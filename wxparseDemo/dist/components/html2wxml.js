"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _wepy = require('./../npm/wepy/lib/wepy.js');

var _wepy2 = _interopRequireDefault(_wepy);

var _wxParse = require('./../wxparse/wxParse.js');

var _wxParse2 = _interopRequireDefault(_wxParse);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var html2wxml = function (_wepy$component) {
    _inherits(html2wxml, _wepy$component);

    function html2wxml() {
        var _ref;

        var _temp, _this, _ret;

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        _classCallCheck(this, html2wxml);

        return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = html2wxml.__proto__ || Object.getPrototypeOf(html2wxml)).call.apply(_ref, [this].concat(args))), _this), _this.props = {
            parserName: {
                type: String,
                default: "htmlParserName"
            },
            parserContent: {
                type: String,
                default: "<p style='font-size: 32rpx; padding: 30rpx 0; text-align: center;'>此处可以在html2wxml.wpy中自行选择删除</p>"
            },
            parserType: {
                type: String,
                default: "html"
            },
            parserPadding: {
                type: Number,
                default: 5
            }
        }, _this.data = {
            htmlParserTpl: {}
        }, _this.events = {
            'htmlParser-broadcast': function htmlParserBroadcast($event) {}
        }, _this.methods = {
            htmlParserNotice: function htmlParserNotice() {
                this.htmlParse();
            }
        }, _temp), _possibleConstructorReturn(_this, _ret);
    }

    _createClass(html2wxml, [{
        key: "onLoad",
        value: function () {
            var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                this.htmlParse();

                            case 1:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function onLoad() {
                return _ref2.apply(this, arguments);
            }

            return onLoad;
        }()
    }, {
        key: "wxParseImgLoad",
        value: function wxParseImgLoad(image) {
            var imgInfo = image.detail;
        }
    }, {
        key: "htmlParse",
        value: function htmlParse() {
            /**
              * WxParse.wxParse(bindName , type, data, target,imagePadding)
              * 1.bindName绑定的数据名(必填)
              * 2.type可以为html或者md(必填)
              * 3.data为传入的具体数据(必填)
              * 4.target为Page对象,一般为this(必填)
              * 5.imagePadding为当图片自适应是左右的单一padding(默认为0,可选)
              */
            try {
                var htmlContent = _wxParse2.default.wxParse(this.parserName, this.parserType, this.parserContent || this.props.parserContent.default, this, this.parserPadding);
                this.htmlParserTpl = htmlContent[this.parserName];
            } catch (e) {
                console.warn('kinerHtmlParser:', '没有任何内容需要转换', e);
            }
        }
    }]);

    return html2wxml;
}(_wepy2.default.component);

