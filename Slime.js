var physicsLog = 0;
var TWO_PI = Math.PI*2;
var WIN_AMOUNT = 7;


var GAME_STATE_RUNNING = 1;
var GAME_STATE_POINT_PAUSE = 2;
var GAME_STATE_MENU_PAUSE = 3;
var GAME_STATE_MENU_PAUSE_BETWEEN_POINTS = 4;
var GAME_STATE_SHOW_WINNER = 5;
var GAME_STATE_WAIT_OPPONENT = 6;

var MAX_VELOCITY_X = 15;
var MAX_VELOCITY_Y = 22;

// MENU DATA
var menuDiv;
var smallMenuDiv;
var onePlayer;
var nextSlimeIndex;

var gameState;

// RENDER DATA
var ctx;
var canvas;
var viewWidth;
var viewHeight;
var courtYPix;
var pixelsPerUnitX;
var pixelsPerUnitY;
var updatesToPaint;
var legacySkyColor;
var legacyGroundColor;
var legacyBallColor;
var newGroundColor;
var backImage;
var backTextColor;
var backImages = {};
var ballImage;
var gameIntervalObject;
var greenSlimeImage;
var redSlimeImage;
var legacyGraphics;


// GAME DATA
var gameWidth,gameHeight;
var ball;
var slimeLeft;
var slimeRight;
var slimeLeftScore;
var slimeRightScore;
var slimeAI;
var updateCount; // RESET every time GAME_STATE_RUNNING is set
var leftWon;
// GAME CHEAT DATA
// NOTE: this data should be reloaded every time the
//       gameState goes back to GAME_STATE_RUNNING
var slowMotion;

function showOptions() {
	if (gameState == GAME_STATE_RUNNING) {
		gameState = GAME_STATE_MENU_PAUSE;
	} else if (gameState == GAME_STATE_POINT_PAUSE) {
		gameState = GAME_STATE_MENU_PAUSE_BETWEEN_POINTS;
	}
	var div = document.getElementById('OptionsDiv');
	div.style.display = 'block';
}
function hideOptions() {
	var div = document.getElementById('OptionsDiv');
	div.style.display = 'none';
	if (gameState == GAME_STATE_MENU_PAUSE) {
		updateCount = 0;
		gameState = GAME_STATE_RUNNING;
	} else if (gameState == GAME_STATE_MENU_PAUSE_BETWEEN_POINTS) {
		startNextPoint();
	}
	loadOptions();
}

function loadOptions() {
	legacyGraphics = document.getElementById('LegacyGraphics').checked;
	slowMotion = document.getElementById('SlowMotion').checked;
	if (document.getElementById('PhysicsLog').checked) {
		physicsLog = 120;
	} else {
		physicsLog = 0;
	}
}

function bodyload() {
	var contentDiv = document.getElementById('GameContentDiv');

	// Create Render objects
	canvas = document.createElement('canvas');
	canvas.width = 750;
	canvas.height = 375;
	setupView(canvas,true);
	canvas.style.display = 'none';

	ctx = canvas.getContext("2d");
	ctx.font = "20px Georgia";

	gameWidth = 1000;
	gameHeight = 1000;

	// Setup Render Data
	updateWindowSize(canvas.width,canvas.height);
	contentDiv.appendChild(canvas);

	// Create Menu Objects
	menuDiv = document.createElement('div');
	setupView(menuDiv,false);
	menuDiv.style.width = '750px';
	menuDiv.style.height = '375px';

	menuDiv.style.background = "#ca6 url('images/sky2.jpg') no-repeat";
	contentDiv.appendChild(menuDiv);

	// Create options menu div
	smallMenuDiv = document.createElement('div');
	smallMenuDiv.style.position = 'absolute';


	// Initialize Logging
	logString = '';

	// Initialize Game Data
	nextSlimeIndex = 0;
	ball = newLegacyBall(25, '#ff0');
	slimeLeft = newLegacySlime(true, 100, '#0f0');
	slimeRight = newLegacySlime(false, 100, '#f00');

	loadBackground('sky', 'images/sky2.jpg');
	loadBackground('cave', 'images/cave.jpg');
	loadBackground('sunset', 'images/sunset.jpg');
	loadImage('images/vball.png', function() {
		ballImage = this;
	});

	greenSlimeImage = new Image();
	greenSlimeImage.src = 'images/slime175green.png';
	/*
	greenSlimeImage.onload = function() {
		slimeLeft.img = this;
	}
	*/
	redSlimeImage = new Image();
	redSlimeImage.src = 'images/slime175red.png';
	/*
	redSlimeImage.onload = function() {
		slimeRight.img = this;
	}
	*/

	toInitialMenu();
}

