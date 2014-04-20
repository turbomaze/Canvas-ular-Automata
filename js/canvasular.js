
/*********************\
| Canvasular Automata |
| @author Anthony     |
| @version 1.0        |
| @date 2014/01/11    |
| @edit 2014/01/11    |
\*********************/

/**********
 * config */
var NUM_NEIGHBORS = 1;
var RULE;
	var d = new Date();
	var coolRules = [30, 57, 60, 73, 89, 90, 102, 105, 110, 124, 126, 150];
	var ruleIdx = Math.floor(
		map(60*d.getMinutes()+d.getSeconds(), 0, 3599, 0, 314)
	)%coolRules.length; //~314 switches an hour
	RULE = intToPaddedBinStr(coolRules[ruleIdx], Math.pow(2, 1+2*NUM_NEIGHBORS)); //2^(2m+1)
var DES_HEIGHT = 87;
var DES_WIDTH = Math.ceil((screen.width/screen.height)*DES_HEIGHT);
var INIT_STATE = null;
var ZERO_COLOR = '#FFFFFF';
var ONE_COLOR = '#E9E9E9';
var VERT_POS = 'top';

/*************
 * constants */

/*********************
 * working variables */
var canvas;
var ctx;

/******************
 * work functions */
function initCanvasular() {
	var start = new Date().getTime();

	////////////////////
	//assign variables//
	canvas = document.createElement('canvas'); //make it
	canvas.width = 1; 
	canvas.height = 1;
	canvas.style.display = 'none'; //hide it from the user
	document.body.appendChild(canvas); //add it to the body
	ctx = canvas.getContext('2d'); //get the context
	
	/////////////////////////////////////////////////
	//load the backround when the button is clicked//
	$('#draw-btn').addEventListener('click', function() {
		//get the inputs or assign defaults
		var width = parseInt($('#ca-width').value) || DES_WIDTH;
		var height = parseInt($('#ca-height').value) || DES_HEIGHT;
		var numNeighbors = parseInt($('#ca-distance').value) || NUM_NEIGHBORS;
		var rule = $('#ca-rule').value || RULE;
			if ($('#ca-distance').value && !$('#ca-rule').value) { //distance but no rule?
				rule = getRandString('01', Math.pow(2, 1+2*numNeighbors)); //make a random one
			}
			
		//fill in the empty ones
		$('#ca-width').value = width;
		$('#ca-height').value = height;
		$('#ca-distance').value = numNeighbors;
		$('#ca-rule').value = rule;
		
		//load the background and report out
		var initRow = loadCABackground(width, height, numNeighbors, rule);
		console.log(((new Date().getTime())-start)+'ms for the rule:\n'+
					rule+'\n'+
					'And inital state: \n'+
					initRow);
	});	
}

function loadCABackground(dw, dh, nn, rule) { //desired width and height of the CA, num neighbors, rule
	////////////////
	//set the size//
	canvas.width = dw;
	canvas.height = dh;
	var scaleAmt = Math.floor((screen.width/dw+screen.height/dh)/2);

	/////////////////////////////
	//prepare the initial state//
	var firstRow;
	if (INIT_STATE) {
		firstRow = centerString(INIT_STATE, dw, '0');
	} else {
		firstRow = getRandString('0001100011', dw); //40% 0s, 60% 1s
	}

	//////////////////////////////////
	//generate the cellular automata//
	var ca = [firstRow];
	var currentRow = firstRow;
	for (var t = 0; t < dh; t++) {
		if (t !== dh-1) {
			currentRow = stepCellularAutomata(nn, rule, currentRow);
			ca.push(currentRow);
		}
	}

	///////////////
	//draw the CA//
	var currImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	for (var y = 0; y < canvas.height; y++) {
		for (var x = 0; x < canvas.width; x++) {
			var idx = 4*(canvas.width*y + x);
			var color = (ca[y].charAt(x) === '0') ? ZERO_COLOR : ONE_COLOR; 
			currImageData.data[idx+0] = parseInt(color.substring(1, 3), 16);
			currImageData.data[idx+1] = parseInt(color.substring(3, 5), 16);
			currImageData.data[idx+2] = parseInt(color.substring(5, 7), 16);
			currImageData.data[idx+3] = 255;
		}
	}

	////////////////////////////////////////////////////////////
	//scale the CA cleanly onto canvas (which must be larger!)//
	var chunkilyScaledImg = scaleImageData(currImageData, scaleAmt);
	canvas.width = canvas.width*scaleAmt;
	canvas.height = canvas.height*scaleAmt;
	ctx.putImageData(chunkilyScaledImg, 0, 0);

	////////////////////////////////
	//load it up as the background//
	var image = canvas.toDataURL();
	document.body.style.background = 'url('+image+
		') no-repeat center '+VERT_POS+' fixed';
	document.body.style.backgroundSize = 'cover';
	
	return firstRow; //return the first row
}

