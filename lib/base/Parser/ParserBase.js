"use strict";

module.exports = Parser;

var Mode = require('../GlobalVar').NodeMode;

function Parser(DOMString, options) {
	//cb = cb || (function () {
	//	});
	//var builder = new DOMBuilder(null, options);
	this._raw = DOMString;
	this._options = options ? options : {};
	// if (this._options.includeLocation === undefined) {
	//     this._options.includeLocation = false; //Include position of element (row, col) on nodes
	// }
	//var self = this;
	//this._builder = DOMBuilder;
	this.reset();
	this._state.data = DOMString;
}

Parser._re_parseText_scriptClose = /<\s*\/\s*script/ig;
Parser.re_parseTag = /\s*(\/?)\s*([^\s>\/]+)(\s*)\??(>?)/g;
Parser.re_parseAttr_findName = /\s*([^=<>\s'"\/]+)\s*/g;
Parser.re_parseAttr_findValue = /\s*=\s*(?:'([^']*)'|"([^"]*)"|([^'"\s\/>]+))\s*/g;
Parser.re_parseAttr_findValue_last = /\s*=\s*['"]?(.*)$/g;
Parser.re_parseAttr_splitValue = /\s*=\s*['"]?/g;
Parser.re_parseAttr_selfClose = /(\s*\/\s*)(>?)/g;
Parser.re_parseCData_findEnding = /\]{1,2}$/;
Parser.re_parseComment_findEnding = /\-{1,2}$/;

Parser.prototype.reset = function Parser$reset() {
	this._state = {
		mode: Mode.Text,
		pos: 0,
		data: null,
		pendingText: null,
		pendingWrite: null,
		lastTag: null,
		isScript: false,
		needData: false,
		output: [],
		done: false//,
		// line: 1,
		// col: 1
	};
	this._options.onReset && this._options.onReset();
	//this._builder.reset();
};

Parser.prototype.done = function Parser$done() {
	this._state.done = true;
	this._parse(this._state);
	this._flushWrite();
	this._options.onDone && this._options.onDone();
	//this._builder.done();
};

Parser.prototype._parse = function Parser$_parse() {
	switch (this._state.mode) {
		case Mode.Text:
			return this._parseText(this._state);
		case Mode.Tag:
			return this._parseTag(this._state);
		case Mode.Attr:
			return this._parseAttr(this._state);
		case Mode.CData:
			return this._parseCData(this._state);
		case Mode.Doctype:
			return this._parseDoctype(this._state);
		case Mode.Comment:
			return this._parseComment(this._state);
	}
};

Parser.prototype._parseTag = function Parser$_parseTag() {
	var state = this._state;
	Parser.re_parseTag.lastIndex = state.pos;
	var match = Parser.re_parseTag.exec(state.data);
	if (match) {
		if (!match[1] && match[2].substr(0, 3) === '!--') {
			state.mode = Mode.Comment;
			state.pos += 3;
			return;
		}
		if (!match[1] && match[2].substr(0, 8) === '![CDATA[') {
			state.mode = Mode.CData;
			state.pos += 8;
			return;
		}
		if (!match[1] && match[2].substr(0, 8) === '!DOCTYPE') {
			state.mode = Mode.Doctype;
			state.pos += 8;
			return;
		}
		if (!state.done && (state.pos + match[0].length) === state.data.length) {
			//We're at the and of the data, might be incomplete
			state.needData = true;
			return;
		}
		var raw;
		if (match[4] === '>') {
			state.mode = Mode.Text;
			raw = match[0].substr(0, match[0].length - 1);
		} else {
			state.mode = Mode.Attr;
			raw = match[0];
		}
		state.pos += match[0].length;
		var tag = {type: Mode.Tag, name: match[1] + match[2], raw: raw};
		if (state.mode === Mode.Attr) {
			state.lastTag = tag;
		}
		if (tag.name.toLowerCase() === 'script') {
			state.isScript = true;
		} else if (tag.name.toLowerCase() === '/script') {
			state.isScript = false;
		}
		if (state.mode === Mode.Attr) {
			//this._writePending(tag);
			this._write(tag);
		} else {
			this._write(tag);
		}
	} else {
		//TODO: end of tag?
		//TODO: push to pending?
		state.needData = true;
	}
};

Parser.prototype._parseText = function Parser$_parseText() {
	var state = this._state;
	var foundPos;
	if (state.isScript) {
		Parser._re_parseText_scriptClose.lastIndex = state.pos;
		foundPos = Parser._re_parseText_scriptClose.exec(state.data);
		foundPos = (foundPos) ? foundPos.index : -1;
	} else {
		foundPos = state.data.indexOf('<', state.pos);
	}
	var text = (foundPos === -1) ? state.data.substring(state.pos, state.data.length) : state.data.substring(state.pos, foundPos);
	if (foundPos < 0 && state.done) {
		foundPos = state.data.length;
	}
	if (foundPos < 0) {
		if (state.isScript) {
			state.needData = true;
			return;
		}
		if (!state.pendingText) {
			state.pendingText = [];
		}
		state.pendingText.push(state.data.substring(state.pos, state.data.length));
		state.pos = state.data.length;
	} else {
		if (state.pendingText) {
			state.pendingText.push(state.data.substring(state.pos, foundPos));
			text = state.pendingText.join('');
			state.pendingText = null;
		} else {
			text = state.data.substring(state.pos, foundPos);
		}
		if (text.trim() !== '') {
			//this._writePending({type: Mode.Text, data: text});
			this._write({type: Mode.Text, data: text});
		}
		state.pos = foundPos + 1;
		state.mode = Mode.Tag;
	}
};
/**
 *
 * @returns {*}
 * @constructor
 */
Parser.prototype._parseAttr_findName = function Parser$_parseAttr_findName() {
	Parser.re_parseAttr_findName.lastIndex = this._state.pos;
	var match = Parser.re_parseAttr_findName.exec(this._state.data);
	if (!match) {
		return null;
	}
	if (this._state.pos + match[0].length !== Parser.re_parseAttr_findName.lastIndex) {
		return null;
	}
	return {
		match: match[0]
		, name: match[1]
	};
};

/**
 *
 * @returns {*}
 * @constructor
 */
Parser.prototype._parseAttr_findValue = function Parser$_parseAttr_findValue() {
	var state = this._state;
	Parser.re_parseAttr_findValue.lastIndex = state.pos;
	var match = Parser.re_parseAttr_findValue.exec(state.data);
	if (!match) {
		if (!state.done) {
			return null;
		}
		Parser.re_parseAttr_findValue_last.lastIndex = state.pos;
		match = Parser.re_parseAttr_findValue_last.exec(state.data);
		if (!match) {
			return null;
		}
		return {
			match: match[0]
			, value: (match[1] !== '') ? match[1] : null
		};
	}
	if (state.pos + match[0].length !== Parser.re_parseAttr_findValue.lastIndex) {
		return null;
	}
	return {
		match: match[0]
		, value: match[1] || match[2] || match[3]
	};
};

Parser.prototype._parseAttr = function Parser$_parseAttr() {
	var state = this._state;
	var name_data = this._parseAttr_findName(state);
	if (!name_data || name_data.name === '?') {
		Parser.re_parseAttr_selfClose.lastIndex = state.pos;
		var matchTrailingSlash = Parser.re_parseAttr_selfClose.exec(state.data);
		if (matchTrailingSlash && matchTrailingSlash.index === state.pos) {
			if (!state.done && !matchTrailingSlash[2] && state.pos + matchTrailingSlash[0].length === state.data.length) {
				state.needData = true;
				return;
			}
			state.lastTag.raw += matchTrailingSlash[1];
			// state.output.push({ type: Mode.Tag, name: '/' + state.lastTag.name, raw: null });
			this._write({type: Mode.Tag, name: '/' + state.lastTag.name, raw: null});
			state.pos += matchTrailingSlash[1].length;
		}
		var foundPos = state.data.indexOf('>', state.pos);
		if (foundPos < 0) {
			if (state.done) { //TODO: is this needed?
				state.lastTag.raw += state.data.substr(state.pos);
				state.pos = state.data.length;
				return;
			}
			state.needData = true;
		} else {
			// state.lastTag = null;
			state.pos = foundPos + 1;
			state.mode = Mode.Text;
		}
		return;
	}
	if (!state.done && state.pos + name_data.match.length === state.data.length) {
		state.needData = true;
		return null;
	}
	state.pos += name_data.match.length;
	var value_data = this._parseAttr_findValue(state);
	if (value_data) {
		if (!state.done && state.pos + value_data.match.length === state.data.length) {
			state.needData = true;
			state.pos -= name_data.match.length;
			return;
		}
		state.pos += value_data.match.length;
	} else {
		Parser.re_parseAttr_splitValue.lastIndex = state.pos;
		if (Parser.re_parseAttr_splitValue.exec(state.data)) {
			state.needData = true;
			state.pos -= name_data.match.length;
			return;
		}
		value_data = {
			match: ''
			, value: null
		};
	}
	state.lastTag.raw += name_data.match + value_data.match;

	//this._writePending({type: Mode.Attr, name: name_data.name, data: value_data.value});
	this._write({type: Mode.Attr, name: name_data.name, data: value_data.value});
};
Parser.prototype._parseCData = function Parser$_parseCData() {
	var state = this._state;
	var foundPos = state.data.indexOf(']]>', state.pos);
	if (foundPos < 0 && state.done) {
		foundPos = state.data.length;
	}
	if (foundPos < 0) {
		Parser.re_parseCData_findEnding.lastIndex = state.pos;
		var matchPartialCDataEnd = Parser.re_parseCData_findEnding.exec(state.data);
		if (matchPartialCDataEnd) {
			state.needData = true;
			return;
		}
		if (!state.pendingText) {
			state.pendingText = [];
		}
		state.pendingText.push(state.data.substr(state.pos, state.data.length));
		state.pos = state.data.length;
		state.needData = true;
	} else {
		var text;
		if (state.pendingText) {
			state.pendingText.push(state.data.substring(state.pos, foundPos));
			text = state.pendingText.join('');
			state.pendingText = null;
		} else {
			text = state.data.substring(state.pos, foundPos);
		}
		//this._write({type: Mode.CData, data: text});
		state.mode = Mode.Text;
		state.pos = foundPos + 3;
	}
};

Parser.prototype._parseDoctype = function Parser$_parseDoctype() {
	var state = this._state;
	var foundPos = state.data.indexOf('>', state.pos);
	if (foundPos < 0 && state.done) {
		foundPos = state.data.length;
	}
	if (foundPos < 0) {
		Parser.re_parseCData_findEnding.lastIndex = state.pos;
		if (!state.pendingText) {
			state.pendingText = [];
		}
		state.pendingText.push(state.data.substr(state.pos, state.data.length));
		state.pos = state.data.length;
		state.needData = true;
	} else {
		var text;
		if (state.pendingText) {
			state.pendingText.push(state.data.substring(state.pos, foundPos));
			text = state.pendingText.join('');
			state.pendingText = null;
		} else {
			text = state.data.substring(state.pos, foundPos);
		}
		//this._write({type: Mode.Doctype, data: text});
		state.mode = Mode.Text;
		state.pos = foundPos + 1;
	}
};

Parser.prototype._parseComment = function Parser$_parseComment() {
	var state = this._state;
	var foundPos = state.data.indexOf('-->', state.pos);
	if (foundPos < 0 && state.done) {
		foundPos = state.data.length;
	}
	if (foundPos < 0) {
		Parser.re_parseComment_findEnding.lastIndex = state.pos;
		var matchPartialCommentEnd = Parser.re_parseComment_findEnding.exec(state.data);
		if (matchPartialCommentEnd) {
			state.needData = true;
			return;
		}
		if (!state.pendingText) {
			state.pendingText = [];
		}
		state.pendingText.push(state.data.substr(state.pos, state.data.length));
		state.pos = state.data.length;
		state.needData = true;
	} else {
		var text;
		if (state.pendingText) {
			state.pendingText.push(state.data.substring(state.pos, foundPos));
			text = state.pendingText.join('');
			state.pendingText = null;
		} else {
			text = state.data.substring(state.pos, foundPos);
		}
		// state.output.push({ type: Mode.Comment, data: text });
		//this._write({type: Mode.Comment, data: text});
		state.mode = Mode.Text;
		state.pos = foundPos + 3;
	}
};

Parser.prototype._parseOuterHTML = function Parser$_parseOuterHTML(tagName, node) {
	var getEndTagPos = function (data, tagName) {
		var tempData;

		var foundPos = data.indexOf('</' + tagName + '>');
		if (foundPos < 0) return -1;
		//console.log(foundPos);
		if (foundPos > 0) {
			//截取中间的一段
			tempData = data.substring(0, foundPos);
			var hasTag = tempData.indexOf('<' + tagName);
			//如果发现在其中已经tag，则需要忽略此闭合标签，需要寻找下一个，直接到字符串结束
			if (hasTag >= 0) {
				//将成对的标签特换成其他字符
				data = data.replace('<' + tagName, new Array(tagName.length + 2).join("x"));
				data = data.replace('</' + tagName, new Array(tagName.length + 3).join("x"));
				//console.log(data);
				return getEndTagPos(data, tagName);
			} else {
				return foundPos;
			}
		}
	};
	// todo 未考虑属性的value中含有html标签的情况，需要后续处理

	var state = this._state;
	var startPos = node.type === Mode.Tag ? state.pos - node.name.length : state.pos;
	var data = state.data.substr(startPos, state.data.length);
	var foundPos = getEndTagPos(data, tagName);
	foundPos = foundPos === -1 ? -1 : foundPos + state.pos;

	if (foundPos < 0 && state.done) {
		foundPos = state.data.length;
	}
	var text;
	if (foundPos < 0) {
		state.pos = state.data.length;
		state.needData = true;
		return data;
	} else {
		//if (state.pendingText) {
		//	state.pendingText.push(state.data.substring(state.pos, foundPos));
		//	text = state.pendingText.join('');
		//	state.pendingText = null;
		//} else {
		text = state.data.substring(state.pos, foundPos);
		//}
		// state.output.push({ type: Mode.Comment, data: text });
		state.mode = Mode.Text;
		state.pos = foundPos + 3 + tagName.length;
		return text;
	}
};

Parser.prototype._write = function Parser$_write(element) {
	this._flushWrite();
	//this._builder.write(node);
	this._options.onWrite && this._options.onWrite(element);
	this._options.onElement && this._options.onElement(element);
	//console.log(node);
	//this._currentNode = node;
};
Parser.prototype._flushWrite = function Parser$_flushWrite() {
	if (this._state.pendingWrite) {
		for (var i = 0, len = this._state.pendingWrite.length; i < len; i++) {
			var node = this._state.pendingWrite[i];
			//this._builder.write(node);
			this._options.onWrite && this._options.onWrite(node);
		}
		this._state.pendingWrite = null;
	}
};
Parser.prototype._writePending = function Parser$_writePending(element) {
	if (!this._state.pendingWrite) {
		this._state.pendingWrite = [];
	}
	if (!this._state.lastElement) {
		this._state.lastElement = null;
	}
	this._state.pendingWrite.push(element);
	////this._options.onWritePending && this._options.onWritePending(node);
	this._options.onElement && this._options.onElement(element);
	//this._currentNode = node;
	//console.log(node);
};