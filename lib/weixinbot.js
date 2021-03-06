'use strict';

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _zlib = require('zlib');

var _zlib2 = _interopRequireDefault(_zlib);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _touch = require('touch');

var _touch2 = _interopRequireDefault(_touch);

var _nedb = require('nedb');

var _nedb2 = _interopRequireDefault(_nedb);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _nodemailer = require('nodemailer');

var _nodemailer2 = _interopRequireDefault(_nodemailer);

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

var _toughCookieFilestore = require('tough-cookie-filestore');

var _toughCookieFilestore2 = _interopRequireDefault(_toughCookieFilestore);

var _conf = require('./conf');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_bluebird2.default.promisifyAll(_nedb2.default.prototype); /* eslint-disable quote-props,no-constant-condition,
                                                            prefer-template,consistent-return,new-cap,no-param-reassign */

var debug = (0, _debug2.default)('weixinbot');

var URLS = (0, _conf.getUrls)({});
var logo = _fs2.default.readFileSync(_path2.default.join(__dirname, '..', 'logo.txt'), 'utf8');

// try persistent cookie
var cookiePath = _path2.default.join(process.cwd(), '.cookie.json');
var jar = void 0;
try {
    _touch2.default.sync(cookiePath);
    jar = _requestPromise2.default.jar(new _toughCookieFilestore2.default(cookiePath));
} catch (e) {
    jar = _requestPromise2.default.jar();
}

var rp = _requestPromise2.default.defaults({
    headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) ' + 'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2652.0 Safari/537.36'
    },

    jar: jar,
    encoding: null,
    transform: function transform(buf, response) {
        if (response.headers['content-encoding'] === 'deflate') {
            var str = _zlib2.default.inflateRawSync(buf).toString();
            try {
                return JSON.parse(str);
            } catch (e) {
                return str;
            }
        }

        return buf.toString();
    }
});

var makeDeviceID = function makeDeviceID() {
    return 'e' + Math.random().toFixed(15).toString().substring(2, 17);
};