function toInitialMenu() {
	menuDiv.innerHTML =
		'<div style="text-align:center;">' +
		'<h1 style="margin-top:30px;">Slime Volleyball</h1>' +
		'<span onclick="startOnePlayer()" class="btn menubutton">One Player</span>' +
		'<span onclick="startTwoPlayer()" class="btn menubutton">Two Player</span>' +
		'<span onclick="startOnlineGame()" class="btn menubutton">Play Online</span>' +
		'<p>Originally written by Quin Pendragon and Daniel Wedge (http://oneslime.net)<br/>' +
		'Rewritten by Jonathan Marler</p>'
		'</div>';
}

// Menu Functions
function startOnePlayer() {
	return start(true);
}
function startTwoPlayer() {
	return start(false);
}
function startOnlineGame() {
	var socket = io();
	gameState = GAME_STATE_WAIT_OPPONENT;
	setMessage('Waiting for opponent...');
	socket.emit('message type', 'content');
	socket.on('start', function(message) {
		start(false);
	});
}

function start(startAsOnePlayer) {
	onePlayer = startAsOnePlayer;

	slimeLeftScore = 0;
	slimeRightScore = 0;

	slimeLeft.img = greenSlimeImage;
	if (onePlayer) {
		var slimeAIProps = slimeAIs[nextSlimeIndex];
		slimeRight.color = slimeAIProps.color;
		legacySkyColor   = slimeAIProps.legacySkyColor;
		backImage        = backImages[slimeAIProps.backImageName];
		backTextColor    = slimeAIProps.backTextColor;
		legacyGroundColor= slimeAIProps.legacyGroundColor;
		legacyBallColor  = slimeAIProps.legacyBallColor;
		newGroundColor   = slimeAIProps.newGroundColor;

		slimeRight.img   = null;
		slimeAI          = newSlimeAI(false,slimeAIProps.name);
		slimeAIProps.initAI(slimeAI);
	} else {
		legacySkyColor   = '#00f';
		backImage        = backImages['sky'];
		backTextColor    = '#000';
		legacyGroundColor= '#888';
		legacyBallColor  = '#fff';
		newGroundColor   = '#ca6';

		slimeRight.img   = redSlimeImage;
		slimeAI          = null;
	}

	initRound(true);

	updatesToPaint = 0;
	updateCount = 0;
	loadOptions();
	gameState = GAME_STATE_RUNNING
	renderBackground(); // clear the field
	canvas.style.display = 'block';
	menuDiv.style.display = 'none';
	gameIntervalObject = setInterval(gameIteration, 20);
}

function initRound(server) {
	ball.x = server ? 200 : 800;
	ball.y = 356;
	ball.velocityX = 0;
	ball.velocityY = 0;

	slimeLeft.x = 200;
	slimeLeft.y = 0;
	slimeLeft.velocityX = 0;
	slimeLeft.velocityY = 0;

	slimeRight.x = 800;
	slimeRight.y = 0;
	slimeRight.velocityX = 0;
	slimeRight.velocityY = 0;
}

function gameIteration() {
	if (gameState != GAME_STATE_RUNNING) {
		return;
	}
	updateCount++;
	if (slowMotion && (updateCount % 2) == 0) {
		return;
	}
	if (updatesToPaint > 0) {
		console.log("WARNING: updating frame before it was rendered");
	}
	if (physicsLog > 0) {
		log("Frame");
		log(" ball.x  " + ball.x);
		log(" ball.y  " + ball.y);
		log(" ball.vx " + ball.velocityX);
		log(" ball.vy " + ball.velocityY);
		physicsLog--;
		if (physicsLog == 0) {
			var logDom = document.createElement('pre');
			logDom.innerHTML = logString;
			document.body.appendChild(logDom);
		}
	}
	updateFrame();
	updatesToPaint++;
	if (updatesToPaint == 1) {
		requestAnimationFrame(renderGame);
	}
}

