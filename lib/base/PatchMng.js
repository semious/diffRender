"use strict";

var DiffLevel = require('./GlobalVar').DiffType;

var PatchMng = function (options) {
	this._options = options;
};

PatchMng.prototype.apply = function (diffRet, DOMMng, npm) {
	//console.log(diffRet);
	switch (diffRet) {
		case DiffLevel.DiffNode:
			this.syncNode(DOMMng, npm);
			break;
		case DiffLevel.DiffAttr:
			this.syncAttr(DOMMng, npm);
			break;
		case DiffLevel.TagClose:
			this.applyTagClose(DOMMng, npm);
			break;
		case DiffLevel.DiffText:
			this.syncText(DOMMng, npm);
			break;
		case DiffLevel.NewSiblingNode:
			this.addNode(DOMMng, npm);
			break;
		case DiffLevel.NoMoreTag:
			this.endDOM(DOMMng);
			break;

	}
};

PatchMng.prototype.syncNode = function (DOMMng, npm) {
	var innerHTML = npm.getCompleteNode();
	var tagtName = npm.currentNode.name;
	var newElement = document.createElement(tagtName);
	newElement.innerHTML = innerHTML;
	DOMMng.currentDOM.parentNode.insertBefore(newElement, DOMMng.currentDOM);
	DOMMng.currentDOM.parentNode.removeChild(DOMMng.currentDOM);
	DOMMng.currentDOM = newElement;
	//DOMMng.currentDOM
};

PatchMng.prototype.addNode = function (DOMMng, npm) {

};

PatchMng.prototype.syncAttr = function (DOMMng, npm) {
	var _syncAttr = function (DOM, node) {
		Array.prototype.slice.call(DOM.attributes).forEach(function (attr) {
			if (node.attr[attr.name] === undefined) {
				DOM.removeAttribute(attr.name);
			} else {
				DOM.setAttribute(attr.name, node.attr[attr.name]);
				delete node.attr[attr.name];
			}
		});
		for (var name in node.attr) {
			if (node.attr.hasOwnProperty(name)) {
				DOM.setAttribute(name, node.attr[name]);
			}
		}
	};
	_syncAttr(DOMMng.currentDOM, npm.currentNode);
};

PatchMng.prototype.applyTagClose = function (DOMMng, npm) {
	var currentDOM = DOMMng.currentDOM;
	var nodeName = npm.currentNode.name.substr(1, npm.currentNode.name.length);
	// 如果当前闭合的标签和当前的元素一直，则清空该元素内部的所有内容
	if (currentDOM.nodeName.toLowerCase() === nodeName) {
		currentDOM.innerHTML = "";
	} else {
		// 移除当前DOM后所有其他的DOM节点，并将当前的DOM设置为父DOM
		while (DOMMng.currentDOM !== DOMMng.rootDOM && DOMMng.currentDOM.nodeName.toLowerCase() !== nodeName) {
			while (DOMMng.currentDOM.nextSibling !== null) {
				DOMMng.currentDOM.parentNode.removeChild(DOMMng.currentDOM.nextSibling);
			}
			DOMMng.currentDOM = DOMMng.currentDOM.parentNode;
		}
	}
};

PatchMng.prototype.syncText = function (DOMMng, npm) {
	DOMMng.currentDOM.nodeValue = npm.currentNode.data;
};

PatchMng.prototype.endDOM = function (DOMMng) {
	while (DOMMng.currentDOM.nextSibling !== null) {
		currentDOM.parentNode.removeChild(currentDOM.nextSibling);
	}
};

module.exports = PatchMng;