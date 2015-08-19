"use strict";

module.exports = ParserMng;

var Parser = require('./Parser/ParserSync');
var DOMBuilder = require('./Parser/DOMBuilder');
var Mode = require('./GlobalVar').NodeMode;
var TagStat = require('./GlobalVar').TagStat;
var ER = require('./GlobalVar').ElementRelation;
var SingleTag = require('./GlobalVar').SingleTag;
var util = require('./util');

function ParserMng(DOMString, options) {
    var self = this;
    options = options || {};
    //this._DOMString = DOMString;
    this._options = options;
    this.stat = {
        hasDone: false,
        currentElement: null,
        hasGotElement: null,
        prevElement: null,
        tagStack: [],
        node: [],
        lastElement: function () {
            return this.node.length === 0 ? null : this.node[this.node.length - 1]
        }
    };

    this._domBuilder = new DOMBuilder({
        //onTagOpen: function (node, dom) {
        //	//self.stat.currentNode = node;
        //	//console.log("onTagOpen", node);
        //},
        //onAttr: function (node, dom) {
        //	//console.log("onAttr", node);
        //},
        //onTagClose: function (node, dom) {
        //	//console.log("onTagClose", node);
        //},
        //onText: function (node, dom) {
        //	//console.log("onText", node);
        //}
    });
    this._parser = new Parser(DOMString, {
        onReset: function () {
            self._domBuilder.reset();
        },
        onDone: function () {
            self._domBuilder.done();
            self.stat.hasDone = true;

            self.stat.prevElement = self.stat.currentElement;
            self.stat.currentElement = self.stat.hasGotElement = "__StreamEnd__";
        },
        onWrite: function (element) {
            self._domBuilder.write(element);
        },
        onElement: function (element) {
            console.log("onElement", element);
            self.stat.prevElement = self.stat.currentElement;
            self.stat.currentElement = self.stat.hasGotElement = element;

            //if (element.type === Mode.Tag) {
            //	if (self.stat.lastElement()) {
            //		self.stat.nodeDone = true;
            //	}
            //	self.stat.node.push(element);
            //} else if (element.type === Mode.Attr) {
            //	//self.stat.currentNode
            //	self.stat.node.push(element);
            //} else if (element.type === Mode.Text) {
            //	if (self.stat.lastElement()) {
            //		self.stat.nodeDone = true;
            //	}
            //	self.stat.node.push(element);
            //}
        }
    });
}

ParserMng.prototype.getNextElement = function () {
    //util.logStart();
    this.stat.hasGotElement = null;
    if (this.stat.hasDone) return null;

    while (!this.stat.hasDone && !this.stat.hasGotElement) {
        this._parser.getNextElement();
    }
    this.stat.currentElement = this.stat.hasGotElement;
    this.stat.relation = this.getRelation();

};

ParserMng.prototype.getCompleteNode = function () {
    if (this.isSingleTag(this.stat.currentElement)) {
        return "";
    }

    return this._parser.getOuterHTML(this.stat.currentElement, node);
};

ParserMng.prototype.hasNext = function () {
    return !this.stat.hasDone;
};

ParserMng.prototype.getNextTagStat = function () {
    if (this.stat.node.length === 0 && this.stat.hasDone) return TagStat.EndOfStream;
    if (this.stat.node.length === 0) return TagStat.NoTag;

    var element = this.stat.node[0];
    var lastStack = this.stat.tagStack.length === 0 ? null : this.stat.tagStack[this.stat.tagStack.length - 1];
    if (element.type === Mode.Tag) {
        if (element.name.charAt(0) === "/") {
            return TagStat.CloseElement;
        } else {
            if (lastStack === "open") {
                return TagStat.ChildrenTag;
            } else {
                return TagStat.SiblingEle;
            }
        }
    }
    if (element.type === Mode.Text) {
        //return TagStat.TextTag;
        if (lastStack === "open") {
            return TagStat.ChildrenTag;
        } else {
            return TagStat.SiblingEle;
        }
    }
};

ParserMng.prototype.getAttr = function (node, attrName) {
    return node.attr[attrName] === undefined ? "" : node.attr[attrName];
};

ParserMng.prototype.getRelation = function () {
    if (this.stat.prevElement === null) {
        return ER.SiblingEle;
    }
    if (this.stat.currentElement.type === Mode.Tag) {
        if (this.stat.currentElement.name.charAt(0) === "/") {
            return ER.CloseElement;
        } else {
            switch (this.stat.prevElement.type) {
                case Mode.Attr:
                    return ER.ChildEle;
                case Mode.Tag:
                    if (this.stat.prevElement.name.charAt(0) === "/") {
                        return ER.SiblingEle;
                    } else {
                        return ER.ChildEle;
                    }
                case Mode.Text:
                case Mode.Comment:
                case Mode.CData:
                    return ER.SiblingEle;
            }
        }
    }
    if (this.stat.currentElement.type === Mode.Attr) {
        return ER.AttrElment;
    }
    return ER.SiblingEle;
};

ParserMng.prototype.isSingleTag = function (node) {
    return !!SingleTag[node.name];
};

ParserMng.prototype.parseAllHTML = function () {
    this._parser.parseSync();
};