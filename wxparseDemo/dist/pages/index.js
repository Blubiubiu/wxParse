'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});


var _wepy = require('./../npm/wepy/lib/wepy.js');

var _wepy2 = _interopRequireDefault(_wepy);

var _html2wxml = require('./../components/html2wxml.js');

var _html2wxml2 = _interopRequireDefault(_html2wxml);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Index = function (_wepy$page) {
  _inherits(Index, _wepy$page);

  function Index() {
    var _ref;

    var _temp, _this, _ret;

    _classCallCheck(this, Index);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = Index.__proto__ || Object.getPrototypeOf(Index)).call.apply(_ref, [this].concat(args))), _this), _this.config = {
      navigationBarTitleText: 'wxparseDemo'
    }, _this.$repeat = {}, _this.$props = { "html2wxml": { "xmlns:v-bind": "", "v-bind:parserName.once": "name", "v-bind:parserContent.sync": "textContent" }, "html2wxml1": { "v-bind:parserName.once": "name1", "v-bind:parserContent.sync": "textContent1" } }, _this.$events = {}, _this.components = {
      html2wxml: _html2wxml2.default,
      html2wxml1: _html2wxml2.default
    }, _this.data = {
      name: 'myHtmlParserKiner',
      name1: 'myHtmlParserKiner1',
      textContent: '',
      textContent1: '',
      mock: "<p>JavaScript 是世界上最流行的脚本语言。</p><p>JavaScript 是属于 web 的语言，它适用于 PC、笔记本电脑、平板电脑和移动电话。</p><p>JavaScript 被设计为向 HTML 页面增加交互性。</p><p>许多 HTML 开发者都不是<span style='color: red;'>程序员</span>，但是 JavaScript 却拥有非常简单的语法。几乎每个人都有能力将小的 JavaScript 片段添加到网页中。</p>",
      mock1: "<p style='color: blue;'>感谢使用，您的star是对我最大的鼓励</p><p>JavaScript 是属于 web 的语言，它适用于 PC、笔记本电脑、平板电脑和移动电话。</p><p>JavaScript 被设计为向 HTML 页面增加交互性。</p><p>许多 HTML 开发者都不是<span style='color: gray;'>程序员</span>，但是 JavaScript 却拥有非常简单的语法。几乎每个人都有能力将小的 JavaScript 片段添加到网页中111。</p>"
    }, _this.methods = {
      translate: function translate() {
        //此处只模仿本地环境
        //获取数据
        this.textContent = this.mock;
        //更新
        this.$apply();
        //调用通知接口通知组件更新数据
        this.$invoke('html2wxml', 'htmlParserNotice');
      },
      translate1: function translate1() {
        //此处只模仿本地环境
        //获取数据
        this.textContent1 = this.mock1;
        //更新
        this.$apply();
        //调用通知接口通知组件更新数据
        this.$invoke('html2wxml1', 'htmlParserNotice');
      }
    }, _temp), _possibleConstructorReturn(_this, _ret);
  }

  return Index;
}(_wepy2.default.page);


