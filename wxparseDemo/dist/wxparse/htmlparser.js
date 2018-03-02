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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0bWxwYXJzZXIuanMiXSwibmFtZXMiOlsic3RhcnRUYWciLCJlbmRUYWciLCJhdHRyIiwiZW1wdHkiLCJtYWtlTWFwIiwiYmxvY2siLCJpbmxpbmUiLCJjbG9zZVNlbGYiLCJmaWxsQXR0cnMiLCJzcGVjaWFsIiwiSFRNTFBhcnNlciIsImh0bWwiLCJoYW5kbGVyIiwiaW5kZXgiLCJjaGFycyIsIm1hdGNoIiwic3RhY2siLCJsYXN0IiwibGVuZ3RoIiwiaW5kZXhPZiIsImNvbW1lbnQiLCJzdWJzdHJpbmciLCJyZXBsYWNlIiwicGFyc2VFbmRUYWciLCJwYXJzZVN0YXJ0VGFnIiwidGV4dCIsIlJlZ0V4cCIsImFsbCIsInRhZyIsInRhZ05hbWUiLCJyZXN0IiwidW5hcnkiLCJ0b0xvd2VyQ2FzZSIsInB1c2giLCJzdGFydCIsImF0dHJzIiwibmFtZSIsInZhbHVlIiwiYXJndW1lbnRzIiwiZXNjYXBlZCIsInBvcyIsImkiLCJlbmQiLCJzdHIiLCJvYmoiLCJpdGVtcyIsInNwbGl0IiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7Ozs7Ozs7OztBQWFBO0FBQ0EsSUFBSUEsV0FBVyxnSEFBZjtBQUFBLElBQ0NDLFNBQVMsNEJBRFY7QUFBQSxJQUVDQyxPQUFPLG9HQUZSOztBQUlBO0FBQ0EsSUFBSUMsUUFBUUMsUUFBUSxvR0FBUixDQUFaOztBQUVBO0FBQ0EsSUFBSUMsUUFBUUQsUUFBUSxvVEFBUixDQUFaOztBQUVBO0FBQ0EsSUFBSUUsU0FBU0YsUUFBUSw2TEFBUixDQUFiOztBQUVBO0FBQ0E7QUFDQSxJQUFJRyxZQUFZSCxRQUFRLGtEQUFSLENBQWhCOztBQUVBO0FBQ0EsSUFBSUksWUFBWUosUUFBUSx3R0FBUixDQUFoQjs7QUFFQTtBQUNBLElBQUlLLFVBQVVMLFFBQVEsb0RBQVIsQ0FBZDs7QUFFQSxTQUFTTSxVQUFULENBQW9CQyxJQUFwQixFQUEwQkMsT0FBMUIsRUFBbUM7QUFDbEMsS0FBSUMsS0FBSjtBQUFB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QUNBOztBQUVERyxPQUFPQyxPQUFQLEdBQWlCdEMsVUFBakIiLCJmaWxlIjoiaHRtbHBhcnNlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICpcbiAqIGh0bWxQYXJzZXLmlLnpgKDoh6o6IGh0dHBzOi8vZ2l0aHViLmNvbS9ibG93c2llL1B1cmUtSmF2YVNjcmlwdC1IVE1MNS1QYXJzZXJcbiAqXG4gKiBhdXRob3I6IERpICjlvq7kv6HlsI/nqIvluo/lvIDlj5Hlt6XnqIvluIgpXG4gKiBvcmdhbml6YXRpb246IFdlQXBwRGV2KOW+ruS/oeWwj+eoi+W6j+W8gOWPkeiuuuWdmykoaHR0cDovL3dlYXBwZGV2LmNvbSlcbiAqICAgICAgICAgICAgICAg5Z6C55u05b6u5L+h5bCP56iL5bqP5byA5Y+R5Lqk5rWB56S+5Yy6XG4gKlxuICogZ2l0aHVi5Zyw5Z2AOiBodHRwczovL2dpdGh1Yi5jb20vaWNpbmR5L3d4UGFyc2VcbiAqXG4gKiBmb3I6IOW+ruS/oeWwj+eoi+W6j+WvjOaWh+acrOino+aekFxuICogZGV0YWlsIDogaHR0cDovL3dlYXBwZGV2LmNvbS90L3d4cGFyc2UtYWxwaGEwLTEtaHRtbC1tYXJrZG93bi8xODRcbiAqL1xuLy8gUmVndWxhciBFeHByZXNzaW9ucyBmb3IgcGFyc2luZyB0YWdzIGFuZCBhdHRyaWJ1dGVzXG52YXIgc3RhcnRUYWcgPSAvXjwoWy1BLVphLXowLTlfXSspKCg/OlxccytbYS16QS1aXzpdWy1hLXpBLVowLTlfOi5dKig/Olxccyo9XFxzKig/Oig/OlwiW15cIl0qXCIpfCg/OidbXiddKicpfFtePlxcc10rKSk/KSopXFxzKihcXC8/KT4vLFxuXHRlbmRUYWcgPSAvXjxcXC8oWy1BLVphLXowLTlfXSspW14+XSo+Lyxcblx0YXR0ciA9IC8oW2EtekEtWl86XVstYS16QS1aMC05XzouXSopKD86XFxzKj1cXHMqKD86KD86XCIoKD86XFxcXC58W15cIl0pKilcIil8KD86JygoPzpcXFxcLnxbXiddKSopJyl8KFtePlxcc10rKSkpPy9nO1xuXG4vLyBFbXB0eSBFbGVtZW50cyAtIEhUTUwgNVxudmFyIGVtcHR5ID0gbWFrZU1hcChcImFyZWEsYmFzZSxiYXNlZm9udCxicixjb2wsZnJhbWUsaHIsaW1nLGlucHV0LGxpbmssbWV0YSxwYXJhbSxlbWJlZCxjb21tYW5kLGtleWdlbixzb3VyY2UsdHJhY2ssd2JyXCIpO1xuXG4vLyBCbG9jayBFbGVtZW50cyAtIEhUTUwgNVxudmFyIGJsb2NrID0gbWFrZU1hcChcImEsYWRkcmVzcyxjb2RlLGFydGljbGUsYXBwbGV0LGFzaWRlLGF1ZGlvLGJsb2NrcXVvdGUsYnV0dG9uLGNhbnZhcyxjZW50ZXIsZGQsZGVsLGRpcixkaXYsZGwsZHQsZmllbGRzZXQsZmlnY2FwdGlvbixmaWd1cmUsZm9vdGVyLGZvcm0sZnJhbWVzZXQsaDEsaDIsaDMsaDQsaDUsaDYsaGVhZGVyLGhncm91cCxocixpZnJhbWUsaW5zLGlzaW5kZXgsbGksbWFwLG1lbnUsbm9mcmFtZXMsbm9zY3JpcHQsb2JqZWN0LG9sLG91dHB1dCxwLHByZSxzZWN0aW9uLHNjcmlwdCx0YWJsZSx0Ym9keSx0ZCx0Zm9vdCx0aCx0aGVhZCx0cix1bCx2aWRlb1wiKTtcblxuLy8gSW5saW5lIEVsZW1lbnRzIC0gSFRNTCA1XG52YXIgaW5saW5lID0gbWFrZU1hcChcImFiYnIsYWNyb255bSxhcHBsZXQsYixiYXNlZm9udCxiZG8sYmlnLGJyLGJ1dHRvbixjaXRlLGRlbCxkZm4sZW0sZm9udCxpLGlmcmFtZSxpbWcsaW5wdXQsaW5zLGtiZCxsYWJlbCxtYXAsb2JqZWN0LHEscyxzYW1wLHNjcmlwdCxzZWxlY3Qsc21hbGwsc3BhbixzdHJpa2Usc3Ryb25nLHN1YixzdXAsdGV4dGFyZWEsdHQsdSx2YXJcIik7XG5cbi8vIEVsZW1lbnRzIHRoYXQgeW91IGNhbiwgaW50ZW50aW9uYWxseSwgbGVhdmUgb3BlblxuLy8gKGFuZCB3aGljaCBjbG9zZSB0aGVtc2VsdmVzKVxudmFyIGNsb3NlU2VsZiA9IG1ha2VNYXAoXCJjb2xncm91cCxkZCxkdCxsaSxvcHRpb25zLHAsdGQsdGZvb3QsdGgsdGhlYWQsdHJcIik7XG5cbi8vIEF0dHJpYnV0ZXMgdGhhdCBoYXZlIHRoZWlyIHZhbHVlcyBmaWxsZWQgaW4gZGlzYWJsZWQ9XCJkaXNhYmxlZFwiXG52YXIgZmlsbEF0dHJzID0gbWFrZU1hcChcImNoZWNrZWQsY29tcGFjdCxkZWNsYXJlLGRlZmVyLGRpc2FibGVkLGlzbWFwLG11bHRpcGxlLG5vaHJlZixub3Jlc2l6ZSxub3NoYWRlLG5vd3JhcCxyZWFkb25seSxzZWxlY3RlZFwiKTtcblxuLy8gU3BlY2lhbCBFbGVtZW50cyAoY2FuIGNvbnRhaW4gYW55dGhpbmcpXG52YXIgc3BlY2lhbCA9IG1ha2VNYXAoXCJ3eHh4Y29kZS1zdHlsZSxzY3JpcHQsc3R5bGUsdmlldyxzY3JvbGwtdmlldyxibG9ja1wiKTtcblxuZnVuY3Rpb24gSFRNTFBhcnNlcihodG1sLCBoYW5kbGVyKSB7XG5cdHZhciBpbmRleCwgY2hhcnMsIG1hdGNoLCBzdGFjayA9IFtdLCBsYXN0ID0gaHRtbDtcblx0c3RhY2subGFzdCA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gdGhpc1t0aGlzLmxlbmd0aCAtIDFdO1xuXHR9O1xuXG5cdHdoaWxlIChodG1sKSB7XG5cdFx0Y2hhcnMgPSB0cnVlO1xuXG5cdFx0Ly8gTWFrZSBzdXJlIHdlJ3JlIG5vdCBpbiBhIHNjcmlwdCBvciBzdHlsZSBlbGVtZW50XG5cdFx0aWYgKCFzdGFjay5sYXN0KCkgfHwgIXNwZWNpYWxbc3RhY2subGFzdCgpXSkge1xuXG5cdFx0XHQvLyBDb21tZW50XG5cdFx0XHRpZiAoaHRtbC5pbmRleE9mKFwiPCEtLVwiKSA9PSAwKSB7XG5cdFx0XHRcdGluZGV4ID0gaHRtbC5pbmRleE9mKFwiLS0+XCIpO1xuXG5cdFx0XHRcdGlmIChpbmRleCA+PSAwKSB7XG5cdFx0XHRcdFx0aWYgKGhhbmRsZXIuY29tbWVudClcblx0XHRcdFx0XHRcdGhhbmRsZXIuY29tbWVudChodG1sLnN1YnN0cmluZyg0LCBpbmRleCkpO1xuXHRcdFx0XHRcdGh0bWwgPSBodG1sLnN1YnN0cmluZyhpbmRleCArIDMpO1xuXHRcdFx0XHRcdGNoYXJzID0gZmFsc2U7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBlbmQgdGFnXG5cdFx0XHR9IGVsc2UgaWYgKGh0bWwuaW5kZXhPZihcIjwvXCIpID09IDApIHtcblx0XHRcdFx0bWF0Y2ggPSBodG1sLm1hdGNoKGVuZFRhZyk7XG5cblx0XHRcdFx0aWYgKG1hdGNoKSB7XG5cdFx0XHRcdFx0aHRtbCA9IGh0bWwuc3Vic3RyaW5nKG1hdGNoWzBdLmxlbmd0aCk7XG5cdFx0XHRcdFx0bWF0Y2hbMF0ucmVwbGFjZShlbmRUYWcsIHBhcnNlRW5kVGFnKTtcblx0XHRcdFx0XHRjaGFycyA9IGZhbHNlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gc3RhcnQgdGFnXG5cdFx0XHR9IGVsc2UgaWYgKGh0bWwuaW5kZXhPZihcIjxcIikgPT0gMCkge1xuXHRcdFx0XHRtYXRjaCA9IGh0bWwubWF0Y2goc3RhcnRUYWcpO1xuXG5cdFx0XHRcdGlmIChtYXRjaCkge1xuXHRcdFx0XHRcdGh0bWwgPSBodG1sLnN1YnN0cmluZyhtYXRjaFswXS5sZW5ndGgpO1xuXHRcdFx0XHRcdG1hdGNoWzBdLnJlcGxhY2Uoc3RhcnRUYWcsIHBhcnNlU3RhcnRUYWcpO1xuXHRcdFx0XHRcdGNoYXJzID0gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKGNoYXJzKSB7XG5cdFx0XHRcdGluZGV4ID0gaHRtbC5pbmRleE9mKFwiPFwiKTtcblx0XHRcdFx0dmFyIHRleHQgPSAnJ1xuXHRcdFx0XHR3aGlsZSAoaW5kZXggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0ICs9IFwiPFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGh0bWwgPSBodG1sLnN1YnN0cmluZygxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGh0bWwuaW5kZXhPZihcIjxcIik7XG5cdFx0XHRcdH1cblx0XHRcdFx0dGV4dCArPSBpbmRleCA8IDAgPyBodG1sIDogaHRtbC5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuXHRcdFx0XHRodG1sID0gaW5kZXggPCAwID8gXCJcIiA6IGh0bWwuc3Vic3RyaW5nKGluZGV4KTtcblxuXHRcdFx0XHRpZiAoaGFuZGxlci5jaGFycylcblx0XHRcdFx0XHRoYW5kbGVyLmNoYXJzKHRleHQpO1xuXHRcdFx0fVxuXG5cdFx0fSBlbHNlIHtcblxuXHRcdFx0aHRtbCA9IGh0bWwucmVwbGFjZShuZXcgUmVnRXhwKFwiKFtcXFxcc1xcXFxTXSo/KTxcXC9cIiArIHN0YWNrLmxhc3QoKSArIFwiW14+XSo+XCIpLCBmdW5jdGlvbiAoYWxsLCB0ZXh0KSB7XG5cdFx0XHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoLzwhLS0oW1xcc1xcU10qPyktLT58PCFcXFtDREFUQVxcWyhbXFxzXFxTXSo/KV1dPi9nLCBcIiQxJDJcIik7XG5cdFx0XHRcdGlmIChoYW5kbGVyLmNoYXJzKVxuXHRcdFx0XHRcdGhhbmRsZXIuY2hhcnModGV4dCk7XG5cblx0XHRcdFx0cmV0dXJuIFwiXCI7XG5cdFx0XHR9KTtcblxuXG5cdFx0XHRwYXJzZUVuZFRhZyhcIlwiLCBzdGFjay5sYXN0KCkpO1xuXHRcdH1cblxuXHRcdGlmIChodG1sID09IGxhc3QpXG5cdFx0XHR0aHJvdyBcIlBhcnNlIEVycm9yOiBcIiArIGh0bWw7XG5cdFx0bGFzdCA9IGh0bWw7XG5cdH1cblxuXHQvLyBDbGVhbiB1cCBhbnkgcmVtYWluaW5nIHRhZ3Ncblx0cGFyc2VFbmRUYWcoKTtcblxuXHRmdW5jdGlvbiBwYXJzZVN0YXJ0VGFnKHRhZywgdGFnTmFtZSwgcmVzdCwgdW5hcnkpIHtcblx0XHR0YWdOYW1lID0gdGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuXG5cdFx0aWYgKGJsb2NrW3RhZ05hbWVdKSB7XG5cdFx0XHR3aGlsZSAoc3RhY2subGFzdCgpICYmIGlubGluZVtzdGFjay5sYXN0KCldKSB7XG5cdFx0XHRcdHBhcnNlRW5kVGFnKFwiXCIsIHN0YWNrLmxhc3QoKSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKGNsb3NlU2VsZlt0YWdOYW1lXSAmJiBzdGFjay5sYXN0KCkgPT0gdGFnTmFtZSkge1xuXHRcdFx0cGFyc2VFbmRUYWcoXCJcIiwgdGFnTmFtZSk7XG5cdFx0fVxuXG5cdFx0dW5hcnkgPSBlbXB0eVt0YWdOYW1lXSB8fCAhIXVuYXJ5O1xuXG5cdFx0aWYgKCF1bmFyeSlcblx0XHRcdHN0YWNrLnB1c2godGFnTmFtZSk7XG5cblx0XHRpZiAoaGFuZGxlci5zdGFydCkge1xuXHRcdFx0dmFyIGF0dHJzID0gW107XG5cblx0XHRcdHJlc3QucmVwbGFjZShhdHRyLCBmdW5jdGlvbiAobWF0Y2gsIG5hbWUpIHtcblx0XHRcdFx0dmFyIHZhbHVlID0gYXJndW1lbnRzWzJdID8gYXJndW1lbnRzWzJdIDpcblx0XHRcdFx0XHRhcmd1bWVudHNbM10gPyBhcmd1bWVudHNbM10gOlxuXHRcdFx0XHRcdFx0YXJndW1lbnRzWzRdID8gYXJndW1lbnRzWzRdIDpcblx0XHRcdFx0XHRcdFx0ZmlsbEF0dHJzW25hbWVdID8gbmFtZSA6IFwiXCI7XG5cblx0XHRcdFx0YXR0cnMucHVzaCh7XG5cdFx0XHRcdFx0bmFtZTogbmFtZSxcblx0XHRcdFx0XHR2YWx1ZTogdmFsdWUsXG5cdFx0XHRcdFx0ZXNjYXBlZDogdmFsdWUucmVwbGFjZSgvKF58W15cXFxcXSlcIi9nLCAnJDFcXFxcXFxcIicpIC8vXCJcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0aWYgKGhhbmRsZXIuc3RhcnQpIHtcblx0XHRcdFx0aGFuZGxlci5zdGFydCh0YWdOYW1lLCBhdHRycywgdW5hcnkpO1xuXHRcdFx0fVxuXG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gcGFyc2VFbmRUYWcodGFnLCB0YWdOYW1lKSB7XG5cdFx0Ly8gSWYgbm8gdGFnIG5hbWUgaXMgcHJvdmlkZWQsIGNsZWFuIHNob3Bcblx0XHRpZiAoIXRhZ05hbWUpXG5cdFx0XHR2YXIgcG9zID0gMDtcblxuXHRcdC8vIEZpbmQgdGhlIGNsb3Nlc3Qgb3BlbmVkIHRhZyBvZiB0aGUgc2FtZSB0eXBlXG5cdFx0ZWxzZSB7XG5cdFx0XHR0YWdOYW1lID0gdGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0Zm9yICh2YXIgcG9zID0gc3RhY2subGVuZ3RoIC0gMTsgcG9zID49IDA7IHBvcy0tKVxuXHRcdFx0XHRpZiAoc3RhY2tbcG9zXSA9PSB0YWdOYW1lKVxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdH1cblx0XHRpZiAocG9zID49IDApIHtcblx0XHRcdC8vIENsb3NlIGFsbCB0aGUgb3BlbiBlbGVtZW50cywgdXAgdGhlIHN0YWNrXG5cdFx0XHRmb3IgKHZhciBpID0gc3RhY2subGVuZ3RoIC0gMTsgaSA+PSBwb3M7IGktLSlcblx0XHRcdFx0aWYgKGhhbmRsZXIuZW5kKVxuXHRcdFx0XHRcdGhhbmRsZXIuZW5kKHN0YWNrW2ldKTtcblxuXHRcdFx0Ly8gUmVtb3ZlIHRoZSBvcGVuIGVsZW1lbnRzIGZyb20gdGhlIHN0YWNrXG5cdFx0XHRzdGFjay5sZW5ndGggPSBwb3M7XG5cdFx0fVxuXHR9XG59O1xuXG5cbmZ1bmN0aW9uIG1ha2VNYXAoc3RyKSB7XG5cdHZhciBvYmogPSB7fSwgaXRlbXMgPSBzdHIuc3BsaXQoXCIsXCIpO1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSsrKVxuXHRcdG9ialtpdGVtc1tpXV0gPSB0cnVlO1xuXHRyZXR1cm4gb2JqO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEhUTUxQYXJzZXI7XG4iXX0=