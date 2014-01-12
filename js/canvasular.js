
/*********************\
| Canvasular Automata |
| @author Anthony     |
| @version 1.0        |
| @date 2014/01/11    |
| @edit 2014/01/11    |
\*********************/

/**********
 * config */

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
	window.addEventListener('resize', updateCanvas);

	/////////////////////////
	//initialize the canvas//
	canvas = document.createElement('canvas'); //make it
	canvas.width = document.documentElement.clientWidth; //with this width
	canvas.height = document.documentElement.clientHeight; //and this height
	canvas.style.display = 'none'; //hide it from the user
	document.body.appendChild(canvas); //add it to the body
	ctx = canvas.getContext('2d'); //get the context

	updateCanvas();
}

function updateCanvas() {
	/////////////
	//resize it//
	canvas.width = document.documentElement.clientWidth;
	canvas.height = document.documentElement.clientHeight;
	
	///////////////////////
	//draw the new canvas//
	ctx.fillStyle = '#CD6622';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	////////////////////////////////
	//load it up as the background//
	var image = canvas.toDataURL();
	document.body.style.backgroundImage = 'url('+image+')';
}

/********************
 * helper functions */

function $(sel) { //ghetto jquery
	if (sel.charAt(0) === '#') {
		return document.getElementById(sel.substring(1));
	} else return false;
}

/***********
 * objects */

window.addEventListener('load', initCanvasular);