//参数配置相关
var infoconfig = {
    't': {
        'wg_wx.000000': 'pv上报',
        'wg_wx.000001': '点击上报',
        'wg_wx.000002': '搜索曝光',
        'wg_wx.000003': '商品曝光',
        'wg_wx.000004': '店铺搜索曝光',
        'wg_wx.000005': 'BI相关上报',
        'wg_wx.100000': '头部上报'
    },
    'vurl': '该页面上报虚拟url',
    'sid': 'Cookie值visitkey|累计会话次数',
    'ref': '上一页面的链接url,优先级低于rvurl',
    'pin': 'cookie值jdpin',
    'logid': '时间戳.随机数,标识页面pv的唯一标志',
    'screen': '屏幕尺寸',
    'color': '颜色范围',
    'os': '操作系统',
    'browser': '浏览器版本号',
    'chan_type': '1代表微信环境，2代表手Q环境，3代表其它。',
    'net_type': {
        '1': '网络类型-wifi',
        '2': '网络类型-2g',
        '3': '网络类型-3g',
        '4': '网络类型-4g',
        '99': '网络类型-其它'
    },
    'openid': '微信手Q应用内的用户标识，登录后才有数据',
    'wid': '登录后才有数据，微信手Q的用户账号，小于39亿的是qq号，大于39亿的是用户账号',
    'cookie_ptag': '该页面成交相关的ptag，EA表示外部rd（比如大入口等），CT表示内部rd',
    'rvurl': '上一页面为虚拟url上报，被当作本页面的来源url',
    'url': '高亮表示当前页面上报真实url，低亮表示上报虚拟vurl',
    'rm': '请求时间戳',
    'm': '站点标识',
    'ptag': '该页面pv流量相关ptag',
    'PTAG': '该页面pv流量相关ptag',
    'target': '埋点的ptag或者url'
};

var noticeconfig = {
    "wg_wx.000000": {
        "ptag": 1,
        "PTAG": 1,
        "cookie_ptag": 1,
        "url": 1,
        "vurl": 1,
        "rvurl": 1,
        "t": 1
    },
    "wg_wx.000001": {
        "target": 1,
        "t": 1
    }
};

var vurlflag = false;

//启动函数
function start(requestUrl) {
    window.requestUrl = requestUrl;
    var resultArray = [];
    var t = getUrlParam('t', requestUrl);
    if (/^wg\_wx\.00000[2-5]$/.test(t)) {
        resultArray = onlyUrlparse(requestUrl);
    } else {
        resultArray = parseurlparams(requestUrl);
    }
    renderTable(resultArray);
}

