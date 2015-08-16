"use strict";

var Mode = require('../GlobalVar').NodeMode;

var conf = require('../../../conf');

function DOMBuilder(options, callback) {
	this.reset();
	this._options = options ? options : {};
	//if (this._options.includeLocation === undefined) {
	//	this._options.includeLocation = false; //Include position of element (row, col) on nodes
	//}
	if (this._options.verbose === undefined) {
		this._options.verbose = true; //Keep data property for tags and raw property for all
	}
	if (this._options.enforceEmptyTags === undefined) {
		this._options.enforceEmptyTags = true; //Don't allow children for HTML tags defined as empty in spec
	}
	if (this._options.caseSensitiveTags === undefined) {
		this._options.caseSensitiveTags = true; //Lowercase all tag names
	}
	if (this._options.caseSensitiveAttr === undefined) {
		this._options.caseSensitiveAttr = false; //Lowercase all attribute names
	}
	if ((typeof callback) == "function") {
		this._callback = callback;
	}
}

//HTML Tags that shouldn't contain child nodes
DOMBuilder._emptyTags = {
	area: 1
	, base: 1
	, basefont: 1
	, br: 1
	, col: 1
	, frame: 1
	, hr: 1
	, img: 1
	, input: 1
	, isindex: 1
	, link: 1
	, meta: 1
	, param: 1
	, embed: 1
	, '?xml': 1
};

//Regex to detect whitespace only text nodes
DOMBuilder.reWhitespace = /^\s*$/;

//**Public**//
//Properties//
DOMBuilder.prototype.dom = null; //The hierarchical object containing the parsed HTML
//Methods//
//Resets the builder back to starting state
DOMBuilder.prototype.reset = function DOMBuilder$reset() {
	this.dom = [];
	// this._raw = [];
	this._done = false;
	this._tagStack = [];
	this._lastTag = null;
	this._tagStack.last = function DOMBuilder$_tagStack$last() {
		return (this.length ? this[this.length - 1] : null);
	};
	this._line = 1;
	this._col = 1;
};
//Signals the builder that parsing is done
DOMBuilder.prototype.done = function DOMBuilder$done() {
	this._done = true;
	this.handleCallback(null);
};

DOMBuilder.prototype.error = function DOMBuilder$error(error) {
	this.handleCallback(error);
};

DOMBuilder.prototype.handleCallback = function DOMBuilder$handleCallback(error) {
	if ((typeof this._callback) != "function") {
		if (error) {
			throw error;
		} else {
			return;
		}
	}
	this._callback(error, this.dom);
};

DOMBuilder.prototype.isEmptyTag = function DOMBuilder$isEmptyTag(element) {
	var name = element.name.toLowerCase();
	if (name.charAt(0) == '?') {
		return true;
	}
	if (name.charAt(0) == '/') {
		name = name.substring(1);
	}
	return this._options.enforceEmptyTags && !!DOMBuilder._emptyTags[name];
};

//DOMBuilder.prototype._getLocation = function DOMBuilder$_getLocation() {
//	return {line: this._line, col: this._col};
//};

// DOMBuilder.reLineSplit = /(\r\n|\r|\n)/g;
//DOMBuilder.prototype._updateLocation = function DOMBuilder$_updateLocation(node) {
//	var positionData = (node.type === Mode.Tag) ? node.raw : node.data;
//	if (positionData === null) {
//		return;
//	}
//	// var lines = positionData.split(DOMBuilder.reLineSplit);
//	var lines = positionData.split("\n");
//	this._line += lines.length - 1;
//	if (lines.length > 1) {
//		this._col = 1;
//	}
//	this._col += lines[lines.length - 1].length;
//	if (node.type === Mode.Tag) {
//		this._col += 2;
//	} else if (node.type === Mode.Comment) {
//		this._col += 7;
//	} else if (node.type === Mode.CData) {
//		this._col += 12;
//	}
//};

DOMBuilder.prototype._copyElement = function DOMBuilder$_copyElement(element) {
	var newElement = {type: element.type};

	if (this._options.verbose && element['raw'] !== undefined) {
		newElement.raw = element.raw;
	}
	if (element['name'] !== undefined) {
		switch (element.type) {
			case Mode.Tag:
				newElement.name = this._options.caseSensitiveTags ?
					element.name
					:
					element.name.toLowerCase()
				;
				break;
			case Mode.Attr:
				newElement.name = this._options.caseSensitiveAttr ?
					element.name
					:
					element.name.toLowerCase()
				;
				break;
			default:
				newElement.name = this._options.caseSensitiveTags ?
					element.name
					:
					element.name.toLowerCase()
				;
				break;

		}
	}
	if (element['data'] !== undefined) {
		newElement.data = element.data;
	}
	if (element.location) {
		newElement.location = {line: element.location.line, col: element.location.col};
	}

	return newElement;
};

