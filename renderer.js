/*jshint esversion: 6 */
// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const fs = require('fs');
const json = require('./list.json');
console.log(json);
const colors = json.colors;
const open = require('open');

const {
	ipcRenderer
} = require('electron');
onWindow = json.mainFolder;


function loadGrid(obj) {
	$(".button-container").empty();
	//var json = JSON.parse(data);
	gridSize = parseFloat(100 * 1.0 / Math.ceil(Math.sqrt(Object.keys(obj).length)));
	for (var element in obj) {

		let button = $(".button-container").append("<div class='grid'><button class='btn button'>" + element + "</button></div>");

		if (typeof obj[element].color === 'string') {
			button.children("div").last().children("button").css("background-color", obj[element].color);
		} else if (typeof obj[element].randomColor === 'undefined' || (typeof obj[element].randomColor === 'boolean' && obj[element].randomColor)) {
			button.children("div").last().children("button").css("background-color", colors[Math.floor(Math.random() * colors.length)]);
		}
	}
	$(".grid").css({
		"width": gridSize + "%",
		"height": gridSize + "%"
	});

}

function jsonClick(target) {
	if (typeof target.method != 'undefined' && typeof target.value != 'undefined') {
		var close = true;
		if (target.method === "folder") {
			close = false;
			loadGrid(target.value);
			onWindow = target.value;
			loadClick();
		} else if (target.method === "url") {
			open(target.value);
		} else if (target.method === "app") {
			let exec = require('child_process').exec;
			exec("\"" + target.value + "\"");
		} else if (target.method === "cmd") {
			let exec = require('child_process').exec;
			exec(target.value);
		}
		if (close) {
			ipcRenderer.send("close");
		}

	}
}

function loadClick() {
	$('.button').unbind('click');
	$(".button").click(function(e) {
		let target = onWindow[$(e.target).text()];
		jsonClick(target);

		/*
		if (typeof target.buttons != 'undefined') {
			loadGrid(target.buttons);
			onWindow = target.buttons;
			loadClick();


		} else if (typeof target.action != 'undefined') {
			if (typeof target.action.value != 'undefined') {
				if (target.action.method == "app") {
					let exec = require('child_process').exec;
					exec("\"" + target.action.value + "\"");
				} else if (target.action.method == "cmd") {
					let exec = require('child_process').exec;
					exec(target.action.value);
				} else if (target.action.method == "url") {
					open(target.action.value);
				}

				ipcRenderer.send("close");
			}
		}
		*/
		loadClick();
	});
}

function reload() {
	loadGrid(onWindow);
	loadClick();
}

reload();

ipcRenderer.on("loaded", function(event, arg) {
	onWindow = json.mainFolder;
	reload();
});
/*
fs.readFile('./list.json', (err, data) => {
	if (err) throw err;
	loadGrid(data);

});
*/
