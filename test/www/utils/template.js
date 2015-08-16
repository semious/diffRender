(function (win) {
    // 模板工具
    var richChar = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        '`': '&#x60;',
        "'": '&#x27;'
    };
    function escapeRich(str){
        if (str == null){
            return '';
        }
        str = String(str);
        var badChars = /[&<>"'`]/g;
        var possible = /[&<>"'`]/;
        if(!possible.test(str)){
            return str;
        }
        return str.replace(badChars, function(chr){
            return richChar[chr];
        });
    }

    var escaper = /\\|'|\r|\n|\u2028|\u2029/g;
    var escapes = {
        "'": "'",
        '\\': '\\',
        '\r': 'r',
        '\n': 'n',
        '\u2028': 'u2028',
        '\u2029': 'u2029'
    };

    function template(tpl){
        tpl = tpl.replace(escaper, function(match){
            return '\\' + escapes[match];
        });

        var r_sep = /{+[^}]+}+/g;
        var textAry = tpl.split(r_sep);
        var codeAry = tpl.match(r_sep);

        var fcode = '';
        function addText(s){fcode += "_s_+='" + s + "';";}
        function addCode(s){fcode += s;}
        function fixedVar(str){return 'typeof ' + str + '=="undefined"?"":' + str;}

        var rules = [
            [/#each\s+([^}]+)/, function(m){return m[1] + '.forEach(function(_o){with(_o){'}],
            [/\/each/, function(m){return '}});'}],
            [/#if\s+([^}]+)/, function(m){return 'if(' + m[1] + '){'}],
            [/else/, function(m){return '}else{'}],
            [/\/if/, function(m){return '}'}],
            [/{{{([^}]+)}}}/, function(m){return '_s_+=' + fixedVar(m[1]) + ';'}],
            [/([^{}}]+)/, function(m){return '_s_+=window.template.escape(' + fixedVar(m[1]) + ');'}]
        ];
        var l = rules.length, j, r;
        codeAry.forEach(function(str, i){
            var code = '';
            for(j = 0; j < l; ++j){
                r = rules[j];
                if(r[0].test(str)){
                    code = r[1](str.match(r[0]));
                    break;
                }
            }
            addText(textAry[i]);
            addCode(code);
        });
        addText(textAry.pop());

        try{
            return new Function("d", "var _s_='';with(d){" + fcode + "}return _s_;");
        } catch(e){throw(e);}
    }
    template.escape = escapeRich;

    win.template = template;
})(window);