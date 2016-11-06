/*jshint esversion: 6 */
// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const fs = require('fs');
const {
    ipcRenderer
} = require('electron');
const open = require('open');
const jsonlint = require('jsonlint');
const exec = require('child_process').exec;

try {
    var json = jsonlint.parse(fs.readFileSync('./config.json', 'utf8'));
    //var json = JSON.parse(fs.readFileSync('./list.json'));
} catch (err) {
    console.log(JSON.stringify(err.toString()));
    $("body").empty();
    $("body").css("background", "#fff");
    $("body").append("<pre>" + err.toString().replace("\r", "") + "</pre>");
    //$("body").append("<textarea rows=\"8\" cols=\"40\">" + err.toString().replace("\r", " ") + "</textarea>");

    throw err;
}

const colors = json.colors;
onWindow = json.mainFolder;

nodeTypes = {
    "folder": (target) => {
        loadFolder(target.value);
        return false;
    },
    "url": (target) => {
        open(target.value);
    },
    "app": (target) => {
        if (process.platform === "darwin") {
            exec("open -a \"" + target.value + "\"");

        } else {
            exec("\"" + target.value + "\"");
        }
    },
    "cmd": (target) => {
        exec(target.value);
    }
};

function jsonClick(target) {
    if (typeof target.method != 'undefined' && typeof target.value != 'undefined' && target.method in nodeTypes) {
        var close = true;
        for (var item in nodeTypes) {
            if (item === target.method) {
                close = nodeTypes[item](target);
            }
        }
        if (close) {
            ipcRenderer.send("close");
        }

    }
}

function loadFolder(value) {
    onWindow = value;
    reload();
}

function jsonArgs(obj, button) {
    if (typeof obj.color === 'string') {
        button.children("div").last().children("button").css("background-color", obj.color);
    } else if (typeof obj.randomColor === 'undefined' || (typeof obj.randomColor === 'boolean' && obj.randomColor)) {
        button.children("div").last().children("button").css("background-color", colors[Math.floor(Math.random() * colors.length)]);
    }
}

function loadGrid(obj) {
    $(".button-container").empty();
    //var json = JSON.parse(data);
    gridSize = parseFloat(100 * 1.0 / Math.ceil(Math.sqrt(Object.keys(obj).length)));
    for (var element in obj) {

        let button = $(".button-container").append("<div class='grid'><button class='btn button'>" + element + "</button></div>");
        jsonArgs(obj[element], button);

    }
    $(".grid").css({
        "width": gridSize + "%",
        "height": gridSize + "%"
    });

}

function loadClickEvents() {
    $('.button').unbind('click');
    $(".button").click(function(e) {
        let target = onWindow[$(e.target).text()];
        jsonClick(target);
        loadClickEvents();
    });
}

function reload() {
    loadGrid(onWindow);
    loadClickEvents();
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