function stepCellularAutomata(magic, rule, curr, loop) {
	////////////////////////////
	//deal with the parameters//
	//how to treat boundaries: loop around or assume white?
	loop = arguments.length === 3 ? loop : true; //default to looping around

	///////////////////////////////
	//compute the next generation//
	var nextGen = '';
	for (var ai = 0; ai < curr.length; ai++) { //for each point
		var slidingWindow = ''; //look at the surrounding cells
		if (ai-magic < 0) { //the leftmost cells requires attention
			for (var bi = 0; bi < magic-ai; bi++) { //this many out of bounds
				slidingWindow += (loop) ? curr.charAt(curr.length-1) : 0;
			}
			//assume there's only an issue with the left end 
			slidingWindow += curr.substring(0, ai+magic+1);
		} else if (ai+magic >= curr.length) { //the rightmost need attn. too
			//assume there's only an issue with the right end 
			slidingWindow += curr.substring(ai-magic, curr.length);
			for (var bi = 0; bi < 1+ai+magic-curr.length; bi++) { //boundary
				slidingWindow += (loop) ? curr.charAt(curr.length-1) : 0;
			}
		} else { 
			slidingWindow = curr.substring(ai-magic, ai+magic+1); 
		}
		var x = parseInt(slidingWindow, 2); //numerical representation
		//digits and strings are index differently, so 'reverse' the idx
		var idxInStrRule = rule.length-x-1;
		//if the pattern is in the rule (corresp. bit is 1)
		if (rule.charAt(idxInStrRule) === '1') {
			nextGen += '1'; //then the point is in
		} else {
			nextGen += '0'; //otherwise it's out
		}
	}
	return nextGen;
}

/********************
 * helper functions */
//this function is stolen from http://stackoverflow.com/a/9138593/3152419
//optimized signicantly though; 100%+ increase in performance
function scaleImageData(imageData, scale) {
	var scaled = ctx.createImageData(imageData.width * scale, 
		imageData.height * scale
	);
	for(var row = 0; row < imageData.height; row++) {
		var rts = row*scale;
		var rtidwt4 = 4*row*imageData.width;
		for(var colt4 = 0; colt4 < imageData.width*4; colt4+=4) {
			var colt4ts = colt4*scale;
			var rtidwt4pcolt4 = rtidwt4 + colt4;
			var p1 = imageData.data[rtidwt4pcolt4 + 0];
			var p2 = imageData.data[rtidwt4pcolt4 + 1];
			var p3 = imageData.data[rtidwt4pcolt4 + 2];
			var p4 = imageData.data[rtidwt4pcolt4 + 3];
			for(var y = 0; y < scale; y++) {
				var destRow = rts + y;
				var drtswt4 = destRow*scaled.width*4;
				for(var xt4 = 0; xt4 < scale*4; xt4+=4) {
					var destCol = colt4ts + xt4;
					var idx = drtswt4+destCol;
					scaled.data[idx] = p1;
					scaled.data[idx+1] = p2;
					scaled.data[idx+2] = p3;
					scaled.data[idx+3] = p4;
				}
			}
		}
	}
	return scaled;
}

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
		if (ret.length < len) {
			ret += '0'; //didn't add up perfect, fudge it by 1
		}
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

//given an n in [d1, d2], return a linearly related number in [r1, r2]
function map(n, d1, d2, r1, r2) {
	var Rd = d2-d1;
	var Rr = r2-r1;
	return (Rr/Rd)*(n - d1) + r1;
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