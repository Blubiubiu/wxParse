"use strict";

/**
 *
 * htmlParser改造自: https://github.com/blowsie/Pure-JavaScript-HTML5-Parser
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
// Regular Expressions for parsing tags and attributes
var startTag = /^<([-A-Za-z0-9_]+)((?:\s+[a-zA-Z_:][-a-zA-Z0-9_:.]*(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,
    endTag = /^<\/([-A-Za-z0-9_]+)[^>]*>/,
    attr = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;

// Empty Elements - HTML 5
var empty = makeMap("area,base,basefont,br,col,frame,hr,img,input,link,meta,param,embed,command,keygen,source,track,wbr");

// Block Elements - HTML 5
var block = makeMap("a,address,code,article,applet,aside,audio,blockquote,button,canvas,center,dd,del,dir,div,dl,dt,fieldset,figcaption,figure,footer,form,frameset,h1,h2,h3,h4,h5,h6,header,hgroup,hr,iframe,ins,isindex,li,map,menu,noframes,noscript,object,ol,output,p,pre,section,script,table,tbody,td,tfoot,th,thead,tr,ul,video");

// Inline Elements - HTML 5
var inline = makeMap("abbr,acronym,applet,b,basefont,bdo,big,br,button,cite,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,textarea,tt,u,var");

// Elements that you can, intentionally, leave open
// (and which close themselves)
var closeSelf = makeMap("colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr");

// Attributes that have their values filled in disabled="disabled"
var fillAttrs = makeMap("checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected");

// Special Elements (can contain anything)
var special = makeMap("wxxxcode-style,script,style,view,scroll-view,block");

function HTMLParser(html, handler) {
	var index,
	    chars,
	    match,
	    stack = [],
	    last = html;
	stack.last = function () {
		return this[this.length - 1];
	};

	while (html) {
		chars = true;

		// Make sure we're not in a script or style element
		if (!stack.last() || !special[stack.last()]) {

			// Comment
			if (html.indexOf("<!--") == 0) {
				index = html.indexOf("-->");

				if (index >= 0) {
					if (handler.comment) handler.comment(html.substring(4, index));
					html = html.substring(index + 3);
					chars = false;
				}

				// end tag
			} else if (html.indexOf("</") == 0) {
				match = html.match(endTag);

				if (match) {
					html = html.substring(match[0].length);
					match[0].replace(endTag, parseEndTag);
					chars = false;
				}

				// start tag
			} else if (html.indexOf("<") == 0) {
				match = html.match(startTag);

				if (match) {
					html = html.substring(match[0].length);
					match[0].replace(startTag, parseStartTag);
					chars = false;
				}
			}

			if (chars) {
				index = html.indexOf("<");
				var text = '';
				while (index === 0) {
					text += "<";
					html = html.substring(1);
					index = html.indexOf("<");
				}
				text += index < 0 ? html : html.substring(0, index);
				html = index < 0 ? "" : html.substring(index);

				if (handler.chars) handler.chars(text);
			}
		} else {

			html = html.replace(new RegExp("([\\s\\S]*?)<\/" + stack.last() + "[^>]*>"), function (all, text) {
				text = text.replace(/<!--([\s\S]*?)-->|<!\[CDATA\[([\s\S]*?)]]>/g, "$1$2");
				if (handler.chars) handler.chars(text);

				return "";
			});

			parseEndTag("", stack.last());
		}

		if (html == last) throw "Parse Error: " + html;
		last = html;
	}

	// Clean up any remaining tags
	parseEndTag();

	function parseStartTag(tag, tagName, rest, unary) {
		tagName = tagName.toLowerCase();

		if (block[tagName]) {
			while (stack.last() && inline[stack.last()]) {
				parseEndTag("", stack.last());
			}
		}

		if (closeSelf[tagName] && stack.last() == tagName) {
			parseEndTag("", tagName);
		}

		unary = empty[tagName] || !!unary;

		if (!unary) stack.push(tagName);

		if (handler.start) {
			var attrs = [];

			rest.replace(attr, function (match, name) {
				var value = arguments[2] ? arguments[2] : arguments[3] ? arguments[3] : arguments[4] ? arguments[4] : fillAttrs[name] ? name : "";

				attrs.push({
					name: name,
					value: value,
					escaped: value.replace(/(^|[^\\])"/g, '$1\\\"') //"
				});
			});

			if (handler.start) {
				handler.start(tagName, attrs, unary);
			}
		}
	}

	function parseEndTag(tag, tagName) {
		// If no tag name is provided, clean shop
		if (!tagName) var pos = 0;

		// Find the closest opened tag of the same type
		else {
				tagName = tagName.toLowerCase();
				for (var pos = stack.length - 1; pos >= 0; pos--) {
					if (stack[pos] == tagName) break;
				}
			}
		if (pos >= 0) {
			// Close all the open elements, up the stack
			for (var i = stack.length - 1; i >= pos; i--) {
				if (handler.end) handler.end(stack[i]);
			} // Remove the open elements from the stack
			stack.length = pos;
		}
	}
};

function makeMap(str) {
	var obj = {},
	    items = str.split(",");
	for (var i = 0; i < items.length; i++) {
		obj[items[i]] = true;
	}return obj;
}

module.exports = HTMLParser;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0bWxwYXJzZXIuanMiXSwibmFtZXMiOlsic3RhcnRUYWciLCJlbmRUYWciLCJhdHRyIiwiZW1wdHkiLCJtYWtlTWFwIiwiYmxvY2siLCJpbmxpbmUiLCJjbG9zZVNlbGYiLCJmaWxsQXR0cnMiLCJzcGVjaWFsIiwiSFRNTFBhcnNlciIsImh0bWwiLCJoYW5kbGVyIiwiaW5kZXgiLCJjaGFycyIsIm1hdGNoIiwic3RhY2siLCJsYXN0IiwibGVuZ3RoIiwiaW5kZXhPZiIsImNvbW1lbnQiLCJzdWJzdHJpbmciLCJyZXBsYWNlIiwicGFyc2VFbmRUYWciLCJwYXJzZVN0YXJ0VGFnIiwidGV4dCIsIlJlZ0V4cCIsImFsbCIsInRhZyIsInRhZ05hbWUiLCJyZXN0IiwidW5hcnkiLCJ0b0xvd2VyQ2FzZSIsInB1c2giLCJzdGFydCIsImF0dHJzIiwibmFtZSIsInZhbHVlIiwiYXJndW1lbnRzIiwiZXNjYXBlZCIsInBvcyIsImkiLCJlbmQiLCJzdHIiLCJvYmoiLCJpdGVtcyIsInNwbGl0IiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7Ozs7Ozs7OztBQWFBO0FBQ0EsSUFBSUEsV0FBVyxnSEFBZjtBQUFBLElBQ0NDLFNBQVMsNEJBRFY7QUFBQSxJQUVDQyxPQUFPLG9HQUZSOztBQUlBO0FBQ0EsSUFBSUMsUUFBUUMsUUFBUSxvR0FBUixDQUFaOztBQUVBO0FBQ0EsSUFBSUMsUUFBUUQsUUFBUSxvVEFBUixDQUFaOztBQUVBO0FBQ0EsSUFBSUUsU0FBU0YsUUFBUSw2TEFBUixDQUFiOztBQUVBO0FBQ0E7QUFDQSxJQUFJRyxZQUFZSCxRQUFRLGtEQUFSLENBQWhCOztBQUVBO0FBQ0EsSUFBSUksWUFBWUosUUFBUSx3R0FBUixDQUFoQjs7QUFFQTtBQUNBLElBQUlLLFVBQVVMLFFBQVEsb0RBQVIsQ0FBZDs7QUFFQSxTQUFTTSxVQUFULENBQW9CQyxJQUFwQixFQUEwQkMsT0FBMUIsRUFBbUM7QUFDbEMsS0FBSUMsS0FBSjtBQUFB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QUNBOztBQUVERyxPQUFPQyxPQUFQLEdBQWlCdEMsVUFBakIiLCJmaWxlIjoiaHRtbHBhcnNlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKlxyXG4gKiBodG1sUGFyc2Vy5pS56YCg6IeqOiBodHRwczovL2dpdGh1Yi5jb20vYmxvd3NpZS9QdXJlLUphdmFTY3JpcHQtSFRNTDUtUGFyc2VyXHJcbiAqXHJcbiAqIGF1dGhvcjogRGkgKOW+ruS/oeWwj+eoi+W6j+W8gOWPkeW3peeoi+W4iClcclxuICogb3JnYW5pemF0aW9uOiBXZUFwcERldijlvq7kv6HlsI/nqIvluo/lvIDlj5HorrrlnZspKGh0dHA6Ly93ZWFwcGRldi5jb20pXHJcbiAqICAgICAgICAgICAgICAg5Z6C55u05b6u5L+h5bCP56iL5bqP5byA5Y+R5Lqk5rWB56S+5Yy6XHJcbiAqXHJcbiAqIGdpdGh1YuWcsOWdgDogaHR0cHM6Ly9naXRodWIuY29tL2ljaW5keS93eFBhcnNlXHJcbiAqXHJcbiAqIGZvcjog5b6u5L+h5bCP56iL5bqP5a+M5paH5pys6Kej5p6QXHJcbiAqIGRldGFpbCA6IGh0dHA6Ly93ZWFwcGRldi5jb20vdC93eHBhcnNlLWFscGhhMC0xLWh0bWwtbWFya2Rvd24vMTg0XHJcbiAqL1xyXG4vLyBSZWd1bGFyIEV4cHJlc3Npb25zIGZvciBwYXJzaW5nIHRhZ3MgYW5kIGF0dHJpYnV0ZXNcclxudmFyIHN0YXJ0VGFnID0gL148KFstQS1aYS16MC05X10rKSgoPzpcXHMrW2EtekEtWl86XVstYS16QS1aMC05XzouXSooPzpcXHMqPVxccyooPzooPzpcIlteXCJdKlwiKXwoPzonW14nXSonKXxbXj5cXHNdKykpPykqKVxccyooXFwvPyk+LyxcclxuXHRlbmRUYWcgPSAvXjxcXC8oWy1BLVphLXowLTlfXSspW14+XSo+LyxcclxuXHRhdHRyID0gLyhbYS16QS1aXzpdWy1hLXpBLVowLTlfOi5dKikoPzpcXHMqPVxccyooPzooPzpcIigoPzpcXFxcLnxbXlwiXSkqKVwiKXwoPzonKCg/OlxcXFwufFteJ10pKiknKXwoW14+XFxzXSspKSk/L2c7XHJcblxyXG4vLyBFbXB0eSBFbGVtZW50cyAtIEhUTUwgNVxyXG52YXIgZW1wdHkgPSBtYWtlTWFwKFwiYXJlYSxiYXNlLGJhc2Vmb250LGJyLGNvbCxmcmFtZSxocixpbWcsaW5wdXQsbGluayxtZXRhLHBhcmFtLGVtYmVkLGNvbW1hbmQsa2V5Z2VuLHNvdXJjZSx0cmFjayx3YnJcIik7XHJcblxyXG4vLyBCbG9jayBFbGVtZW50cyAtIEhUTUwgNVxyXG52YXIgYmxvY2sgPSBtYWtlTWFwKFwiYSxhZGRyZXNzLGNvZGUsYXJ0aWNsZSxhcHBsZXQsYXNpZGUsYXVkaW8sYmxvY2txdW90ZSxidXR0b24sY2FudmFzLGNlbnRlcixkZCxkZWwsZGlyLGRpdixkbCxkdCxmaWVsZHNldCxmaWdjYXB0aW9uLGZpZ3VyZSxmb290ZXIsZm9ybSxmcmFtZXNldCxoMSxoMixoMyxoNCxoNSxoNixoZWFkZXIsaGdyb3VwLGhyLGlmcmFtZSxpbnMsaXNpbmRleCxsaSxtYXAsbWVudSxub2ZyYW1lcyxub3NjcmlwdCxvYmplY3Qsb2wsb3V0cHV0LHAscHJlLHNlY3Rpb24sc2NyaXB0LHRhYmxlLHRib2R5LHRkLHRmb290LHRoLHRoZWFkLHRyLHVsLHZpZGVvXCIpO1xyXG5cclxuLy8gSW5saW5lIEVsZW1lbnRzIC0gSFRNTCA1XHJcbnZhciBpbmxpbmUgPSBtYWtlTWFwKFwiYWJicixhY3JvbnltLGFwcGxldCxiLGJhc2Vmb250LGJkbyxiaWcsYnIsYnV0dG9uLGNpdGUsZGVsLGRmbixlbSxmb250LGksaWZyYW1lLGltZyxpbnB1dCxpbnMsa2JkLGxhYmVsLG1hcCxvYmplY3QscSxzLHNhbXAsc2NyaXB0LHNlbGVjdCxzbWFsbCxzcGFuLHN0cmlrZSxzdHJvbmcsc3ViLHN1cCx0ZXh0YXJlYSx0dCx1LHZhclwiKTtcclxuXHJcbi8vIEVsZW1lbnRzIHRoYXQgeW91IGNhbiwgaW50ZW50aW9uYWxseSwgbGVhdmUgb3BlblxyXG4vLyAoYW5kIHdoaWNoIGNsb3NlIHRoZW1zZWx2ZXMpXHJcbnZhciBjbG9zZVNlbGYgPSBtYWtlTWFwKFwiY29sZ3JvdXAsZGQsZHQsbGksb3B0aW9ucyxwLHRkLHRmb290LHRoLHRoZWFkLHRyXCIpO1xyXG5cclxuLy8gQXR0cmlidXRlcyB0aGF0IGhhdmUgdGhlaXIgdmFsdWVzIGZpbGxlZCBpbiBkaXNhYmxlZD1cImRpc2FibGVkXCJcclxudmFyIGZpbGxBdHRycyA9IG1ha2VNYXAoXCJjaGVja2VkLGNvbXBhY3QsZGVjbGFyZSxkZWZlcixkaXNhYmxlZCxpc21hcCxtdWx0aXBsZSxub2hyZWYsbm9yZXNpemUsbm9zaGFkZSxub3dyYXAscmVhZG9ubHksc2VsZWN0ZWRcIik7XHJcblxyXG4vLyBTcGVjaWFsIEVsZW1lbnRzIChjYW4gY29udGFpbiBhbnl0aGluZylcclxudmFyIHNwZWNpYWwgPSBtYWtlTWFwKFwid3h4eGNvZGUtc3R5bGUsc2NyaXB0LHN0eWxlLHZpZXcsc2Nyb2xsLXZpZXcsYmxvY2tcIik7XHJcblxyXG5mdW5jdGlvbiBIVE1MUGFyc2VyKGh0bWwsIGhhbmRsZXIpIHtcclxuXHR2YXIgaW5kZXgsIGNoYXJzLCBtYXRjaCwgc3RhY2sgPSBbXSwgbGFzdCA9IGh0bWw7XHJcblx0c3RhY2subGFzdCA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiB0aGlzW3RoaXMubGVuZ3RoIC0gMV07XHJcblx0fTtcclxuXHJcblx0d2hpbGUgKGh0bWwpIHtcclxuXHRcdGNoYXJzID0gdHJ1ZTtcclxuXHJcblx0XHQvLyBNYWtlIHN1cmUgd2UncmUgbm90IGluIGEgc2NyaXB0IG9yIHN0eWxlIGVsZW1lbnRcclxuXHRcdGlmICghc3RhY2subGFzdCgpIHx8ICFzcGVjaWFsW3N0YWNrLmxhc3QoKV0pIHtcclxuXHJcblx0XHRcdC8vIENvbW1lbnRcclxuXHRcdFx0aWYgKGh0bWwuaW5kZXhPZihcIjwhLS1cIikgPT0gMCkge1xyXG5cdFx0XHRcdGluZGV4ID0gaHRtbC5pbmRleE9mKFwiLS0+XCIpO1xyXG5cclxuXHRcdFx0XHRpZiAoaW5kZXggPj0gMCkge1xyXG5cdFx0XHRcdFx0aWYgKGhhbmRsZXIuY29tbWVudClcclxuXHRcdFx0XHRcdFx0aGFuZGxlci5jb21tZW50KGh0bWwuc3Vic3RyaW5nKDQsIGluZGV4KSk7XHJcblx0XHRcdFx0XHRodG1sID0gaHRtbC5zdWJzdHJpbmcoaW5kZXggKyAzKTtcclxuXHRcdFx0XHRcdGNoYXJzID0gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHQvLyBlbmQgdGFnXHJcblx0XHRcdH0gZWxzZSBpZiAoaHRtbC5pbmRleE9mKFwiPC9cIikgPT0gMCkge1xyXG5cdFx0XHRcdG1hdGNoID0gaHRtbC5tYXRjaChlbmRUYWcpO1xyXG5cclxuXHRcdFx0XHRpZiAobWF0Y2gpIHtcclxuXHRcdFx0XHRcdGh0bWwgPSBodG1sLnN1YnN0cmluZyhtYXRjaFswXS5sZW5ndGgpO1xyXG5cdFx0XHRcdFx0bWF0Y2hbMF0ucmVwbGFjZShlbmRUYWcsIHBhcnNlRW5kVGFnKTtcclxuXHRcdFx0XHRcdGNoYXJzID0gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHQvLyBzdGFydCB0YWdcclxuXHRcdFx0fSBlbHNlIGlmIChodG1sLmluZGV4T2YoXCI8XCIpID09IDApIHtcclxuXHRcdFx0XHRtYXRjaCA9IGh0bWwubWF0Y2goc3RhcnRUYWcpO1xyXG5cclxuXHRcdFx0XHRpZiAobWF0Y2gpIHtcclxuXHRcdFx0XHRcdGh0bWwgPSBodG1sLnN1YnN0cmluZyhtYXRjaFswXS5sZW5ndGgpO1xyXG5cdFx0XHRcdFx0bWF0Y2hbMF0ucmVwbGFjZShzdGFydFRhZywgcGFyc2VTdGFydFRhZyk7XHJcblx0XHRcdFx0XHRjaGFycyA9IGZhbHNlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKGNoYXJzKSB7XHJcblx0XHRcdFx0aW5kZXggPSBodG1sLmluZGV4T2YoXCI8XCIpO1xyXG5cdFx0XHRcdHZhciB0ZXh0ID0gJydcclxuXHRcdFx0XHR3aGlsZSAoaW5kZXggPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQgKz0gXCI8XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBodG1sID0gaHRtbC5zdWJzdHJpbmcoMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGh0bWwuaW5kZXhPZihcIjxcIik7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRleHQgKz0gaW5kZXggPCAwID8gaHRtbCA6IGh0bWwuc3Vic3RyaW5nKDAsIGluZGV4KTtcclxuXHRcdFx0XHRodG1sID0gaW5kZXggPCAwID8gXCJcIiA6IGh0bWwuc3Vic3RyaW5nKGluZGV4KTtcclxuXHJcblx0XHRcdFx0aWYgKGhhbmRsZXIuY2hhcnMpXHJcblx0XHRcdFx0XHRoYW5kbGVyLmNoYXJzKHRleHQpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0fSBlbHNlIHtcclxuXHJcblx0XHRcdGh0bWwgPSBodG1sLnJlcGxhY2UobmV3IFJlZ0V4cChcIihbXFxcXHNcXFxcU10qPyk8XFwvXCIgKyBzdGFjay5sYXN0KCkgKyBcIltePl0qPlwiKSwgZnVuY3Rpb24gKGFsbCwgdGV4dCkge1xyXG5cdFx0XHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoLzwhLS0oW1xcc1xcU10qPyktLT58PCFcXFtDREFUQVxcWyhbXFxzXFxTXSo/KV1dPi9nLCBcIiQxJDJcIik7XHJcblx0XHRcdFx0aWYgKGhhbmRsZXIuY2hhcnMpXHJcblx0XHRcdFx0XHRoYW5kbGVyLmNoYXJzKHRleHQpO1xyXG5cclxuXHRcdFx0XHRyZXR1cm4gXCJcIjtcclxuXHRcdFx0fSk7XHJcblxyXG5cclxuXHRcdFx0cGFyc2VFbmRUYWcoXCJcIiwgc3RhY2subGFzdCgpKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoaHRtbCA9PSBsYXN0KVxyXG5cdFx0XHR0aHJvdyBcIlBhcnNlIEVycm9yOiBcIiArIGh0bWw7XHJcblx0XHRsYXN0ID0gaHRtbDtcclxuXHR9XHJcblxyXG5cdC8vIENsZWFuIHVwIGFueSByZW1haW5pbmcgdGFnc1xyXG5cdHBhcnNlRW5kVGFnKCk7XHJcblxyXG5cdGZ1bmN0aW9uIHBhcnNlU3RhcnRUYWcodGFnLCB0YWdOYW1lLCByZXN0LCB1bmFyeSkge1xyXG5cdFx0dGFnTmFtZSA9IHRhZ05hbWUudG9Mb3dlckNhc2UoKTtcclxuXHJcblx0XHRpZiAoYmxvY2tbdGFnTmFtZV0pIHtcclxuXHRcdFx0d2hpbGUgKHN0YWNrLmxhc3QoKSAmJiBpbmxpbmVbc3RhY2subGFzdCgpXSkge1xyXG5cdFx0XHRcdHBhcnNlRW5kVGFnKFwiXCIsIHN0YWNrLmxhc3QoKSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRpZiAoY2xvc2VTZWxmW3RhZ05hbWVdICYmIHN0YWNrLmxhc3QoKSA9PSB0YWdOYW1lKSB7XHJcblx0XHRcdHBhcnNlRW5kVGFnKFwiXCIsIHRhZ05hbWUpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHVuYXJ5ID0gZW1wdHlbdGFnTmFtZV0gfHwgISF1bmFyeTtcclxuXHJcblx0XHRpZiAoIXVuYXJ5KVxyXG5cdFx0XHRzdGFjay5wdXNoKHRhZ05hbWUpO1xyXG5cclxuXHRcdGlmIChoYW5kbGVyLnN0YXJ0KSB7XHJcblx0XHRcdHZhciBhdHRycyA9IFtdO1xyXG5cclxuXHRcdFx0cmVzdC5yZXBsYWNlKGF0dHIsIGZ1bmN0aW9uIChtYXRjaCwgbmFtZSkge1xyXG5cdFx0XHRcdHZhciB2YWx1ZSA9IGFyZ3VtZW50c1syXSA/IGFyZ3VtZW50c1syXSA6XHJcblx0XHRcdFx0XHRhcmd1bWVudHNbM10gPyBhcmd1bWVudHNbM10gOlxyXG5cdFx0XHRcdFx0XHRhcmd1bWVudHNbNF0gPyBhcmd1bWVudHNbNF0gOlxyXG5cdFx0XHRcdFx0XHRcdGZpbGxBdHRyc1tuYW1lXSA/IG5hbWUgOiBcIlwiO1xyXG5cclxuXHRcdFx0XHRhdHRycy5wdXNoKHtcclxuXHRcdFx0XHRcdG5hbWU6IG5hbWUsXHJcblx0XHRcdFx0XHR2YWx1ZTogdmFsdWUsXHJcblx0XHRcdFx0XHRlc2NhcGVkOiB2YWx1ZS5yZXBsYWNlKC8oXnxbXlxcXFxdKVwiL2csICckMVxcXFxcXFwiJykgLy9cIlxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdGlmIChoYW5kbGVyLnN0YXJ0KSB7XHJcblx0XHRcdFx0aGFuZGxlci5zdGFydCh0YWdOYW1lLCBhdHRycywgdW5hcnkpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gcGFyc2VFbmRUYWcodGFnLCB0YWdOYW1lKSB7XHJcblx0XHQvLyBJZiBubyB0YWcgbmFtZSBpcyBwcm92aWRlZCwgY2xlYW4gc2hvcFxyXG5cdFx0aWYgKCF0YWdOYW1lKVxyXG5cdFx0XHR2YXIgcG9zID0gMDtcclxuXHJcblx0XHQvLyBGaW5kIHRoZSBjbG9zZXN0IG9wZW5lZCB0YWcgb2YgdGhlIHNhbWUgdHlwZVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHRhZ05hbWUgPSB0YWdOYW1lLnRvTG93ZXJDYXNlKCk7XHJcblx0XHRcdGZvciAodmFyIHBvcyA9IHN0YWNrLmxlbmd0aCAtIDE7IHBvcyA+PSAwOyBwb3MtLSlcclxuXHRcdFx0XHRpZiAoc3RhY2tbcG9zXSA9PSB0YWdOYW1lKVxyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHR9XHJcblx0XHRpZiAocG9zID49IDApIHtcclxuXHRcdFx0Ly8gQ2xvc2UgYWxsIHRoZSBvcGVuIGVsZW1lbnRzLCB1cCB0aGUgc3RhY2tcclxuXHRcdFx0Zm9yICh2YXIgaSA9IHN0YWNrLmxlbmd0aCAtIDE7IGkgPj0gcG9zOyBpLS0pXHJcblx0XHRcdFx0aWYgKGhhbmRsZXIuZW5kKVxyXG5cdFx0XHRcdFx0aGFuZGxlci5lbmQoc3RhY2tbaV0pO1xyXG5cclxuXHRcdFx0Ly8gUmVtb3ZlIHRoZSBvcGVuIGVsZW1lbnRzIGZyb20gdGhlIHN0YWNrXHJcblx0XHRcdHN0YWNrLmxlbmd0aCA9IHBvcztcclxuXHRcdH1cclxuXHR9XHJcbn07XHJcblxyXG5cclxuZnVuY3Rpb24gbWFrZU1hcChzdHIpIHtcclxuXHR2YXIgb2JqID0ge30sIGl0ZW1zID0gc3RyLnNwbGl0KFwiLFwiKTtcclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSsrKVxyXG5cdFx0b2JqW2l0ZW1zW2ldXSA9IHRydWU7XHJcblx0cmV0dXJuIG9iajtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBIVE1MUGFyc2VyO1xyXG4iXX0=