function updateFrame() {
	if (onePlayer) {
		slimeAI.move(false); // Move the right slime
		updateSlimeVelocitiesWithDoubleKeys(slimeLeft,
			KEY_A,KEY_LEFT,
			KEY_D,KEY_RIGHT,
			KEY_W,KEY_UP);
		updateSlimeVelocities(slimeRight,slimeAI.movement,slimeAI.jumpSet);
	} else {
		updateSlimeVelocitiesWithKeys(slimeLeft, KEY_A,KEY_D,KEY_W);
		updateSlimeVelocitiesWithKeys(slimeRight, KEY_LEFT,KEY_RIGHT,KEY_UP);
	}

	updateSlime(slimeLeft, 50, 445);
	updateSlime(slimeRight, 555, 950);

	// Allows slimes to go accross the net
	//updateSlime(slimeLeft, 0, 1000);
	//updateSlime(slimeRight, 0, 1000);

	if (updateBall()) {
		return;
	}
}

// Game Update Functions
function updateSlimeVelocities(s,movement,jump) {
	if (movement == 0) {
		s.velocityX = 0;
	} else if (movement == 1) {
		s.velocityX = -8;
	} else if (movement == 2) {
		s.velocityX = 8;
	} else {
		throw "slime movement " + movement + " is invalid";
	}
	if (jump && s.y == 0) {
		s.velocityY = 31;
	}
}
function updateSlimeVelocitiesWithKeys(s,left,right,up) {
	// update velocities
	if (keysDown[left]) {
		if (keysDown[right]) {
			s.velocityX = 0;
		} else {
			s.velocityX = -8;
		}
	} else if (keysDown[right]) {
		s.velocityX = 8;
	} else {
		s.velocityX = 0;
	}
	if (s.y == 0 && keysDown[up]) {
		s.velocityY = 31;
	}
}
function updateSlimeVelocitiesWithDoubleKeys(s,left1,left2,right1,right2,up1,up2) {
	// update velocities
	if (keysDown[left1] || keysDown[left2]) {
		if (keysDown[right1] || keysDown[right2]) {
			s.velocityX = 0;
		} else {
			s.velocityX = -8;
		}
	} else if (keysDown[right1] || keysDown[right2]) {
		s.velocityX = 8;
	} else {
		s.velocityX = 0;
	}
	if (s.y == 0 && (keysDown[up1] || keysDown[up2])) {
		s.velocityY = 31;
	}
}
function updateSlime(s, leftLimit, rightLimit) {
	if (s.velocityX != 0) {
		s.x += s.velocityX;
		if (s.x < leftLimit) s.x = leftLimit;
		else if (s.x > rightLimit) s.x = rightLimit;
	}
	if (s.velocityY != 0 || s.y > 0) {
		s.velocityY -= 2;
		s.y += s.velocityY;
		if (s.y < 0) {
			s.y = 0;
			s.velocityY = 0;
		}
	}
}

function loadBackground(name, filename) {
	loadImage(filename, function() {
		backImages[name] = this;
	});
}

function loadImage(filename, onload) {
	var image = new Image();
	image.src = filename;
	image.onload = onload;
}

