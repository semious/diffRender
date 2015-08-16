(function (root, factory) {
    if (typeof module !== "undefined" && module.exports) {
        // 兼容 CommonJS
        module.exports = factory();
    } else if (typeof define === "function" && (define.amd || define.cmd)) {
        // 兼容 AMD / RequireJS / seaJS
        define(factory);
    } else {
        // 如果不使用模块加载器则自动生成全局变量
        root.BSL = root.BSL || {};
        factory.call(root, root.BSL);
    }
}(this, function (BSL) {
    "use strict";
    BSL = BSL || {};

    //高性能的querySelectorAll，parentNode为空表示从document中找，返回值为数组，来自zepto
    function qs(selector, parentNode) {
        var element = parentNode || document;

        var found,
            maybeID = selector[0] == '#',
            maybeClass = !maybeID && selector[0] == '.',
            nameOnly = maybeID || maybeClass ? selector.slice(1) : selector, // Ensure that a 1 char tag name still gets checked
            isSimple = /^[\w-]*$/.test(nameOnly);
        return (isSimple && maybeID) ?
            ( (found = element.getElementById(nameOnly)) ? [found] : [] ) :
            (element.nodeType !== 1 && element.nodeType !== 9) ? [] :
                Array.prototype.slice.call(
                    isSimple && !maybeID ?
                        maybeClass ? element.getElementsByClassName(nameOnly) : // If it's simple, it could be a class
                            element.getElementsByTagName(selector) : // Or a tag
                        element.querySelectorAll(selector) // Or it's not simple, and we need to query all
                )
    }

    //依赖qs。如果查找到的节点明确为1个，则直接返回该节点；否则还是返回数组
    function q(selector, parentNode) {
        var lst = qs(selector, parentNode);
        if (lst.length == 0) {
            return null;
        } else if (lst.length == 1) {
            return lst[0];
        } else {
            return lst;
        }
    }

    //依赖q，为了效率，只能给一个节点附加事件。selector可以为选择字符串，也可以为节点
    function on(selector, event, callback, parentNode) {
        var node = typeof selector == 'string' ? q(selector, parentNode) : selector;
        if (node) {
            node.addEventListener(event, callback, false);
        }
    }

    function extend(target, source) {
        for (var i in source) {
            target[i] = source[i];
        }
        return target;
    }

    //依赖extend
    function ajax(settings) {
        function empty() {
        }

        //obj -> str
        function getParams(data) {
            var parts = [];
            for (var key in data) {
                parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
            }
            return parts.join('&').replace(/%20/g, '+');
        }

        //可配置的参数
        settings = extend({
            url: '',
            data: {},
            headers: {},
            type: 'get',
            dataType: 'json',
            timeout: 0,
            //TODO: 防缓存
            cache: false,
            success: empty,
            error: empty
        }, settings);

        //规范化
        settings.type = settings.type.toLowerCase();
        settings.dataType = settings.dataType.toLowerCase();

        //xhr
        var xhr = new XMLHttpRequest();
        var abortTimeout;

        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                clearTimeout(abortTimeout);
                if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
                    var result, error;
                    if (settings.dataType == 'json') {
                        try {
                            result = JSON.parse(xhr.responseText);
                        } catch (e) {
                            error = e;
                        }

                        if (error) {
                            settings.error(xhr, 'parsererror');
                        } else {
                            settings.success(result, xhr);
                        }
                    } else {
                        result = xhr.responseText;
                        settings.success(result, xhr);
                    }
                } else {
                    settings.error(xhr, 'error');
                }
            }
        };

        //data obj -> str
        settings.data = getParams(settings.data);

        function appendQuery(url, query) {
            if (query == '') return url;
            return (url + '&' + query).replace(/[&?]{1,2}/, '?');
        }

        if (settings.type == 'get') {
            settings.url = appendQuery(settings.url, settings.data);
            settings.data = undefined;
        }

        //open
        xhr.open(settings.type, settings.url);

        //headers
        for (var key in settings.headers) {
            xhr.setRequestHeader(key, settings.headers[key]);
        }

        //timeout
        if (settings.timeout > 0) {
            abortTimeout = setTimeout(function () {
                xhr.onreadystatechange = empty;
                xhr.abort();
                settings.error(xhr, 'timeout');
            }, settings.timeout);
        }

        //send
        xhr.send(settings.data);
    }

    var jsonpID = 0;

    function jsonp(settings) {
        function empty() {
        }

        //obj -> str
        //隐式调用了toString方法，[1,2] => '1,2', {a:'aa'} => [object Object], 所以最好不要传入object
        function getParams(data) {
            var parts = [];
            for (var key in data) {
                parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
            }
            return parts.join('&').replace(/%20/g, '+');
        }

        //可配置的参数
        settings = extend({
            url: '',
            data: {},
            timeout: 0,
            //默认防缓存
            cache: false,
            //向服务端发请求时加上参数queryName=?，如果设为false则不会添加参数，此时需要设置callbackName来使得返回的方法得到执行
            queryName: 'callback',
            //客户端执行的方法名，默认为bsljsonp+递增数字。可以为字符串或者一个函数，不能与页面中的变量重复
            callbackName: '',
            success: empty,
            error: empty
        }, settings);

        var responseData,
            xhr = {},
            abortTimeout;

        var script = document.createElement('script');

        var onLoad = function () {
            clear(function () {
                settings.success(responseData[0], xhr);
            });
        };
        var onError = function () {
            clear(function () {
                settings.error(xhr, 'error');
            });
        };

        script.addEventListener('load', onLoad, false);
        script.addEventListener('error', onError, false);

        function clear(callback) {
            clearTimeout(abortTimeout);
            script.removeEventListener('load', onLoad, false);
            script.removeEventListener('error', onError, false);
            script.parentNode.removeChild(script);

            callback && callback();

            window[callbackName] = undefined;
            responseData = undefined;
        }


        //将jsonp返回后的回调方法
        var callbackName = (typeof settings.callbackName == 'function' ?
                settings.callbackName() : settings.callbackName) || ('bsljsonp' + (++jsonpID));

        window[callbackName] = function () {
            responseData = arguments;
        };


        function appendQuery(url, query) {
            if (query == '') return url;
            return (url + '&' + query).replace(/[&?]{1,2}/, '?');
        }

        if (!settings.cache) {
            settings.url = appendQuery(settings.url, '_=' + Date.now());
        }

        if (settings.queryName) {
            settings.url = appendQuery(settings.url, settings.queryName + '=?');
        }

        if (settings.data) {
            settings.url = appendQuery(settings.url, getParams(settings.data));
        }

        script.src = settings.url.replace(/\?(.+)=\?/, '?$1=' + callbackName);
        document.head.appendChild(script);


        if (settings.timeout > 0) {
            abortTimeout = setTimeout(function () {
                clear();
                settings.error(xhr, 'timeout');
            }, settings.timeout);
        }
    }

    //过滤特殊字符，来自handlebars，插入dom前必须使用
    function escape(string) {
        var escapeObj = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#x27;",
            "`": "&#x60;"
        };

        var badChars = /[&<>"'`]/g;
        var possible = /[&<>"'`]/;

        function escapeChar(chr) {
            return escapeObj[chr] || "&amp;";
        }

        if (!string && string !== 0) {
            return "";
        }

        // Force a string conversion as this will be done by the append regardless and
        // the regex test will do this transparently behind the scenes, causing issues if
        // an object's to string has escaped characters in it.
        string = "" + string;

        if (!possible.test(string)) {
            return string;
        }
        return string.replace(badChars, escapeChar);
    }

    //依赖escape，修改自underscore。建议使用{{}}进行占位替换，会自动escape转义；{{{}}}不转义，可能会被xss；{{@}}可插入js代码片段
    function template(text) {
        var regInterpolate = /{{{([\s\S]+?)}}}/g,
            regEvaluate = /<%([\s\S]+?)%>/g,
            regEscape = /{{([\s\S]+?)}}/g;

        var escapes = {
            "'": "'",
            '\\': '\\',
            '\r': 'r',
            '\n': 'n',
            '\u2028': 'u2028',
            '\u2029': 'u2029'
        };

        var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

        var escapeChar = function (match) {
            return '\\' + escapes[match];
        };

        // Combine delimiters into one regular expression via alternation.
        var matcher = RegExp([
            (regInterpolate).source,
            (regEvaluate).source,
            (regEscape).source
        ].join('|') + '|$', 'g');

        // Compile the template source, escaping string literals appropriately.
        var index = 0;
        var source = "__p+='";
        text.replace(matcher, function (match, interpolate, evaluate, escape, offset) {
            source += text.slice(index, offset).replace(escaper, escapeChar);
            index = offset + match.length;

            if (escape) {
                source += "'+\n((__t=(" + escape + "))==null?'':BSL.escape(__t))+\n'";
            } else if (interpolate) {
                source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
            } else if (evaluate) {
                source += "';\n" + evaluate + "\n__p+='";
            }

            // Adobe VMs need the match returned to produce the correct offest.
            return match;
        });
        source += "';\n";

        // place data values in local scope.
        source = 'with(obj){\n' + source + '}\n';

        source = "var __t,__p='',__j=Array.prototype.join," +
        "print=function(){__p+=__j.call(arguments,'');};\n" +
        source + 'return __p;\n';

        try {
            var render = new Function('obj', 'BSL', source);
        } catch (e) {
            e.source = source;
            throw e;
        }

        var template = function (data) {
            return render.call(this, data, BSL);
        };

        // Provide the compiled source as a convenience for precompilation.
        template.source = 'function(obj){\n' + source + '}';

        return template;
    }


    BSL.qs = qs;
    BSL.q = q;
    BSL.on = on;
    BSL.ajax = ajax;
    BSL.jsonp = jsonp;
    BSL.escape = escape;
    BSL.template = template;

    return BSL;
}));