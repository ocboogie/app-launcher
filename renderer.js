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
    $("body").empty();
    $("body").css("background", "#fff");
    $("body").append("<pre>" + err.toString().replace("\r", "") + "</pre>");
    //$("body").append("<textarea rows=\"8\" cols=\"40\">" + err.toString().replace("\r", " ") + "</textarea>");

    throw err;
}

const colors = json.colors;
windowHistory = [json.mainFolder];

nodeTypes = {
    "folder": (target) => {
        loadFolder(target.value);
        return false;
    },
    "sys short folder": (target) => {
        loadFolder(dir2obj(target.value));
        return false;
    },
    "sys long folder": (target) => {
        loadFolder(dir2obj(target.value, true));
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

$("body").mousedown((event) => {
    if (event.which === 3) {
        if (windowHistory[0] == json.mainFolder) {
            ipcRenderer.send("close");
        }
        else {
            back();
        }
    }

});

function stripDataType(string) {
    if (string.split(".").length > 1) {
        return string.split(".").slice(0, -1).join(".");
    } else {
        return string;
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
    let obj = [];
    dir.forEach((item) => {
        if (long || !fs.lstatSync(path + "/" + item).isDirectory()) {
            let name = stripDataType(item);
            let index = obj.push({});
            obj[index - 1].name = name;
            if (fs.lstatSync(path + "/" + item).isDirectory() && long) {
                obj[index - 1].method = "folder";
                obj[index - 1].value = dir2obj(path + "/" + item);
            } else {
                obj[index - 1].method = "app";
                obj[index - 1].value = path + "/" + item;
            }
        }
    });
    return obj;
}

function loadFolder(value) {

    windowHistory.unshift(value);
    reload();
}

function back() {
    if (windowHistory.length > 1) {
        windowHistory.shift();
        reload();
    }
}

function jsonArgs(obj, button) {
    if (typeof obj.name === 'string') {
        button.children("div").last().children("div").children("span").html(obj.name);
    }
    if (typeof obj.color === 'string') {
        button.children("div").last().css("background-color", obj.color);
    } else {
        button.children("div").last().css("background-color", colors[Math.floor(Math.random() * colors.length)]);
    }
    if (typeof obj.img === 'string') {
        button.children("div").last().css("background-image", "url('" + obj.img + "')");
    }
}

function loadGrid(obj) {
    $(".button-container").empty();
    //var json = JSON.parse(data);
    gridSize = parseFloat(100 * 1.0 / Math.ceil(Math.sqrt(obj.length)));
    obj.forEach((element) => {
        let button = $(".button-container").append("<div class='grid'><div class='text'><span></span></div></div>");
        //let button = $(".button-container").append("<div class='grid'><button class='btn'><span></span></button></div>");
        jsonArgs(element, button);
    });
    $(".grid").css({
        "width": gridSize + "%",
        "height": gridSize + "%",
    });
    $(".grid div").each((index) => {
        $(".grid div").eq(index).textfill();
    });
}

function loadClickEvents() {
    $('.button-container .grid').unbind('click');
    $(".button-container .grid").click(function(e) {
        let target = windowHistory[0][$('.button-container .grid').index(this)];
        jsonClick(target);
        loadClickEvents();
    });
}

function reload() {
    loadGrid(windowHistory[0]);
    loadClickEvents();
}

reload();

ipcRenderer.on("loaded", function(event, arg) {
    windowHistory = [json.mainFolder];
    reload();
});
