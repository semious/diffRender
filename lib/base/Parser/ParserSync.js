"use strict";

var Parser = require('./ParserBase');

Parser.prototype.parseSync = function Parser$parseWorker() {
	//console.time("syncparser");
	//window.syncparser = + new Date();
	this.reset();
	this._parseChunkSync(this._raw);
	this.done();
	//return this._builder.dom;
};

Parser.prototype._parseChunkSync = function Parser$parseChunkSync(chunk) {
	this._state.needData = false;
	this._state.data = (this._state.data !== null) ?
	this._state.data.substr(this.pos) + chunk : chunk;
	while (this._state.pos < this._state.data.length && !this._state.needData) {
		//console.log(this._state);
		this._parse(this._state);
	}
};

Parser.prototype.getNextElement = function () {
	//this._stat.parserPending = false;
	if (this._state.pos < this._state.data.length && !this._state.needData) {
		//console.log(this._state);
		this._parse(this._state);
	}
	else {
		this.done();
	}
};

Parser.prototype.getOuterHTML = function (tagName, node) {
	return this._parseOuterHTML(tagName, node);
};

module.exports = Parser;