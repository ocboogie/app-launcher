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
    "sys short folder": (target) => {
        loadFolder(dir2obj(target.value));
        return false;
    },
    "url": (target) => {
        open(target.value);
        return true;
    },
    "app": (target) => {
        if (process.platform === "darwin") {
            exec("open -a \"" + target.value + "\"");
        } else {
            exec("\"" + target.value + "\"");
        }
        return true;
    },
    "cmd": (target) => {
        exec(target.value);
        return true;
    }
};

function stripDataType(string) {
    if (string.split(".").length > 1) {
        return string.split(".").slice(0, -1).join(".");
    } else {
        return string.join(".");
    }
}

function jsonClick(target) {
    if (typeof target.method != 'undefined' && typeof target.value != 'undefined' && target.method in nodeTypes) {
        let close = false;
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

function dir2obj(path, long = false) {
    let dir = fs.readdirSync(path);
    let obj = {};
    dir.forEach((item) => {
        let name = stripDataType(item);
        obj[name] = {};

        if (fs.lstatSync(path + "/" + item).isDirectory() && long) {
            obj[name].method = "folder";
            obj[name].value = dir2obj(path + "/" + item);
        } else {
            obj[name].method = "app";
            obj[name].value = path + "/" + item;
        }

    });
    return obj;
}

function loadFolder(value) {
    onWindow = value;
    reload();
}

function jsonArgs(obj, button) {
    if (typeof obj.color === 'string') {
        button.children("div").last().children("button").css("background-color", obj.color);
    } else {
        button.children("div").last().children("button").css("background-color", colors[Math.floor(Math.random() * colors.length)]);
    }
}

function loadGrid(obj) {
    $(".button-container").empty();
    //var json = JSON.parse(data);
    gridSize = parseFloat(100 * 1.0 / Math.ceil(Math.sqrt(Object.keys(obj).length)));
    for (var element in obj) {

        let button = $(".button-container").append("<div class='grid'><button class='btn'>" + element + "</button></div>");
        jsonArgs(obj[element], button);

    }
    $(".grid").css({
        "width": gridSize + "%",
        "height": gridSize + "%"
    });

}

function loadClickEvents() {
    $('.button-container .grid .btn').unbind('click');
    $(".button-container .grid .btn").click(function(e) {
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