var WeixinBot = function (_EventEmitter) {
    (0, _inherits3.default)(WeixinBot, _EventEmitter);

    function WeixinBot() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
        (0, _classCallCheck3.default)(this, WeixinBot);

        // transporter for send qrcode image url
        // 请不要依赖这个默认提供的邮件账户！。
        var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(WeixinBot).call(this));

        _this.transporter = _nodemailer2.default.createTransport(options.mailOpts || {
            service: 'qq',
            auth: {
                user: 'no_reply@shaozi.info',
                pass: 'Shaozi123456'
            }
        });

        // email address for get qrcode image url
        _this.receiver = options.receiver || '';

        (0, _assign2.default)(_this, _conf.CODES);

        debug(logo);
        return _this;
    }

    (0, _createClass3.default)(WeixinBot, [{
        key: 'run',
        value: function () {
            var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
                var _this2 = this;

                var qrcodeUrl, loginCode;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                debug('开始登录...');

                                this.baseHost = '';
                                this.pushHost = '';
                                this.uuid = '';
                                this.redirectUri = '';
                                this.skey = '';
                                this.sid = '';
                                this.uin = '';
                                this.passTicket = '';
                                this.baseRequest = null;
                                this.my = null;
                                this.syncKey = null;
                                this.formateSyncKey = '';

                                // member store
                                this.Members = new _nedb2.default();
                                this.Contacts = new _nedb2.default();
                                this.Groups = new _nedb2.default();
                                this.GroupMembers = new _nedb2.default();
                                this.Brands = new _nedb2.default(); // 公众帐号
                                this.SPs = new _nedb2.default(); // 特殊帐号

                                // indexing
                                this.Members.ensureIndex({ fieldName: 'UserName', unique: true });
                                this.Contacts.ensureIndex({ fieldName: 'UserName', unique: true });
                                this.Groups.ensureIndex({ fieldName: 'UserName', unique: true });
                                this.Brands.ensureIndex({ fieldName: 'UserName', unique: true });
                                this.SPs.ensureIndex({ fieldName: 'UserName', unique: true });

                                clearTimeout(this.checkSyncTimer);
                                clearInterval(this.updataContactTimer);

                                _context.prev = 26;
                                _context.next = 29;
                                return this.fetchUUID();

                            case 29:
                                this.uuid = _context.sent;
                                _context.next = 37;
                                break;

                            case 32:
                                _context.prev = 32;
                                _context.t0 = _context['catch'](26);

                                debug('fetch uuid error', '');
                                this.run();
                                return _context.abrupt('return');

                            case 37:
                                if (this.uuid) {
                                    _context.next = 41;
                                    break;
                                }

                                debug('获取 uuid 失败，正在重试...');
                                this.run();
                                return _context.abrupt('return');

                            case 41:

                                debug('获得 uuid -> ' + this.uuid);

                                qrcodeUrl = URLS.QRCODE_PATH + this.uuid;

                                this.emit('qrcode', qrcodeUrl);

                                if (this.receiver) {
                                    debug('发送二维码图片到邮箱 ' + this.receiver);
                                    this.transporter.sendMail({
                                        from: 'WeixinBot <' + this.transporter.transporter.options.auth.user + '>',
                                        to: this.receiver,
                                        subject: 'WeixinBot 请求登录',
                                        html: '<img src="' + qrcodeUrl + '" height="256" width="256" />'
                                    }, function (e) {
                                        if (e) debug('发送二维码图片到邮箱 ' + _this2.receiver + ' 失败', e);
                                    });
                                }

                                // limit check times
                                this.checkTimes = 0;

                            case 46:
                                if (!true) {
                                    _context.next = 59;
                                    break;
                                }

                                _context.next = 49;
                                return this.checkLoginStep();

                            case 49:
                                loginCode = _context.sent;

                                if (!(loginCode === 200)) {
                                    _context.next = 52;
                                    break;
                                }

                                return _context.abrupt('break', 59);

                            case 52:

                                if (loginCode !== 201) this.checkTimes += 1;

                                if (!(this.checkTimes > 6)) {
                                    _context.next = 57;
                                    break;
                                }

                                debug('检查登录状态次数超出限制，重新获取二维码');
                                this.run();
                                return _context.abrupt('return');

                            case 57:
                                _context.next = 46;
                                break;

                            case 59:
                                _context.prev = 59;

                                debug('正在获取凭据...');
                                _context.next = 63;
                                return this.fetchTickets();

                            case 63:
                                debug('获取凭据成功!');

                                debug('正在初始化参数...');
                                _context.next = 67;
                                return this.webwxinit();

                            case 67:
                                debug('初始化成功!');

                                debug('正在通知客户端网页端已登录...');
                                _context.next = 71;
                                return this.notifyMobile();

                            case 71:
                                debug('通知成功!');

                                debug('正在获取通讯录列表...');
                                _context.next = 75;
                                return this.fetchContact();

                            case 75:
                                debug('获取通讯录列表成功!');

                                // await this.fetchBatchgetContact();
                                _context.next = 78;
                                return this.lookupSyncCheckHost();

                            case 78:
                                this.pushHost = _context.sent;
                                _context.next = 86;
                                break;

                            case 81:
                                _context.prev = 81;
                                _context.t1 = _context['catch'](59);

                                debug('初始化主要参数步骤出错，正在重新登录...', _context.t1);
                                this.run();
                                return _context.abrupt('return');

                            case 86:

                                URLS = (0, _conf.getUrls)({ baseHost: this.baseHost, pushHost: this.pushHost });

                                debug('开始循环拉取新消息');
                                this.runLoop();

                                // auto update Contacts every ten minute
                                this.updataContactTimer = setInterval(function () {
                                    _this2.updateContact();
                                }, 1000 * 60 * 10);

                            case 90:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this, [[26, 32], [59, 81]]);
            }));

            function run() {
                return _ref.apply(this, arguments);
            }

            return run;
        }()
    }, {
        key: 'runLoop',
        value: function () {
            var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
                var _this3 = this;

                var _ref3, selector, retcode;

                return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                _context2.next = 2;
                                return this.syncCheck();

                            case 2:
                                _ref3 = _context2.sent;
                                selector = _ref3.selector;
                                retcode = _ref3.retcode;

                                if (!(retcode !== '0')) {
                                    _context2.next = 9;
                                    break;
                                }

                                debug('你在其他地方登录或登出了微信，正在尝试重新登录...');
                                this.run();
                                return _context2.abrupt('return');

                            case 9:

                                if (selector !== '0') {
                                    this.webwxsync();
                                }

                                this.checkSyncTimer = setTimeout(function () {
                                    _this3.runLoop();
                                }, 3e3);

                            case 11:
                            case 'end':
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));

            function runLoop() {
                return _ref2.apply(this, arguments);
            }

            return runLoop;
        }()
    }, {
        key: 'checkLoginStep',
        value: function () {
            var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3() {
                var data, loginCode;
                return _regenerator2.default.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                data = void 0;
                                _context3.prev = 1;
                                _context3.next = 4;
                                return rp({
                                    uri: URLS.API_login + ('?uuid=' + this.uuid + '&tip=1&r=' + +new Date()),
                                    timeout: 35e3
                                });

                            case 4:
                                data = _context3.sent;
                                _context3.next = 13;
                                break;

                            case 7:
                                _context3.prev = 7;
                                _context3.t0 = _context3['catch'](1);

                                debug('checkLoginStep network error', _context3.t0);
                                _context3.next = 12;
                                return this.checkLoginStep();

                            case 12:
                                return _context3.abrupt('return');

                            case 13:
                                if (/code=(\d{3});/.test(data)) {
                                    _context3.next = 17;
                                    break;
                                }

                                _context3.next = 16;
                                return this.checkLoginStep();

                            case 16:
                                return _context3.abrupt('return', _context3.sent);

                            case 17:
                                loginCode = parseInt(data.match(/code=(\d{3});/)[1], 10);
                                _context3.t1 = loginCode;
                                _context3.next = _context3.t1 === 200 ? 21 : _context3.t1 === 201 ? 26 : _context3.t1 === 408 ? 28 : 30;
                                break;

                            case 21:
                                debug('已点击确认登录!');
                                this.redirectUri = data.match(/redirect_uri="(.+)";$/)[1] + '&fun=new&version=v2';
                                this.baseHost = _url2.default.parse(this.redirectUri).host;
                                URLS = (0, _conf.getUrls)({ baseHost: this.baseHost });
                                return _context3.abrupt('break', 31);

                            case 26:
                                debug('二维码已被扫描，请确认登录!');
                                return _context3.abrupt('break', 31);

                            case 28:
                                debug('检查登录超时，正在重试...');
                                return _context3.abrupt('break', 31);

                            case 30:
                                debug('未知的状态，重试...');

                            case 31:
                                return _context3.abrupt('return', loginCode);

                            case 32:
                            case 'end':
                                return _context3.stop();
                        }
                    }
                }, _callee3, this, [[1, 7]]);
            }));

            function checkLoginStep() {
                return _ref4.apply(this, arguments);
            }

            return checkLoginStep;
        }()
    }, {
        key: 'webwxinit',
        value: function () {
            var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4() {
                var data;
                return _regenerator2.default.wrap(function _callee4$(_context4) {
                    while (1) {
                        switch (_context4.prev = _context4.next) {
                            case 0:
                                data = void 0;
                                _context4.prev = 1;
                                _context4.next = 4;
                                return rp({
                                    uri: URLS.API_webwxinit,
                                    method: 'POST',
                                    json: true,
                                    body: {
                                        BaseRequest: this.baseRequest
                                    }
                                });

                            case 4:
                                data = _context4.sent;
                                _context4.next = 13;
                                break;

                            case 7:
                                _context4.prev = 7;
                                _context4.t0 = _context4['catch'](1);

                                debug('webwxinit network error', _context4.t0);
                                // network error retry
                                _context4.next = 12;
                                return this.webwxinit();

                            case 12:
                                return _context4.abrupt('return');

                            case 13:
                                if (!(!data || !data.BaseResponse || data.BaseResponse.Ret !== 0)) {
                                    _context4.next = 15;
                                    break;
                                }

                                throw new Error('Init Webwx failed');

                            case 15:

                                this.my = data.User;
                                this.syncKey = data.SyncKey;
                                this.formateSyncKey = this.syncKey.List.map(function (item) {
                                    return item.Key + '_' + item.Val;
                                }).join('|');

                            case 18:
                            case 'end':
                                return _context4.stop();
                        }
                    }
                }, _callee4, this, [[1, 7]]);
            }));

            function webwxinit() {
                return _ref5.apply(this, arguments);
            }

            return webwxinit;
        }()
    }, {
        key: 'webwxsync',
        value: function () {
            var _ref6 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5() {
                var _this4 = this;

                var data;
                return _regenerator2.default.wrap(function _callee5$(_context5) {
                    while (1) {
                        switch (_context5.prev = _context5.next) {
                            case 0:
                                data = void 0;
                                _context5.prev = 1;

                                debug('webwxsync', URLS.API_webwxsync);
                                _context5.next = 5;
                                return rp({
                                    uri: URLS.API_webwxsync,
                                    method: 'POST',
                                    qs: {
                                        sid: this.sid,
                                        skey: this.skey
                                    },
                                    json: true,
                                    body: {
                                        BaseRequest: this.baseRequest,
                                        SyncKey: this.syncKey,
                                        rr: ~new Date()
                                    }
                                });

                            case 5:
                                data = _context5.sent;
                                _context5.next = 14;
                                break;

                            case 8:
                                _context5.prev = 8;
                                _context5.t0 = _context5['catch'](1);

                                debug('webwxsync network error', '');
                                // network error retry
                                _context5.next = 13;
                                return this.webwxsync();

                            case 13:
                                return _context5.abrupt('return');

                            case 14:

                                this.syncKey = data.SyncKey;
                                this.formateSyncKey = this.syncKey.List.map(function (item) {
                                    return item.Key + '_' + item.Val;
                                }).join('|');

                                data.AddMsgList.forEach(function (msg) {
                                    return _this4.handleMsg(msg);
                                });

                            case 17:
                            case 'end':
                                return _context5.stop();
                        }
                    }
                }, _callee5, this, [[1, 8]]);
            }));

            function webwxsync() {
                return _ref6.apply(this, arguments);
            }

            return webwxsync;
        }()
    }, {
        key: 'lookupSyncCheckHost',
        value: function () {
            var _ref7 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee6() {
                var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, host, data, retcode;

                return _regenerator2.default.wrap(function _callee6$(_context6) {
                    while (1) {
                        switch (_context6.prev = _context6.next) {
                            case 0:
                                _iteratorNormalCompletion = true;
                                _didIteratorError = false;
                                _iteratorError = undefined;
                                _context6.prev = 3;
                                _iterator = (0, _getIterator3.default)(_conf.PUSH_HOST_LIST);

                            case 5:
                                if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                                    _context6.next = 26;
                                    break;
                                }

                                host = _step.value;
                                data = void 0;
                                _context6.prev = 8;
                                _context6.next = 11;
                                return rp({
                                    uri: 'https://' + host + '/cgi-bin/mmwebwx-bin/synccheck',
                                    qs: {
                                        r: +new Date(),
                                        skey: this.skey,
                                        sid: this.sid,
                                        uin: this.uin,
                                        deviceid: makeDeviceID(),
                                        synckey: this.formateSyncKey
                                    },
                                    timeout: 35e3
                                });

                            case 11:
                                data = _context6.sent;
                                _context6.next = 20;
                                break;

                            case 14:
                                _context6.prev = 14;
                                _context6.t0 = _context6['catch'](8);

                                debug('lookupSyncCheckHost network error', '');
                                // network error retry
                                _context6.next = 19;
                                return this.lookupSyncCheckHost();

                            case 19:
                                return _context6.abrupt('return');

                            case 20:
                                retcode = data.match(/retcode:"(\d+)"/)[1];

                                if (!(retcode === '0')) {
                                    _context6.next = 23;
                                    break;
                                }

                                return _context6.abrupt('return', host);

                            case 23:
                                _iteratorNormalCompletion = true;
                                _context6.next = 5;
                                break;

                            case 26:
                                _context6.next = 32;
                                break;

                            case 28:
                                _context6.prev = 28;
                                _context6.t1 = _context6['catch'](3);
                                _didIteratorError = true;
                                _iteratorError = _context6.t1;

                            case 32:
                                _context6.prev = 32;
                                _context6.prev = 33;

                                if (!_iteratorNormalCompletion && _iterator.return) {
                                    _iterator.return();
                                }

                            case 35:
                                _context6.prev = 35;

                                if (!_didIteratorError) {
                                    _context6.next = 38;
                                    break;
                                }

                                throw _iteratorError;

                            case 38:
                                return _context6.finish(35);

                            case 39:
                                return _context6.finish(32);

                            case 40:
                            case 'end':
                                return _context6.stop();
                        }
                    }
                }, _callee6, this, [[3, 28, 32, 40], [8, 14], [33,, 35, 39]]);
            }));

            function lookupSyncCheckHost() {
                return _ref7.apply(this, arguments);
            }

            return lookupSyncCheckHost;
        }()
    }, {
        key: 'syncCheck',
        value: function () {
            var _ref8 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee7() {
                var data, retcode, selector;
                return _regenerator2.default.wrap(function _callee7$(_context7) {
                    while (1) {
                        switch (_context7.prev = _context7.next) {
                            case 0:
                                data = void 0;
                                _context7.prev = 1;

                                debug('synccheck', URLS.API_synccheck);
                                _context7.next = 5;
                                return rp({
                                    uri: URLS.API_synccheck,
                                    qs: {
                                        r: +new Date(),
                                        skey: this.skey,
                                        sid: this.sid,
                                        uin: this.uin,
                                        deviceid: makeDeviceID(),
                                        synckey: this.formateSyncKey
                                    },
                                    timeout: 35e3
                                });

                            case 5:
                                data = _context7.sent;
                                _context7.next = 14;
                                break;

                            case 8:
                                _context7.prev = 8;
                                _context7.t0 = _context7['catch'](1);

                                debug('synccheck network error', 'error');
                                // network error retry
                                _context7.next = 13;
                                return this.syncCheck();

                            case 13:
                                return _context7.abrupt('return', _context7.sent);

                            case 14:
                                retcode = data.match(/retcode:"(\d+)"/)[1];
                                selector = data.match(/selector:"(\d+)"/)[1];


                                debug('synccheck success', retcode + " " + selector);

                                return _context7.abrupt('return', { retcode: retcode, selector: selector });

                            case 18:
                            case 'end':
                                return _context7.stop();
                        }
                    }
                }, _callee7, this, [[1, 8]]);
            }));

            function syncCheck() {
                return _ref8.apply(this, arguments);
            }

            return syncCheck;
        }()
    }, {
        key: 'notifyMobile',
        value: function () {
            var _ref9 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee8() {
                var data;
                return _regenerator2.default.wrap(function _callee8$(_context8) {
                    while (1) {
                        switch (_context8.prev = _context8.next) {
                            case 0:
                                data = void 0;
                                _context8.prev = 1;

                                debug('start notify mobile network', URLS.API_webwxstatusnotify);
                                _context8.next = 5;
                                return rp({
                                    uri: URLS.API_webwxstatusnotify,
                                    method: 'POST',
                                    json: true,
                                    body: {
                                        BaseRequest: this.baseRequest,
                                        Code: _conf.CODES.StatusNotifyCode_INITED,
                                        FromUserName: this.my.UserName,
                                        ToUserName: this.my.UserName,
                                        ClientMsgId: +new Date()
                                    }
                                });

                            case 5:
                                data = _context8.sent;
                                _context8.next = 14;
                                break;

                            case 8:
                                _context8.prev = 8;
                                _context8.t0 = _context8['catch'](1);

                                debug('notify mobile network error', 'error');
                                // network error retry
                                _context8.next = 13;
                                return this.notifyMobile();

                            case 13:
                                return _context8.abrupt('return');

                            case 14:
                                if (!(!data || !data.BaseResponse || data.BaseResponse.Ret !== 0)) {
                                    _context8.next = 16;
                                    break;
                                }

                                throw new Error('Notify mobile fail');

                            case 16:
                            case 'end':
                                return _context8.stop();
                        }
                    }
                }, _callee8, this, [[1, 8]]);
            }));

            function notifyMobile() {
                return _ref9.apply(this, arguments);
            }

            return notifyMobile;
        }()
    }, {
        key: 'fetchUUID',
        value: function () {
            var _ref10 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee9() {
                var data, uuid;
                return _regenerator2.default.wrap(function _callee9$(_context9) {
                    while (1) {
                        switch (_context9.prev = _context9.next) {
                            case 0:
                                data = void 0;
                                _context9.prev = 1;
                                _context9.next = 4;
                                return rp(URLS.API_jsLogin);

                            case 4:
                                data = _context9.sent;
                                _context9.next = 13;
                                break;

                            case 7:
                                _context9.prev = 7;
                                _context9.t0 = _context9['catch'](1);

                                debug('fetch uuid network error', '');
                                // network error retry
                                _context9.next = 12;
                                return this.fetchUUID();

                            case 12:
                                return _context9.abrupt('return', _context9.sent);

                            case 13:
                                if (/uuid = "(.+)";$/.test(data)) {
                                    _context9.next = 15;
                                    break;
                                }

                                throw new Error('get uuid failed');

                            case 15:
                                uuid = data.match(/uuid = "(.+)";$/)[1];
                                return _context9.abrupt('return', uuid);

                            case 17:
                            case 'end':
                                return _context9.stop();
                        }
                    }
                }, _callee9, this, [[1, 7]]);
            }));

            function fetchUUID() {
                return _ref10.apply(this, arguments);
            }

            return fetchUUID;
        }()
    }, {
        key: 'fetchTickets',
        value: function () {
            var _ref11 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee10() {
                var data, skeyM, wxsidM, wxuinM, passTicketM;
                return _regenerator2.default.wrap(function _callee10$(_context10) {
                    while (1) {
                        switch (_context10.prev = _context10.next) {
                            case 0:
                                data = void 0;
                                _context10.prev = 1;
                                _context10.next = 4;
                                return rp(this.redirectUri);

                            case 4:
                                data = _context10.sent;
                                _context10.next = 13;
                                break;

                            case 7:
                                _context10.prev = 7;
                                _context10.t0 = _context10['catch'](1);

                                debug('fetch tickets network error', '');
                                // network error, retry
                                _context10.next = 12;
                                return this.fetchTickets();

                            case 12:
                                return _context10.abrupt('return');

                            case 13:
                                if (/<ret>0<\/ret>/.test(data)) {
                                    _context10.next = 15;
                                    break;
                                }

                                throw new Error('Get skey failed, restart login');

                            case 15:

                                // const retM = data.match(/<ret>(.*)<\/ret>/);
                                // const scriptM = data.match(/<script>(.*)<\/script>/);
                                skeyM = data.match(/<skey>(.*)<\/skey>/);
                                wxsidM = data.match(/<wxsid>(.*)<\/wxsid>/);
                                wxuinM = data.match(/<wxuin>(.*)<\/wxuin>/);
                                passTicketM = data.match(/<pass_ticket>(.*)<\/pass_ticket>/);
                                // const redirectUrl = data.match(/<redirect_url>(.*)<\/redirect_url>/);

                                this.skey = skeyM && skeyM[1];
                                this.sid = wxsidM && wxsidM[1];
                                this.uin = wxuinM && wxuinM[1];
                                this.passTicket = passTicketM && passTicketM[1];
                                debug('\n      获得 skey -> ' + this.skey + '\n      获得 sid -> ' + this.sid + '\n      获得 uid -> ' + this.uin + '\n      获得 pass_ticket -> ' + this.passTicket + '\n    ');

                                this.baseRequest = {
                                    Uin: parseInt(this.uin, 10),
                                    Sid: this.sid,
                                    Skey: this.skey,
                                    DeviceID: makeDeviceID()
                                };

                            case 25:
                            case 'end':
                                return _context10.stop();
                        }
                    }
                }, _callee10, this, [[1, 7]]);
            }));

            function fetchTickets() {
                return _ref11.apply(this, arguments);
            }

            return fetchTickets;
        }()
    }, {
        key: 'fetchContact',
        value: function () {
            var _ref12 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee11() {
                var _this5 = this;

                var data;
                return _regenerator2.default.wrap(function _callee11$(_context11) {
                    while (1) {
                        switch (_context11.prev = _context11.next) {
                            case 0:
                                data = void 0;
                                _context11.prev = 1;
                                _context11.next = 4;
                                return rp({
                                    uri: URLS.API_webwxgetcontact,
                                    qs: {
                                        skey: this.skey,
                                        pass_ticket: this.passTicket,
                                        seq: 0,
                                        r: +new Date()
                                    }
                                });

                            case 4:
                                data = _context11.sent;
                                _context11.next = 13;
                                break;

                            case 7:
                                _context11.prev = 7;
                                _context11.t0 = _context11['catch'](1);

                                debug('fetch contact network error', '');
                                // network error retry
                                _context11.next = 12;
                                return this.fetchContact();

                            case 12:
                                return _context11.abrupt('return');

                            case 13:
                                if (!(!data || !data.BaseResponse || data.BaseResponse.Ret !== 0)) {
                                    _context11.next = 15;
                                    break;
                                }

                                throw new Error('Fetch contact fail');

                            case 15:

                                this.Members.insert(data.MemberList);
                                this.totalMemberCount = data.MemberList.length;
                                this.brandCount = 0;
                                this.spCount = 0;
                                this.groupCount = 0;
                                this.friendCount = 0;
                                data.MemberList.forEach(function (member) {
                                    var userName = member.UserName;

                                    if (member.VerifyFlag & _conf.CODES.MM_USERATTRVERIFYFALG_BIZ_BRAND) {
                                        _this5.brandCount += 1;
                                        _this5.Brands.insert(member);
                                        return;
                                    }

                                    if (_conf.SP_ACCOUNTS.includes(userName) || /@qqim$/.test(userName)) {
                                        _this5.spCount += 1;
                                        _this5.SPs.insert(member);
                                        return;
                                    }

                                    if (userName.includes('@@')) {
                                        _this5.groupCount += 1;
                                        _this5.Groups.insert(member);
                                        return;
                                    }

                                    if (userName !== _this5.my.UserName) {
                                        _this5.friendCount += 1;
                                        _this5.Contacts.insert(member);
                                    }
                                });

                                debug('\n      获取通讯录成功\n      全部成员数: ' + this.totalMemberCount + '\n      公众帐号数: ' + this.brandCount + '\n      特殊帐号数: ' + this.spCount + '\n      通讯录好友数: ' + this.friendCount + '\n      加入的群聊数(不准确，只有把群聊加入通讯录才会在这里显示): ' + this.groupCount + '\n    ');

                            case 23:
                            case 'end':
                                return _context11.stop();
                        }
                    }
                }, _callee11, this, [[1, 7]]);
            }));

            function fetchContact() {
                return _ref12.apply(this, arguments);
            }

            return fetchContact;
        }()
    }, {
        key: 'fetchBatchgetContact',
        value: function () {
            var _ref13 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee12(groupIds) {
                var _this6 = this;

                var list, data;
                return _regenerator2.default.wrap(function _callee12$(_context12) {
                    while (1) {
                        switch (_context12.prev = _context12.next) {
                            case 0:
                                list = groupIds.map(function (id) {
                                    return { UserName: id, EncryChatRoomId: '' };
                                });
                                data = void 0;
                                _context12.prev = 2;
                                _context12.next = 5;
                                return rp({
                                    method: 'POST',
                                    uri: URLS.API_webwxbatchgetcontact,
                                    qs: {
                                        type: 'ex',
                                        r: +new Date()
                                    },
                                    json: true,
                                    body: {
                                        BaseRequest: this.baseRequest,
                                        Count: list.length,
                                        List: list
                                    }
                                });

                            case 5:
                                data = _context12.sent;
                                _context12.next = 14;
                                break;

                            case 8:
                                _context12.prev = 8;
                                _context12.t0 = _context12['catch'](2);

                                debug('fetch batchgetcontact network error', '');
                                // network error retry
                                _context12.next = 13;
                                return this.fetchBatchgetContact(groupIds);

                            case 13:
                                return _context12.abrupt('return');

                            case 14:
                                if (!(!data || !data.BaseResponse || data.BaseResponse.Ret !== 0)) {
                                    _context12.next = 16;
                                    break;
                                }

                                throw new Error('Fetch batchgetcontact fail');

                            case 16:

                                data.ContactList.forEach(function (Group) {
                                    _this6.Groups.insert(Group);
                                    debug('获取到群: ' + Group.NickName);
                                    debug('群 ' + Group.NickName + ' 成员数量: ' + Group.MemberList.length);

                                    var MemberList = Group.MemberList;

                                    MemberList.forEach(function (member) {
                                        member.GroupUserName = Group.UserName;
                                        _this6.GroupMembers.update({
                                            UserName: member.UserName,
                                            GroupUserName: member.GroupUserName
                                        }, member, { upsert: true });
                                    });
                                });

                            case 17:
                            case 'end':
                                return _context12.stop();
                        }
                    }
                }, _callee12, this, [[2, 8]]);
            }));

            function fetchBatchgetContact(_x2) {
                return _ref13.apply(this, arguments);
            }

            return fetchBatchgetContact;
        }()
    }, {
        key: 'updateContact',
        value: function () {
            var _ref14 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee13() {
                var groups, groupIds;
                return _regenerator2.default.wrap(function _callee13$(_context13) {
                    while (1) {
                        switch (_context13.prev = _context13.next) {
                            case 0:
                                debug('正在更新通讯录');
                                _context13.prev = 1;
                                _context13.next = 4;
                                return this.fetchContact();

                            case 4:
                                _context13.next = 6;
                                return this.Groups.findAsync({});

                            case 6:
                                groups = _context13.sent;
                                groupIds = groups.map(function (group) {
                                    return group.UserName;
                                });
                                _context13.next = 10;
                                return this.fetchBatchgetContact(groupIds);

                            case 10:
                                _context13.next = 15;
                                break;

                            case 12:
                                _context13.prev = 12;
                                _context13.t0 = _context13['catch'](1);

                                debug('更新通讯录失败', _context13.t0);

                            case 15:
                                debug('更新通讯录成功!');

                            case 16:
                            case 'end':
                                return _context13.stop();
                        }
                    }
                }, _callee13, this, [[1, 12]]);
            }));

            function updateContact() {
                return _ref14.apply(this, arguments);
            }

            return updateContact;
        }()
    }, {
        key: 'getMember',
        value: function () {
            var _ref15 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee14(id) {
                var member;
                return _regenerator2.default.wrap(function _callee14$(_context14) {
                    while (1) {
                        switch (_context14.prev = _context14.next) {
                            case 0:
                                _context14.next = 2;
                                return this.Members.findOneAsync({ UserName: id });

                            case 2:
                                member = _context14.sent;
                                return _context14.abrupt('return', member);

                            case 4:
                            case 'end':
                                return _context14.stop();
                        }
                    }
                }, _callee14, this);
            }));

            function getMember(_x3) {
                return _ref15.apply(this, arguments);
            }

            return getMember;
        }()
    }, {
        key: 'getGroup',
        value: function () {
            var _ref16 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee15(groupId) {
                var group;
                return _regenerator2.default.wrap(function _callee15$(_context15) {
                    while (1) {
                        switch (_context15.prev = _context15.next) {
                            case 0:
                                _context15.next = 2;
                                return this.Groups.findOneAsync({ UserName: groupId });

                            case 2:
                                group = _context15.sent;

                                if (!group) {
                                    _context15.next = 5;
                                    break;
                                }

                                return _context15.abrupt('return', group);

                            case 5:
                                _context15.prev = 5;
                                _context15.next = 8;
                                return this.fetchBatchgetContact([groupId]);

                            case 8:
                                _context15.next = 14;
                                break;

                            case 10:
                                _context15.prev = 10;
                                _context15.t0 = _context15['catch'](5);

                                debug('fetchBatchgetContact error', '');
                                return _context15.abrupt('return', null);

                            case 14:
                                _context15.next = 16;
                                return this.Groups.findOneAsync({ UserName: groupId });

                            case 16:
                                group = _context15.sent;
                                return _context15.abrupt('return', group);

                            case 18:
                            case 'end':
                                return _context15.stop();
                        }
                    }
                }, _callee15, this, [[5, 10]]);
            }));

            function getGroup(_x4) {
                return _ref16.apply(this, arguments);
            }

            return getGroup;
        }()
    }, {
        key: 'getGroupMember',
        value: function () {
            var _ref17 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee16(id, groupId) {
                var member;
                return _regenerator2.default.wrap(function _callee16$(_context16) {
                    while (1) {
                        switch (_context16.prev = _context16.next) {
                            case 0:
                                _context16.next = 2;
                                return this.GroupMembers.findOneAsync({
                                    UserName: id,
                                    GroupUserName: groupId
                                });

                            case 2:
                                member = _context16.sent;

                                if (!member) {
                                    _context16.next = 5;
                                    break;
                                }

                                return _context16.abrupt('return', member);

                            case 5:
                                _context16.prev = 5;
                                _context16.next = 8;
                                return this.fetchBatchgetContact([groupId]);

                            case 8:
                                _context16.next = 14;
                                break;

                            case 10:
                                _context16.prev = 10;
                                _context16.t0 = _context16['catch'](5);

                                debug('fetchBatchgetContact error', '');
                                return _context16.abrupt('return', null);

                            case 14:
                                _context16.next = 16;
                                return this.GroupMembers.findOneAsync({ UserName: id });

                            case 16:
                                member = _context16.sent;
                                return _context16.abrupt('return', member);

                            case 18:
                            case 'end':
                                return _context16.stop();
                        }
                    }
                }, _callee16, this, [[5, 10]]);
            }));

            function getGroupMember(_x5, _x6) {
                return _ref17.apply(this, arguments);
            }

            return getGroupMember;
        }()
    }, {
        key: 'handleMsg',
        value: function () {
            var _ref18 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee17(msg) {
                var userId;
                return _regenerator2.default.wrap(function _callee17$(_context17) {
                    while (1) {
                        switch (_context17.prev = _context17.next) {
                            case 0:
                                if (!msg.FromUserName.includes('@@')) {
                                    _context17.next = 12;
                                    break;
                                }

                                userId = msg.Content.match(/^(@[a-zA-Z0-9]+|[a-zA-Z0-9_-]+):<br\/>/)[1];
                                _context17.next = 4;
                                return this.getGroupMember(userId, msg.FromUserName);

                            case 4:
                                msg.GroupMember = _context17.sent;
                                _context17.next = 7;
                                return this.getGroup(msg.FromUserName);

                            case 7:
                                msg.Group = _context17.sent;

                                msg.Content = msg.Content.replace(/^(@[a-zA-Z0-9]+|[a-zA-Z0-9_-]+):<br\/>/, '');

                                debug('来自群 ' + msg.Group.NickName + ' 的消息 ' + (msg.GroupMember.DisplayName || msg.GroupMember.NickName) + ': ' + msg.Content);

                                this.emit('group', msg);
                                return _context17.abrupt('return');

                            case 12:
                                _context17.next = 14;
                                return this.getMember(msg.FromUserName);

                            case 14:
                                msg.Member = _context17.sent;

                                if (msg.Member) {
                                    debug('新消息 ' + (msg.Member.RemarkName || msg.Member.NickName) + ': ' + msg.Content);
                                } else {
                                    debug('新消息 ' + msg.FromUserName + ': ' + msg.Content);
                                }

                                this.emit('friend', msg);
                                // if (msg.MsgType === CODES.MSGTYPE_SYSNOTICE) {
                                //   return;
                                // }

                                // switch (msg.MsgType) {
                                //   case CODES.MSGTYPE_APP:
                                //     break;
                                //   case CODES.MSGTYPE_EMOTICON:
                                //     break;
                                //   case CODES.MSGTYPE_IMAGE:
                                //     break;
                                //   case CODES.MSGTYPE_VOICE:
                                //     break;
                                //   case CODES.MSGTYPE_VIDEO:
                                //     break;
                                //   case CODES.MSGTYPE_MICROVIDEO:
                                //     break;
                                //   case CODES.MSGTYPE_TEXT:
                                //     try {
                                //       await this.sendText(msg.FromUserName, msg.Content);
                                //     } catch (e) {
                                //       console.error(e);
                                //     }
                                //     break;
                                //   case CODES.MSGTYPE_RECALLED:
                                //     break;
                                //   case CODES.MSGTYPE_LOCATION:
                                //     break;
                                //   case CODES.MSGTYPE_VOIPMSG:
                                //   case CODES.MSGTYPE_VOIPNOTIFY:
                                //   case CODES.MSGTYPE_VOIPINVITE:
                                //     break;
                                //   case CODES.MSGTYPE_POSSIBLEFRIEND_MSG:
                                //     break;
                                //   case CODES.MSGTYPE_VERIFYMSG:
                                //     break;
                                //   case CODES.MSGTYPE_SHARECARD:
                                //     break;
                                //   case CODES.MSGTYPE_SYS:
                                //     break;
                                //   default:
                                // }

                            case 17:
                            case 'end':
                                return _context17.stop();
                        }
                    }
                }, _callee17, this);
            }));

            function handleMsg(_x7) {
                return _ref18.apply(this, arguments);
            }

            return handleMsg;
        }()
    }, {
        key: 'sendText',
        value: function sendText(to, content, callback) {
            var _this7 = this;

            var clientMsgId = (+new Date() + Math.random().toFixed(3)).replace('.', '');

            rp({
                uri: URLS.API_webwxsendmsg,
                method: 'POST',
                qs: {
                    pass_ticket: this.passTicket
                },
                json: true,
                body: {
                    BaseRequest: this.baseRequest,
                    Msg: {
                        Type: _conf.CODES.MSGTYPE_TEXT,
                        Content: content,
                        FromUserName: this.my.UserName,
                        ToUserName: to,
                        LocalID: clientMsgId,
                        ClientMsgId: clientMsgId
                    }
                }
            }).then(function (data) {
                callback = callback || function () {
                    return null;
                };
                if (!data || !data.BaseResponse || data.BaseResponse.Ret !== 0) {
                    return callback(new Error('Send text fail'));
                }

                callback();
            }).catch(function (e) {
                debug('send text network error', '');
                // network error, retry
                _this7.sendText(to, content, callback);
                return;
            });
        }
    }]);
    return WeixinBot;
}(_events2.default);

// compatible nodejs require


module.exports = WeixinBot;