// Objects rendered in the slime engine
// need an x and a y parameter
function newLegacyBall(radius,color) {
	return {
		radius: radius,
		color: color,
		x: 0,
		y: 0,
		velocityX: 0,
		velocityY: 0,
		rotation: 0,
		render: function() {
			var xPix = this.x * pixelsPerUnitX;
			var yPix = courtYPix - (this.y * pixelsPerUnitY);
			// The original game's ball looked bigger then
			// it was, so we add 2 pixels here to the radius
			var radiusPix = this.radius * pixelsPerUnitY + 2;

			if (ballImage && !legacyGraphics) {
				this.rotation += this.velocityX / 100;
				this.rotation = this.rotation % TWO_PI;

				ctx.translate(xPix, yPix);
				ctx.rotate(this.rotation);
				ctx.drawImage(ballImage, -radiusPix, -radiusPix);
				ctx.setTransform(1,0,0,1,0,0);
			} else {
				ctx.fillStyle = legacyBallColor;
				ctx.beginPath();
				ctx.arc(xPix, yPix, radiusPix, 0, TWO_PI);
				ctx.fill();
			}
		}
	};
}
function newLegacySlime(onLeft,radius,color) {
	return {
		onLeft: onLeft,
		radius: radius,
		color: color,
		img: null,
		x: 0,
		y: 0,
		velocityX: 0,
		velocityY: 0,
		render: function() {
			var xPix = this.x * pixelsPerUnitX;
			var yPix = courtYPix - (this.y * pixelsPerUnitY);
			var radiusPix = this.radius * pixelsPerUnitY;

			if (this.img && !legacyGraphics) {
				ctx.drawImage(this.img, xPix - radiusPix, yPix - 38);
			} else {
				ctx.fillStyle = this.color;
				ctx.beginPath();
				ctx.arc(xPix, yPix, radiusPix, Math.PI, TWO_PI);
				ctx.fill();
			}

			// Draw Eyes
			var eyeX = this.x + (this.onLeft ? 1 : -1)*this.radius/4;
			var eyeY = this.y + this.radius/2;
			var eyeXPix = eyeX * pixelsPerUnitX;
			var eyeYPix = courtYPix - (eyeY * pixelsPerUnitY);
			ctx.translate(eyeXPix, eyeYPix);
			ctx.fillStyle = '#fff';
			ctx.beginPath();
			ctx.arc(0,0, radiusPix/4, 0, TWO_PI);
			ctx.fill();

			// Draw Pupil
			var dx = ball.x - eyeX;
			var dy = eyeY - ball.y;
			var dist = Math.sqrt(dx*dx+dy*dy);
			var rPixOver8 = radiusPix/8;
			ctx.fillStyle = '#000';
			ctx.beginPath();
			ctx.arc(rPixOver8*dx/dist, rPixOver8*dy/dist, rPixOver8, 0, TWO_PI);
			ctx.fill();
			ctx.setTransform(1,0,0,1,0,0);
		}
	};
}


function collisionBallSlime(s) {
	var FUDGE = 5; // not sure why this is needed

	var dx = 2 * (ball.x - s.x);
	var dy = ball.y - s.y;
	var dist = Math.trunc(Math.sqrt(dx * dx + dy * dy));

	var dVelocityX = ball.velocityX - s.velocityX;
	var dVelocityY = ball.velocityY - s.velocityY;

	if (dy > 0 && dist < ball.radius + s.radius && dist > FUDGE) {
		var oldBall = {x:ball.x,y:ball.y,velocityX:ball.velocityX,velocityY:ball.velocityY};
		if (physicsLog > 0) {
			log("Collision:");
			log(" dx        " + dx);
			log(" dy        " + dy);
			log(" dist      " + dist);
			log(" dvx       " + dVelocityX);
			log(" dvy       " + dVelocityY);
			log(" oldBallX  " + ball.x);
			log(" oldBallY  " + ball.y);
			log(" [DBG] s.x   : " + s.x);
			log(" [DBG] s.rad : " + s.radius);
			log(" [DBG] b.rad : " + ball.radius);
			log(" [DBG] 0   : " + Math.trunc((s.radius + ball.radius) / 2));
			log(" [DBG] 1   : " + Math.trunc((s.radius + ball.radius) / 2)*dx);
			log(" [DBG] 2   : " + Math.trunc(Math.trunc((s.radius + ball.radius) / 2)*dx/dist));
		}
		ball.x = s.x + Math.trunc(Math.trunc((s.radius + ball.radius) / 2) * dx / dist);
		ball.y = s.y + Math.trunc((s.radius + ball.radius) * dy / dist);

		var something = Math.trunc((dx * dVelocityX + dy * dVelocityY) / dist);
		if (physicsLog > 0) {
			log(" newBallX  " + ball.x);
			log(" newBallY  " + ball.y);
			log(" something " + something);
		}

		if (something <= 0) {
			ball.velocityX += Math.trunc(s.velocityX - 2 * dx * something / dist);
			ball.velocityY += Math.trunc(s.velocityY - 2 * dy * something / dist);
			if (     ball.velocityX < -MAX_VELOCITY_X) ball.velocityX = -MAX_VELOCITY_X;
			else if (ball.velocityX >  MAX_VELOCITY_X) ball.velocityX =  MAX_VELOCITY_X;
			if (     ball.velocityY < -MAX_VELOCITY_Y) ball.velocityY = -MAX_VELOCITY_Y;
			else if (ball.velocityY >  MAX_VELOCITY_Y) ball.velocityY =  MAX_VELOCITY_Y;
			if (physicsLog > 0) {
				log(" ballVX    " + ball.velocityX);
				log(" ballVY    " + ball.velocityY);
			}
		}
	}
}

