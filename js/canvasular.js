
/*********************\
| Canvasular Automata |
| @author Anthony     |
| @version 1.0        |
| @date 2014/01/11    |
| @edit 2014/01/11    |
\*********************/

/**********
 * config */
var DES_WIDTH = 100;
var DES_HEIGHT = 100;
var RULE = 30;
var INIT_STATE = null;
var ZERO_COLOR = 255;
var ONE_COLOR = 0;
var RECALC_ON_RESIZE = false;

/*************
 * constants */

/*********************
 * working variables */
var canvas;
var ctx;

/******************
 * work functions */
function initCanvasular() {
	///////////////////
	//event listeners//
	if (RECALC_ON_RESIZE) {
		window.addEventListener('resize', function onResize() {
			canvas.width = document.documentElement.clientWidth; 
			canvas.height = document.documentElement.clientHeight;
			updateCanvas(canvas.width, canvas.height);
		});
	}
	
	////////////////////
	//assign variables//
	canvas = document.createElement('canvas'); //make it
	canvas.width = document.documentElement.clientWidth; 
	canvas.height = document.documentElement.clientHeight;
	canvas.style.display = 'none'; //hide it from the user
	document.body.appendChild(canvas); //add it to the body
	ctx = canvas.getContext('2d'); //get the context
	
	//updateCanvas(DES_WIDTH, DES_HEIGHT);
	updateCanvas(canvas.width, canvas.height);
}

function updateCanvas(dw, dh) { //desired width and height of the image
	////////////////
	//fix the size//

	/////////////////////////////
	//prepare the initial state//
	var firstRow;
	if (INIT_STATE) {
		firstRow = centerString(INIT_STATE, dw, '0');
	} else {
		firstRow = getRandString('01', dw);
	}

	//////////////////////////
	//compute the new canvas//
	var currImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	for (var y = 0; y < canvas.height; y++) {
		for (var x = 0; x < canvas.width; x++) {
			var idx = 4*(canvas.width*y + x);
			var color = (firstRow.charAt(x) === '0') ? ZERO_COLOR : ONE_COLOR; 

			currImageData.data[idx+0] = color;
			currImageData.data[idx+1] = color;
			currImageData.data[idx+2] = color;
			currImageData.data[idx+3] = 255;
		}
		if (y !== canvas.height-1) {
			firstRow = stepCellularAutomata(RULE, firstRow);
		}
	}
	ctx.putImageData(currImageData, 0, 0);

	////////////////////////////////
	//load it up as the background//
	var image = canvas.toDataURL();
	document.body.style.background = '#EFEFEF url('+image+
		') no-repeat center top fixed';
	document.body.style.backgroundSize = 'cover';
}

function stepCellularAutomata(rule, curr, loop) {
	var MAGIC = 1; //how many to check, left and right

	////////////////////////////
	//deal with the parameters//
	var strRule = intToPaddedBinStr(rule, Math.pow(2, 1+2*MAGIC)); //2^(2m+1) 
	//how to treat boundaries: loop around or assume white?
	loop = arguments.length === 3 ? loop : true; //default to looping around

	///////////////////////////////
	//compute the next generation//
	var nextGen = '';
	for (var ai = 0; ai < curr.length; ai++) { //for each point
		var slidingWindow = ''; //look at the surrounding cells
		if (ai-MAGIC < 0) { //the leftmost cells requires attention
			for (var bi = 0; bi < MAGIC-ai; bi++) { //this many out of bounds
				slidingWindow += (loop) ? curr.charAt(curr.length-1) : 0;
			}
			//assume there's only an issue with the left end 
			slidingWindow += curr.substring(0, ai+MAGIC+1);
		} else if (ai+MAGIC >= curr.length) { //the rightmost need attn. too
			//assume there's only an issue with the right end 
			slidingWindow += curr.substring(ai-MAGIC, curr.length);
			for (var bi = 0; bi < 1+ai+MAGIC-curr.length; bi++) { //boundary
				slidingWindow += (loop) ? curr.charAt(curr.length-1) : 0;
			}
		} else { 
			slidingWindow = curr.substring(ai-MAGIC, ai+MAGIC+1); 
		}
		var x = parseInt(slidingWindow, 2); //numerical representation
		//digits and strings are index differently, so 'reverse' the idx
		var idxInStrRule = strRule.length-x-1;
		//if the pattern is in the rule (corresp. bit is 1)
		if (strRule.charAt(idxInStrRule) === '1') {
			nextGen += '1'; //then the point is in
		} else {
			nextGen += '0'; //otherwise it's out
		}
	}
	return nextGen;
}

/********************
 * helper functions */
function centerString(str, len, fill) {
	if (str.length == len) return str;
	else if (str.length > len) {
		var diff = str.length - len;
		var numLeft = Math.floor(diff/2); //amt to cut off the left
		var numRight = diff - numLeft; //amt to cut off the right
		return str.substring(numLeft+1, str.length-numRight);
	} else {
		var ret = str;
		for (var ai = 0; ai < Math.floor((len-str.length)/2); ai++) {
			ret = fill + ret + fill;
		}
		if (ret.length < len) ret += '0'; //didn't add up perfect, fudge it by 1
		return ret;
	}
}

function intToPaddedBinStr(num, len) {
	var ret = num.toString(2);
	var numZeroesToAdd = len-ret.length;
	for (var ai = 0; ai < numZeroesToAdd; ai++) {
		ret = '0'+ret;
	}
	return ret.substring(ret.length-len, len); //least significant len digits
}

function $(sel) { //ghetto jquery
	if (sel.charAt(0) === '#') {
		return document.getElementById(sel.substring(1));
	} else return false;
}

function getRandString(alphabet, length) {
	if (length == 0) return '';
	return alphabet.charAt(getRandInt(0, alphabet.length)) + 
		   getRandString(alphabet, length-1);
} 

function getRandInt(low, high) { //output is in [low, high)
	return Math.floor(low + Math.random()*(high-low));
}

function round(n, places) {
	var mult = Math.pow(10, places);
	return Math.round(mult*n)/mult;
}

/***********
 * objects */

window.addEventListener('load', initCanvasular);