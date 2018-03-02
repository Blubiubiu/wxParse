'use strict';

/**
 * html2Json 改造来自: https://github.com/Jxck/html2json
 *
 *
 * author: Di (微信小程序开发工程师)
 * organization: WeAppDev(微信小程序开发论坛)(http://weappdev.com)
 *               垂直微信小程序开发交流社区
 *
 * github地址: https://github.com/icindy/wxParse
 *
 * for: 微信小程序富文本解析
 * detail : http://weappdev.com/t/wxparse-alpha0-1-html-markdown/184
 */

var __placeImgeUrlHttps = "https";
var __emojisReg = '';
var __emojisBaseSrc = '';
var __emojis = {};
var wxDiscode = require('./wxDiscode.js');
var HTMLParser = require('./htmlparser.js');
// Empty Elements - HTML 5
var empty = makeMap("area,base,basefont,br,col,frame,hr,img,input,link,meta,param,embed,command,keygen,source,track,wbr");
// Block Elements - HTML 5
var block = makeMap("br,a,code,address,article,applet,aside,audio,blockquote,button,canvas,center,dd,del,dir,div,dl,dt,fieldset,figcaption,figure,footer,form,frameset,h1,h2,h3,h4,h5,h6,header,hgroup,hr,iframe,ins,isindex,li,map,menu,noframes,noscript,object,ol,output,p,pre,section,script,table,tbody,td,tfoot,th,thead,tr,ul,video");

// Inline Elements - HTML 5
var inline = makeMap("abbr,acronym,applet,b,basefont,bdo,big,button,cite,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,textarea,tt,u,var");

// Elements that you can, intentionally, leave open
// (and which close themselves)
var closeSelf = makeMap("colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr");

// Attributes that have their values filled in disabled="disabled"
var fillAttrs = makeMap("checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected");

// Special Elements (can contain anything)
var special = makeMap("wxxxcode-style,script,style,view,scroll-view,block");
function makeMap(str) {
    var obj = {},
        items = str.split(",");
    for (var i = 0; i < items.length; i++) {
        obj[items[i]] = true;
    }return obj;
}

function q(v) {
    return '"' + v + '"';
}

function removeDOCTYPE(html) {
    return html.replace(/<\?xml.*\?>\n/, '').replace(/<.*!doctype.*\>\n/, '').replace(/<.*!DOCTYPE.*\>\n/, '');
}