// returns true if end of point
function updateBall() {
	ball.velocityY += -1; // gravity
	if (ball.velocityY < -MAX_VELOCITY_Y) {
		ball.velocityY = -MAX_VELOCITY_Y;
	}

	ball.x += ball.velocityX;
	ball.y += ball.velocityY;

	collisionBallSlime(slimeLeft);
	collisionBallSlime(slimeRight);

	// handle wall hits
	if (ball.x < 15) {
		ball.x = 15;
		ball.velocityX = -ball.velocityX;
	} else if (ball.x > 985){
		ball.x = 985;
		ball.velocityX = -ball.velocityX;
	}
	// hits the post
	if (ball.x > 480 && ball.x < 520 && ball.y < 140) {
		// bounces off top of net
		if (ball.velocityY < 0 && ball.y > 130) {
			ball.velocityY *= -1;
			ball.y = 130;
		} else if (ball.x < 500) { // hits side of net
			ball.x = 480;
			ball.velocityX = ball.velocityX >= 0 ? -ball.velocityX : ball.velocityX;
		} else {
			ball.x = 520;
			ball.velocityX = ball.velocityX <= 0 ? -ball.velocityX : ball.velocityX;
		}
	}

	// Check for end of point
	if (ball.y < 0) {
		if (ball.x > 500) {
			leftWon = true;
			slimeLeftScore++;
		} else {
			leftWon = false;
			slimeRightScore++;
		}
		endPoint()
		return true;
	}
	return false;
}


// Rendering Functions
function renderGame() {
	if (updatesToPaint == 0) {
		console.log("ERROR: render called but not ready to paint");
	} else {
		if (updatesToPaint > 1) {
			console.log("WARNING: render missed " + (updatesToPaint - 1) + " frame(s)");
		}
		renderBackground();
		ctx.fillStyle = '#000';
		//ctx.font = "20px Georgia";
		//ctx.fillText("Score: " + slimeLeftScore, 140, 20);
		//ctx.fillText("Score: " + slimeRightScore, viewWidth - 230, 20);
		ball.render();
		slimeLeft.render();
		slimeRight.render();
		updatesToPaint = 0;
	}
}

function renderBackground()
{
	if (legacyGraphics) {
		ctx.fillStyle=legacySkyColor;
		ctx.fillRect(0, 0, viewWidth, courtYPix);
		ctx.fillStyle = legacyGroundColor;
	} else {
		ctx.drawImage(backImage, 0, 0);
		ctx.fillStyle = newGroundColor;
	}
	ctx.fillRect(0, courtYPix, viewWidth, viewHeight - courtYPix);
	ctx.fillStyle='#fff'
	ctx.fillRect(viewWidth/2-2,7*viewHeight/10,4,viewHeight/10+5);
	// render scores
	renderPoints(slimeLeftScore, 30, 40);
	renderPoints(slimeRightScore, viewWidth - 30, -40);
}

