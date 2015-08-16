"use strict";

var DOMMng = function (DOM) {
	this.rootDOM = DOM;
	this.currentDOM = undefined;
};

DOMMng.prototype.getNextNode = function () {
	if (this.currentDOM === undefined) {
		this.currentDOM = this.rootDOM.children.length ? this.rootDOM.children[0] : null;
	} else {
		if (this.currentDOM !== null) {
			var nextNode = this.currentDOM.nextSibling;
			if (nextNode === null) return nextNode;
			// 出去标签之间的空节点 参考 https://developer.mozilla.org/en-US/docs/Web/API/Node/nextSibling
			if (nextNode.valueType === 3 && nextNode.nodeValue.replace(/\s+/g, "").length === 0) {
				nextNode = nextNode.nextSibling;
			}
			this.currentDOM = nextNode;
		}
	}
	return this.currentDOM;
};

DOMMng.prototype.getChildNode = function () {
	if (this.currentDOM === undefined) {
		this.currentDOM = this.rootDOM.children.length ? this.rootDOM.children[0] : null;
	} else {
		if (this.currentDOM !== null) {
			if (this.currentDOM.childNodes.length > 0) {
				this.currentDOM = this.currentDOM.childNodes[0];
				return this.currentDOM;
			}else{
				return null;
			}
		}
	}
	return this.currentDOM;
};

DOMMng.prototype.endDOM = function () {
	while (this.currentDOM !== this.rootDOM) {
		while (this.currentDOM.nextSibling !== null) {
			this.currentDOM.parentNode.removeChild(this.currentDOM.nextSibling);
		}
		this.currentDOM = this.currentDOM.parentNode;
	}
};

module.exports = DOMMng;