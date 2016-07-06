function getSkyTheme() {
	return {
		backImageName:'sky',
		legacySkyColor:'#00f',
		legacyGroundColor:'#888',
		legacyBallColor:'#ff0',
		newGroundColor:'#ca6',
		backTextColor:'#000'
	};
}

function getCaveTheme() {
	return {
		backImageName:'cave',
		legacySkyColor:'#1e5000',
		legacyGroundColor:'#444',
		legacyBallColor:'#88f',
		newGroundColor:'#444',
		backTextColor:'#fff'
	};
}

function getSunsetTheme() {
	return {
		backImageName:'sunset',
		legacySkyColor:'#623939',
		legacyGroundColor:'#00a800',
		legacyBallColor:'#fff',
		newGroundColor:'#655040',
		backTextColor:'#fff'
	};
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
		renderBall(ball);
		renderSlime(slimeLeft);
		renderSlime(slimeRight);
		updatesToPaint = 0;
	}
}

function renderBackground()
{
	if (legacyGraphics) {
		ctx.fillStyle = background.legacySkyColor;
		ctx.fillRect(0, 0, viewWidth, courtYPix);
		ctx.fillStyle = background.legacyGroundColor;
	} else {
		var backImage = backImages[background.backImageName];
		ctx.drawImage(backImage, 0, 0);
		ctx.fillStyle = background.newGroundColor;
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
	ctx.strokeStyle = background.backTextColor;
	ctx.lineWidth = 2;
	x = initialX;
	for (var i = 0; i < WIN_AMOUNT; i++) {
		ctx.beginPath();
		ctx.arc(x, 25, 12, 0, TWO_PI);
		ctx.stroke();
		x += xDiff;
	}
}

function renderBall(ball) {
	var xPix = ball.x * pixelsPerUnitX;
	var yPix = courtYPix - (ball.y * pixelsPerUnitY);
	// The original game's ball looked bigger then
	// it was, so we add 2 pixels here to the radius
	var radiusPix = ball.radius * pixelsPerUnitY + 2;

	if (ballImage && !legacyGraphics) {
		ball.rotation += ball.velocityX / 100;
		ball.rotation = ball.rotation % TWO_PI;

		ctx.translate(xPix, yPix);
		ctx.rotate(ball.rotation);
		ctx.drawImage(ballImage, -radiusPix, -radiusPix);
		ctx.setTransform(1,0,0,1,0,0);
	} else {
		ctx.fillStyle = background.legacyBallColor;
		ctx.beginPath();
		ctx.arc(xPix, yPix, radiusPix, 0, TWO_PI);
		ctx.fill();
	}
}

function renderSlime(slime) {
	var xPix = slime.x * pixelsPerUnitX;
	var yPix = courtYPix - (slime.y * pixelsPerUnitY);
	var radiusPix = slime.radius * pixelsPerUnitY;

	if (slime.img && !legacyGraphics) {
		ctx.drawImage(slime.img, xPix - radiusPix, yPix - 38);
	} else {
		ctx.fillStyle = slime.color;
		ctx.beginPath();
		ctx.arc(xPix, yPix, radiusPix, Math.PI, TWO_PI);
		ctx.fill();
	}

	// Draw Eyes
	var eyeX = slime.x + (slime.onLeft ? 1 : -1)*slime.radius/4;
	var eyeY = slime.y + slime.radius/2;
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