//工具方法获取url里面的参数
function parseUrl(url) {
    var a = document.createElement('a');
    a.href = url;
    return {
        source: url,
        protocol: a.protocol.replace(':', ''),
        host: a.hostname,
        port: a.port,
        query: a.search,
        params: (function() {
            var ret = {},
                seg = a.search.replace(/^\?/, '').split('&'),
                len = seg.length,
                i = 0,
                s;
            for (; i < len; i++) {
                if (!seg[i]) {
                    continue;
                }
                s = seg[i].split('=');
                ret[s[0]] = s[1];
            }
            return ret;
        })(),
        file: (a.pathname.match(/([^\/?#]+)$/i) || [, ''])[1],
        hash: a.hash.replace('#', ''),
        path: a.pathname.replace(/^([^\/])/, '/$1'),
        relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [, ''])[1],
        segments: a.pathname.replace(/^\//, '').split('/')
    };
}

//获取url里面的参数
function getUrlParam(name, url) {
    //参数：变量名，url为空则表从当前页面的url中取
    var u = arguments[1] || window.location.search,
        reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i"),
        r = u.substr(u.indexOf("\?") + 1).match(reg);
    return r != null ? r[2] : "";
}

//解析完整url函数
function parseurlparams(url) {
    var result = parseUrl(url);
    var paramsObject = result.params;
    paramsObject.url && (window.url = decodeURIComponent(paramsObject.url));

    var resultArray = [];
    for (key in paramsObject) {
        var value = decodeURIComponent(paramsObject[key]),
            detail = '';

        if (value == "undefined") {
            continue;
        }

        //vurl被当做参数传进来，delete掉防止混淆
        if (key == 'vurl') {
            delete paramsObject.vurl;
            continue;
        }

        //被当作ct_url显示时是截断的,不是ct_url时也不会取它的字段值
        if (key == 'url') {
            value = /(.+)(\?|\.shtml|\.html)/.exec(value)[1];
        }

        if (key == 'v' && value) {
            var temparr = parseVparams(value);
            resultArray = resultArray.concat(temparr);
            continue;
        }

        if (infoconfig[key] && ({}).toString.call(infoconfig[key]) == '[object Object]') {
            detail = infoconfig[key][value];
        } else {
            detail = infoconfig[key] || '';
        }

        resultArray.push({
            key: key,
            value: value,
            info: detail || ''
        });
    }
    return resultArray;
}

//解析v参数函数
function parseVparams(result) {
    var arr = result.split('$');
    var retarr = [];
    for (var i = 0; i < arr.length; i++) {
        var key = arr[i].split('=')[0],
            value;

        if (key == 'vurl') {
            value = /vurl=(.+)/.exec(arr[i])[1];
            vurlflag = true;
            retarr = retarr.concat(parseurlparams(value));
        } else {
            value = getValue(key, arr[i]);
        }

        var detail = '';

        if (infoconfig[key] && ({}).toString.call(infoconfig[key]) == '[object Object]') {
            detail = infoconfig[key][value];
        } else {
            detail = infoconfig[key] || '';
        }

        retarr.push({
            key: key,
            value: decodeURIComponent(value),
            info: detail || ''
        });
    }

    if (!vurlflag) {
        retarr = retarr.concat(parseurlparams(window.url));
    }

    return retarr;
}

//对于t等于wg_wx.00000[2-5]的处理方式
function onlyUrlparse(url) {
    var result = parseUrl(url);
    var paramsObject = result.params;

    if (paramsObject.v) {
        extend(paramsObject, JSON.parse(decodeURIComponent(paramsObject.v)));
        delete paramsObject.v;
    }

    var resultArray = [];
    for (key in paramsObject) {
        var value = decodeURIComponent(paramsObject[key]);
        if (value == "undefined") {
            continue;
        }

        resultArray.push({
            key: key,
            value: value,
            info: ''
        });
    }
    return resultArray;
}

/**
 * 改变了target引用的对象，深拷贝
 * @param target
 * @param source
 */
function extend(target, source) {
    for (var p in source) {
        if (typeof source[p] == "object") {
            extend(target, source[p]);
        } else {
            target[p] = source[p];
        }
    }
}

//从key=value里面取出value,split方法value还有=号取值不准
function getValue(key, str) {
    var reg = new RegExp(key + "=(.+)", "i"),
        result = '';
    if (reg.exec(str)) {
        result = reg.exec(str)[1];
    }
    return result;
}

/**
 * 渲染图表
 * @param result
 */
function renderTable(result) {
    var renderHtml = '';
    var t = getUrlParam('t', requestUrl);
    var sucessconfig = noticeconfig[t] || {};

    if (vurlflag) {
        noticeconfig[t] && (noticeconfig[t].url = 0);
    }

    for (var i = 0; i < result.length; i++) {
        if (sucessconfig[result[i].key]) {
            renderHtml = '<tr class="success"><td>' + result[i].key + '</td><td>' + result[i].value + '</td><td>' + result[i].info + '</td></tr>';
            $('#paramTbody').prepend(renderHtml);
        } else {
            renderHtml = '<tr><td>' + result[i].key + '</td><td>' + result[i].value + '</td><td>' + result[i].info + '</td></tr>';
            $('#paramTbody').append(renderHtml);
        }
    }
}