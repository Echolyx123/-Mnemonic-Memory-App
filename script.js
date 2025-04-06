// ✅ Fully updated script.js with case-insensitive grammar tooltip matching
console.log("✅ script.js is running!");

const wordEl = document.getElementById('word');
const meaningEl = document.getElementById('meaning');
const mnemonicEl = document.getElementById('mnemonic');
const nextBtn = document.getElementById('next-btn');
const backBtn = document.getElementById('back-btn');
const resetBtn = document.getElementById('reset-btn');
const levelSelector = document.getElementById('level-selector');
const progressEl = document.getElementById('progress');
const chatSearch = document.getElementById('chat-search');
const chatSubmit = document.getElementById('chat-submit');
const matchNotice = document.getElementById('match-notice');

let wordPool = [];
let history = [];
let currentIndex = -1;
let currentLevel = 1;
let grammarData = {};

let missedWords = [];
let searchResults = [];
let searchIndex = 0;
let lastQuery = "";

async function fetchGrammarData() {
  try {
    const res = await fetch("/static/german_grammar_explained.json");
    grammarData = await res.json();
  } catch (err) {
    console.warn("Could not load grammar JSON.", err);
  }
}

async function loadWords(level) {
  await fetchGrammarData();
  const response = await fetch(`http://127.0.0.1:5000/get_all_words?level=${level}`);
  const data = await response.json();

  if (!Array.isArray(data)) {
    wordEl.textContent = "Error loading data";
    meaningEl.textContent = "";
    mnemonicEl.textContent = data.error || "Check server or data.py";
    return;
  }

  wordPool = data;
  history = [];
  currentIndex = -1;
  currentLevel = level;
  missedWords = [];
  matchNotice.textContent = "";
  searchResults = [];
  searchIndex = 0;
  lastQuery = "";

  updateProgress();
  showNextWord();
}

function showNextWord() {
  const seenWords = history.map(entry => entry.word);
  const remaining = wordPool.filter(item => !seenWords.includes(item.word));

  if (remaining.length === 0) {
    wordEl.textContent = "🎉 All Done!";
    meaningEl.textContent = "You’ve seen all entries.";
    mnemonicEl.textContent = "Reset or try a different level.";
    nextBtn.disabled = true;
    backBtn.disabled = false;
    return;
  }

  const randomEntry = remaining[Math.floor(Math.random() * remaining.length)];

  history.push(randomEntry);
  currentIndex = history.length - 1;
  displayEntry(randomEntry);
}

function showPreviousWord() {
  if (currentIndex > 0) {
    currentIndex--;
    displayEntry(history[currentIndex]);
    updateProgress();
    nextBtn.disabled = false;
    matchNotice.textContent = "";
  }
}

function wrapGrammarWords(entry) {
  const text = entry.word;
  const tokens = entry.tokens || [];

  return text.split(" ").map((word) => {
    const clean = word.replace(/[.,!?]/g, "");
    const key = clean.toLowerCase();
    const token = tokens.find(t => t.text === clean || t.text === key);
    const grammarInfo = grammarData[key];
    const tooltip = grammarInfo ? grammarInfo.tooltip : (token?.pos || "No grammar info available.");
    return `<span class="word-chip" title="${tooltip}">${word}</span>`;
  }).join(" ");
}

function displayEntry(entry) {
  wordEl.innerHTML = wrapGrammarWords(entry);
  meaningEl.textContent = entry.meaning;
  mnemonicEl.textContent = `"${entry.mnemonic}"`;

  updateProgress();

  backBtn.disabled = currentIndex <= 0;
  nextBtn.disabled = history.length === wordPool.length && currentIndex === history.length - 1;
}

function updateProgress() {
  progressEl.textContent = `Progress: ${history.length} / ${wordPool.length}`;
}

function resetCurrentLevel() {
  const confirmReset = confirm("Do you want to restart this level? Your progress will reset.");
  if (confirmReset) {
    loadWords(currentLevel);
  }
}

function startSearch(input) {
  const query = input.trim().toLowerCase();
  if (!query || wordPool.length === 0) return;

  searchResults = wordPool.filter(entry =>
    entry.word.toLowerCase().includes(query) ||
    entry.meaning.toLowerCase().includes(query) ||
    entry.mnemonic.toLowerCase().includes(query)
  );

  if (searchResults.length > 0) {
    searchIndex = 0;
    lastQuery = query;
    displaySearchResult();
  } else {
    wordEl.textContent = "🤖 Not Found";
    meaningEl.textContent = "";
    mnemonicEl.textContent = `No match for \"${query}\"`;
    matchNotice.textContent = "";
    searchResults = [];
    searchIndex = 0;
    nextBtn.disabled = true;
    backBtn.disabled = true;
  }
}

function displaySearchResult() {
  if (searchResults.length === 0) return;

  const match = searchResults[searchIndex];
  displayEntry(match);
  matchNotice.textContent = `Match ${searchIndex + 1} of ${searchResults.length}`;
  searchIndex = (searchIndex + 1) % searchResults.length;

  nextBtn.disabled = false;
  backBtn.disabled = false;
}

chatSearch.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const input = chatSearch.value.trim().toLowerCase();
    if (input !== lastQuery) {
      startSearch(input);
    } else {
      displaySearchResult();
    }
  }
});

chatSubmit.addEventListener('click', () => {
  const input = chatSearch.value.trim().toLowerCase();
  if (input !== lastQuery) {
    startSearch(input);
  } else {
    displaySearchResult();
  }
});

nextBtn.addEventListener('click', showNextWord);
backBtn.addEventListener('click', showPreviousWord);
resetBtn.addEventListener('click', resetCurrentLevel);
levelSelector.addEventListener('change', e => loadWords(parseInt(e.target.value)));

window.onload = () => loadWords(currentLevel);
