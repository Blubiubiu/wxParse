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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInd4UGFyc2UuanMiXSwibmFtZXMiOlsicmVhbFdpbmRvd1dpZHRoIiwicmVhbFdpbmRvd0hlaWdodCIsInd4IiwiZ2V0U3lzdGVtSW5mbyIsInN1Y2Nlc3MiLCJyZXMiLCJ3aW5kb3dXaWR0aCIsIndpbmRvd0hlaWdodCIsInd4UGFyc2UiLCJiaW5kTmFtZSIsInR5cGUiLCJkYXRhIiwidGFyZ2V0IiwiaW1hZ2VQYWRkaW5nIiwidGhhdCIsInRyYW5zRGF0YSIsImh0bWwyanNvbiIsImNvbnZlcnRlciIsIkNvbnZlcnRlciIsImh0bWwiLCJtYWtlSHRtbCIsInZpZXciLCJiaW5kRGF0YSIsInNldERhdGEiLCJ3eFBhcnNlSW1nTG9hZCIsInd4UGFyc2VJbWdUYXAiLCJlIiwibm93SW1nVXJsIiwiZGF0YXNldCIsInNyYyIsInRhZ0Zyb20iLCJmcm9tIiwibGVuZ3RoIiwicHJldmlld0ltYWdlIiwiY3VycmVudCIsInVybHMiLCJpbWFnZVVybHMiLCJpZHgiLCJjYWxNb3JlSW1hZ2VJbmZvIiwidGVtRGF0YSIsImltYWdlcyIsInRlbUltYWdlcyIsInJlY2FsIiwid3hBdXRvSW1hZ2VDYWwiLCJkZXRhaWwiLCJ3aWR0aCIsImhlaWdodCIsImluZGV4Iiwia2V5Iiwic3BsaXQiLCJpIiwia2V5VyIsImtleUgiLCJpbWFnZVdpZHRoIiwiaW1hZ2VoZWlnaHQiLCJvcmlnaW5hbFdpZHRoIiwib3JpZ2luYWxIZWlnaHQiLCJhdXRvV2lkdGgiLCJhdXRvSGVpZ2h0IiwicmVzdWx0cyIsInBhZGRpbmciLCJ3eFBhcnNlVGVtQXJyYXkiLCJ0ZW1BcnJheU5hbWUiLCJiaW5kTmFtZVJlZyIsInRvdGFsIiwiYXJyYXkiLCJvYmoiLCJzaW1BcnIiLCJub2RlcyIsInB1c2giLCJKU09OIiwicGFyc2UiLCJlbW9qaXNJbml0IiwicmVnIiwiYmFzZVNyYyIsImVtb2ppcyIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O0FBY0E7Ozs7QUFDQTs7Ozs7O2tOQWZB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LE9BQUwsQ0FBYTJDLEdBQWI7QUFDRDs7QUFFRDs7Ozs7QUFLQSxTQUFTTSxVQUFULEdBQXFFO0FBQUEsTUFBaERDLEdBQWdELHVFQUExQyxFQUEwQztBQUFBLE1BQXRDQyxPQUFzQyx1RUFBNUIsa0JBQTRCO0FBQUEsTUFBUkMsTUFBUTs7QUFDbkUsc0JBQVdILFVBQVgsQ0FBc0JDLEdBQXRCLEVBQTJCQyxPQUEzQixFQUFvQ0MsTUFBcEM7QUFDRDs7QUFFREMsT0FBT0MsT0FBUCxHQUFpQjtBQUNmckUsV0FBU0EsT0FETTtBQUVmaUIsaUJBQWVBLGFBRkE7QUFHZm9DLG1CQUFpQkEsZUFIRjtBQUlmVyxjQUFZQTtBQUpHLENBQWpCIiwiZmlsZSI6Ind4UGFyc2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogYXV0aG9yOiBEaSAo5b6u5L+h5bCP56iL5bqP5byA5Y+R5bel56iL5biIKVxyXG4gKiBvcmdhbml6YXRpb246IFdlQXBwRGV2KOW+ruS/oeWwj+eoi+W6j+W8gOWPkeiuuuWdmykoaHR0cDovL3dlYXBwZGV2LmNvbSlcclxuICogICAgICAgICAgICAgICDlnoLnm7Tlvq7kv6HlsI/nqIvluo/lvIDlj5HkuqTmtYHnpL7ljLpcclxuICpcclxuICogZ2l0aHVi5Zyw5Z2AOiBodHRwczovL2dpdGh1Yi5jb20vaWNpbmR5L3d4UGFyc2VcclxuICpcclxuICogZm9yOiDlvq7kv6HlsI/nqIvluo/lr4zmlofmnKzop6PmnpBcclxuICogZGV0YWlsIDogaHR0cDovL3dlYXBwZGV2LmNvbS90L3d4cGFyc2UtYWxwaGEwLTEtaHRtbC1tYXJrZG93bi8xODRcclxuICovXHJcblxyXG4vKipcclxuICogdXRpbHPlh73mlbDlvJXlhaVcclxuICoqL1xyXG5pbXBvcnQgc2hvd2Rvd24gZnJvbSAnLi9zaG93ZG93bi5qcydcclxuaW1wb3J0IEh0bWxUb0pzb24gZnJvbSAnLi9odG1sMmpzb24uanMnXHJcblxyXG4vKipcclxuICog6YWN572u5Y+K5YWs5pyJ5bGe5oCnXHJcbiAqKi9cclxudmFyIHJlYWxXaW5kb3dXaWR0aCA9IDBcclxudmFyIHJlYWxXaW5kb3dIZWlnaHQgPSAwXHJcbnd4LmdldFN5c3RlbUluZm8oe1xyXG4gIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXMpIHtcclxuICAgIHJlYWxXaW5kb3dXaWR0aCA9IHJlcy53aW5kb3dXaWR0aFxyXG4gICAgcmVhbFdpbmRvd0hlaWdodCA9IHJlcy53aW5kb3dIZWlnaHRcclxuICB9XHJcbn0pXHJcblxyXG4vKipcclxuICog5Li75Ye95pWw5YWl5Y+j5Yy6XHJcbiAqKi9cclxuZnVuY3Rpb24gd3hQYXJzZSAoYmluZE5hbWUgPSAnd3hQYXJzZURhdGEnLCB0eXBlID0gJ2h0bWwnLCBkYXRhID0gJzxkaXYgY2xhc3M9XCJjb2xvcjpyZWQ7XCI+5pWw5o2u5LiN6IO95Li656m6PC9kaXY+JywgdGFyZ2V0LCBpbWFnZVBhZGRpbmcpIHtcclxuICB2YXIgdGhhdCA9IHRhcmdldFxyXG4gIHZhciB0cmFuc0RhdGEgPSB7fS8v5a2Y5pS+6L2s5YyW5ZCO55qE5pWw5o2uXHJcbiAgaWYgKHR5cGUgPT0gJ2h0bWwnKSB7XHJcbiAgICB0cmFuc0RhdGEgPSBIdG1sVG9Kc29uLmh0bWwyanNvbihkYXRhLCBiaW5kTmFtZSlcclxuICAgIC8vY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkodHJhbnNEYXRhLCAnICcsICcgJykpXHJcbiAgfSBlbHNlIGlmICh0eXBlID09ICdtZCcgfHwgdHlwZSA9PSAnbWFya2Rvd24nKSB7XHJcbiAgICB2YXIgY29udmVydGVyID0gbmV3IHNob3dkb3duLkNvbnZlcnRlcigpXHJcbiAgICB2YXIgaHRtbCA9IGNvbnZlcnRlci5tYWtlSHRtbChkYXRhKVxyXG4gICAgdHJhbnNEYXRhID0gSHRtbFRvSnNvbi5odG1sMmpzb24oaHRtbCwgYmluZE5hbWUpXHJcbiAgICAvL2NvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHRyYW5zRGF0YSwgJyAnLCAnICcpKVxyXG4gIH1cclxuICB0cmFuc0RhdGEudmlldyA9IHt9XHJcbiAgdHJhbnNEYXRhLnZpZXcuaW1hZ2VQYWRkaW5nID0gMFxyXG4gIGlmICh0eXBlb2YoaW1hZ2VQYWRkaW5nKSAhPSAndW5kZWZpbmVkJykge1xyXG4gICAgdHJhbnNEYXRhLnZpZXcuaW1hZ2VQYWRkaW5nID0gaW1hZ2VQYWRkaW5nXHJcbiAgfVxyXG4gIHZhciBiaW5kRGF0YSA9IHt9XHJcbiAgYmluZERhdGFbYmluZE5hbWVdID0gdHJhbnNEYXRhXHJcbiAgdGhhdC5zZXREYXRhKGJpbmREYXRhKVxyXG4gIHRoYXQuYmluZERhdGEgPSBiaW5kRGF0YVxyXG4gIHRoYXQud3hQYXJzZUltZ0xvYWQgPSB3eFBhcnNlSW1nTG9hZFxyXG4gIHRoYXQud3hQYXJzZUltZ1RhcCA9IHd4UGFyc2VJbWdUYXBcclxuXHJcbiAgLy/mlrDlop5cclxuICBiaW5kRGF0YS53eFBhcnNlSW1nTG9hZCA9IHd4UGFyc2VJbWdMb2FkXHJcbiAgYmluZERhdGEud3hQYXJzZUltZ1RhcCA9IHd4UGFyc2VJbWdUYXBcclxuXHJcbiAgcmV0dXJuIGJpbmREYXRhXHJcbn1cclxuXHJcbi8vIOWbvueJh+eCueWHu+S6i+S7tlxyXG5mdW5jdGlvbiB3eFBhcnNlSW1nVGFwIChlLCBiaW5kRGF0YSkge1xyXG4gIHZhciB0aGF0ID0gdGhpc1xyXG4gIHZhciBub3dJbWdVcmwgPSBlLnRhcmdldC5kYXRhc2V0LnNyY1xyXG4gIHZhciB0YWdGcm9tID0gZS50YXJnZXQuZGF0YXNldC5mcm9tXHJcblxyXG4gIGlmICh0eXBlb2YgKHRhZ0Zyb20pICE9ICd1bmRlZmluZWQnICYmIHRhZ0Zyb20ubGVuZ3RoID4gMCkge1xyXG4gICAgd3gucHJldmlld0ltYWdlKHtcclxuICAgICAgY3VycmVudDogbm93SW1nVXJsLCAvLyDlvZPliY3mmL7npLrlm77niYfnmoRodHRw6ZO+5o6lXHJcbiAgICAgIHVybHM6IGJpbmREYXRhW3RhZ0Zyb21dLmltYWdlVXJscyAvLyDpnIDopoHpooTop4jnmoTlm77niYdodHRw6ZO+5o6l5YiX6KGoXHJcbiAgICB9KVxyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIOWbvueJh+inhuinieWuvemrmOiuoeeul+WHveaVsOWMulxyXG4gKiovXHJcbmZ1bmN0aW9uIHd4UGFyc2VJbWdMb2FkIChlKSB7XHJcbiAgdmFyIHRoYXQgPSB0aGlzXHJcbiAgdmFyIHRhZ0Zyb20gPSBlLnRhcmdldC5kYXRhc2V0LmZyb21cclxuICB2YXIgaWR4ID0gZS50YXJnZXQuZGF0YXNldC5pZHhcclxuICBpZiAodHlwZW9mICh0YWdGcm9tKSAhPSAndW5kZWZpbmVkJyAmJiB0YWdGcm9tLmxlbmd0aCA+IDApIHtcclxuICAgIGNhbE1vcmVJbWFnZUluZm8oZSwgaWR4LCB0aGF0LCB0YWdGcm9tKVxyXG4gIH1cclxufVxyXG5cclxuLy8g5YGH5b6q546v6I635Y+W6K6h566X5Zu+54mH6KeG6KeJ5pyA5L2z5a696auYXHJcbmZ1bmN0aW9uIGNhbE1vcmVJbWFnZUluZm8gKGUsIGlkeCwgdGhhdCwgYmluZE5hbWUpIHtcclxuICB2YXIgdGVtRGF0YSA9IHRoYXQuZGF0YVtiaW5kTmFtZV1cclxuICBpZiAoIXRlbURhdGEgfHwgdGVtRGF0YS5pbWFnZXMubGVuZ3RoID09IDApIHtcclxuICAgIHJldHVyblxyXG4gIH1cclxuICB2YXIgdGVtSW1hZ2VzID0gdGVtRGF0YS5pbWFnZXNcclxuICAvL+WboOS4uuaXoOazleiOt+WPlnZpZXflrr3luqYg6ZyA6KaB6Ieq5a6a5LmJcGFkZGluZ+i/m+ihjOiuoeeul++8jOeojeWQjuWkhOeQhlxyXG4gIHZhciByZWNhbCA9IHd4QXV0b0ltYWdlQ2FsKGUuZGV0YWlsLndpZHRoLCBlLmRldGFpbC5oZWlnaHQsIHRoYXQsIGJpbmROYW1lKVxyXG4gIC8vIHRlbUltYWdlc1tpZHhdLndpZHRoID0gcmVjYWwuaW1hZ2VXaWR0aDtcclxuICAvLyB0ZW1JbWFnZXNbaWR4XS5oZWlnaHQgPSByZWNhbC5pbWFnZWhlaWdodDtcclxuICAvLyB0ZW1EYXRhLmltYWdlcyA9IHRlbUltYWdlcztcclxuICAvLyB2YXIgYmluZERhdGEgPSB7fTtcclxuICAvLyBiaW5kRGF0YVtiaW5kTmFtZV0gPSB0ZW1EYXRhO1xyXG4gIC8vIHRoYXQuc2V0RGF0YShiaW5kRGF0YSk7XHJcbiAgdmFyIGluZGV4ID0gdGVtSW1hZ2VzW2lkeF0uaW5kZXhcclxuICB2YXIga2V5ID0gYCR7YmluZE5hbWV9YFxyXG4gIGZvciAodmFyIGkgb2YgaW5kZXguc3BsaXQoJy4nKSkga2V5ICs9IGAubm9kZXNbJHtpfV1gXHJcbiAgdmFyIGtleVcgPSBrZXkgKyAnLndpZHRoJ1xyXG4gIHZhciBrZXlIID0ga2V5ICsgJy5oZWlnaHQnXHJcbiAgdGhhdC5zZXREYXRhKHtcclxuICAgIFtrZXlXXTogcmVjYWwuaW1hZ2VXaWR0aCxcclxuICAgIFtrZXlIXTogcmVjYWwuaW1hZ2VoZWlnaHQsXHJcbiAgfSlcclxufVxyXG5cclxuLy8g6K6h566X6KeG6KeJ5LyY5YWI55qE5Zu+54mH5a696auYXHJcbmZ1bmN0aW9uIHd4QXV0b0ltYWdlQ2FsIChvcmlnaW5hbFdpZHRoLCBvcmlnaW5hbEhlaWdodCwgdGhhdCwgYmluZE5hbWUpIHtcclxuICAvL+iOt+WPluWbvueJh+eahOWOn+Wni+mVv+WuvVxyXG4gIHZhciB3aW5kb3dXaWR0aCA9IDAsIHdpbmRvd0hlaWdodCA9IDBcclxuICB2YXIgYXV0b1dpZHRoID0gMCwgYXV0b0hlaWdodCA9IDBcclxuICB2YXIgcmVzdWx0cyA9IHt9XHJcbiAgdmFyIHBhZGRpbmcgPSB0aGF0LmRhdGFbYmluZE5hbWVdLnZpZXcuaW1hZ2VQYWRkaW5nXHJcbiAgd2luZG93V2lkdGggPSByZWFsV2luZG93V2lkdGggLSAyICogcGFkZGluZ1xyXG4gIHdpbmRvd0hlaWdodCA9IHJlYWxXaW5kb3dIZWlnaHRcclxuICAvL+WIpOaWreaMieeFp+mCo+enjeaWueW8j+i/m+ihjOe8qeaUvlxyXG4gIC8vIGNvbnNvbGUubG9nKFwid2luZG93V2lkdGhcIiArIHdpbmRvd1dpZHRoKTtcclxuICBpZiAob3JpZ2luYWxXaWR0aCA+IHdpbmRvd1dpZHRoKSB7Ly/lnKjlm77niYd3aWR0aOWkp+S6juaJi+acuuWxj+W5lXdpZHRo5pe25YCZXHJcbiAgICBhdXRvV2lkdGggPSB3aW5kb3dXaWR0aFxyXG4gICAgLy8gY29uc29sZS5sb2coXCJhdXRvV2lkdGhcIiArIGF1dG9XaWR0aCk7XHJcbiAgICBhdXRvSGVpZ2h0ID0gKGF1dG9XaWR0aCAqIG9yaWdpbmFsSGVpZ2h0KSAvIG9yaWdpbmFsV2lkdGhcclxuICAgIC8vIGNvbnNvbGUubG9nKFwiYXV0b0hlaWdodFwiICsgYXV0b0hlaWdodCk7XHJcbiAgICByZXN1bHRzLmltYWdlV2lkdGggPSBhdXRvV2lkdGhcclxuICAgIHJlc3VsdHMuaW1hZ2VoZWlnaHQgPSBhdXRvSGVpZ2h0XHJcbiAgfSBlbHNlIHsvL+WQpuWImeWxleekuuWOn+adpeeahOaVsOaNrlxyXG4gICAgcmVzdWx0cy5pbWFnZVdpZHRoID0gb3JpZ2luYWxXaWR0aFxyXG4gICAgcmVzdWx0cy5pbWFnZWhlaWdodCA9IG9yaWdpbmFsSGVpZ2h0XHJcbiAgfVxyXG4gIHJldHVybiByZXN1bHRzXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHd4UGFyc2VUZW1BcnJheSAodGVtQXJyYXlOYW1lLCBiaW5kTmFtZVJlZywgdG90YWwsIHRoYXQpIHtcclxuICB2YXIgYXJyYXkgPSBbXVxyXG4gIHZhciB0ZW1EYXRhID0gdGhhdC5kYXRhXHJcbiAgdmFyIG9iaiA9IG51bGxcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRvdGFsOyBpKyspIHtcclxuICAgIHZhciBzaW1BcnIgPSB0ZW1EYXRhW2JpbmROYW1lUmVnICsgaV0ubm9kZXNcclxuICAgIGFycmF5LnB1c2goc2ltQXJyKVxyXG4gIH1cclxuXHJcbiAgdGVtQXJyYXlOYW1lID0gdGVtQXJyYXlOYW1lIHx8ICd3eFBhcnNlVGVtQXJyYXknXHJcbiAgb2JqID0gSlNPTi5wYXJzZSgne1wiJyArIHRlbUFycmF5TmFtZSArICdcIjpcIlwifScpXHJcbiAgb2JqW3RlbUFycmF5TmFtZV0gPSBhcnJheVxyXG4gIHRoYXQuc2V0RGF0YShvYmopXHJcbn1cclxuXHJcbi8qKlxyXG4gKiDphY3nva5lbW9qaXNcclxuICpcclxuICovXHJcblxyXG5mdW5jdGlvbiBlbW9qaXNJbml0IChyZWcgPSAnJywgYmFzZVNyYyA9ICcvd3hQYXJzZS9lbW9qaXMvJywgZW1vamlzKSB7XHJcbiAgSHRtbFRvSnNvbi5lbW9qaXNJbml0KHJlZywgYmFzZVNyYywgZW1vamlzKVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICB3eFBhcnNlOiB3eFBhcnNlLFxyXG4gIHd4UGFyc2VJbWdUYXA6IHd4UGFyc2VJbWdUYXAsXHJcbiAgd3hQYXJzZVRlbUFycmF5OiB3eFBhcnNlVGVtQXJyYXksXHJcbiAgZW1vamlzSW5pdDogZW1vamlzSW5pdFxyXG59XHJcblxyXG4iXX0=