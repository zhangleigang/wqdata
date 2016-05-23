//捕获请求后的回调处理
var callback = function(details) {
	start(details.url);
	console.log(details.url);
};

//筛选请求
var filter = {
	urls: [
		"*://hermes.jd.com/*"
	],
	types: ["image"]
};

var opt_extraInfoSpec = ["blocking"];

//事件监听
chrome.webRequest.onBeforeRequest.addListener(callback, filter, opt_extraInfoSpec);