Page(require('./../npm/wepy/lib/wepy.js').default.$createPage(Index , 'pages/index'));

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIl0sIm5hbWVzIjpbIkluZGV4IiwiY29uZmlnIiwibmF2aWdhdGlvbkJhclRpdGxlVGV4dCIsIiRyZXBlYXQiLCIkcHJvcHMiLCIkZXZlbnRzIiwiY29tcG9uZW50cyIsImh0bWwyd3htbCIsImh0bWwyd3htbDEiLCJkYXRhIiwibmFtZSIsIm5hbWUxIiwidGV4dENvbnRlbnQiLCJ0ZXh0Q29udGVudDEiLCJtb2NrIiwibW9jazEiLCJtZXRob2RzIiwidHJhbnNsYXRlIiwiJGFwcGx5IiwiJGludm9rZSIsInRyYW5zbGF0ZTEiLCJwYWdlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQ0U7Ozs7QUFDQTs7Ozs7Ozs7Ozs7O0lBRXFCQSxLOzs7Ozs7Ozs7Ozs7OztvTEFDbkJDLE0sR0FBUztBQUNQQyw4QkFBd0I7QUFEakIsSyxRQUlWQyxPLEdBQVUsRSxRQUNiQyxNLEdBQVMsRUFBQyxhQUFZLEVBQUMsZ0JBQWUsRUFBaEIsRUFBbUIsMEJBQXlCLE1BQTVDLEVBQW1ELDZCQUE0QixhQUEvRSxFQUFiLEVBQTJHLGNBQWEsRUFBQywwQkFBeUIsT0FBMUIsRUFBa0MsNkJBQTRCLGNBQTlELEVBQXhILEUsUUFDVEMsTyxHQUFVLEUsUUFDVEMsVSxHQUFhO0FBQ1JDLG9DQURRO0FBRVJDO0FBRlEsSyxRQUtWQyxJLEdBQU87QUFDTEMsWUFBTSxtQkFERDtBQUVMQyxhQUFPLG9CQUZGO0FBR0xDLG1CQUFhLEVBSFI7QUFJTEMsb0JBQWMsRUFKVDtBQUtMQyxZQUFNLGdQQUxEO0FBTUxDLGFBQU87QUFORixLLFFBU1BDLE8sR0FBVTtBQUNSQyxlQURRLHVCQUNLO0FBQ1g7QUFDQTtBQUNBLGFBQUtMLFdBQUwsR0FBbUIsS0FBS0UsSUFBeEI7QUFDQTtBQUNBLGFBQUtJLE1BQUw7QUFDQTtBQUNBLGFBQUtDLE9BQUwsQ0FBYSxXQUFiLEVBQTBCLGtCQUExQjtBQUNELE9BVE87QUFVUkMsZ0JBVlEsd0JBVU07QUFDWjtBQUNBO0FBQ0EsYUFBS1AsWUFBTCxHQUFvQixLQUFLRSxLQUF6QjtBQUNBO0FBQ0EsYUFBS0csTUFBTDtBQUNBO0FBQ0EsYUFBS0MsT0FBTCxDQUFhLFlBQWIsRUFBMkIsa0JBQTNCO0FBQ0Q7QUFsQk8sSzs7OztFQXRCdUIsZUFBS0UsSTs7a0JBQW5CckIsSyIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuICBpbXBvcnQgd2VweSBmcm9tICd3ZXB5J1xuICBpbXBvcnQgaHRtbDJ3eG1sIGZyb20gJy4uL2NvbXBvbmVudHMvaHRtbDJ3eG1sJ1xuXG4gIGV4cG9ydCBkZWZhdWx0IGNsYXNzIEluZGV4IGV4dGVuZHMgd2VweS5wYWdlIHtcbiAgICBjb25maWcgPSB7XG4gICAgICBuYXZpZ2F0aW9uQmFyVGl0bGVUZXh0OiAnd3hwYXJzZURlbW8nXG4gICAgfVxuXG4gICAkcmVwZWF0ID0ge307XHJcbiRwcm9wcyA9IHtcImh0bWwyd3htbFwiOntcInhtbG5zOnYtYmluZFwiOlwiXCIsXCJ2LWJpbmQ6cGFyc2VyTmFtZS5vbmNlXCI6XCJuYW1lXCIsXCJ2LWJpbmQ6cGFyc2VyQ29udGVudC5zeW5jXCI6XCJ0ZXh0Q29udGVudFwifSxcImh0bWwyd3htbDFcIjp7XCJ2LWJpbmQ6cGFyc2VyTmFtZS5vbmNlXCI6XCJuYW1lMVwiLFwidi1iaW5kOnBhcnNlckNvbnRlbnQuc3luY1wiOlwidGV4dENvbnRlbnQxXCJ9fTtcclxuJGV2ZW50cyA9IHt9O1xyXG4gY29tcG9uZW50cyA9IHtcbiAgICAgIGh0bWwyd3htbDogaHRtbDJ3eG1sLFxuICAgICAgaHRtbDJ3eG1sMTogaHRtbDJ3eG1sXG4gICAgfVxuXG4gICAgZGF0YSA9IHtcbiAgICAgIG5hbWU6ICdteUh0bWxQYXJzZXJLaW5lcicsXG4gICAgICBuYW1lMTogJ215SHRtbFBhcnNlcktpbmVyMScsXG4gICAgICB0ZXh0Q29udGVudDogJycsXG4gICAgICB0ZXh0Q29udGVudDE6ICcnLFxuICAgICAgbW9jazogXCI8cD5KYXZhU2NyaXB0IOaYr+S4lueVjOS4iuacgOa1geihjOeahOiEmuacrOivreiogOOAgjwvcD48cD5KYXZhU2NyaXB0IOaYr+WxnuS6jiB3ZWIg55qE6K+t6KiA77yM5a6D6YCC55So5LqOIFBD44CB56yU6K6w5pys55S16ISR44CB5bmz5p2/55S16ISR5ZKM56e75Yqo55S16K+d44CCPC9wPjxwPkphdmFTY3JpcHQg6KKr6K6+6K6h5Li65ZCRIEhUTUwg6aG16Z2i5aKe5Yqg5Lqk5LqS5oCn44CCPC9wPjxwPuiuuOWkmiBIVE1MIOW8gOWPkeiAhemDveS4jeaYrzxzcGFuIHN0eWxlPSdjb2xvcjogcmVkOyc+56iL5bqP5ZGYPC9zcGFuPu+8jOS9huaYryBKYXZhU2NyaXB0IOWNtOaLpeaciemdnuW4uOeugOWNleeahOivreazleOAguWHoOS5juavj+S4quS6uumDveacieiDveWKm+WwhuWwj+eahCBKYXZhU2NyaXB0IOeJh+autea3u+WKoOWIsOe9kemhteS4reOAgjwvcD5cIixcbiAgICAgIG1vY2sxOiBcIjxwIHN0eWxlPSdjb2xvcjogYmx1ZTsnPuaEn+iwouS9v+eUqO+8jOaCqOeahHN0YXLmmK/lr7nmiJHmnIDlpKfnmoTpvJPlirE8L3A+PHA+SmF2YVNjcmlwdCDmmK/lsZ7kuo4gd2ViIOeahOivreiogO+8jOWug+mAgueUqOS6jiBQQ+OAgeeslOiusOacrOeUteiEkeOAgeW5s+adv+eUteiEkeWSjOenu+WKqOeUteivneOAgjwvcD48cD5KYXZhU2NyaXB0IOiiq+iuvuiuoeS4uuWQkSBIVE1MIOmhtemdouWinuWKoOS6pOS6kuaAp+OAgjwvcD48cD7orrjlpJogSFRNTCDlvIDlj5HogIXpg73kuI3mmK88c3BhbiBzdHlsZT0nY29sb3I6IGdyYXk7Jz7nqIvluo/lkZg8L3NwYW4+77yM5L2G5pivIEphdmFTY3JpcHQg5Y205oul5pyJ6Z2e5bi4566A5Y2V55qE6K+t5rOV44CC5Yeg5LmO5q+P5Liq5Lq66YO95pyJ6IO95Yqb5bCG5bCP55qEIEphdmFTY3JpcHQg54mH5q615re75Yqg5Yiw572R6aG15LitMTEx44CCPC9wPlwiXG4gICAgfVxuXG4gICAgbWV0aG9kcyA9IHtcbiAgICAgIHRyYW5zbGF0ZSAoKSB7XG4gICAgICAgIC8v5q2k5aSE5Y+q5qih5Lu/5pys5Zyw546v5aKDXG4gICAgICAgIC8v6I635Y+W5pWw5o2uXG4gICAgICAgIHRoaXMudGV4dENvbnRlbnQgPSB0aGlzLm1vY2tcbiAgICAgICAgLy/mm7TmlrBcbiAgICAgICAgdGhpcy4kYXBwbHkoKVxuICAgICAgICAvL+iwg+eUqOmAmuefpeaOpeWPo+mAmuefpee7hOS7tuabtOaWsOaVsOaNrlxuICAgICAgICB0aGlzLiRpbnZva2UoJ2h0bWwyd3htbCcsICdodG1sUGFyc2VyTm90aWNlJylcbiAgICAgIH0sXG4gICAgICB0cmFuc2xhdGUxICgpIHtcbiAgICAgICAgLy/mraTlpITlj6rmqKHku7/mnKzlnLDnjq/looNcbiAgICAgICAgLy/ojrflj5bmlbDmja5cbiAgICAgICAgdGhpcy50ZXh0Q29udGVudDEgPSB0aGlzLm1vY2sxXG4gICAgICAgIC8v5pu05pawXG4gICAgICAgIHRoaXMuJGFwcGx5KClcbiAgICAgICAgLy/osIPnlKjpgJrnn6XmjqXlj6PpgJrnn6Xnu4Tku7bmm7TmlrDmlbDmja5cbiAgICAgICAgdGhpcy4kaW52b2tlKCdodG1sMnd4bWwxJywgJ2h0bWxQYXJzZXJOb3RpY2UnKVxuICAgICAgfVxuICAgIH1cbiAgfVxuIl19