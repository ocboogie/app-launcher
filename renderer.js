/*jshint esversion: 6 */
// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const fs = require('fs');
const {
    ipcRenderer
} = require('electron');
try {
    var json = require('./list.json');
    //var json = JSON.parse(fs.readFileSync('./list.json'));
} catch (err) {
    $("body").empty();
    $("body").css("background", "#fff");
    $("body").append(err);

    throw err;
}
const colors = json.colors;
const open = require('open');
onWindow = json.mainFolder;

function dir2obj(path) {
    let dir = fs.readdirSync(path);
    let obj = {};
    dir.forEach((item) => {
        obj[item] = {};
        if (fs.lstatSync(path + "/" + item).isDirectory()) {
            obj[item].method = "folder";
            obj[item].value = dir2obj(path + "/" + item);
        } else {
            obj[item].method = "app";
            obj[item].value = path + "/" + item;
        }

    });
    return obj;
}

function jsonClick(target) {
    if (typeof target.method != 'undefined' && typeof target.value != 'undefined') {
        var close = true;
        let exec = require('child_process').exec;
        switch (target.method) {
            case "folder":
                close = false;
                loadFolder(target.value);
                break;
            case "sysFolder":
                close = false;
                loadFolder(dir2obj(target.value));
                break;
            case "url":
                open(target.value);
                break;
            case "app":
                exec("\"" + target.value + "\"");
                break;
            case "cmd":
                exec(target.value);
                break;
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

function loadClick() {
    $('.button').unbind('click');
    $(".button").click(function(e) {
        let target = onWindow[$(e.target).text()];
        jsonClick(target);
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
