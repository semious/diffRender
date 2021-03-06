"use strict";

var util = module.exports = {};

var conf = require('../../conf.json');

var timestamp = 0, logs = {};

/**
 *
 * @param {String} [logName] 可选日志名字，默认为default
 */
util.logStart = function (logName) {
	logName = logName || "default";
	logs[logName] = +new Date();
	if (conf.debugMode === true) {
		if (document.querySelector("#__log__") == null) {
			var div = document.createElement("div");
			div.setAttribute("style", "position: fixed;left: 0;bottom: 0;background: #ffffff;border: 1px solid #cccccc;padding: 3px;z-index: 1000;max-height:300px;overflow:scroll");
			div.id = "__log__";
			document.body.appendChild(div);
		}
	}
};

/**
 *
 * @param value
 * @param logName
 *
 */
util.logEnd = function (value, logName) {
	logName = logName || "default";
	var logText = (value ? value + ": " : "") + (+new Date() - logs[logName]) + " ms";
	console.log(logText);
	if (conf.debugMode === true) {
		var log = document.querySelector("#__log__").innerHTML;
		document.querySelector("#__log__").innerHTML = log + "<br />" + logText;
	}
	logs[logName] = +new Date();
};