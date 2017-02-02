var _tjlt = new Date().toDateString().replace(/\s/g, '');
document.write(unescape("%3Cscript src='http://file.chanet.com.cn/widget/wangjinlian.cgi?as_id=534996%26v=" + _tjlt + ".js' type='text/javascript'%3E%3C/script%3E"));
document.write(unescape("%3Cscript src='http://file.chanet.com.cn/html/js/wangjinlian/wangjinlian2.js?v=" + _tjlt + ".js' type='text/javascript'%3E%3C/script%3E"));

try {
    var _tjl = WangJinLian.__init__();
    _tjl._setASID(534996);
    _tjl._setParam_e();
    _tjl._setParam_u('');
    _tjl._setType();
    _tjl._setCPType(7);
    _tjl._run();
} catch (e) { }