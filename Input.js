var KEY_A = 65;
var KEY_D = 68;
var KEY_W = 87;

var KEY_SPACE = 32;

var KEY_LEFT  = 37;
var KEY_UP    = 38
var KEY_RIGHT = 39


var keysDown = {};
addEventListener("keydown", function(e) {
  //console.log("keydown '" + e.keyCode + "'");
  if(e.keyCode == KEY_SPACE) {
    spaceKeyDown();
  } else {
    keysDown[e.keyCode] = true;
  }
}, false);
addEventListener("keyup", function(e) {
    //console.log("keyup   '" + e.keyCode + "'");
    keysDown[e.keyCode] = false;
}, false);


function getSinglePlayerInput() {
	var input1 = getPlayerOneInput();
	var input2 = getPlayerTwoInput();
	return {
		left: input1.left || input2.left,
		right: input1.right || input2.right,
		jump: input1.jump || input2.jump
	};
}

function getPlayerOneInput() {
	return {
		left: keysDown[KEY_A],
		right: keysDown[KEY_D],
		jump: keysDown[KEY_W]
	};
}

function getPlayerTwoInput() {
	return {
		left: keysDown[KEY_LEFT],
		right: keysDown[KEY_RIGHT],
		jump: keysDown[KEY_UP]
	};
}

function wrapInputToNetwork(inputFun, socket, slime) {
	var cached = {
		left: false,
		right: false,
		jump: false
	};
	return function() {
		var input = inputFun();
		if (input.left != cached.left ||
		    input.right != cached.right ||
		    input.jump != cached.jump) {
			cached = input;
			var message = {
				input: input,
				orientation: copyOrientation(slime)
			};
			socket.emit('move', message);
		}
		return input;
	};
}

function newStaticInput(input) {
	return function() {
		return input || { left: false, right: false, jump: false };
	};
}