function trimHtml(html) {
    return html.replace(/\r?\n+/g, '').replace(/<!--.*?-->/ig, '').replace(/\/\*.*?\*\//ig, '').replace(/[ ]+</ig, '<');
}

function html2json(html, bindName) {
    //处理字符串
    html = removeDOCTYPE(html);
    html = trimHtml(html);
    html = wxDiscode.strDiscode(html);
    //生成node节点
    var bufArray = [];
    var results = {
        node: bindName,
        nodes: [],
        images: [],
        imageUrls: []
    };
    var index = 0;
    HTMLParser(html, {
        start: function start(tag, attrs, unary) {
            //debug(tag, attrs, unary);
            // node for this element
            var node = {
                node: 'element',
                tag: tag
            };

            if (bufArray.length === 0) {
                node.index = index.toString();
                index += 1;
            } else {
                var parent = bufArray[0];
                if (parent.nodes === undefined) {
                    parent.nodes = [];
                }
                node.index = parent.index + '.' + parent.nodes.length;
            }

            if (block[tag]) {
                node.tagType = "block";
            } else if (inline[tag]) {
                node.tagType = "inline";
            } else if (closeSelf[tag]) {
                node.tagType = "closeSelf";
            }

            if (attrs.length !== 0) {
                node.attr = attrs.reduce(function (pre, attr) {
                    var name = attr.name;
                    var value = attr.value;
                    if (name == 'class') {
                        //console.dir(value);
                        //  value = value.join("")
                        node.classStr = value;
                    }
                    // has multi attibutes
                    // make it array of attribute
                    if (name == 'style') {
                        //console.dir(value);
                        //  value = value.join("")
                        node.styleStr = value;
                    }
                    if (value.match(/ /)) {
                        value = value.split(' ');
                    }

                    // if attr already exists
                    // merge it
                    if (pre[name]) {
                        if (Array.isArray(pre[name])) {
                            // already array, push to last
                            pre[name].push(value);
                        } else {
                            // single value, make it array
                            pre[name] = [pre[name], value];
                        }
                    } else {
                        // not exist, put it
                        pre[name] = value;
                    }

                    return pre;
                }, {});
            }

            //对img添加额外数据
            if (node.tag === 'img') {
                node.imgIndex = results.images.length;
                var imgUrl = node.attr.src;
                if (imgUrl[0] == '') {
                    imgUrl.splice(0, 1);
                }
                imgUrl = wxDiscode.urlToHttpUrl(imgUrl, __placeImgeUrlHttps);
                node.attr.src = imgUrl;
                node.from = bindName;
                results.images.push(node);
                results.imageUrls.push(imgUrl);
            }

            //对p便签添加margin
            if (node.tag === 'p') {
                node.styleStr += ';margin-top: 20rpx;';
            }

            // 处理font标签样式属性
            if (node.tag === 'font') {
                var fontSize = ['x-small', 'small', 'medium', 'large', 'x-large', 'xx-large', '-webkit-xxx-large'];
                var styleAttrs = {
                    'color': 'color',
                    'face': 'font-family',
                    'size': 'font-size'
                };
                if (!node.attr.style) node.attr.style = [];
                if (!node.styleStr) node.styleStr = '';
                for (var key in styleAttrs) {
                    if (node.attr[key]) {
                        var value = key === 'size' ? fontSize[node.attr[key] - 1] : node.attr[key];
                        node.attr.style.push(styleAttrs[key]);
                        node.attr.style.push(value);
                        node.styleStr += styleAttrs[key] + ': ' + value + ';';
                    }
                }
            }

            //临时记录source资源
            if (node.tag === 'source') {
                results.source = node.attr.src;
            }

            if (unary) {
                // if this tag doesn't have end tag
                // like <img src="hoge.png"/>
                // add to parents
                var parent = bufArray[0] || results;
                if (parent.nodes === undefined) {
                    parent.nodes = [];
                }
                parent.nodes.push(node);
            } else {
                bufArray.unshift(node);
            }
        },
        end: function end(tag) {
            //debug(tag);
            // merge into parent tag
            var node = bufArray.shift();
            if (node.tag !== tag) console.error('invalid state: mismatch end tag');

            //当有缓存source资源时于于video补上src资源
            if (node.tag === 'video' && results.source) {
                node.attr.src = results.source;
                delete results.source;
            }

            if (bufArray.length === 0) {
                results.nodes.push(node);
            } else {
                var parent = bufArray[0];
                if (parent.nodes === undefined) {
                    parent.nodes = [];
                }
                parent.nodes.push(node);
            }
        },
        chars: function chars(text) {
            //debug(text);
            var node = {
                node: 'text',
                text: text,
                textArray: transEmojiStr(text)
            };

            if (bufArray.length === 0) {
                node.index = index.toString();
                index += 1;
                results.nodes.push(node);
            } else {
                var parent = bufArray[0];
                if (parent.nodes === undefined) {
                    parent.nodes = [];
                }
                node.index = parent.index + '.' + parent.nodes.length;
                parent.nodes.push(node);
            }
        },
        comment: function comment(text) {
            //debug(text);
            // var node = {
            //     node: 'comment',
            //     text: text,
            // };
            // var parent = bufArray[0];
            // if (parent.nodes === undefined) {
            //     parent.nodes = [];
            // }
            // parent.nodes.push(node);
        }
    });
    return results;
};

function transEmojiStr(str) {
    // var eReg = new RegExp("["+__reg+' '+"]");
    //   str = str.replace(/\[([^\[\]]+)\]/g,':$1:')

    var emojiObjs = [];
    //如果正则表达式为空
    if (__emojisReg.length == 0 || !__emojis) {
        var emojiObj = {};
        emojiObj.node = "text";
        emojiObj.text = str;
        array = [emojiObj];
        return array;
    }
    //这个地方需要调整
    str = str.replace(/\[([^\[\]]+)\]/g, ':$1:');
    var eReg = new RegExp("[:]");
    var array = str.split(eReg);
    for (var i = 0; i < array.length; i++) {
        var ele = array[i];
        var emojiObj = {};
        if (__emojis[ele]) {
            emojiObj.node = "element";
            emojiObj.tag = "emoji";
            emojiObj.text = __emojis[ele];
            emojiObj.baseSrc = __emojisBaseSrc;
        } else {
            emojiObj.node = "text";
            emojiObj.text = ele;
        }
        emojiObjs.push(emojiObj);
    }

    return emojiObjs;
}

function emojisInit() {
    var reg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    var baseSrc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "/wxParse/emojis/";
    var emojis = arguments[2];

    __emojisReg = reg;
    __emojisBaseSrc = baseSrc;
    __emojis = emojis;
}

module.exports = {
    html2json: html2json,
    emojisInit: emojisInit
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0bWwyanNvbi5qcyJdLCJuYW1lcyI6WyJfX3BsYWNlSW1nZVVybEh0dHBzIiwiX19lbW9qaXNSZWciLCJfX2Vtb2ppc0Jhc2VTcmMiLCJfX2Vtb2ppcyIsInd4RGlzY29kZSIsInJlcXVpcmUiLCJIVE1MUGFyc2VyIiwiZW1wdHkiLCJtYWtlTWFwIiwiYmxvY2siLCJpbmxpbmUiLCJjbG9zZVNlbGYiLCJmaWxsQXR0cnMiLCJzcGVjaWFsIiwic3RyIiwib2JqIiwiaXRlbXMiLCJzcGxpdCIsImkiLCJsZW5ndGgiLCJxIiwidiIsInJlbW92ZURPQ1RZUEUiLCJodG1sIiwicmVwbGFjZSIsInRyaW1IdG1sIiwiaHRtbDJqc29uIiwiYmluZE5hbWUiLCJzdHJEaXNjb2RlIiwiYnVmQXJyYXkiLCJyZXN1bHRzIiwibm9kZSIsIm5vZGVzIiwiaW1hZ2VzIiwiaW1hZ2VVcmxzIiwiaW5kZXgiLCJzdGFydCIsInRhZyIsImF0dHJzIiwidW5hcnkiLCJ0b1N0cmluZyIsInBhcmVudCIsInVuZGVmaW5lZCIsInRhZ1R5cGUiLCJhdHRyIiwicmVkdWNlIiwicHJlIiwibmFtZSIsInZhbHVlIiwiY2xhc3NTdHIiLCJzdHlsZVN0ciIsIm1hdGNoIiwiQXJyYXkiLCJpc0FycmF5IiwicHVzaCIsImltZ0luZGV4IiwiaW1nVXJsIiwic3JjIiwic3BsaWNlIiwidXJsVG9IdHRwVXJsIiwiZnJvbSIsImZvbnRTaXplIiwic3R5bGVBdHRycyIsInN0eWxlIiwia2V5Iiwic291cmNlIiwidW5zaGlmdCIsImVuZCIsInNoaWZ0IiwiY29uc29sZSIsImVycm9yIiwiY2hhcnMiLCJ0ZXh0IiwidGV4dEFycmF5IiwidHJhbnNFbW9qaVN0ciIsImNvbW1lbnQiLCJlbW9qaU9ianMiLCJlbW9qaU9iaiIsImFycmF5IiwiZVJlZyIsIlJlZ0V4cCIsImVsZSIsImJhc2VTcmMiLCJlbW9qaXNJbml0IiwicmVnIiwiZW1vamlzIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7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LHFCQUFTOUMsSUFBVCxHQUFnQixTQUFoQjtBQUNBOEMscUJBQVN4QyxHQUFULEdBQWUsT0FBZjtBQUNBd0MscUJBQVNMLElBQVQsR0FBZ0JyRSxTQUFTOEUsR0FBVCxDQUFoQjtBQUNBSixxQkFBU0ssT0FBVCxHQUFrQmhGLGVBQWxCO0FBQ0QsU0FMRCxNQUtLO0FBQ0gyRSxxQkFBUzlDLElBQVQsR0FBZ0IsTUFBaEI7QUFDQThDLHFCQUFTTCxJQUFULEdBQWdCUyxHQUFoQjtBQUNEO0FBQ0RMLGtCQUFVdEIsSUFBVixDQUFldUIsUUFBZjtBQUNEOztBQUVELFdBQU9ELFNBQVA7QUFDRDs7QUFFRCxTQUFTTyxVQUFULEdBQTZEO0FBQUEsUUFBekNDLEdBQXlDLHVFQUFyQyxFQUFxQztBQUFBLFFBQWxDRixPQUFrQyx1RUFBMUIsa0JBQTBCO0FBQUEsUUFBUEcsTUFBTzs7QUFDekRwRixrQkFBY21GLEdBQWQ7QUFDQWxGLHNCQUFnQmdGLE9BQWhCO0FBQ0EvRSxlQUFTa0YsTUFBVDtBQUNIOztBQUVEQyxPQUFPQyxPQUFQLEdBQWlCO0FBQ2I3RCxlQUFXQSxTQURFO0FBRWJ5RCxnQkFBV0E7QUFGRSxDQUFqQiIsImZpbGUiOiJodG1sMmpzb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIGh0bWwySnNvbiDmlLnpgKDmnaXoh6o6IGh0dHBzOi8vZ2l0aHViLmNvbS9KeGNrL2h0bWwyanNvblxuICpcbiAqXG4gKiBhdXRob3I6IERpICjlvq7kv6HlsI/nqIvluo/lvIDlj5Hlt6XnqIvluIgpXG4gKiBvcmdhbml6YXRpb246IFdlQXBwRGV2KOW+ruS/oeWwj+eoi+W6j+W8gOWPkeiuuuWdmykoaHR0cDovL3dlYXBwZGV2LmNvbSlcbiAqICAgICAgICAgICAgICAg5Z6C55u05b6u5L+h5bCP56iL5bqP5byA5Y+R5Lqk5rWB56S+5Yy6XG4gKlxuICogZ2l0aHVi5Zyw5Z2AOiBodHRwczovL2dpdGh1Yi5jb20vaWNpbmR5L3d4UGFyc2VcbiAqXG4gKiBmb3I6IOW+ruS/oeWwj+eoi+W6j+WvjOaWh+acrOino+aekFxuICogZGV0YWlsIDogaHR0cDovL3dlYXBwZGV2LmNvbS90L3d4cGFyc2UtYWxwaGEwLTEtaHRtbC1tYXJrZG93bi8xODRcbiAqL1xuXG52YXIgX19wbGFjZUltZ2VVcmxIdHRwcyA9IFwiaHR0cHNcIjtcbnZhciBfX2Vtb2ppc1JlZyA9ICcnO1xudmFyIF9fZW1vamlzQmFzZVNyYyA9ICcnO1xudmFyIF9fZW1vamlzID0ge307XG52YXIgd3hEaXNjb2RlID0gcmVxdWlyZSgnLi93eERpc2NvZGUuanMnKTtcbnZhciBIVE1MUGFyc2VyID0gcmVxdWlyZSgnLi9odG1scGFyc2VyLmpzJyk7XG4vLyBFbXB0eSBFbGVtZW50cyAtIEhUTUwgNVxudmFyIGVtcHR5ID0gbWFrZU1hcChcImFyZWEsYmFzZSxiYXNlZm9udCxicixjb2wsZnJhbWUsaHIsaW1nLGlucHV0LGxpbmssbWV0YSxwYXJhbSxlbWJlZCxjb21tYW5kLGtleWdlbixzb3VyY2UsdHJhY2ssd2JyXCIpO1xuLy8gQmxvY2sgRWxlbWVudHMgLSBIVE1MIDVcbnZhciBibG9jayA9IG1ha2VNYXAoXCJicixhLGNvZGUsYWRkcmVzcyxhcnRpY2xlLGFwcGxldCxhc2lkZSxhdWRpbyxibG9ja3F1b3RlLGJ1dHRvbixjYW52YXMsY2VudGVyLGRkLGRlbCxkaXIsZGl2LGRsLGR0LGZpZWxkc2V0LGZpZ2NhcHRpb24sZmlndXJlLGZvb3Rlcixmb3JtLGZyYW1lc2V0LGgxLGgyLGgzLGg0LGg1LGg2LGhlYWRlcixoZ3JvdXAsaHIsaWZyYW1lLGlucyxpc2luZGV4LGxpLG1hcCxtZW51LG5vZnJhbWVzLG5vc2NyaXB0LG9iamVjdCxvbCxvdXRwdXQscCxwcmUsc2VjdGlvbixzY3JpcHQsdGFibGUsdGJvZHksdGQsdGZvb3QsdGgsdGhlYWQsdHIsdWwsdmlkZW9cIik7XG5cbi8vIElubGluZSBFbGVtZW50cyAtIEhUTUwgNVxudmFyIGlubGluZSA9IG1ha2VNYXAoXCJhYmJyLGFjcm9ueW0sYXBwbGV0LGIsYmFzZWZvbnQsYmRvLGJpZyxidXR0b24sY2l0ZSxkZWwsZGZuLGVtLGZvbnQsaSxpZnJhbWUsaW1nLGlucHV0LGlucyxrYmQsbGFiZWwsbWFwLG9iamVjdCxxLHMsc2FtcCxzY3JpcHQsc2VsZWN0LHNtYWxsLHNwYW4sc3RyaWtlLHN0cm9uZyxzdWIsc3VwLHRleHRhcmVhLHR0LHUsdmFyXCIpO1xuXG4vLyBFbGVtZW50cyB0aGF0IHlvdSBjYW4sIGludGVudGlvbmFsbHksIGxlYXZlIG9wZW5cbi8vIChhbmQgd2hpY2ggY2xvc2UgdGhlbXNlbHZlcylcbnZhciBjbG9zZVNlbGYgPSBtYWtlTWFwKFwiY29sZ3JvdXAsZGQsZHQsbGksb3B0aW9ucyxwLHRkLHRmb290LHRoLHRoZWFkLHRyXCIpO1xuXG4vLyBBdHRyaWJ1dGVzIHRoYXQgaGF2ZSB0aGVpciB2YWx1ZXMgZmlsbGVkIGluIGRpc2FibGVkPVwiZGlzYWJsZWRcIlxudmFyIGZpbGxBdHRycyA9IG1ha2VNYXAoXCJjaGVja2VkLGNvbXBhY3QsZGVjbGFyZSxkZWZlcixkaXNhYmxlZCxpc21hcCxtdWx0aXBsZSxub2hyZWYsbm9yZXNpemUsbm9zaGFkZSxub3dyYXAscmVhZG9ubHksc2VsZWN0ZWRcIik7XG5cbi8vIFNwZWNpYWwgRWxlbWVudHMgKGNhbiBjb250YWluIGFueXRoaW5nKVxudmFyIHNwZWNpYWwgPSBtYWtlTWFwKFwid3h4eGNvZGUtc3R5bGUsc2NyaXB0LHN0eWxlLHZpZXcsc2Nyb2xsLXZpZXcsYmxvY2tcIik7XG5mdW5jdGlvbiBtYWtlTWFwKHN0cikge1xuICAgIHZhciBvYmogPSB7fSwgaXRlbXMgPSBzdHIuc3BsaXQoXCIsXCIpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpKyspXG4gICAgICAgIG9ialtpdGVtc1tpXV0gPSB0cnVlO1xuICAgIHJldHVybiBvYmo7XG59XG5cbmZ1bmN0aW9uIHEodikge1xuICAgIHJldHVybiAnXCInICsgdiArICdcIic7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZURPQ1RZUEUoaHRtbCkge1xuICAgIHJldHVybiBodG1sXG4gICAgICAgIC5yZXBsYWNlKC88XFw/eG1sLipcXD8+XFxuLywgJycpXG4gICAgICAgIC5yZXBsYWNlKC88LiohZG9jdHlwZS4qXFw+XFxuLywgJycpXG4gICAgICAgIC5yZXBsYWNlKC88LiohRE9DVFlQRS4qXFw+XFxuLywgJycpO1xufVxuXG5mdW5jdGlvbiB0cmltSHRtbChodG1sKSB7XG4gIHJldHVybiBodG1sXG4gICAgICAgIC5yZXBsYWNlKC9cXHI/XFxuKy9nLCAnJylcbiAgICAgICAgLnJlcGxhY2UoLzwhLS0uKj8tLT4vaWcsICcnKVxuICAgICAgICAucmVwbGFjZSgvXFwvXFwqLio/XFwqXFwvL2lnLCAnJylcbiAgICAgICAgLnJlcGxhY2UoL1sgXSs8L2lnLCAnPCcpXG59XG5cblxuZnVuY3Rpb24gaHRtbDJqc29uKGh0bWwsIGJpbmROYW1lKSB7XG4gICAgLy/lpITnkIblrZfnrKbkuLJcbiAgICBodG1sID0gcmVtb3ZlRE9DVFlQRShodG1sKTtcbiAgICBodG1sID0gdHJpbUh0bWwoaHRtbCk7XG4gICAgaHRtbCA9IHd4RGlzY29kZS5zdHJEaXNjb2RlKGh0bWwpO1xuICAgIC8v55Sf5oiQbm9kZeiKgueCuVxuICAgIHZhciBidWZBcnJheSA9IFtdO1xuICAgIHZhciByZXN1bHRzID0ge1xuICAgICAgICBub2RlOiBiaW5kTmFtZSxcbiAgICAgICAgbm9kZXM6IFtdLFxuICAgICAgICBpbWFnZXM6W10sXG4gICAgICAgIGltYWdlVXJsczpbXVxuICAgIH07XG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICBIVE1MUGFyc2VyKGh0bWwsIHtcbiAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uICh0YWcsIGF0dHJzLCB1bmFyeSkge1xuICAgICAgICAgICAgLy9kZWJ1Zyh0YWcsIGF0dHJzLCB1bmFyeSk7XG4gICAgICAgICAgICAvLyBub2RlIGZvciB0aGlzIGVsZW1lbnRcbiAgICAgICAgICAgIHZhciBub2RlID0ge1xuICAgICAgICAgICAgICAgIG5vZGU6ICdlbGVtZW50JyxcbiAgICAgICAgICAgICAgICB0YWc6IHRhZyxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChidWZBcnJheS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBub2RlLmluZGV4ID0gaW5kZXgudG9TdHJpbmcoKVxuICAgICAgICAgICAgICAgIGluZGV4ICs9IDFcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IGJ1ZkFycmF5WzBdO1xuICAgICAgICAgICAgICAgIGlmIChwYXJlbnQubm9kZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnQubm9kZXMgPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbm9kZS5pbmRleCA9IHBhcmVudC5pbmRleCArICcuJyArIHBhcmVudC5ub2Rlcy5sZW5ndGhcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGJsb2NrW3RhZ10pIHtcbiAgICAgICAgICAgICAgICBub2RlLnRhZ1R5cGUgPSBcImJsb2NrXCI7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlubGluZVt0YWddKSB7XG4gICAgICAgICAgICAgICAgbm9kZS50YWdUeXBlID0gXCJpbmxpbmVcIjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2xvc2VTZWxmW3RhZ10pIHtcbiAgICAgICAgICAgICAgICBub2RlLnRhZ1R5cGUgPSBcImNsb3NlU2VsZlwiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYXR0cnMubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5hdHRyID0gYXR0cnMucmVkdWNlKGZ1bmN0aW9uIChwcmUsIGF0dHIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWUgPSBhdHRyLm5hbWU7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGF0dHIudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuYW1lID09ICdjbGFzcycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5kaXIodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gIHZhbHVlID0gdmFsdWUuam9pbihcIlwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5jbGFzc1N0ciA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIGhhcyBtdWx0aSBhdHRpYnV0ZXNcbiAgICAgICAgICAgICAgICAgICAgLy8gbWFrZSBpdCBhcnJheSBvZiBhdHRyaWJ1dGVcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWUgPT0gJ3N0eWxlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmRpcih2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgdmFsdWUgPSB2YWx1ZS5qb2luKFwiXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnN0eWxlU3RyID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlLm1hdGNoKC8gLykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuc3BsaXQoJyAnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgYXR0ciBhbHJlYWR5IGV4aXN0c1xuICAgICAgICAgICAgICAgICAgICAvLyBtZXJnZSBpdFxuICAgICAgICAgICAgICAgICAgICBpZiAocHJlW25hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShwcmVbbmFtZV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWxyZWFkeSBhcnJheSwgcHVzaCB0byBsYXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlW25hbWVdLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzaW5nbGUgdmFsdWUsIG1ha2UgaXQgYXJyYXlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVbbmFtZV0gPSBbcHJlW25hbWVdLCB2YWx1ZV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBub3QgZXhpc3QsIHB1dCBpdFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlW25hbWVdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJlO1xuICAgICAgICAgICAgICAgIH0sIHt9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy/lr7lpbWfmt7vliqDpop3lpJbmlbDmja5cbiAgICAgICAgICAgIGlmIChub2RlLnRhZyA9PT0gJ2ltZycpIHtcbiAgICAgICAgICAgICAgICBub2RlLmltZ0luZGV4ID0gcmVzdWx0cy5pbWFnZXMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHZhciBpbWdVcmwgPSBub2RlLmF0dHIuc3JjO1xuICAgICAgICAgICAgICAgIGlmIChpbWdVcmxbMF0gPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgaW1nVXJsLnNwbGljZSgwLCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaW1nVXJsID0gd3hEaXNjb2RlLnVybFRvSHR0cFVybChpbWdVcmwsIF9fcGxhY2VJbWdlVXJsSHR0cHMpO1xuICAgICAgICAgICAgICAgIG5vZGUuYXR0ci5zcmMgPSBpbWdVcmw7XG4gICAgICAgICAgICAgICAgbm9kZS5mcm9tID0gYmluZE5hbWU7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5pbWFnZXMucHVzaChub2RlKTtcbiAgICAgICAgICAgICAgICByZXN1bHRzLmltYWdlVXJscy5wdXNoKGltZ1VybCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8v5a+5cOS+v+etvua3u+WKoG1hcmdpblxuICAgICAgICAgICAgaWYgKG5vZGUudGFnID09PSAncCcpIHtcbiAgICAgICAgICAgICAgICBub2RlLnN0eWxlU3RyICs9ICc7bWFyZ2luLXRvcDogMjBycHg7JztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g5aSE55CGZm9udOagh+etvuagt+W8j+WxnuaAp1xuICAgICAgICAgICAgaWYgKG5vZGUudGFnID09PSAnZm9udCcpIHtcbiAgICAgICAgICAgICAgICB2YXIgZm9udFNpemUgPSBbJ3gtc21hbGwnLCAnc21hbGwnLCAnbWVkaXVtJywgJ2xhcmdlJywgJ3gtbGFyZ2UnLCAneHgtbGFyZ2UnLCAnLXdlYmtpdC14eHgtbGFyZ2UnXTtcbiAgICAgICAgICAgICAgICB2YXIgc3R5bGVBdHRycyA9IHtcbiAgICAgICAgICAgICAgICAgICAgJ2NvbG9yJzogJ2NvbG9yJyxcbiAgICAgICAgICAgICAgICAgICAgJ2ZhY2UnOiAnZm9udC1mYW1pbHknLFxuICAgICAgICAgICAgICAgICAgICAnc2l6ZSc6ICdmb250LXNpemUnXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGUuYXR0ci5zdHlsZSkgbm9kZS5hdHRyLnN0eWxlID0gW107XG4gICAgICAgICAgICAgICAgaWYgKCFub2RlLnN0eWxlU3RyKSBub2RlLnN0eWxlU3RyID0gJyc7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHN0eWxlQXR0cnMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUuYXR0cltrZXldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBrZXkgPT09ICdzaXplJyA/IGZvbnRTaXplW25vZGUuYXR0cltrZXldLTFdIDogbm9kZS5hdHRyW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLmF0dHIuc3R5bGUucHVzaChzdHlsZUF0dHJzW2tleV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5hdHRyLnN0eWxlLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5zdHlsZVN0ciArPSBzdHlsZUF0dHJzW2tleV0gKyAnOiAnICsgdmFsdWUgKyAnOyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8v5Li05pe26K6w5b2Vc291cmNl6LWE5rqQXG4gICAgICAgICAgICBpZihub2RlLnRhZyA9PT0gJ3NvdXJjZScpe1xuICAgICAgICAgICAgICAgIHJlc3VsdHMuc291cmNlID0gbm9kZS5hdHRyLnNyYztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHVuYXJ5KSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgdGhpcyB0YWcgZG9lc24ndCBoYXZlIGVuZCB0YWdcbiAgICAgICAgICAgICAgICAvLyBsaWtlIDxpbWcgc3JjPVwiaG9nZS5wbmdcIi8+XG4gICAgICAgICAgICAgICAgLy8gYWRkIHRvIHBhcmVudHNcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gYnVmQXJyYXlbMF0gfHwgcmVzdWx0cztcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50Lm5vZGVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50Lm5vZGVzID0gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHBhcmVudC5ub2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBidWZBcnJheS51bnNoaWZ0KG5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBlbmQ6IGZ1bmN0aW9uICh0YWcpIHtcbiAgICAgICAgICAgIC8vZGVidWcodGFnKTtcbiAgICAgICAgICAgIC8vIG1lcmdlIGludG8gcGFyZW50IHRhZ1xuICAgICAgICAgICAgdmFyIG5vZGUgPSBidWZBcnJheS5zaGlmdCgpO1xuICAgICAgICAgICAgaWYgKG5vZGUudGFnICE9PSB0YWcpIGNvbnNvbGUuZXJyb3IoJ2ludmFsaWQgc3RhdGU6IG1pc21hdGNoIGVuZCB0YWcnKTtcblxuICAgICAgICAgICAgLy/lvZPmnInnvJPlrZhzb3VyY2XotYTmupDml7bkuo7kuo52aWRlb+ihpeS4inNyY+i1hOa6kFxuICAgICAgICAgICAgaWYobm9kZS50YWcgPT09ICd2aWRlbycgJiYgcmVzdWx0cy5zb3VyY2Upe1xuICAgICAgICAgICAgICAgIG5vZGUuYXR0ci5zcmMgPSByZXN1bHRzLnNvdXJjZTtcbiAgICAgICAgICAgICAgICBkZWxldGUgcmVzdWx0cy5zb3VyY2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChidWZBcnJheS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzLm5vZGVzLnB1c2gobm9kZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBwYXJlbnQgPSBidWZBcnJheVswXTtcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50Lm5vZGVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50Lm5vZGVzID0gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHBhcmVudC5ub2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjaGFyczogZnVuY3Rpb24gKHRleHQpIHtcbiAgICAgICAgICAgIC8vZGVidWcodGV4dCk7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IHtcbiAgICAgICAgICAgICAgICBub2RlOiAndGV4dCcsXG4gICAgICAgICAgICAgICAgdGV4dDogdGV4dCxcbiAgICAgICAgICAgICAgICB0ZXh0QXJyYXk6dHJhbnNFbW9qaVN0cih0ZXh0KVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKGJ1ZkFycmF5Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIG5vZGUuaW5kZXggPSBpbmRleC50b1N0cmluZygpXG4gICAgICAgICAgICAgICAgaW5kZXggKz0gMVxuICAgICAgICAgICAgICAgIHJlc3VsdHMubm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IGJ1ZkFycmF5WzBdO1xuICAgICAgICAgICAgICAgIGlmIChwYXJlbnQubm9kZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnQubm9kZXMgPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbm9kZS5pbmRleCA9IHBhcmVudC5pbmRleCArICcuJyArIHBhcmVudC5ub2Rlcy5sZW5ndGhcbiAgICAgICAgICAgICAgICBwYXJlbnQubm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY29tbWVudDogZnVuY3Rpb24gKHRleHQpIHtcbiAgICAgICAgICAgIC8vZGVidWcodGV4dCk7XG4gICAgICAgICAgICAvLyB2YXIgbm9kZSA9IHtcbiAgICAgICAgICAgIC8vICAgICBub2RlOiAnY29tbWVudCcsXG4gICAgICAgICAgICAvLyAgICAgdGV4dDogdGV4dCxcbiAgICAgICAgICAgIC8vIH07XG4gICAgICAgICAgICAvLyB2YXIgcGFyZW50ID0gYnVmQXJyYXlbMF07XG4gICAgICAgICAgICAvLyBpZiAocGFyZW50Lm5vZGVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vICAgICBwYXJlbnQubm9kZXMgPSBbXTtcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIC8vIHBhcmVudC5ub2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICB9LFxuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xufTtcblxuZnVuY3Rpb24gdHJhbnNFbW9qaVN0cihzdHIpe1xuICAvLyB2YXIgZVJlZyA9IG5ldyBSZWdFeHAoXCJbXCIrX19yZWcrJyAnK1wiXVwiKTtcbi8vICAgc3RyID0gc3RyLnJlcGxhY2UoL1xcWyhbXlxcW1xcXV0rKVxcXS9nLCc6JDE6JylcblxuICB2YXIgZW1vamlPYmpzID0gW107XG4gIC8v5aaC5p6c5q2j5YiZ6KGo6L6+5byP5Li656m6XG4gIGlmKF9fZW1vamlzUmVnLmxlbmd0aCA9PSAwIHx8ICFfX2Vtb2ppcyl7XG4gICAgICB2YXIgZW1vamlPYmogPSB7fVxuICAgICAgZW1vamlPYmoubm9kZSA9IFwidGV4dFwiO1xuICAgICAgZW1vamlPYmoudGV4dCA9IHN0cjtcbiAgICAgIGFycmF5ID0gW2Vtb2ppT2JqXTtcbiAgICAgIHJldHVybiBhcnJheTtcbiAgfVxuICAvL+i/meS4quWcsOaWuemcgOimgeiwg+aVtFxuICBzdHIgPSBzdHIucmVwbGFjZSgvXFxbKFteXFxbXFxdXSspXFxdL2csJzokMTonKVxuICB2YXIgZVJlZyA9IG5ldyBSZWdFeHAoXCJbOl1cIik7XG4gIHZhciBhcnJheSA9IHN0ci5zcGxpdChlUmVnKTtcbiAgZm9yKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKXtcbiAgICB2YXIgZWxlID0gYXJyYXlbaV07XG4gICAgdmFyIGVtb2ppT2JqID0ge307XG4gICAgaWYoX19lbW9qaXNbZWxlXSl7XG4gICAgICBlbW9qaU9iai5ub2RlID0gXCJlbGVtZW50XCI7XG4gICAgICBlbW9qaU9iai50YWcgPSBcImVtb2ppXCI7XG4gICAgICBlbW9qaU9iai50ZXh0ID0gX19lbW9qaXNbZWxlXTtcbiAgICAgIGVtb2ppT2JqLmJhc2VTcmM9IF9fZW1vamlzQmFzZVNyYztcbiAgICB9ZWxzZXtcbiAgICAgIGVtb2ppT2JqLm5vZGUgPSBcInRleHRcIjtcbiAgICAgIGVtb2ppT2JqLnRleHQgPSBlbGU7XG4gICAgfVxuICAgIGVtb2ppT2Jqcy5wdXNoKGVtb2ppT2JqKTtcbiAgfVxuXG4gIHJldHVybiBlbW9qaU9ianM7XG59XG5cbmZ1bmN0aW9uIGVtb2ppc0luaXQocmVnPScnLGJhc2VTcmM9XCIvd3hQYXJzZS9lbW9qaXMvXCIsZW1vamlzKXtcbiAgICBfX2Vtb2ppc1JlZyA9IHJlZztcbiAgICBfX2Vtb2ppc0Jhc2VTcmM9YmFzZVNyYztcbiAgICBfX2Vtb2ppcz1lbW9qaXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGh0bWwyanNvbjogaHRtbDJqc29uLFxuICAgIGVtb2ppc0luaXQ6ZW1vamlzSW5pdFxufTtcblxuIl19