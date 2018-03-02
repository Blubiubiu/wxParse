'use strict';

var _showdown = require('./showdown.js');

var _showdown2 = _interopRequireDefault(_showdown);

var _html2json = require('./html2json.js');

var _html2json2 = _interopRequireDefault(_html2json);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
                                                                                                                                                                                                                   * author: Di (微信小程序开发工程师)
                                                                                                                                                                                                                   * organization: WeAppDev(微信小程序开发论坛)(http://weappdev.com)
                                                                                                                                                                                                                   *               垂直微信小程序开发交流社区
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * github地址: https://github.com/icindy/wxParse
                                                                                                                                                                                                                   *
                                                                                                                                                                                                                   * for: 微信小程序富文本解析
                                                                                                                                                                                                                   * detail : http://weappdev.com/t/wxparse-alpha0-1-html-markdown/184
                                                                                                                                                                                                                   */

/**
 * utils函数引入
 **/


/**
 * 配置及公有属性
 **/
var realWindowWidth = 0;
var realWindowHeight = 0;
wx.getSystemInfo({
  success: function success(res) {
    realWindowWidth = res.windowWidth;
    realWindowHeight = res.windowHeight;
  }
});

/**
 * 主函数入口区
 **/
function wxParse() {
  var bindName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'wxParseData';
  var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'html';
  var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '<div class="color:red;">数据不能为空</div>';
  var target = arguments[3];
  var imagePadding = arguments[4];

  var that = target;
  var transData = {}; //存放转化后的数据
  if (type == 'html') {
    transData = _html2json2.default.html2json(data, bindName);
    //console.log(JSON.stringify(transData, ' ', ' '))
  } else if (type == 'md' || type == 'markdown') {
    var converter = new _showdown2.default.Converter();
    var html = converter.makeHtml(data);
    transData = _html2json2.default.html2json(html, bindName);
    //console.log(JSON.stringify(transData, ' ', ' '))
  }
  transData.view = {};
  transData.view.imagePadding = 0;
  if (typeof imagePadding != 'undefined') {
    transData.view.imagePadding = imagePadding;
  }
  var bindData = {};
  bindData[bindName] = transData;
  that.setData(bindData);
  that.bindData = bindData;
  that.wxParseImgLoad = wxParseImgLoad;
  that.wxParseImgTap = wxParseImgTap;

  //新增
  bindData.wxParseImgLoad = wxParseImgLoad;
  bindData.wxParseImgTap = wxParseImgTap;

  return bindData;
}

// 图片点击事件
function wxParseImgTap(e, bindData) {
  var that = this;
  var nowImgUrl = e.target.dataset.src;
  var tagFrom = e.target.dataset.from;

  if (typeof tagFrom != 'undefined' && tagFrom.length > 0) {
    wx.previewImage({
      current: nowImgUrl, // 当前显示图片的http链接
      urls: bindData[tagFrom].imageUrls // 需要预览的图片http链接列表
    });
  }
}

/**
 * 图片视觉宽高计算函数区
 **/
function wxParseImgLoad(e) {
  var that = this;
  var tagFrom = e.target.dataset.from;
  var idx = e.target.dataset.idx;
  if (typeof tagFrom != 'undefined' && tagFrom.length > 0) {
    calMoreImageInfo(e, idx, that, tagFrom);
  }
}

// 假循环获取计算图片视觉最佳宽高
function calMoreImageInfo(e, idx, that, bindName) {
  var _that$setData;

  var temData = that.data[bindName];
  if (!temData || temData.images.length == 0) {
    return;
  }
  var temImages = temData.images;
  //因为无法获取view宽度 需要自定义padding进行计算，稍后处理
  var recal = wxAutoImageCal(e.detail.width, e.detail.height, that, bindName);
  // temImages[idx].width = recal.imageWidth;
  // temImages[idx].height = recal.imageheight;
  // temData.images = temImages;
  // var bindData = {};
  // bindData[bindName] = temData;
  // that.setData(bindData);
  var index = temImages[idx].index;
  var key = '' + bindName;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = index.split('.')[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var i = _step.value;
      key += '.nodes[' + i + ']';
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  var keyW = key + '.width';
  var keyH = key + '.height';
  that.setData((_that$setData = {}, _defineProperty(_that$setData, keyW, recal.imageWidth), _defineProperty(_that$setData, keyH, recal.imageheight), _that$setData));
}

// 计算视觉优先的图片宽高
function wxAutoImageCal(originalWidth, originalHeight, that, bindName) {
  //获取图片的原始长宽
  var windowWidth = 0,
      windowHeight = 0;
  var autoWidth = 0,
      autoHeight = 0;
  var results = {};
  var padding = that.data[bindName].view.imagePadding;
  windowWidth = realWindowWidth - 2 * padding;
  windowHeight = realWindowHeight;
  //判断按照那种方式进行缩放
  // console.log("windowWidth" + windowWidth);
  if (originalWidth > windowWidth) {
    //在图片width大于手机屏幕width时候
    autoWidth = windowWidth;
    // console.log("autoWidth" + autoWidth);
    autoHeight = autoWidth * originalHeight / originalWidth;
    // console.log("autoHeight" + autoHeight);
    results.imageWidth = autoWidth;
    results.imageheight = autoHeight;
  } else {
    //否则展示原来的数据
    results.imageWidth = originalWidth;
    results.imageheight = originalHeight;
  }
  return results;
}

function wxParseTemArray(temArrayName, bindNameReg, total, that) {
  var array = [];
  var temData = that.data;
  var obj = null;
  for (var i = 0; i < total; i++) {
    var simArr = temData[bindNameReg + i].nodes;
    array.push(simArr);
  }

  temArrayName = temArrayName || 'wxParseTemArray';
  obj = JSON.parse('{"' + temArrayName + '":""}');
  obj[temArrayName] = array;
  that.setData(obj);
}

/**
 * 配置emojis
 *
 */

function emojisInit() {
  var reg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var baseSrc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '/wxParse/emojis/';
  var emojis = arguments[2];

  _html2json2.default.emojisInit(reg, baseSrc, emojis);
}

module.exports = {
  wxParse: wxParse,
  wxParseImgTap: wxParseImgTap,
  wxParseTemArray: wxParseTemArray,
  emojisInit: emojisInit
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInd4UGFyc2UuanMiXSwibmFtZXMiOlsicmVhbFdpbmRvd1dpZHRoIiwicmVhbFdpbmRvd0hlaWdodCIsInd4IiwiZ2V0U3lzdGVtSW5mbyIsInN1Y2Nlc3MiLCJyZXMiLCJ3aW5kb3dXaWR0aCIsIndpbmRvd0hlaWdodCIsInd4UGFyc2UiLCJiaW5kTmFtZSIsInR5cGUiLCJkYXRhIiwidGFyZ2V0IiwiaW1hZ2VQYWRkaW5nIiwidGhhdCIsInRyYW5zRGF0YSIsImh0bWwyanNvbiIsImNvbnZlcnRlciIsIkNvbnZlcnRlciIsImh0bWwiLCJtYWtlSHRtbCIsInZpZXciLCJiaW5kRGF0YSIsInNldERhdGEiLCJ3eFBhcnNlSW1nTG9hZCIsInd4UGFyc2VJbWdUYXAiLCJlIiwibm93SW1nVXJsIiwiZGF0YXNldCIsInNyYyIsInRhZ0Zyb20iLCJmcm9tIiwibGVuZ3RoIiwicHJldmlld0ltYWdlIiwiY3VycmVudCIsInVybHMiLCJpbWFnZVVybHMiLCJpZHgiLCJjYWxNb3JlSW1hZ2VJbmZvIiwidGVtRGF0YSIsImltYWdlcyIsInRlbUltYWdlcyIsInJlY2FsIiwid3hBdXRvSW1hZ2VDYWwiLCJkZXRhaWwiLCJ3aWR0aCIsImhlaWdodCIsImluZGV4Iiwia2V5Iiwic3BsaXQiLCJpIiwia2V5VyIsImtleUgiLCJpbWFnZVdpZHRoIiwiaW1hZ2VoZWlnaHQiLCJvcmlnaW5hbFdpZHRoIiwib3JpZ2luYWxIZWlnaHQiLCJhdXRvV2lkdGgiLCJhdXRvSGVpZ2h0IiwicmVzdWx0cyIsInBhZGRpbmciLCJ3eFBhcnNlVGVtQXJyYXkiLCJ0ZW1BcnJheU5hbWUiLCJiaW5kTmFtZVJlZyIsInRvdGFsIiwiYXJyYXkiLCJvYmoiLCJzaW1BcnIiLCJub2RlcyIsInB1c2giLCJKU09OIiwicGFyc2UiLCJlbW9qaXNJbml0IiwicmVnIiwiYmFzZVNyYyIsImVtb2ppcyIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O0FBY0E7Ozs7QUFDQTs7Ozs7O2tOQWZB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LE9BQUwsQ0FBYTJDLEdBQWI7QUFDRDs7QUFFRDs7Ozs7QUFLQSxTQUFTTSxVQUFULEdBQXFFO0FBQUEsTUFBaERDLEdBQWdELHVFQUExQyxFQUEwQztBQUFBLE1BQXRDQyxPQUFzQyx1RUFBNUIsa0JBQTRCO0FBQUEsTUFBUkMsTUFBUTs7QUFDbkUsc0JBQVdILFVBQVgsQ0FBc0JDLEdBQXRCLEVBQTJCQyxPQUEzQixFQUFvQ0MsTUFBcEM7QUFDRDs7QUFFREMsT0FBT0MsT0FBUCxHQUFpQjtBQUNmckUsV0FBU0EsT0FETTtBQUVmaUIsaUJBQWVBLGFBRkE7QUFHZm9DLG1CQUFpQkEsZUFIRjtBQUlmVyxjQUFZQTtBQUpHLENBQWpCIiwiZmlsZSI6Ind4UGFyc2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIGF1dGhvcjogRGkgKOW+ruS/oeWwj+eoi+W6j+W8gOWPkeW3peeoi+W4iClcbiAqIG9yZ2FuaXphdGlvbjogV2VBcHBEZXYo5b6u5L+h5bCP56iL5bqP5byA5Y+R6K665Z2bKShodHRwOi8vd2VhcHBkZXYuY29tKVxuICogICAgICAgICAgICAgICDlnoLnm7Tlvq7kv6HlsI/nqIvluo/lvIDlj5HkuqTmtYHnpL7ljLpcbiAqXG4gKiBnaXRodWLlnLDlnYA6IGh0dHBzOi8vZ2l0aHViLmNvbS9pY2luZHkvd3hQYXJzZVxuICpcbiAqIGZvcjog5b6u5L+h5bCP56iL5bqP5a+M5paH5pys6Kej5p6QXG4gKiBkZXRhaWwgOiBodHRwOi8vd2VhcHBkZXYuY29tL3Qvd3hwYXJzZS1hbHBoYTAtMS1odG1sLW1hcmtkb3duLzE4NFxuICovXG5cbi8qKlxuICogdXRpbHPlh73mlbDlvJXlhaVcbiAqKi9cbmltcG9ydCBzaG93ZG93biBmcm9tICcuL3Nob3dkb3duLmpzJ1xuaW1wb3J0IEh0bWxUb0pzb24gZnJvbSAnLi9odG1sMmpzb24uanMnXG5cbi8qKlxuICog6YWN572u5Y+K5YWs5pyJ5bGe5oCnXG4gKiovXG52YXIgcmVhbFdpbmRvd1dpZHRoID0gMFxudmFyIHJlYWxXaW5kb3dIZWlnaHQgPSAwXG53eC5nZXRTeXN0ZW1JbmZvKHtcbiAgc3VjY2VzczogZnVuY3Rpb24gKHJlcykge1xuICAgIHJlYWxXaW5kb3dXaWR0aCA9IHJlcy53aW5kb3dXaWR0aFxuICAgIHJlYWxXaW5kb3dIZWlnaHQgPSByZXMud2luZG93SGVpZ2h0XG4gIH1cbn0pXG5cbi8qKlxuICog5Li75Ye95pWw5YWl5Y+j5Yy6XG4gKiovXG5mdW5jdGlvbiB3eFBhcnNlIChiaW5kTmFtZSA9ICd3eFBhcnNlRGF0YScsIHR5cGUgPSAnaHRtbCcsIGRhdGEgPSAnPGRpdiBjbGFzcz1cImNvbG9yOnJlZDtcIj7mlbDmja7kuI3og73kuLrnqbo8L2Rpdj4nLCB0YXJnZXQsIGltYWdlUGFkZGluZykge1xuICB2YXIgdGhhdCA9IHRhcmdldFxuICB2YXIgdHJhbnNEYXRhID0ge30vL+WtmOaUvui9rOWMluWQjueahOaVsOaNrlxuICBpZiAodHlwZSA9PSAnaHRtbCcpIHtcbiAgICB0cmFuc0RhdGEgPSBIdG1sVG9Kc29uLmh0bWwyanNvbihkYXRhLCBiaW5kTmFtZSlcbiAgICAvL2NvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHRyYW5zRGF0YSwgJyAnLCAnICcpKVxuICB9IGVsc2UgaWYgKHR5cGUgPT0gJ21kJyB8fCB0eXBlID09ICdtYXJrZG93bicpIHtcbiAgICB2YXIgY29udmVydGVyID0gbmV3IHNob3dkb3duLkNvbnZlcnRlcigpXG4gICAgdmFyIGh0bWwgPSBjb252ZXJ0ZXIubWFrZUh0bWwoZGF0YSlcbiAgICB0cmFuc0RhdGEgPSBIdG1sVG9Kc29uLmh0bWwyanNvbihodG1sLCBiaW5kTmFtZSlcbiAgICAvL2NvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHRyYW5zRGF0YSwgJyAnLCAnICcpKVxuICB9XG4gIHRyYW5zRGF0YS52aWV3ID0ge31cbiAgdHJhbnNEYXRhLnZpZXcuaW1hZ2VQYWRkaW5nID0gMFxuICBpZiAodHlwZW9mKGltYWdlUGFkZGluZykgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0cmFuc0RhdGEudmlldy5pbWFnZVBhZGRpbmcgPSBpbWFnZVBhZGRpbmdcbiAgfVxuICB2YXIgYmluZERhdGEgPSB7fVxuICBiaW5kRGF0YVtiaW5kTmFtZV0gPSB0cmFuc0RhdGFcbiAgdGhhdC5zZXREYXRhKGJpbmREYXRhKVxuICB0aGF0LmJpbmREYXRhID0gYmluZERhdGFcbiAgdGhhdC53eFBhcnNlSW1nTG9hZCA9IHd4UGFyc2VJbWdMb2FkXG4gIHRoYXQud3hQYXJzZUltZ1RhcCA9IHd4UGFyc2VJbWdUYXBcblxuICAvL+aWsOWinlxuICBiaW5kRGF0YS53eFBhcnNlSW1nTG9hZCA9IHd4UGFyc2VJbWdMb2FkXG4gIGJpbmREYXRhLnd4UGFyc2VJbWdUYXAgPSB3eFBhcnNlSW1nVGFwXG5cbiAgcmV0dXJuIGJpbmREYXRhXG59XG5cbi8vIOWbvueJh+eCueWHu+S6i+S7tlxuZnVuY3Rpb24gd3hQYXJzZUltZ1RhcCAoZSwgYmluZERhdGEpIHtcbiAgdmFyIHRoYXQgPSB0aGlzXG4gIHZhciBub3dJbWdVcmwgPSBlLnRhcmdldC5kYXRhc2V0LnNyY1xuICB2YXIgdGFnRnJvbSA9IGUudGFyZ2V0LmRhdGFzZXQuZnJvbVxuXG4gIGlmICh0eXBlb2YgKHRhZ0Zyb20pICE9ICd1bmRlZmluZWQnICYmIHRhZ0Zyb20ubGVuZ3RoID4gMCkge1xuICAgIHd4LnByZXZpZXdJbWFnZSh7XG4gICAgICBjdXJyZW50OiBub3dJbWdVcmwsIC8vIOW9k+WJjeaYvuekuuWbvueJh+eahGh0dHDpk77mjqVcbiAgICAgIHVybHM6IGJpbmREYXRhW3RhZ0Zyb21dLmltYWdlVXJscyAvLyDpnIDopoHpooTop4jnmoTlm77niYdodHRw6ZO+5o6l5YiX6KGoXG4gICAgfSlcbiAgfVxufVxuXG4vKipcbiAqIOWbvueJh+inhuinieWuvemrmOiuoeeul+WHveaVsOWMulxuICoqL1xuZnVuY3Rpb24gd3hQYXJzZUltZ0xvYWQgKGUpIHtcbiAgdmFyIHRoYXQgPSB0aGlzXG4gIHZhciB0YWdGcm9tID0gZS50YXJnZXQuZGF0YXNldC5mcm9tXG4gIHZhciBpZHggPSBlLnRhcmdldC5kYXRhc2V0LmlkeFxuICBpZiAodHlwZW9mICh0YWdGcm9tKSAhPSAndW5kZWZpbmVkJyAmJiB0YWdGcm9tLmxlbmd0aCA+IDApIHtcbiAgICBjYWxNb3JlSW1hZ2VJbmZvKGUsIGlkeCwgdGhhdCwgdGFnRnJvbSlcbiAgfVxufVxuXG4vLyDlgYflvqrnjq/ojrflj5borqHnrpflm77niYfop4bop4nmnIDkvbPlrr3pq5hcbmZ1bmN0aW9uIGNhbE1vcmVJbWFnZUluZm8gKGUsIGlkeCwgdGhhdCwgYmluZE5hbWUpIHtcbiAgdmFyIHRlbURhdGEgPSB0aGF0LmRhdGFbYmluZE5hbWVdXG4gIGlmICghdGVtRGF0YSB8fCB0ZW1EYXRhLmltYWdlcy5sZW5ndGggPT0gMCkge1xuICAgIHJldHVyblxuICB9XG4gIHZhciB0ZW1JbWFnZXMgPSB0ZW1EYXRhLmltYWdlc1xuICAvL+WboOS4uuaXoOazleiOt+WPlnZpZXflrr3luqYg6ZyA6KaB6Ieq5a6a5LmJcGFkZGluZ+i/m+ihjOiuoeeul++8jOeojeWQjuWkhOeQhlxuICB2YXIgcmVjYWwgPSB3eEF1dG9JbWFnZUNhbChlLmRldGFpbC53aWR0aCwgZS5kZXRhaWwuaGVpZ2h0LCB0aGF0LCBiaW5kTmFtZSlcbiAgLy8gdGVtSW1hZ2VzW2lkeF0ud2lkdGggPSByZWNhbC5pbWFnZVdpZHRoO1xuICAvLyB0ZW1JbWFnZXNbaWR4XS5oZWlnaHQgPSByZWNhbC5pbWFnZWhlaWdodDtcbiAgLy8gdGVtRGF0YS5pbWFnZXMgPSB0ZW1JbWFnZXM7XG4gIC8vIHZhciBiaW5kRGF0YSA9IHt9O1xuICAvLyBiaW5kRGF0YVtiaW5kTmFtZV0gPSB0ZW1EYXRhO1xuICAvLyB0aGF0LnNldERhdGEoYmluZERhdGEpO1xuICB2YXIgaW5kZXggPSB0ZW1JbWFnZXNbaWR4XS5pbmRleFxuICB2YXIga2V5ID0gYCR7YmluZE5hbWV9YFxuICBmb3IgKHZhciBpIG9mIGluZGV4LnNwbGl0KCcuJykpIGtleSArPSBgLm5vZGVzWyR7aX1dYFxuICB2YXIga2V5VyA9IGtleSArICcud2lkdGgnXG4gIHZhciBrZXlIID0ga2V5ICsgJy5oZWlnaHQnXG4gIHRoYXQuc2V0RGF0YSh7XG4gICAgW2tleVddOiByZWNhbC5pbWFnZVdpZHRoLFxuICAgIFtrZXlIXTogcmVjYWwuaW1hZ2VoZWlnaHQsXG4gIH0pXG59XG5cbi8vIOiuoeeul+inhuinieS8mOWFiOeahOWbvueJh+WuvemrmFxuZnVuY3Rpb24gd3hBdXRvSW1hZ2VDYWwgKG9yaWdpbmFsV2lkdGgsIG9yaWdpbmFsSGVpZ2h0LCB0aGF0LCBiaW5kTmFtZSkge1xuICAvL+iOt+WPluWbvueJh+eahOWOn+Wni+mVv+WuvVxuICB2YXIgd2luZG93V2lkdGggPSAwLCB3aW5kb3dIZWlnaHQgPSAwXG4gIHZhciBhdXRvV2lkdGggPSAwLCBhdXRvSGVpZ2h0ID0gMFxuICB2YXIgcmVzdWx0cyA9IHt9XG4gIHZhciBwYWRkaW5nID0gdGhhdC5kYXRhW2JpbmROYW1lXS52aWV3LmltYWdlUGFkZGluZ1xuICB3aW5kb3dXaWR0aCA9IHJlYWxXaW5kb3dXaWR0aCAtIDIgKiBwYWRkaW5nXG4gIHdpbmRvd0hlaWdodCA9IHJlYWxXaW5kb3dIZWlnaHRcbiAgLy/liKTmlq3mjInnhafpgqPnp43mlrnlvI/ov5vooYznvKnmlL5cbiAgLy8gY29uc29sZS5sb2coXCJ3aW5kb3dXaWR0aFwiICsgd2luZG93V2lkdGgpO1xuICBpZiAob3JpZ2luYWxXaWR0aCA+IHdpbmRvd1dpZHRoKSB7Ly/lnKjlm77niYd3aWR0aOWkp+S6juaJi+acuuWxj+W5lXdpZHRo5pe25YCZXG4gICAgYXV0b1dpZHRoID0gd2luZG93V2lkdGhcbiAgICAvLyBjb25zb2xlLmxvZyhcImF1dG9XaWR0aFwiICsgYXV0b1dpZHRoKTtcbiAgICBhdXRvSGVpZ2h0ID0gKGF1dG9XaWR0aCAqIG9yaWdpbmFsSGVpZ2h0KSAvIG9yaWdpbmFsV2lkdGhcbiAgICAvLyBjb25zb2xlLmxvZyhcImF1dG9IZWlnaHRcIiArIGF1dG9IZWlnaHQpO1xuICAgIHJlc3VsdHMuaW1hZ2VXaWR0aCA9IGF1dG9XaWR0aFxuICAgIHJlc3VsdHMuaW1hZ2VoZWlnaHQgPSBhdXRvSGVpZ2h0XG4gIH0gZWxzZSB7Ly/lkKbliJnlsZXnpLrljp/mnaXnmoTmlbDmja5cbiAgICByZXN1bHRzLmltYWdlV2lkdGggPSBvcmlnaW5hbFdpZHRoXG4gICAgcmVzdWx0cy5pbWFnZWhlaWdodCA9IG9yaWdpbmFsSGVpZ2h0XG4gIH1cbiAgcmV0dXJuIHJlc3VsdHNcbn1cblxuZnVuY3Rpb24gd3hQYXJzZVRlbUFycmF5ICh0ZW1BcnJheU5hbWUsIGJpbmROYW1lUmVnLCB0b3RhbCwgdGhhdCkge1xuICB2YXIgYXJyYXkgPSBbXVxuICB2YXIgdGVtRGF0YSA9IHRoYXQuZGF0YVxuICB2YXIgb2JqID0gbnVsbFxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRvdGFsOyBpKyspIHtcbiAgICB2YXIgc2ltQXJyID0gdGVtRGF0YVtiaW5kTmFtZVJlZyArIGldLm5vZGVzXG4gICAgYXJyYXkucHVzaChzaW1BcnIpXG4gIH1cblxuICB0ZW1BcnJheU5hbWUgPSB0ZW1BcnJheU5hbWUgfHwgJ3d4UGFyc2VUZW1BcnJheSdcbiAgb2JqID0gSlNPTi5wYXJzZSgne1wiJyArIHRlbUFycmF5TmFtZSArICdcIjpcIlwifScpXG4gIG9ialt0ZW1BcnJheU5hbWVdID0gYXJyYXlcbiAgdGhhdC5zZXREYXRhKG9iailcbn1cblxuLyoqXG4gKiDphY3nva5lbW9qaXNcbiAqXG4gKi9cblxuZnVuY3Rpb24gZW1vamlzSW5pdCAocmVnID0gJycsIGJhc2VTcmMgPSAnL3d4UGFyc2UvZW1vamlzLycsIGVtb2ppcykge1xuICBIdG1sVG9Kc29uLmVtb2ppc0luaXQocmVnLCBiYXNlU3JjLCBlbW9qaXMpXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICB3eFBhcnNlOiB3eFBhcnNlLFxuICB3eFBhcnNlSW1nVGFwOiB3eFBhcnNlSW1nVGFwLFxuICB3eFBhcnNlVGVtQXJyYXk6IHd4UGFyc2VUZW1BcnJheSxcbiAgZW1vamlzSW5pdDogZW1vamlzSW5pdFxufVxuXG4iXX0=