DOMBuilder.prototype.write = function DOMBuilder$write(element) {
	// this._raw.push(element);
	if (this._done) {
		this.handleCallback(new Error("Writing to the builder after done() called is not allowed without a reset()"));
	}
	//if (this._options.includeLocation) {
	//	if (element.type !== Mode.Attr) {
	//		element.location = this._getLocation();
	//		this._updateLocation(element);
	//	}
	//}

	var parent, node;

	//if (element.type === Mode.Tag) {
	//	node = this._copyElement(element);
	//	if (element.name.charAt(0) !== "/") {
	//		this._options.onTagOpen && this._options.onTagOpen(node);
	//	} else {
	//		this._options.onTagClose && this._options.onTagClose(node);
	//	}
	//}
	//
	//if (element.type === Mode.Attr) {
	//	var node = this._copyElement(element);
	//	this._options.onAttr && this._options.onAttr(node);
	//}
	//
	//if (element.type === Mode.Text) {
	//	var node = this._copyElement(element);
	//	this._options.onText && this._options.onText(node);
	//	if (DOMBuilder.reWhitespace.test(element.data)) {
	//		return;
	//	}
	//}

	if (!this._tagStack.last()) { //There are no parent elements
		//If the element can be a container, add it to the tag stack and the top level list
		if (element.type === Mode.Tag) {
			if (element.name.charAt(0) != "/") { //Ignore closing tags that obviously don't have an opening tag
				node = this._copyElement(element);
				if (!_isIgnoredTags(node)) {
					this.dom.push(node);
				}
				if (!this.isEmptyTag(node)) { //Don't add tags to the tag stack that can't have children
					this._tagStack.push(node);
				}
				this._lastTag = node;
			}
		} else if (element.type === Mode.Attr && this._lastTag) {
			if (!this._lastTag.attributes) {
				this._lastTag.attributes = {};
			}
			this._lastTag.attributes[this._options.caseSensitiveAttr ? element.name : element.name.toLowerCase()] =
				element.data;
		} else { //Otherwise just add to the top level list
			node = this._copyElement(element);
			//console.log(node);
			//if (!_isIgnoredTags(node)) {
			this.dom.push(node);
			//}
		}
	} else { //There are parent elements
		//If the element can be a container, add it as a child of the element
		//on top of the tag stack and then add it to the tag stack
		if (element.type === Mode.Tag) {
			if (element.name.charAt(0) == "/") {
				//This is a closing tag, scan the tagStack to find the matching opening tag
				//and pop the stack up to the opening tag's parent
				var baseName = this._options.caseSensitiveTags ?
						element.name.substring(1)
						:
						element.name.substring(1).toLowerCase()
					;
				if (!this.isEmptyTag(element)) {
					var pos = this._tagStack.length - 1;
					while (pos > -1 && this._tagStack[pos--].name != baseName) {
					}
					if (pos > -1 || this._tagStack[0].name == baseName) {
						while (pos < this._tagStack.length - 1) {
							this._tagStack.pop();
						}
					}
				}
			} else { //This is not a closing tag
				parent = this._tagStack.last();
				if (element.type === Mode.Attr) {
					if (!parent.attributes) {
						parent.attributes = {};
					}
					parent.attributes[this._options.caseSensitiveAttr ? element.name : element.name.toLowerCase()] =
						element.data;
				} else {
					node = this._copyElement(element);
					if (!parent.children) {
						parent.children = [];
					}
					//console.log(node);
					//if (!_isIgnoredTags(node)) {
					parent.children.push(node);
					//}
					if (!this.isEmptyTag(node)) { //Don't add tags to the tag stack that can't have children
						if (!_isIgnoredTags(node)) {
							this._tagStack.push(node);
						}
					}
					if (element.type === Mode.Tag) {
						this._lastTag = node;
					}
				}
			}
		} else { //This is not a container element
			parent = this._tagStack.last();
			if (element.type === Mode.Attr) {
				if (!parent.attributes) {
					parent.attributes = {};
				}
				parent.attributes[this._options.caseSensitiveAttr ? element.name : element.name.toLowerCase()] =
					element.data;
			} else {
				if (!parent.children) {
					parent.children = [];
				}
				node = this._copyElement(element);
				//if (!_isIgnoredTags(node)) {
				parent.children.push(node);
				//}
			}
		}
	}
};

//**Private**//
DOMBuilder.prototype._options = null; //Builder options for how to behave
DOMBuilder.prototype._callback = null; //Callback to respond to when parsing done
DOMBuilder.prototype._done = false; //Flag indicating whether builder has been notified of parsing completed
DOMBuilder.prototype._tagStack = null; //List of parents to the currently element being processed

function _isIgnoredTags(node) {
	for (var i = 0; i < conf.filterTags.length; i++) {
		if (node.name == conf.filterTags[i]) {
			return true;
		}
	}
	return false;
}

module.exports = DOMBuilder;