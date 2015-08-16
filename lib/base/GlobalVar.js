'use strict';

var NodeMode = {
	Text: 'text',
	Tag: 'tag',
	Attr: 'attr',
	CData: 'cdata',
	Doctype: 'doctype',
	Comment: 'comment',
	OuterHTML: 'outerHTML'
};

module.exports.NodeMode = NodeMode;

var DiffType = {
	Same: 'same',
	DiffChildren: 'diffChildren',
	DiffAttr: 'diffAttr',
	DiffNode: 'diffNode',
	DiffText: 'diffText',
	NewSiblingNode: 'NewSiblingNode',
	NewChildNode: 'NewChildNode',
	TagClose: 'tagClose',
	NoMoreTag: 'noMoreTag'
};

module.exports.DiffType = DiffType;

var ElementRelation = {
	ChildEle: 'childElement',
	SiblingEle: 'siblingElement',
	CloseEle: 'closeElement',
	AttrEle: 'attrElement'
};

module.exports.ElementRelation = ElementRelation;

var SingleTag = {
	area: true
	, base: true
	, basefont: true
	, br: true
	, col: true
	, frame: true
	, hr: true
	, img: true
	, input: true
	, isindex: true
	, link: true
	, meta: true
	, param: true
	, embed: true
	, '?xml': true
};

module.exports.SingleTag = SingleTag;