exports.default = html2wxml;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0bWwyd3htbC5qcyJdLCJuYW1lcyI6WyJodG1sMnd4bWwiLCJwcm9wcyIsInBhcnNlck5hbWUiLCJ0eXBlIiwiU3RyaW5nIiwiZGVmYXVsdCIsInBhcnNlckNvbnRlbnQiLCJwYXJzZXJUeXBlIiwicGFyc2VyUGFkZGluZyIsIk51bWJlciIsImRhdGEiLCJodG1sUGFyc2VyVHBsIiwiZXZlbnRzIiwiJGV2ZW50IiwibWV0aG9kcyIsImh0bWxQYXJzZXJOb3RpY2UiLCJodG1sUGFyc2UiLCJpbWFnZSIsImltZ0luZm8iLCJkZXRhaWwiLCJodG1sQ29udGVudCIsInd4UGFyc2UiLCJlIiwiY29uc29sZSIsIndhcm4iLCJjb21wb25lbnQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUNFOzs7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7O0lBRXFCQSxTOzs7Ozs7Ozs7Ozs7OztnTUFDbkJDLEssR0FBUTtBQUNOQyx3QkFBWTtBQUNSQyxzQkFBS0MsTUFERztBQUVSQyx5QkFBUztBQUZELGFBRE47QUFLTkMsMkJBQWM7QUFDVkgsc0JBQU1DLE1BREk7QUFFVkMseUJBQVM7QUFGQyxhQUxSO0FBU05FLHdCQUFXO0FBQ1BKLHNCQUFLQyxNQURFO0FBRVBDLHlCQUFTO0FBRkYsYUFUTDtBQWFORywyQkFBYztBQUNWTCxzQkFBTU0sTUFESTtBQUVWSix5QkFBUztBQUZDO0FBYlIsUyxRQWtCUkssSSxHQUFPO0FBQ0xDLDJCQUFlO0FBRFYsUyxRQUdQQyxNLEdBQVM7QUFDTCxvQ0FBd0IsNkJBQUNDLE1BQUQsRUFBcUIsQ0FDNUM7QUFGSSxTLFFBSVRDLE8sR0FBVTtBQUNOQyw0QkFETSw4QkFDWTtBQUNkLHFCQUFLQyxTQUFMO0FBQ0g7QUFISyxTOzs7Ozs7Ozs7OztBQU1OLHFDQUFLQSxTQUFMOzs7Ozs7Ozs7Ozs7Ozs7Ozs7dUNBRVdDLEssRUFBTTtBQUNqQixnQkFBSUMsVUFBVUQsTUFBTUUsTUFBcEI7QUFDSDs7O29DQUNVO0FBQ1A7Ozs7Ozs7O0FBUUEsZ0JBQUk7QUFDRixvQkFBSUMsY0FBYyxrQkFBUUMsT0FBUixDQUFnQixLQUFLbkIsVUFBckIsRUFBaUMsS0FBS0ssVUFBdEMsRUFBa0QsS0FBS0QsYUFBTCxJQUFzQixLQUFLTCxLQUFMLENBQVdLLGFBQVgsQ0FBeUJELE9BQWpHLEVBQTBHLElBQTFHLEVBQWdILEtBQUtHLGFBQXJILENBQWxCO0FBQ0EscUJBQUtHLGFBQUwsR0FBcUJTLFlBQVksS0FBS2xCLFVBQWpCLENBQXJCO0FBQ0QsYUFIRCxDQUdFLE9BQU9vQixDQUFQLEVBQVU7QUFDVkMsd0JBQVFDLElBQVIsQ0FBYSxrQkFBYixFQUFpQyxZQUFqQyxFQUErQ0YsQ0FBL0M7QUFDRDtBQUNKOzs7O0VBcERvQyxlQUFLRyxTOztrQkFBdkJ6QixTIiwiZmlsZSI6Imh0bWwyd3htbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuICBpbXBvcnQgd2VweSBmcm9tIFwid2VweVwiXG4gIGltcG9ydCBXeFBhcnNlIGZyb20gJy4uL3d4cGFyc2Uvd3hQYXJzZSdcblxuICBleHBvcnQgZGVmYXVsdCBjbGFzcyBodG1sMnd4bWwgZXh0ZW5kcyB3ZXB5LmNvbXBvbmVudCB7XG4gICAgcHJvcHMgPSB7XG4gICAgICBwYXJzZXJOYW1lOiB7XG4gICAgICAgICAgdHlwZTpTdHJpbmcsXG4gICAgICAgICAgZGVmYXVsdDogXCJodG1sUGFyc2VyTmFtZVwiXG4gICAgICB9LFxuICAgICAgcGFyc2VyQ29udGVudDp7XG4gICAgICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgICAgIGRlZmF1bHQ6IFwiPHAgc3R5bGU9J2ZvbnQtc2l6ZTogMzJycHg7IHBhZGRpbmc6IDMwcnB4IDA7IHRleHQtYWxpZ246IGNlbnRlcjsnPuatpOWkhOWPr+S7peWcqGh0bWwyd3htbC53cHnkuK3oh6rooYzpgInmi6nliKDpmaQ8L3A+XCJcbiAgICAgIH0sXG4gICAgICBwYXJzZXJUeXBlOntcbiAgICAgICAgICB0eXBlOlN0cmluZyxcbiAgICAgICAgICBkZWZhdWx0OiBcImh0bWxcIlxuICAgICAgfSxcbiAgICAgIHBhcnNlclBhZGRpbmc6e1xuICAgICAgICAgIHR5cGU6IE51bWJlcixcbiAgICAgICAgICBkZWZhdWx0OiA1XG4gICAgICB9XG4gICAgfVxuICAgIGRhdGEgPSB7XG4gICAgICBodG1sUGFyc2VyVHBsOiB7fVxuICAgIH1cbiAgICBldmVudHMgPSB7XG4gICAgICAgICdodG1sUGFyc2VyLWJyb2FkY2FzdCc6ICgkZXZlbnQsIC4uLmFyZ3MpID0+IHtcbiAgICAgICAgfSxcbiAgICB9XG4gICAgbWV0aG9kcyA9IHtcbiAgICAgICAgaHRtbFBhcnNlck5vdGljZSgpe1xuICAgICAgICAgICAgdGhpcy5odG1sUGFyc2UoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBvbkxvYWQoKXtcbiAgICAgICAgdGhpcy5odG1sUGFyc2UoKTtcbiAgICB9XG4gICAgd3hQYXJzZUltZ0xvYWQoaW1hZ2Upe1xuICAgICAgICBsZXQgaW1nSW5mbyA9IGltYWdlLmRldGFpbDtcbiAgICB9XG4gICAgaHRtbFBhcnNlKCl7XG4gICAgICAgIC8qKlxuICAgICAgICAgICogV3hQYXJzZS53eFBhcnNlKGJpbmROYW1lICwgdHlwZSwgZGF0YSwgdGFyZ2V0LGltYWdlUGFkZGluZylcbiAgICAgICAgICAqIDEuYmluZE5hbWXnu5HlrprnmoTmlbDmja7lkI0o5b+F5aGrKVxuICAgICAgICAgICogMi50eXBl5Y+v5Lul5Li6aHRtbOaIluiAhW1kKOW/heWhqylcbiAgICAgICAgICAqIDMuZGF0YeS4uuS8oOWFpeeahOWFt+S9k+aVsOaNrijlv4XloaspXG4gICAgICAgICAgKiA0LnRhcmdldOS4ulBhZ2Xlr7nosaEs5LiA6Iis5Li6dGhpcyjlv4XloaspXG4gICAgICAgICAgKiA1LmltYWdlUGFkZGluZ+S4uuW9k+WbvueJh+iHqumAguW6lOaYr+W3puWPs+eahOWNleS4gHBhZGRpbmco6buY6K6k5Li6MCzlj6/pgIkpXG4gICAgICAgICAgKi9cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBsZXQgaHRtbENvbnRlbnQgPSBXeFBhcnNlLnd4UGFyc2UodGhpcy5wYXJzZXJOYW1lLCB0aGlzLnBhcnNlclR5cGUsIHRoaXMucGFyc2VyQ29udGVudCB8fCB0aGlzLnByb3BzLnBhcnNlckNvbnRlbnQuZGVmYXVsdCwgdGhpcywgdGhpcy5wYXJzZXJQYWRkaW5nKVxuICAgICAgICAgIHRoaXMuaHRtbFBhcnNlclRwbCA9IGh0bWxDb250ZW50W3RoaXMucGFyc2VyTmFtZV1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGNvbnNvbGUud2Fybigna2luZXJIdG1sUGFyc2VyOicsICfmsqHmnInku7vkvZXlhoXlrrnpnIDopoHovazmjaInLCBlKVxuICAgICAgICB9XG4gICAgfVxuICB9XG4iXX0=