function renderPoints(score, initialX, xDiff) {
	ctx.fillStyle = '#ff0';
	var x = initialX;
	for (var i = 0; i < score; i++) {
		ctx.beginPath();
		ctx.arc(x, 25, 12, 0, TWO_PI);
		ctx.fill();
		x += xDiff;
	}
	ctx.strokeStyle = backTextColor;
	ctx.lineWidth = 2;
	x = initialX;
	for (var i = 0; i < WIN_AMOUNT; i++) {
		ctx.beginPath();
		ctx.arc(x, 25, 12, 0, TWO_PI);
		ctx.stroke();
		x += xDiff;
	}
}



function spaceKeyDown() {
	if (gameState != GAME_STATE_SHOW_WINNER) {
		return;
	}
	if (onePlayer && nextSlimeIndex >= slimeAIs.length) {
		nextSlimeIndex = 0;
		toInitialMenu();
	} else {
		start(onePlayer);
	}
}

function endMatch() {
	gameState = GAME_STATE_SHOW_WINNER;
	clearInterval(gameIntervalObject);
	if (onePlayer) {
		if (leftWon) {
			nextSlimeIndex++;
			if (nextSlimeIndex >= slimeAIs.length) {
				setMessage('You beat everyone!', "Press 'space' to do it all over again!");
			} else {
				setMessage('You won!', "Press 'space' to continue...");
			}
		} else {
			nextSlimeIndex = 0;
			setMessage('You lost :(', "Press 'space' to retry...");
		}
	} else {
		var winningPlayer = 'Player ' + (leftWon ? '1' : '2');
		setMessage(winningPlayer + ' Wins!', "Press 'space' for rematch...");
	}
	menuDiv.style.display = 'block';
	canvas.style.display = 'none';
}

function setMessage(message, actionMessage) {
	actionMessage = actionMessage || '';
	menuDiv.innerHTML =
		'<div style="text-align:center;">' +
		'<h1 style="margin:50px 0 20px 0;">' + message + '</h1>' +
		actionMessage +
		'</div>';
}
function startNextPoint() {
	initRound(leftWon);
	updatesToPaint = 0;
	updateCount = 0;
	gameState = GAME_STATE_RUNNING;
}
function endPoint() {
	if (slimeAI) {
		keysDown[KEY_UP] = false;
		keysDown[KEY_RIGHT] = false;
		keysDown[KEY_LEFT] = false;
	}

	if (slimeLeftScore >= WIN_AMOUNT) {
		endMatch(true);
		return;
	}
	if (slimeRightScore >= WIN_AMOUNT) {
		endMatch(false);
		return;
	}

	var endOfPointText;
	if (onePlayer) {
		if (leftWon) {
			endOfPointText = 'Nice, you got the point!';
		} else {
			endOfPointText = slimeAI.name + ' scores!';
		}
	} else {
		endOfPointText = 'Player ' + (leftWon ? '1':'2') + ' scores!';
	}
	gameState = GAME_STATE_POINT_PAUSE;
	requestAnimationFrame(function() {
		renderEndOfPoint(endOfPointText);
	});

	setTimeout(function () {
		if (gameState == GAME_STATE_POINT_PAUSE) {
			startNextPoint();
		}
	}, 700);
}

function renderEndOfPoint(endOfPointText) {
	var textWidth = ctx.measureText(endOfPointText).width;
	renderGame();
	ctx.fillStyle = '#000';
	ctx.fillText(
		endOfPointText,
		(viewWidth - textWidth)/2,
		courtYPix + (viewHeight - courtYPix)/2);
}

function updateWindowSize(width,height) {
	viewWidth = width;
	viewHeight = height;
	console.log("ViewSize x: " + width + ", y: " + height);
	pixelsPerUnitX = width / gameWidth;
	pixelsPerUnitY = height / gameHeight;
	console.log("GAMESIZE x: " + gameWidth + ", y: " + gameHeight);
	console.log("PPU      x: " + pixelsPerUnitX + ", y: " + pixelsPerUnitY);
	courtYPix = 4 * viewHeight / 5;
}

function setupView(view) {
	view.style.position = 'absolute';
	view.style.left     = '0';
	view.style.top      = '0';
}

var logString;
function log(msg)
{
	logString += msg + '\n';
}
