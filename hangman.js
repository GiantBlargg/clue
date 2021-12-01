"use strict"

let fair = false;

const pickerStrategies = [{
	name: "Always Wrong",
	initialChoice: dictionary => dictionary[Math.floor(Math.random() * dictionary.length)],
	cheat: (possible, char) => {
		let cheatWords = possible.filter(value => value.indexOf(char) == -1);
		return cheatWords[Math.floor(Math.random() * cheatWords.length)];
	}
}];

function newGameState(dictionary, strategy) {
	let word = strategy.initialChoice(dictionary);
	console.log(word);
	return {
		real: word, possible: dictionary.filter(value => value.length == word.length), word: new Array(word.length + 1).join("_"), wrong: ""
	};
}

function updateState(gameState, char, strategy) {
	let cheatWord = strategy.cheat(gameState.possible, char);
	if (!fair) {
		if (cheatWord) {
			gameState.real = cheatWord;
			console.log(cheatWord);
		}
	}

	if (gameState.real.indexOf(char) != -1) {
		// Found Match
		let realWord = gameState.real;
		let splitWord = [gameState.word];
		while (true) {
			let pos = realWord.lastIndexOf(char);
			if (pos == -1) break;
			realWord = realWord.substring(0, pos);
			let first = splitWord.shift();
			splitWord.unshift(first.substring(pos + 1));
			splitWord.unshift(first.substring(0, pos));
		}
		gameState.word = splitWord.join(char);

		gameState.possible = gameState.possible.filter(value => {
			for (let i = 0; i < gameState.word.length; i++) {

				if (gameState.word[i] == "_" && value[i] != char) continue;
				if (gameState.word[i] == value[i]) continue;
				return false;
			} return true;
		});
	} else {
		// Wrong
		gameState.wrong += char;
		gameState.possible = gameState.possible.filter(value => value.indexOf(char) == -1);
	}
}

async function loadHangmanStates() {
	return (await (await fetch("hangman_states.txt")).text()).split(",\n");
}

async function loadDictionary() {
	return (await (await fetch("dictionary.txt")).text()).split("\n");
}

async function setup() {
	const hangmanStatesPromise = loadHangmanStates();
	const dictionaryPromise = loadDictionary();

	const hangmanStates = await hangmanStatesPromise;
	const dictionary = await dictionaryPromise;

	const root = document.getElementById("root");
	const hangmanDisplay = document.createElement("pre");
	root.appendChild(hangmanDisplay);
	const wordDisplay = document.createElement("pre");
	root.appendChild(wordDisplay);

	let gameState;

	function processKey(char) {
		if (gameState.word.indexOf(char) == -1 && gameState.wrong.indexOf(char) == -1)
			updateState(gameState, char, pickerStrategies[0]);
		updateDisplay();
	}

	function listenKey(ev) {
		if (!(/^[A-Za-z]$/.test(ev.key))) return;
		document.removeEventListener("keydown", listenKey);
		processKey(ev.key.toUpperCase());
	}

	function newGame() {
		gameState = newGameState(dictionary, pickerStrategies[0]);
		updateDisplay();
	}

	function listenRestart(ev) {
		if (ev.key != "Enter") return;
		document.removeEventListener("keydown", listenRestart);
		newGame();
	}

	function updateDisplay() {
		let win = gameState.word.indexOf("_") == -1;
		let lose = gameState.wrong.length == hangmanStates.length - 1;

		hangmanDisplay.innerText = hangmanStates[gameState.wrong.length];
		wordDisplay.innerHTML = gameState.wrong.split("").join(" ") + "\n\n" + gameState.word.split("").join(" ");

		if (win || lose) {
			if (win)
				wordDisplay.innerHTML += "\n\nYou Win";
			if (lose)
				wordDisplay.innerHTML += "\n\nYou Lose";

			wordDisplay.innerHTML += "! The word was " + gameState.real;

			wordDisplay.innerHTML += "\n\nPress Enter to Restart";
			document.addEventListener("keydown", listenRestart);
		} else {
			document.addEventListener("keydown", listenKey);
		}
	}

	newGame();
}

if (document.readyState === "loading")
	document.addEventListener("DOMContentLoaded", setup);
else setup();
