(function (win) {
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

    win.ajax = ajax;
})(window);
