var Parser = require('./base/Parser/ParserSync');

onmessage = function (e) {
	//console.log('Message received from main script', e);
	var str = e.data;
	//var workerResult = 'Result: ' + e;
	var parser = new Parser();
	var t = +new Date();
	console.time("parser");
	var dom = parser.parseSync(str);
	console.timeEnd("parser");
	//console.log('Posting message back to main script');
	postMessage(dom);
};
