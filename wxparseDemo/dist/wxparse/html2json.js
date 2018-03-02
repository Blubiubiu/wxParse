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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0bWwyanNvbi5qcyJdLCJuYW1lcyI6WyJfX3BsYWNlSW1nZVVybEh0dHBzIiwiX19lbW9qaXNSZWciLCJfX2Vtb2ppc0Jhc2VTcmMiLCJfX2Vtb2ppcyIsInd4RGlzY29kZSIsInJlcXVpcmUiLCJIVE1MUGFyc2VyIiwiZW1wdHkiLCJtYWtlTWFwIiwiYmxvY2siLCJpbmxpbmUiLCJjbG9zZVNlbGYiLCJmaWxsQXR0cnMiLCJzcGVjaWFsIiwic3RyIiwib2JqIiwiaXRlbXMiLCJzcGxpdCIsImkiLCJsZW5ndGgiLCJxIiwidiIsInJlbW92ZURPQ1RZUEUiLCJodG1sIiwicmVwbGFjZSIsInRyaW1IdG1sIiwiaHRtbDJqc29uIiwiYmluZE5hbWUiLCJzdHJEaXNjb2RlIiwiYnVmQXJyYXkiLCJyZXN1bHRzIiwibm9kZSIsIm5vZGVzIiwiaW1hZ2VzIiwiaW1hZ2VVcmxzIiwiaW5kZXgiLCJzdGFydCIsInRhZyIsImF0dHJzIiwidW5hcnkiLCJ0b1N0cmluZyIsInBhcmVudCIsInVuZGVmaW5lZCIsInRhZ1R5cGUiLCJhdHRyIiwicmVkdWNlIiwicHJlIiwibmFtZSIsInZhbHVlIiwiY2xhc3NTdHIiLCJzdHlsZVN0ciIsIm1hdGNoIiwiQXJyYXkiLCJpc0FycmF5IiwicHVzaCIsImltZ0luZGV4IiwiaW1nVXJsIiwic3JjIiwic3BsaWNlIiwidXJsVG9IdHRwVXJsIiwiZnJvbSIsImZvbnRTaXplIiwic3R5bGVBdHRycyIsInN0eWxlIiwia2V5Iiwic291cmNlIiwidW5zaGlmdCIsImVuZCIsInNoaWZ0IiwiY29uc29sZSIsImVycm9yIiwiY2hhcnMiLCJ0ZXh0IiwidGV4dEFycmF5IiwidHJhbnNFbW9qaVN0ciIsImNvbW1lbnQiLCJlbW9qaU9ianMiLCJlbW9qaU9iaiIsImFycmF5IiwiZVJlZyIsIlJlZ0V4cCIsImVsZSIsImJhc2VTcmMiLCJlbW9qaXNJbml0IiwicmVnIiwiZW1vamlzIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7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LHFCQUFTOUMsSUFBVCxHQUFnQixTQUFoQjtBQUNBOEMscUJBQVN4QyxHQUFULEdBQWUsT0FBZjtBQUNBd0MscUJBQVNMLElBQVQsR0FBZ0JyRSxTQUFTOEUsR0FBVCxDQUFoQjtBQUNBSixxQkFBU0ssT0FBVCxHQUFrQmhGLGVBQWxCO0FBQ0QsU0FMRCxNQUtLO0FBQ0gyRSxxQkFBUzlDLElBQVQsR0FBZ0IsTUFBaEI7QUFDQThDLHFCQUFTTCxJQUFULEdBQWdCUyxHQUFoQjtBQUNEO0FBQ0RMLGtCQUFVdEIsSUFBVixDQUFldUIsUUFBZjtBQUNEOztBQUVELFdBQU9ELFNBQVA7QUFDRDs7QUFFRCxTQUFTTyxVQUFULEdBQTZEO0FBQUEsUUFBekNDLEdBQXlDLHVFQUFyQyxFQUFxQztBQUFBLFFBQWxDRixPQUFrQyx1RUFBMUIsa0JBQTBCO0FBQUEsUUFBUEcsTUFBTzs7QUFDekRwRixrQkFBY21GLEdBQWQ7QUFDQWxGLHNCQUFnQmdGLE9BQWhCO0FBQ0EvRSxlQUFTa0YsTUFBVDtBQUNIOztBQUVEQyxPQUFPQyxPQUFQLEdBQWlCO0FBQ2I3RCxlQUFXQSxTQURFO0FBRWJ5RCxnQkFBV0E7QUFGRSxDQUFqQiIsImZpbGUiOiJodG1sMmpzb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogaHRtbDJKc29uIOaUuemAoOadpeiHqjogaHR0cHM6Ly9naXRodWIuY29tL0p4Y2svaHRtbDJqc29uXHJcbiAqXHJcbiAqXHJcbiAqIGF1dGhvcjogRGkgKOW+ruS/oeWwj+eoi+W6j+W8gOWPkeW3peeoi+W4iClcclxuICogb3JnYW5pemF0aW9uOiBXZUFwcERldijlvq7kv6HlsI/nqIvluo/lvIDlj5HorrrlnZspKGh0dHA6Ly93ZWFwcGRldi5jb20pXHJcbiAqICAgICAgICAgICAgICAg5Z6C55u05b6u5L+h5bCP56iL5bqP5byA5Y+R5Lqk5rWB56S+5Yy6XHJcbiAqXHJcbiAqIGdpdGh1YuWcsOWdgDogaHR0cHM6Ly9naXRodWIuY29tL2ljaW5keS93eFBhcnNlXHJcbiAqXHJcbiAqIGZvcjog5b6u5L+h5bCP56iL5bqP5a+M5paH5pys6Kej5p6QXHJcbiAqIGRldGFpbCA6IGh0dHA6Ly93ZWFwcGRldi5jb20vdC93eHBhcnNlLWFscGhhMC0xLWh0bWwtbWFya2Rvd24vMTg0XHJcbiAqL1xyXG5cclxudmFyIF9fcGxhY2VJbWdlVXJsSHR0cHMgPSBcImh0dHBzXCI7XHJcbnZhciBfX2Vtb2ppc1JlZyA9ICcnO1xyXG52YXIgX19lbW9qaXNCYXNlU3JjID0gJyc7XHJcbnZhciBfX2Vtb2ppcyA9IHt9O1xyXG52YXIgd3hEaXNjb2RlID0gcmVxdWlyZSgnLi93eERpc2NvZGUuanMnKTtcclxudmFyIEhUTUxQYXJzZXIgPSByZXF1aXJlKCcuL2h0bWxwYXJzZXIuanMnKTtcclxuLy8gRW1wdHkgRWxlbWVudHMgLSBIVE1MIDVcclxudmFyIGVtcHR5ID0gbWFrZU1hcChcImFyZWEsYmFzZSxiYXNlZm9udCxicixjb2wsZnJhbWUsaHIsaW1nLGlucHV0LGxpbmssbWV0YSxwYXJhbSxlbWJlZCxjb21tYW5kLGtleWdlbixzb3VyY2UsdHJhY2ssd2JyXCIpO1xyXG4vLyBCbG9jayBFbGVtZW50cyAtIEhUTUwgNVxyXG52YXIgYmxvY2sgPSBtYWtlTWFwKFwiYnIsYSxjb2RlLGFkZHJlc3MsYXJ0aWNsZSxhcHBsZXQsYXNpZGUsYXVkaW8sYmxvY2txdW90ZSxidXR0b24sY2FudmFzLGNlbnRlcixkZCxkZWwsZGlyLGRpdixkbCxkdCxmaWVsZHNldCxmaWdjYXB0aW9uLGZpZ3VyZSxmb290ZXIsZm9ybSxmcmFtZXNldCxoMSxoMixoMyxoNCxoNSxoNixoZWFkZXIsaGdyb3VwLGhyLGlmcmFtZSxpbnMsaXNpbmRleCxsaSxtYXAsbWVudSxub2ZyYW1lcyxub3NjcmlwdCxvYmplY3Qsb2wsb3V0cHV0LHAscHJlLHNlY3Rpb24sc2NyaXB0LHRhYmxlLHRib2R5LHRkLHRmb290LHRoLHRoZWFkLHRyLHVsLHZpZGVvXCIpO1xyXG5cclxuLy8gSW5saW5lIEVsZW1lbnRzIC0gSFRNTCA1XHJcbnZhciBpbmxpbmUgPSBtYWtlTWFwKFwiYWJicixhY3JvbnltLGFwcGxldCxiLGJhc2Vmb250LGJkbyxiaWcsYnV0dG9uLGNpdGUsZGVsLGRmbixlbSxmb250LGksaWZyYW1lLGltZyxpbnB1dCxpbnMsa2JkLGxhYmVsLG1hcCxvYmplY3QscSxzLHNhbXAsc2NyaXB0LHNlbGVjdCxzbWFsbCxzcGFuLHN0cmlrZSxzdHJvbmcsc3ViLHN1cCx0ZXh0YXJlYSx0dCx1LHZhclwiKTtcclxuXHJcbi8vIEVsZW1lbnRzIHRoYXQgeW91IGNhbiwgaW50ZW50aW9uYWxseSwgbGVhdmUgb3BlblxyXG4vLyAoYW5kIHdoaWNoIGNsb3NlIHRoZW1zZWx2ZXMpXHJcbnZhciBjbG9zZVNlbGYgPSBtYWtlTWFwKFwiY29sZ3JvdXAsZGQsZHQsbGksb3B0aW9ucyxwLHRkLHRmb290LHRoLHRoZWFkLHRyXCIpO1xyXG5cclxuLy8gQXR0cmlidXRlcyB0aGF0IGhhdmUgdGhlaXIgdmFsdWVzIGZpbGxlZCBpbiBkaXNhYmxlZD1cImRpc2FibGVkXCJcclxudmFyIGZpbGxBdHRycyA9IG1ha2VNYXAoXCJjaGVja2VkLGNvbXBhY3QsZGVjbGFyZSxkZWZlcixkaXNhYmxlZCxpc21hcCxtdWx0aXBsZSxub2hyZWYsbm9yZXNpemUsbm9zaGFkZSxub3dyYXAscmVhZG9ubHksc2VsZWN0ZWRcIik7XHJcblxyXG4vLyBTcGVjaWFsIEVsZW1lbnRzIChjYW4gY29udGFpbiBhbnl0aGluZylcclxudmFyIHNwZWNpYWwgPSBtYWtlTWFwKFwid3h4eGNvZGUtc3R5bGUsc2NyaXB0LHN0eWxlLHZpZXcsc2Nyb2xsLXZpZXcsYmxvY2tcIik7XHJcbmZ1bmN0aW9uIG1ha2VNYXAoc3RyKSB7XHJcbiAgICB2YXIgb2JqID0ge30sIGl0ZW1zID0gc3RyLnNwbGl0KFwiLFwiKTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAgb2JqW2l0ZW1zW2ldXSA9IHRydWU7XHJcbiAgICByZXR1cm4gb2JqO1xyXG59XHJcblxyXG5mdW5jdGlvbiBxKHYpIHtcclxuICAgIHJldHVybiAnXCInICsgdiArICdcIic7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbW92ZURPQ1RZUEUoaHRtbCkge1xyXG4gICAgcmV0dXJuIGh0bWxcclxuICAgICAgICAucmVwbGFjZSgvPFxcP3htbC4qXFw/Plxcbi8sICcnKVxyXG4gICAgICAgIC5yZXBsYWNlKC88LiohZG9jdHlwZS4qXFw+XFxuLywgJycpXHJcbiAgICAgICAgLnJlcGxhY2UoLzwuKiFET0NUWVBFLipcXD5cXG4vLCAnJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRyaW1IdG1sKGh0bWwpIHtcclxuICByZXR1cm4gaHRtbFxyXG4gICAgICAgIC5yZXBsYWNlKC9cXHI/XFxuKy9nLCAnJylcclxuICAgICAgICAucmVwbGFjZSgvPCEtLS4qPy0tPi9pZywgJycpXHJcbiAgICAgICAgLnJlcGxhY2UoL1xcL1xcKi4qP1xcKlxcLy9pZywgJycpXHJcbiAgICAgICAgLnJlcGxhY2UoL1sgXSs8L2lnLCAnPCcpXHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBodG1sMmpzb24oaHRtbCwgYmluZE5hbWUpIHtcclxuICAgIC8v5aSE55CG5a2X56ym5LiyXHJcbiAgICBodG1sID0gcmVtb3ZlRE9DVFlQRShodG1sKTtcclxuICAgIGh0bWwgPSB0cmltSHRtbChodG1sKTtcclxuICAgIGh0bWwgPSB3eERpc2NvZGUuc3RyRGlzY29kZShodG1sKTtcclxuICAgIC8v55Sf5oiQbm9kZeiKgueCuVxyXG4gICAgdmFyIGJ1ZkFycmF5ID0gW107XHJcbiAgICB2YXIgcmVzdWx0cyA9IHtcclxuICAgICAgICBub2RlOiBiaW5kTmFtZSxcclxuICAgICAgICBub2RlczogW10sXHJcbiAgICAgICAgaW1hZ2VzOltdLFxyXG4gICAgICAgIGltYWdlVXJsczpbXVxyXG4gICAgfTtcclxuICAgIHZhciBpbmRleCA9IDA7XHJcbiAgICBIVE1MUGFyc2VyKGh0bWwsIHtcclxuICAgICAgICBzdGFydDogZnVuY3Rpb24gKHRhZywgYXR0cnMsIHVuYXJ5KSB7XHJcbiAgICAgICAgICAgIC8vZGVidWcodGFnLCBhdHRycywgdW5hcnkpO1xyXG4gICAgICAgICAgICAvLyBub2RlIGZvciB0aGlzIGVsZW1lbnRcclxuICAgICAgICAgICAgdmFyIG5vZGUgPSB7XHJcbiAgICAgICAgICAgICAgICBub2RlOiAnZWxlbWVudCcsXHJcbiAgICAgICAgICAgICAgICB0YWc6IHRhZyxcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGlmIChidWZBcnJheS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIG5vZGUuaW5kZXggPSBpbmRleC50b1N0cmluZygpXHJcbiAgICAgICAgICAgICAgICBpbmRleCArPSAxXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gYnVmQXJyYXlbMF07XHJcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50Lm5vZGVzID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQubm9kZXMgPSBbXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIG5vZGUuaW5kZXggPSBwYXJlbnQuaW5kZXggKyAnLicgKyBwYXJlbnQubm9kZXMubGVuZ3RoXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChibG9ja1t0YWddKSB7XHJcbiAgICAgICAgICAgICAgICBub2RlLnRhZ1R5cGUgPSBcImJsb2NrXCI7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5saW5lW3RhZ10pIHtcclxuICAgICAgICAgICAgICAgIG5vZGUudGFnVHlwZSA9IFwiaW5saW5lXCI7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2xvc2VTZWxmW3RhZ10pIHtcclxuICAgICAgICAgICAgICAgIG5vZGUudGFnVHlwZSA9IFwiY2xvc2VTZWxmXCI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChhdHRycy5sZW5ndGggIT09IDApIHtcclxuICAgICAgICAgICAgICAgIG5vZGUuYXR0ciA9IGF0dHJzLnJlZHVjZShmdW5jdGlvbiAocHJlLCBhdHRyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWUgPSBhdHRyLm5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gYXR0ci52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobmFtZSA9PSAnY2xhc3MnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5kaXIodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgdmFsdWUgPSB2YWx1ZS5qb2luKFwiXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuY2xhc3NTdHIgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaGFzIG11bHRpIGF0dGlidXRlc1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIG1ha2UgaXQgYXJyYXkgb2YgYXR0cmlidXRlXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWUgPT0gJ3N0eWxlJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUuZGlyKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gIHZhbHVlID0gdmFsdWUuam9pbihcIlwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnN0eWxlU3RyID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZS5tYXRjaCgvIC8pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuc3BsaXQoJyAnKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBpZiBhdHRyIGFscmVhZHkgZXhpc3RzXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gbWVyZ2UgaXRcclxuICAgICAgICAgICAgICAgICAgICBpZiAocHJlW25hbWVdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHByZVtuYW1lXSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFscmVhZHkgYXJyYXksIHB1c2ggdG8gbGFzdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlW25hbWVdLnB1c2godmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2luZ2xlIHZhbHVlLCBtYWtlIGl0IGFycmF5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVbbmFtZV0gPSBbcHJlW25hbWVdLCB2YWx1ZV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBub3QgZXhpc3QsIHB1dCBpdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVbbmFtZV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwcmU7XHJcbiAgICAgICAgICAgICAgICB9LCB7fSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8v5a+5aW1n5re75Yqg6aKd5aSW5pWw5o2uXHJcbiAgICAgICAgICAgIGlmIChub2RlLnRhZyA9PT0gJ2ltZycpIHtcclxuICAgICAgICAgICAgICAgIG5vZGUuaW1nSW5kZXggPSByZXN1bHRzLmltYWdlcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW1nVXJsID0gbm9kZS5hdHRyLnNyYztcclxuICAgICAgICAgICAgICAgIGlmIChpbWdVcmxbMF0gPT0gJycpIHtcclxuICAgICAgICAgICAgICAgICAgICBpbWdVcmwuc3BsaWNlKDAsIDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaW1nVXJsID0gd3hEaXNjb2RlLnVybFRvSHR0cFVybChpbWdVcmwsIF9fcGxhY2VJbWdlVXJsSHR0cHMpO1xyXG4gICAgICAgICAgICAgICAgbm9kZS5hdHRyLnNyYyA9IGltZ1VybDtcclxuICAgICAgICAgICAgICAgIG5vZGUuZnJvbSA9IGJpbmROYW1lO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0cy5pbWFnZXMucHVzaChub2RlKTtcclxuICAgICAgICAgICAgICAgIHJlc3VsdHMuaW1hZ2VVcmxzLnB1c2goaW1nVXJsKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy/lr7lw5L6/562+5re75YqgbWFyZ2luXHJcbiAgICAgICAgICAgIGlmIChub2RlLnRhZyA9PT0gJ3AnKSB7XHJcbiAgICAgICAgICAgICAgICBub2RlLnN0eWxlU3RyICs9ICc7bWFyZ2luLXRvcDogMjBycHg7JztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8g5aSE55CGZm9udOagh+etvuagt+W8j+WxnuaAp1xyXG4gICAgICAgICAgICBpZiAobm9kZS50YWcgPT09ICdmb250Jykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZvbnRTaXplID0gWyd4LXNtYWxsJywgJ3NtYWxsJywgJ21lZGl1bScsICdsYXJnZScsICd4LWxhcmdlJywgJ3h4LWxhcmdlJywgJy13ZWJraXQteHh4LWxhcmdlJ107XHJcbiAgICAgICAgICAgICAgICB2YXIgc3R5bGVBdHRycyA9IHtcclxuICAgICAgICAgICAgICAgICAgICAnY29sb3InOiAnY29sb3InLFxyXG4gICAgICAgICAgICAgICAgICAgICdmYWNlJzogJ2ZvbnQtZmFtaWx5JyxcclxuICAgICAgICAgICAgICAgICAgICAnc2l6ZSc6ICdmb250LXNpemUnXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgaWYgKCFub2RlLmF0dHIuc3R5bGUpIG5vZGUuYXR0ci5zdHlsZSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFub2RlLnN0eWxlU3RyKSBub2RlLnN0eWxlU3RyID0gJyc7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gc3R5bGVBdHRycykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlLmF0dHJba2V5XSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBrZXkgPT09ICdzaXplJyA/IGZvbnRTaXplW25vZGUuYXR0cltrZXldLTFdIDogbm9kZS5hdHRyW2tleV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuYXR0ci5zdHlsZS5wdXNoKHN0eWxlQXR0cnNba2V5XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuYXR0ci5zdHlsZS5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5zdHlsZVN0ciArPSBzdHlsZUF0dHJzW2tleV0gKyAnOiAnICsgdmFsdWUgKyAnOyc7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL+S4tOaXtuiusOW9lXNvdXJjZei1hOa6kFxyXG4gICAgICAgICAgICBpZihub2RlLnRhZyA9PT0gJ3NvdXJjZScpe1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0cy5zb3VyY2UgPSBub2RlLmF0dHIuc3JjO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodW5hcnkpIHtcclxuICAgICAgICAgICAgICAgIC8vIGlmIHRoaXMgdGFnIGRvZXNuJ3QgaGF2ZSBlbmQgdGFnXHJcbiAgICAgICAgICAgICAgICAvLyBsaWtlIDxpbWcgc3JjPVwiaG9nZS5wbmdcIi8+XHJcbiAgICAgICAgICAgICAgICAvLyBhZGQgdG8gcGFyZW50c1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IGJ1ZkFycmF5WzBdIHx8IHJlc3VsdHM7XHJcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50Lm5vZGVzID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQubm9kZXMgPSBbXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHBhcmVudC5ub2Rlcy5wdXNoKG5vZGUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYnVmQXJyYXkudW5zaGlmdChub2RlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW5kOiBmdW5jdGlvbiAodGFnKSB7XHJcbiAgICAgICAgICAgIC8vZGVidWcodGFnKTtcclxuICAgICAgICAgICAgLy8gbWVyZ2UgaW50byBwYXJlbnQgdGFnXHJcbiAgICAgICAgICAgIHZhciBub2RlID0gYnVmQXJyYXkuc2hpZnQoKTtcclxuICAgICAgICAgICAgaWYgKG5vZGUudGFnICE9PSB0YWcpIGNvbnNvbGUuZXJyb3IoJ2ludmFsaWQgc3RhdGU6IG1pc21hdGNoIGVuZCB0YWcnKTtcclxuXHJcbiAgICAgICAgICAgIC8v5b2T5pyJ57yT5a2Yc291cmNl6LWE5rqQ5pe25LqO5LqOdmlkZW/ooaXkuIpzcmPotYTmupBcclxuICAgICAgICAgICAgaWYobm9kZS50YWcgPT09ICd2aWRlbycgJiYgcmVzdWx0cy5zb3VyY2Upe1xyXG4gICAgICAgICAgICAgICAgbm9kZS5hdHRyLnNyYyA9IHJlc3VsdHMuc291cmNlO1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIHJlc3VsdHMuc291cmNlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoYnVmQXJyYXkubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRzLm5vZGVzLnB1c2gobm9kZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gYnVmQXJyYXlbMF07XHJcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50Lm5vZGVzID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQubm9kZXMgPSBbXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHBhcmVudC5ub2Rlcy5wdXNoKG5vZGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBjaGFyczogZnVuY3Rpb24gKHRleHQpIHtcclxuICAgICAgICAgICAgLy9kZWJ1Zyh0ZXh0KTtcclxuICAgICAgICAgICAgdmFyIG5vZGUgPSB7XHJcbiAgICAgICAgICAgICAgICBub2RlOiAndGV4dCcsXHJcbiAgICAgICAgICAgICAgICB0ZXh0OiB0ZXh0LFxyXG4gICAgICAgICAgICAgICAgdGV4dEFycmF5OnRyYW5zRW1vamlTdHIodGV4dClcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGlmIChidWZBcnJheS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIG5vZGUuaW5kZXggPSBpbmRleC50b1N0cmluZygpXHJcbiAgICAgICAgICAgICAgICBpbmRleCArPSAxXHJcbiAgICAgICAgICAgICAgICByZXN1bHRzLm5vZGVzLnB1c2gobm9kZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gYnVmQXJyYXlbMF07XHJcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50Lm5vZGVzID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQubm9kZXMgPSBbXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIG5vZGUuaW5kZXggPSBwYXJlbnQuaW5kZXggKyAnLicgKyBwYXJlbnQubm9kZXMubGVuZ3RoXHJcbiAgICAgICAgICAgICAgICBwYXJlbnQubm9kZXMucHVzaChub2RlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY29tbWVudDogZnVuY3Rpb24gKHRleHQpIHtcclxuICAgICAgICAgICAgLy9kZWJ1Zyh0ZXh0KTtcclxuICAgICAgICAgICAgLy8gdmFyIG5vZGUgPSB7XHJcbiAgICAgICAgICAgIC8vICAgICBub2RlOiAnY29tbWVudCcsXHJcbiAgICAgICAgICAgIC8vICAgICB0ZXh0OiB0ZXh0LFxyXG4gICAgICAgICAgICAvLyB9O1xyXG4gICAgICAgICAgICAvLyB2YXIgcGFyZW50ID0gYnVmQXJyYXlbMF07XHJcbiAgICAgICAgICAgIC8vIGlmIChwYXJlbnQubm9kZXMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAvLyAgICAgcGFyZW50Lm5vZGVzID0gW107XHJcbiAgICAgICAgICAgIC8vIH1cclxuICAgICAgICAgICAgLy8gcGFyZW50Lm5vZGVzLnB1c2gobm9kZSk7XHJcbiAgICAgICAgfSxcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHJlc3VsdHM7XHJcbn07XHJcblxyXG5mdW5jdGlvbiB0cmFuc0Vtb2ppU3RyKHN0cil7XHJcbiAgLy8gdmFyIGVSZWcgPSBuZXcgUmVnRXhwKFwiW1wiK19fcmVnKycgJytcIl1cIik7XHJcbi8vICAgc3RyID0gc3RyLnJlcGxhY2UoL1xcWyhbXlxcW1xcXV0rKVxcXS9nLCc6JDE6JylcclxuXHJcbiAgdmFyIGVtb2ppT2JqcyA9IFtdO1xyXG4gIC8v5aaC5p6c5q2j5YiZ6KGo6L6+5byP5Li656m6XHJcbiAgaWYoX19lbW9qaXNSZWcubGVuZ3RoID09IDAgfHwgIV9fZW1vamlzKXtcclxuICAgICAgdmFyIGVtb2ppT2JqID0ge31cclxuICAgICAgZW1vamlPYmoubm9kZSA9IFwidGV4dFwiO1xyXG4gICAgICBlbW9qaU9iai50ZXh0ID0gc3RyO1xyXG4gICAgICBhcnJheSA9IFtlbW9qaU9ial07XHJcbiAgICAgIHJldHVybiBhcnJheTtcclxuICB9XHJcbiAgLy/ov5nkuKrlnLDmlrnpnIDopoHosIPmlbRcclxuICBzdHIgPSBzdHIucmVwbGFjZSgvXFxbKFteXFxbXFxdXSspXFxdL2csJzokMTonKVxyXG4gIHZhciBlUmVnID0gbmV3IFJlZ0V4cChcIls6XVwiKTtcclxuICB2YXIgYXJyYXkgPSBzdHIuc3BsaXQoZVJlZyk7XHJcbiAgZm9yKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKXtcclxuICAgIHZhciBlbGUgPSBhcnJheVtpXTtcclxuICAgIHZhciBlbW9qaU9iaiA9IHt9O1xyXG4gICAgaWYoX19lbW9qaXNbZWxlXSl7XHJcbiAgICAgIGVtb2ppT2JqLm5vZGUgPSBcImVsZW1lbnRcIjtcclxuICAgICAgZW1vamlPYmoudGFnID0gXCJlbW9qaVwiO1xyXG4gICAgICBlbW9qaU9iai50ZXh0ID0gX19lbW9qaXNbZWxlXTtcclxuICAgICAgZW1vamlPYmouYmFzZVNyYz0gX19lbW9qaXNCYXNlU3JjO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgIGVtb2ppT2JqLm5vZGUgPSBcInRleHRcIjtcclxuICAgICAgZW1vamlPYmoudGV4dCA9IGVsZTtcclxuICAgIH1cclxuICAgIGVtb2ppT2Jqcy5wdXNoKGVtb2ppT2JqKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBlbW9qaU9ianM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGVtb2ppc0luaXQocmVnPScnLGJhc2VTcmM9XCIvd3hQYXJzZS9lbW9qaXMvXCIsZW1vamlzKXtcclxuICAgIF9fZW1vamlzUmVnID0gcmVnO1xyXG4gICAgX19lbW9qaXNCYXNlU3JjPWJhc2VTcmM7XHJcbiAgICBfX2Vtb2ppcz1lbW9qaXM7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgaHRtbDJqc29uOiBodG1sMmpzb24sXHJcbiAgICBlbW9qaXNJbml0OmVtb2ppc0luaXRcclxufTtcclxuXHJcbiJdfQ==