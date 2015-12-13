'use strict';

var Vue = require('vue/dist/vue.js');
var Game = require('Game.es6');

Vue.filter('censor', function(str) {
	return str.replace(/koran|jinn/ig, str => new Array(str.length + 1).join('█'));
});

Vue.filter('uriComponent', function (str) {
  return encodeURIComponent(str);
})

module.exports = class Holytest {
	constructor(parent) {
		this.parent = parent;
		this.games = [];
		this.nextGame = null;
		this.shareURL = window.location.protocol + '//' + window.location.host;

		// Start game
		this.newGame();

		// Init Vue
		this.vue = new Vue({
			el: this.parent,
			data: this,
			computed: {
				scoreURL: this.generateScoreURL,
				scoreURLTitle: this.generateScoreURLTitle,
			},
			methods: {
				newGame: this.newGame.bind(this),
				openShareWindow: this.openShareWindow.bind(this),
			},
		});
	}

	generateScoreURL() {
		var score = this.currentGame.score;
		return window.location.protocol + '//' + window.location.host + '/score/' + score + '.html';
	}

	generateScoreURLTitle() {
		var score = this.currentGame.score;
		return 'I scored ' + score + '/10 on The Holy Test - how will you go?';
	}

	newGame(startImmediately) {
		var game;
		if (this.nextGame) {
			game = this.nextGame;
			this.nextGame = null;
		} else {
			game = new Game();
		}

		this.currentGame = game;
		this.games.push(game);

		game.on('start', (data) => {
			this.track('start');
			this.preloadGame();
		});
		game.on('guess', (data) => {
			this.track('guess', data.source + '-' + data.guess, data.correct ? 1 : 0);
		});
		game.on('end', (data) => {
			this.track('end', undefined, data.score);
		});

		if (startImmediately)
			game.start();
	}

	openShareWindow(e) {
		var elm = e.target;
		while (elm.parentElement && !elm.href) {
			elm = elm.parentElement;
		}
		if (!elm.href)
			return;

		window.open(elm.href, 'share', 'height=500,width=500');
		this.track('share', elm.title);
	}

	preloadGame() {
		if (this.nextGame)
			return;

		this.nextGame = new Game();
	}

	track(action, label, value) {
		console.log('track', action, label, value);
		if (typeof window.ga !== 'function' || location.hostname === 'localhost')
			return;

		window.ga('send', 'event', 'game', action, label, value);
	}
}
