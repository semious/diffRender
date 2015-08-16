"use strict";

var NodeParserMng = require('./base/NodeParserMng');
var DOMMng = require('./base/DOMMng');
var DiffMng = require('./base/DiffMng');
var PatchMng = require('./base/PatchMng');

function RenderEngine(DOM, DOMString, options) {
	this.options = options;
	this.raw = {
		DOM: DOM,
		DOMString: DOMString
	};
}

RenderEngine.prototype.renderAll = function () {
	//过滤非必要字符
	var chars = /(\r|\n)/g;
	var DOMString = this.raw.DOMString.replace(chars, "");

	var npm = new NodeParserMng(DOMString);
	npm.parseAllHTML();
};

RenderEngine.prototype.renderMock = function () {
	var diff = new DiffMng(),
		patchMng = new PatchMng();

	//过滤非必要字符
	var chars = /(\r|\n)/g;
	var DOMString = this.raw.DOMString.replace(chars, "");

	var npm = new NodeParserMng(DOMString);
	var DOMMmg = new DOMMng(this.raw.DOM);

	while (npm.hasNext()) {
		var diffRet = diff.getNextDiff(DOMMmg, npm);
		patchMng.apply(diffRet, DOMMmg, npm);
	}

	DOMMmg.endDOM();

	//PatchMng.apply(diffRet);
};

RenderEngine.prototype.render = function (DOM, DOMString) {
	if (DOM) this.raw.rootDOM = DOM;
	if (DOMString) this.raw.DOMSting = DOMString;
	this.rootDOM = this.raw.rootDOM;
	this.DOMString = this.raw.DOMString;
	this.startTick();
};

RenderEngine.prototype.startTick = function () {
	this.tick();
};

RenderEngine.prototype.tick = function () {
	this.renderOnce();
	if (this.DOMString.length !== 0) {
		this.tick();
	} else {
		//this.options.onRenderEnd && (this.options.onRenderEnd());
	}
};

RenderEngine.prototype.renderOnce = function () {
	var node = NodeParserMng.getNextNode(this.DOMString);
	var DOMEntity = DOMMng.getNextDOM(this.rootDOM);
	var diff = new DiffMng(node.stream, DOMEntity, {});
	PatchMng.apply(this.rootDOM, diff);
	this.tick();
};

module.exports = window.FastRender = RenderEngine;