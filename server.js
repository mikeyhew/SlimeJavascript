var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var util = require('util');

var playerQueue = [];

function main() {
	app.get('/', function(req, res){
		res.sendFile(__dirname + '/SlimeVolleyball.html');
	});

	app.use(express.static('.'));

	io.on('connection', onConnection);

	http.listen(3000, function(){
		console.log('listening on *:3000');
	});
}

function onConnection(socket) {
	console.log("connection: " + socket);
	playerQueue.push(socket);
	while (playerQueue.length >= 2) {
		var matchedPlayers = playerQueue.splice(0, 2);
		startGame(matchedPlayers);
	}
}

function startGame(players) {
	// TODO: Maybe shuffle players ?
	for (var i = 0; i < players.length; ++i) {
		startPlayer(i, players);
	}
}

function startPlayer(index, players) {
	var socket = players[index];
	socket.on('move', function(message) {
		handleMoveRequest(index, players, message);
	});
	socket.on('ball', function(message) {
		handleMoveRequest(index, players, message);
	});
	socket.on('score', function(message) {
		handleScoreRequest(index, players, message);
	});

	socket.emit('start', {
		'index': index
	});
}

function handleMoveRequest(index, players, message) {
	forEachExcept(players, index, function(socket) {
		socket.emit('move', message);
	});
}

function handleBallUpdate(index, players, message) {
	forEachExcept(players, index, function(socket) {
		socket.emit('ball', message);
	});
}

function handleScoreRequest(index, players, message) {
	forEachExcept(players, index, function(socket) {
		socket.emit('score', message);
	});
}

function forEachExcept(list, exception, fun) {
	for (var i = 0; i < list.length; ++i) {
		if (i != exception) {
			fun(list[i]);
		}
	}
}

main();
