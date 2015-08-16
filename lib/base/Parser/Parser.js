"use strict";

var Parser = require('./ParserBase');
var util = require('./../util');

Parser.prototype.parse = function Parser$parse(data) {
	var self = this;
	this.reset();
	this._parseChunk(data, function () {
		self.done();
	});
};

Parser.prototype._parseChunk = function Parser$parseChunk(chunk, cb) {
	this._state.needData = false;
	this._state.data = (this._state.data !== null) ? this._state.data.substr(this.pos) + chunk : chunk;
	this._parseTask(cb);
};

Parser.prototype._parseTask = function Parser$_parseTask(cb) {
	var self = this, startTime = 0;
	var raf = typeof requestAnimationFrame != "undefined" ? window.requestAnimationFrame : function (callback) {
		window.setTimeout(callback, 1000 / 60);
	};
	var _parseChunk = function () {
		if (self._state.pos < self._state.data.length && !self._state.needData) {
			if (+new Date() - startTime > 100) {
				util.logEnd("start new triggerParse");
				triggerParse();
				//_parseChunk();
			} else {
				//util.logStart("parse");
				self._parse(self._state);
				//util.logEnd("parseEnd", "parse");
				_parseChunk();
			}
		} else {
			cb();
			util.logEnd("parseEnd");
		}
	};
	var triggerParse = function () {
		startTime = +new Date();
		raf(function () {
			_parseChunk();
		});
	};
	util.logStart();
	triggerParse();
};

module.exports = Parser;
