"use strict";

var DiffType = require('./GlobalVar').DiffType;
var TagStat = require('./GlobalVar').TagStat;
var ER = require('./GlobalVar').ElementRelation;

var DiffMng = function (options) {
	//this.diffList = [];
	this._options = options;
};

DiffMng.prototype.getNextDiff = function (DOMMng, npm) {
	var DOMNode;

	this.DOMMng = DOMMng;
	this.npm = npm;

	npm.getNextElement();

	switch (npm.getRelation()) {
		case ER.SiblingEle:
			DOMNode = DOMMng.getNextNode();
			if (DOMNode === null) {
				return DiffType.NewSiblingNode;
			} else {
				return this._compareTag(DOMNode, npm.stat.currentElement);
			}
		case ER.ChildEle:
			DOMNode = DOMMng.getChildNode();
			if (DOMNode === null) {
				return DiffType.NewChildNode;
			} else {
				return this._compareTag(DOMNode, npm.stat.currentElement);
			}
		case ER.AttrEle:
			return this._compareAttr(DOMMng.currentDOM, npm.stat.currentElement);
		case ER.CloseEle:
			return DiffType.TagClose;
	}

	return null;
	//return this._compareTag(DOMMng, npm);
	//this.diffList.push([diff, DOMNode, node]);
	//this._options.onDiff && this._options.onDiff(diff, DOMNode, node);
};

DiffMng.prototype._compareTag = function (DOMNode, node) {

	/*
	 Node.ELEMENT_NODE	1	An Element node such that <p> or <div>.
	 Node.TEXT_NODE	3	The actual Text of Element or Attr.
	 Node.PROCESSING_INSTRUCTION_NODE	7	A ProcessingInstruction of an XML document such as <?xml-stylesheet ... ?> declaration.
	 Node.COMMENT_NODE	8	A Comment node.
	 Node.DOCUMENT_NODE	9	A Document node.
	 Node.DOCUMENT_TYPE_NODE	10	A DocumentType node e.g. <!DOCTYPE html> for HTML5 documents.
	 Node.DOCUMENT_FRAGMENT_NODE	11	A DocumentFragment node.
	 * */
	var nodeTypeMap = {
		text: 3,
		tag: 1,
		doctype: 10,
		comment: 8
	};

	/*
	 采用乐观比较方案，即认为大多数的节点和属性都是相同的，对于少部分的节点和属性会有不同,
	 比较采用特性比对，比对主要特性，不对所有的属性进行比较，已提高性能，并且不比较children，完全相同的比较会非常高
	 */


	// 如果节点类型不同，则视为完全不同的节点
	if (DOMNode.nodeType !== nodeTypeMap[node.type]) {
		return DiffType.DiffNode;
	}

	// 对于文本节点做专门判断
	if (DOMNode.nodeType === 3) {//对于文本节点做特殊处理
		//DOMNode.nodeValue === node.data
		//if(DOMNode.nodeValue)
		return this._compareText(DOMNode, node);
	}

	// 规则 node名字不同，完全不同的节点
	if (DOMNode.nodeName.toLowerCase() !== node.name.toLowerCase()) {
		return DiffType.DiffNode;
	}else{
		return DiffType.Same;
	}
};

DiffMng.prototype._compareAttr = function (DOMNode, attrElement) {
	var DOMAttr = DOMNode.getAttribute(attrElement.name);
	if (DOMAttr === null) {
		return DiffType.DiffAttr;
	} else {
		return DOMAttr == attrElement.data ? DiffType.Same : DiffType.DiffAttr;
	}
};

DiffMng.prototype._compareText = function (DOMNode, node) {
	if (DOMNode.nodeValue === node.data) {
		return DiffType.Same;
	} else {
		return DiffType.DiffText;
	}
};

DiffMng.prototype._isSameClass = function (DOMNode, node) {
	var DOMClass = DOMNode.attributes['class'],
		npmClass = this.npm.getAttr(node, "class");

	// 只有存在一个节点没有class，则判定class是不同的,立即返回
	if (DOMClass === undefined || npmClass === "") {
		return false;
	}

	// 不采用foreach，是因为要采用短路的方式，即一发现不同，即迅速return，而不是等所有的遍历结束
	var DOMClassAry = DOMClass.split(/\s+/),
		isInClassReg = new RegExp("(^|\\s+)" + className + "($|\\s+)");

	for (var i = 0; i = DOMClassAry.length; i++) {
		if (!isInClassReg.test(DOMClassAry[i])) {
			return false;
		}
	}
	return true;
};

//todo 需要考虑 onclick 之类的变化

module.exports = DiffMng;