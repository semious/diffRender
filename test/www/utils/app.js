(function () {
    // ajax请求rpc接口
    function ajaxRequest(operationType, params, onSuccess) {
        ant.showLoading({
            text: '数据加载中'
        });

        // ajax默认配置
        var config = {
            url: app.configs.gateWay,
            timeout: app.configs.timeout,
            type: 'post',
            dataType: 'json',
            data: {
                operationType: operationType,
                requestData: JSON.stringify(params)
            },
            headers: {
                did: app.configs.did
            },
            success: function (data, textStatus, xhr) {
                switch (data.resultStatus) {
                    case 1000:
                        onSuccess(data.result);
                        break;
                    case 2000:
                        ant.alert({
                            title: '',
                            message: data.tips,
                            button: '确定'
                        }, function () {
                            ant.login(function () {
                                ant.toast({
                                    text: '重新登录',
                                    type: 'success'
                                });
                            });
                        });
                        break;
                    default:
                        console.log('error', data.tips);
                        break;
                }
            },
            error: function (xhr, errorType) {
                console.log(xhr, errorType);
            },
            complete: function () {
                ant.hideLoading()
            }
        };

        // 1.设备号存在，直接发起请求
        if (app.configs.did && app.configs.gateWay) {
            $.ajax(config);
        } else {
            // 2.否则，先获取did设备号和rpc网关
            ant.getConfig({
                configKeys: ['rpcUrl', 'did']
            }, function (result) {
                config.url = result.data.rpcUrl;
                config.headers.did = result.data.did;
                $.ajax(config);
            });
        }
    }

    window.app = {
        configs: {
            gateWay: '',
            did: '',
            timeout: 15000//超时时间15s
        },
        request: ajaxRequest
    };
})();