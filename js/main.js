// Make a card game of War

/*
2 players
Each player draws their next card
Highest card wins, winner gets the pair of cards
Tie? Declare 'war'
Put down 3 cards. Flip 4th card and highest wins all 8 cards.

https://deckofcardsapi.com/

*/

document.querySelector('#startGame').addEventListener('click', startGame);
document.querySelector('#nextMove').addEventListener('click', nextMove);
document.querySelector('#autoPlay').addEventListener('click', autoPlay);
document.querySelector('#stopAutoPlay').addEventListener('click', stopAutoPlay);

let stackOfCards = [];
let timer;

async function startGame() {
  document.querySelector('#winner h2').innerText = '';
  // Clear the stack of cards
  stackOfCards = [];
  const cardsToPlay = 16;
  localStorage.setItem('war', false);
  // Get a new deck and draw the 52 cards
  const newDeckURL = `https://deckofcardsapi.com/api/deck/new/draw/?count=${cardsToPlay}`;

  const p1Pile = [];
  const p2Pile = [];

  // Fetch a new deck
  const newDeckRes = await fetch(newDeckURL);
  const newDeckData = await newDeckRes.json();

  localStorage.setItem('deckId', newDeckData.deck_id);

  // Split the card into two piles
  for (let i = 0; i < newDeckData.cards.length; i++) {
    if (i % 2 === 0) p1Pile.push(newDeckData.cards[i].code);
    else {
      p2Pile.push(newDeckData.cards[i].code);
    }
  }
  // Create initial two piles
  await addCardsToPile(p1Pile, 'p1Cards');
  const pileData = await addCardsToPile(p2Pile, 'p2Cards');
  updateCardsRemaining(pileData.piles);
}

function autoPlay() {
  nextMove();
  timer = setTimeout(autoPlay, 1000);
}

function stopAutoPlay() {
  clearTimeout(timer);
}

async function addCardsToPile(pile, pileName) {
  const deckId = localStorage.getItem('deckId');
  let cardsToAdd = pile.join(',');
  // Needed to get the data back to update number
  const res = await fetch(
    `https://deckofcardsapi.com/api/deck/${deckId}/pile/${pileName}/add/?cards=${cardsToAdd}`
  );
  const data = res.json();
  return data;
}

async function nextMove() {
  let p1CardData;
  let p2CardData;
  let war = localStorage.getItem('war');
  if (war === 'true') {
    // If state of war, draw 4 cards (3 to burn and the one to play)
    console.log('War so drawing 4');
    p1CardData = await drawCardAndUpdate('p1', 4);
    p2CardData = await drawCardAndUpdate('p2', 4);
  } else {
    // Draw a card from each pile & update the pictures
    p1CardData = await drawCardAndUpdate('p1');
    p2CardData = await drawCardAndUpdate('p2');
  }
  localStorage.setItem('war', false);

  // Who won?
  const result = pickWinner(p1CardData[0], p2CardData[0]);
  // Update the class so the border colour changes
  setBorder(result);

  // Add cards to pile of winnable cards
  addToStack(p1CardData);
  addToStack(p2CardData);

  // If there is a winner
  // Add both cards to the correct pile
  if (result === 'p1') {
    await addCardsToPile(stackOfCards, 'p1Cards');
    stackOfCards = [];
  } else if (result === 'p2') {
    await addCardsToPile(stackOfCards, 'p2Cards');
    stackOfCards = [];
  } else if (result === 'war') {
    // Draw 3 more cards
    localStorage.setItem('war', 'true');
    console.log('WAR!');
  }
  // Update the number
  const pileData = await getPileData('p1Cards');
  updateCardsRemaining(pileData);
}

async function getPileData(pileName) {
  const deckId = localStorage.getItem('deckId');

  const res = await fetch(
    `https://deckofcardsapi.com/api/deck/${deckId}/pile/${pileName}/list/`
  );
  const data = await res.json();
  return data.piles;
}

async function drawCard(pileName, count = 1) {
  // Draws a random card - stops it getting stuck in a loop
  const deckId = localStorage.getItem('deckId');
  const drawURL = `https://deckofcardsapi.com/api/deck/${deckId}/pile/${pileName}Cards/draw/random/?count=${count}`;

  try {
    const res = await fetch(drawURL);
    if (!res.ok) {
      // Problem? Most likely no cards left so game is over
      gameOver(pileName);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.log(err);
  }
}

function updateCardsRemaining(piles) {
  // Iterate through each pile
  for (pile in piles) {
    document.querySelector(`#${pile}Count`).innerText = piles[pile].remaining;
  }
}

function updateCardImage(player, cards) {
  document.querySelector(`#${player}CardsImg`).src = cards[0].image;
}

async function drawCardAndUpdate(player, count = 1) {
  const cardData = await drawCard(player, count);
  // updateCardsRemaining(cardData.piles);
  updateCardImage(player, cardData.cards);
  return cardData.cards;
}

function pickWinner(card1, card2) {
  const card1Value = getValue(card1.value);
  const card2Value = getValue(card2.value);
  if (card1Value > card2Value) return 'p1';
  if (card1Value < card2Value) return 'p2';
  return 'war';
}

function getValue(cardValue) {
  switch (cardValue) {
    case 'ACE':
      return 14;
    case 'KING':
      return 13;
    case 'QUEEN':
      return 12;
    case 'JACK':
      return 11;
    default:
      return Number(cardValue);
  }
}

function addToStack(cards) {
  for (card of cards) {
    stackOfCards.push(card.code);
  }
}

function setBorder(winner) {
  const p1CardImg = document.querySelector('#p1CardsImg');
  const p2CardImg = document.querySelector('#p2CardsImg');

  // Remove all states
  p1CardImg.classList.remove('win', 'lose', 'war');
  p2CardImg.classList.remove('win', 'lose', 'war');

  // Apply the appropriate one
  if (winner === 'p1') {
    p1CardImg.classList.add('win');
    p2CardImg.classList.add('lose');
  } else if (winner === 'p2') {
    p1CardImg.classList.add('lose');
    p2CardImg.classList.add('win');
  } else {
    p1CardImg.classList.add('war');
    p2CardImg.classList.add('war');
  }
}

function gameOver(loser) {
  const h2Ele = document.querySelector('#winner h2');
  if (loser === 'p1') {
    h2Ele.innerText = `Player 2 wins!`;
    stopAutoPlay();
  } else {
    h2Ele.innerText = `Player 1 wins!`;
    stopAutoPlay();
  }
}
