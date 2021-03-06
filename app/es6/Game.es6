'use strict';

require('object-assign-shim/index.js');
var offlineData = require('offlineData.json');

module.exports = class Game {
	constructor() {
		this.lineCount = 10;
		this.resultTimeout = 1500;

		this.currentLineIndex = null;
		this.finished = false;
		this.lines = null;
		this.listeners = {};
		this.offline = null;
		this.ready = false;
		this.score = 0;
		this.showingResult = false;
		this.started = false;

		this.getLines(() => {
			this.currentLineIndex = 0;

			this.ready = true;
			this.notify('ready');
		});
	}

	get currentLine() {
		if (typeof this.currentLineIndex === 'number')
			return this.lines[this.currentLineIndex];
		else
			return null;
	}

	get lastLine() {
		if (typeof this.currentLineIndex === 'number' && this.currentLineIndex > 0)
			return this.lines[this.currentLineIndex - 1];
		else
			return null;
	}

	// Get lines from the API
	getLines(callback) {
		return this.getLinesOffline(callback);

		// var xhr = new XMLHttpRequest();
		// xhr.open('GET', 'http://api.theholytest.com/random/' + this.lineCount + '?t=' + new Date().getTime(), true);
		// xhr.timeout = 5000;

		// xhr.onload = () => {
		// 	try {
		// 		var responseJSON = JSON.parse(xhr.responseText);
		// 		if (responseJSON.lines.length !== this.lineCount) {
		// 			throw 'Incorrect number of lines';
		// 		}
		// 		this.offline = false;
		// 		this.lines = responseJSON.lines;
		// 		callback();
		// 	} catch(e) {
		// 		this.getLinesOffline(callback);
		// 	}
		// };

		// xhr.ontimeout = xhr.onerror = () => {
		// 	this.getLinesOffline(callback);
		// };

		// xhr.send(null);
	}

	// Get lines locally (if API is down)
	getLinesOffline(callback) {
		this.offline = true;
		var lines = [];
		var used = [];
		while (lines.length < this.lineCount) {
			var i = Math.floor(Math.random() * offlineData.length);
			if (used.indexOf(i) === -1) {
				lines.push(Object.assign({}, offlineData[i]));
				used.push(i);
			}
		}

		this.lines = lines;

		callback();
	}

	// Guess a either the bible or the quran
	guess(source) {
		if (this.showingResult || typeof this.currentLineIndex !== 'number')
			return;

		this.currentLine.guess = source;

		if (source === this.currentLine.source)
			this.score++;

		this.showingResult = true;

		setTimeout(() => {
			this.showingResult = false;

			if (this.currentLineIndex === this.lines.length - 1) {
				this.finished = true;
				this.currentLineIndex = null;
				this.notify('end', {
					score: this.score,
				});
			} else {
				this.currentLineIndex++;
			}
		}, this.resultTimeout);

		this.notify('guess', {
			source: this.currentLine.source,
			guess: this.currentLine.guess,
			correct: this.currentLine.source === this.currentLine.guess,
		});

		// Call API
		// var xhr = new XMLHttpRequest();
		// xhr.open('POST', 'http://api.theholytest.com/guess/' + this.currentLine.source + '/' + this.currentLine.id + '/' + this.currentLine.guess, true);

		// xhr.send(null);
	}

	// Start game
	start() {
		if (!this.ready || this.started)
			return;

		this.started = true;
		this.notify('start');
	}

	// Bind a function to a named event
	on(event, f) {
		this.listeners[event] = this.listeners[event] || [];
		this.listeners[event].push(f);
		return this;
	}

	// Call all functions bound to a named event
	notify(event, data) {
		if (!this.listeners[event])
			return;
		this.listeners[event].forEach(f => f(data));
		return this;
	}
};
