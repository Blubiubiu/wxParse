'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * 
 * showdown: https://github.com/showdownjs/showdown
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

function getDefaultOpts(simple) {
  'use strict';

  var defaultOptions = {
    omitExtraWLInCodeBlocks: {
      defaultValue: false,
      describe: 'Omit the default extra whiteline added to code blocks',
      type: 'boolean'
    },
    noHeaderId: {
      defaultValue: false,
      describe: 'Turn on/off generated header id',
      type: 'boolean'
    },
    prefixHeaderId: {
      defaultValue: false,
      describe: 'Specify a prefix to generated header ids',
      type: 'string'
    },
    headerLevelStart: {
      defaultValue: false,
      describe: 'The header blocks level start',
      type: 'integer'
    },
    parseImgDimensions: {
      defaultValue: false,
      describe: 'Turn on/off image dimension parsing',
      type: 'boolean'
    },
    simplifiedAutoLink: {
      defaultValue: false,
      describe: 'Turn on/off GFM autolink style',
      type: 'boolean'
    },
    literalMidWordUnderscores: {
      defaultValue: false,
      describe: 'Parse midword underscores as literal underscores',
      type: 'boolean'
    },
    strikethrough: {
      defaultValue: false,
      describe: 'Turn on/off strikethrough support',
      type: 'boolean'
    },
    tables: {
      defaultValue: false,
      describe: 'Turn on/off tables support',
      type: 'boolean'
    },
    tablesHeaderId: {
      defaultValue: false,
      describe: 'Add an id to table headers',
      type: 'boolean'
    },
    ghCodeBlocks: {
      defaultValue: true,
      describe: 'Turn on/off GFM fenced code blocks support',
      type: 'boolean'
    },
    tasklists: {
      defaultValue: false,
      describe: 'Turn on/off GFM tasklist support',
      type: 'boolean'
    },
    smoothLivePreview: {
      defaultValue: false,
      describe: 'Prevents weird effects in live previews due to incomplete input',
      type: 'boolean'
    },
    smartIndentationFix: {
      defaultValue: false,
      description: 'Tries to smartly fix identation in es6 strings',
      type: 'boolean'
    }
  };
  if (simple === false) {
    return JSON.parse(JSON.stringify(defaultOptions));
  }
  var ret = {};
  for (var opt in defaultOptions) {
    if (defaultOptions.hasOwnProperty(opt)) {
      ret[opt] = defaultOptions[opt].defaultValue;
    }
  }
  return ret;
}

/**
 * Created by Tivie on 06-01-2015.
 */

// Private properties
var showdown = {},
    parsers = {},
    extensions = {},
    globalOptions = getDefaultOpts(true),
    flavor = {
  github: {
    omitExtraWLInCodeBlocks: true,
    prefixHeaderId: 'user-content-',
    simplifiedAutoLink: true,
    literalMidWordUnderscores: true,
    strikethrough: true,
    tables: true,
    tablesHeaderId: true,
    ghCodeBlocks: true,
    tasklists: true
  },
  vanilla: getDefaultOpts(true)
};

/**
 * helper namespace
 * @type {{}}
 */
showdown.helper = {};

/**
 * TODO LEGACY SUPPORT CODE
 * @type {{}}
 */
showdown.extensions = {};

/**
 * Set a global option
 * @static
 * @param {string} key
 * @param {*} value
 * @returns {showdown}
 */
showdown.setOption = function (key, value) {
  'use strict';

  globalOptions[key] = value;
  return this;
};

/**
 * Get a global option
 * @static
 * @param {string} key
 * @returns {*}
 */
showdown.getOption = function (key) {
  'use strict';

  return globalOptions[key];
};

/**
 * Get the global options
 * @static
 * @returns {{}}
 */
showdown.getOptions = function () {
  'use strict';

  return globalOptions;
};

/**
 * Reset global options to the default values
 * @static
 */
showdown.resetOptions = function () {
  'use strict';

  globalOptions = getDefaultOpts(true);
};

/**
 * Set the flavor showdown should use as default
 * @param {string} name
 */
showdown.setFlavor = function (name) {
  'use strict';

  if (flavor.hasOwnProperty(name)) {
    var preset = flavor[name];
    for (var option in preset) {
      if (preset.hasOwnProperty(option)) {
        globalOptions[option] = preset[option];
      }
    }
  }
};

/**
 * Get the default options
 * @static
 * @param {boolean} [simple=true]
 * @returns {{}}
 */
showdown.getDefaultOptions = function (simple) {
  'use strict';

  return getDefaultOpts(simple);
};

/**
 * Get or set a subParser
 *
 * subParser(name)       - Get a registered subParser
 * subParser(name, func) - Register a subParser
 * @static
 * @param {string} name
 * @param {function} [func]
 * @returns {*}
 */
showdown.subParser = function (name, func) {
  'use strict';

  if (showdown.helper.isString(name)) {
    if (typeof func !== 'undefined') {
      parsers[name] = func;
    } else {
      if (parsers.hasOwnProperty(name)) {
        return parsers[name];
      } else {
        throw Error('SubParser named ' + name + ' not registered!');
      }
    }
  }
};

/**
 * Gets or registers an extension
 * @static
 * @param {string} name
 * @param {object|function=} ext
 * @returns {*}
 */
showdown.extension = function (name, ext) {
  'use strict';

  if (!showdown.helper.isString(name)) {
    throw Error('Extension \'name\' must be a string');
  }

  name = showdown.helper.stdExtName(name);

  // Getter
  if (showdown.helper.isUndefined(ext)) {
    if (!extensions.hasOwnProperty(name)) {
      throw Error('Extension named ' + name + ' is not registered!');
    }
    return extensions[name];

    // Setter
  } else {
    // Expand extension if it's wrapped in a function
    if (typeof ext === 'function') {
      ext = ext();
    }

    // Ensure extension is an array
    if (!showdown.helper.isArray(ext)) {
      ext = [ext];
    }

    var validExtension = validate(ext, name);

    if (validExtension.valid) {
      extensions[name] = ext;
    } else {
      throw Error(validExtension.error);
    }
  }
};

/**
 * Gets all extensions registered
 * @returns {{}}
 */
showdown.getAllExtensions = function () {
  'use strict';

  return extensions;
};

/**
 * Remove an extension
 * @param {string} name
 */
showdown.removeExtension = function (name) {
  'use strict';

  delete extensions[name];
};

/**
 * Removes all extensions
 */
showdown.resetExtensions = function () {
  'use strict';

  extensions = {};
};

/**
 * Validate extension
 * @param {array} extension
 * @param {string} name
 * @returns {{valid: boolean, error: string}}
 */
function validate(extension, name) {
  'use strict';

  var errMsg = name ? 'Error in ' + name + ' extension->' : 'Error in unnamed extension',
      ret = {
    valid: true,
    error: ''
  };

  if (!showdown.helper.isArray(extension)) {
    extension = [extension];
  }

  for (var i = 0; i < extension.length; ++i) {
    var baseMsg = errMsg + ' sub-extension ' + i + ': ',
        ext = extension[i];
    if ((typeof ext === 'undefined' ? 'undefined' : _typeof(ext)) !== 'object') {
      ret.valid = false;
      ret.error = baseMsg + 'must be an object, but ' + (typeof ext === 'undefined' ? 'undefined' : _typeof(ext)) + ' given';
      return ret;
    }

    if (!showdown.helper.isString(ext.type)) {
      ret.valid = false;
      ret.error = baseMsg + 'property "type" must be a string, but ' + _typeof(ext.type) + ' given';
      return ret;
    }

    var type = ext.type = ext.type.toLowerCase();

    // normalize extension type
    if (type === 'language') {
      type = ext.type = 'lang';
    }

    if (type === 'html') {
      type = ext.type = 'output';
    }

    if (type !== 'lang' && type !== 'output' && type !== 'listener') {
      ret.valid = false;
      ret.error = baseMsg + 'type ' + type + ' is not recognized. Valid values: "lang/language", "output/html" or "listener"';
      return ret;
    }

    if (type === 'listener') {
      if (showdown.helper.isUndefined(ext.listeners)) {
        ret.valid = false;
        ret.error = baseMsg + '. Extensions of type "listener" must have a property called "listeners"';
        return ret;
      }
    } else {
      if (showdown.helper.isUndefined(ext.filter) && showdown.helper.isUndefined(ext.regex)) {
        ret.valid = false;
        ret.error = baseMsg + type + ' extensions must define either a "regex" property or a "filter" method';
        return ret;
      }
    }

    if (ext.listeners) {
      if (_typeof(ext.listeners) !== 'object') {
        ret.valid = false;
        ret.error = baseMsg + '"listeners" property must be an object but ' + _typeof(ext.listeners) + ' given';
        return ret;
      }
      for (var ln in ext.listeners) {
        if (ext.listeners.hasOwnProperty(ln)) {
          if (typeof ext.listeners[ln] !== 'function') {
            ret.valid = false;
            ret.error = baseMsg + '"listeners" property must be an hash of [event name]: [callback]. listeners.' + ln + ' must be a function but ' + _typeof(ext.listeners[ln]) + ' given';
            return ret;
          }
        }
      }
    }

    if (ext.filter) {
      if (typeof ext.filter !== 'function') {
        ret.valid = false;
        ret.error = baseMsg + '"filter" must be a function, but ' + _typeof(ext.filter) + ' given';
        return ret;
      }
    } else if (ext.regex) {
      if (showdown.helper.isString(ext.regex)) {
        ext.regex = new RegExp(ext.regex, 'g');
      }
      if (!ext.regex instanceof RegExp) {
        ret.valid = false;
        ret.error = baseMsg + '"regex" property must either be a string or a RegExp object, but ' + _typeof(ext.regex) + ' given';
        return ret;
      }
      if (showdown.helper.isUndefined(ext.replace)) {
        ret.valid = false;
        ret.error = baseMsg + '"regex" extensions must implement a replace string or function';
        return ret;
      }
    }
  }
  return ret;
}

/**
 * Validate extension
 * @param {object} ext
 * @returns {boolean}
 */
showdown.validateExtension = function (ext) {
  'use strict';

  var validateExtension = validate(ext, null);
  if (!validateExtension.valid) {
    console.warn(validateExtension.error);
    return false;
  }
  return true;
};

/**
 * showdownjs helper functions
 */

if (!showdown.hasOwnProperty('helper')) {
  showdown.helper = {};
}

/**
 * Check if var is string
 * @static
 * @param {string} a
 * @returns {boolean}
 */
showdown.helper.isString = function isString(a) {
  'use strict';

  return typeof a === 'string' || a instanceof String;
};

/**
 * Check if var is a function
 * @static
 * @param {string} a
 * @returns {boolean}
 */
showdown.helper.isFunction = function isFunction(a) {
  'use strict';

  var getType = {};
  return a && getType.toString.call(a) === '[object Function]';
};

/**
 * ForEach helper function
 * @static
 * @param {*} obj
 * @param {function} callback
 */
showdown.helper.forEach = function forEach(obj, callback) {
  'use strict';

  if (typeof obj.forEach === 'function') {
    obj.forEach(callback);
  } else {
    for (var i = 0; i < obj.length; i++) {
      callback(obj[i], i, obj);
    }
  }
};

/**
 * isArray helper function
 * @static
 * @param {*} a
 * @returns {boolean}
 */
showdown.helper.isArray = function isArray(a) {
  'use strict';

  return a.constructor === Array;
};

/**
 * Check if value is undefined
 * @static
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `undefined`, else `false`.
 */
showdown.helper.isUndefined = function isUndefined(value) {
  'use strict';

  return typeof value === 'undefined';
};

/**
 * Standardidize extension name
 * @static
 * @param {string} s extension name
 * @returns {string}
 */
showdown.helper.stdExtName = function (s) {
  'use strict';

  return s.replace(/[_-]||\s/g, '').toLowerCase();
};

function escapeCharactersCallback(wholeMatch, m1) {
  'use strict';

  var charCodeToEscape = m1.charCodeAt(0);
  return '~E' + charCodeToEscape + 'E';
}

/**
 * Callback used to escape characters when passing through String.replace
 * @static
 * @param {string} wholeMatch
 * @param {string} m1
 * @returns {string}
 */
showdown.helper.escapeCharactersCallback = escapeCharactersCallback;

/**
 * Escape characters in a string
 * @static
 * @param {string} text
 * @param {string} charsToEscape
 * @param {boolean} afterBackslash
 * @returns {XML|string|void|*}
 */
showdown.helper.escapeCharacters = function escapeCharacters(text, charsToEscape, afterBackslash) {
  'use strict';
  // First we have to escape the escape characters so that
  // we can build a character class out of them

  var regexString = '([' + charsToEscape.replace(/([\[\]\\])/g, '\\$1') + '])';

  if (afterBackslash) {
    regexString = '\\\\' + regexString;
  }

  var regex = new RegExp(regexString, 'g');
  text = text.replace(regex, escapeCharactersCallback);

  return text;
};

var rgxFindMatchPos = function rgxFindMatchPos(str, left, right, flags) {
  'use strict';

  var f = flags || '',
      g = f.indexOf('g') > -1,
      x = new RegExp(left + '|' + right, 'g' + f.replace(/g/g, '')),
      l = new RegExp(left, f.replace(/g/g, '')),
      pos = [],
      t,
      s,
      m,
      start,
      end;

  do {
    t = 0;
    while (m = x.exec(str)) {
      if (l.test(m[0])) {
        if (!t++) {
          s = x.lastIndex;
          start = s - m[0].length;
        }
      } else if (t) {
        if (! --t) {
          end = m.index + m[0].length;
          var obj = {
            left: { start: start, end: s },
            match: { start: s, end: m.index },
            right: { start: m.index, end: end },
            wholeMatch: { start: start, end: end }
          };
          pos.push(obj);
          if (!g) {
            return pos;
          }
        }
      }
    }
  } while (t && (x.lastIndex = s));

  return pos;
};

/**
 * matchRecursiveRegExp
 *
 * (c) 2007 Steven Levithan <stevenlevithan.com>
 * MIT License
 *
 * Accepts a string to search, a left and right format delimiter
 * as regex patterns, and optional regex flags. Returns an array
 * of matches, allowing nested instances of left/right delimiters.
 * Use the "g" flag to return all matches, otherwise only the
 * first is returned. Be careful to ensure that the left and
 * right format delimiters produce mutually exclusive matches.
 * Backreferences are not supported within the right delimiter
 * due to how it is internally combined with the left delimiter.
 * When matching strings whose format delimiters are unbalanced
 * to the left or right, the output is intentionally as a
 * conventional regex library with recursion support would
 * produce, e.g. "<<x>" and "<x>>" both produce ["x"] when using
 * "<" and ">" as the delimiters (both strings contain a single,
 * balanced instance of "<x>").
 *
 * examples:
 * matchRecursiveRegExp("test", "\\(", "\\)")
 * returns: []
 * matchRecursiveRegExp("<t<<e>><s>>t<>", "<", ">", "g")
 * returns: ["t<<e>><s>", ""]
 * matchRecursiveRegExp("<div id=\"x\">test</div>", "<div\\b[^>]*>", "</div>", "gi")
 * returns: ["test"]
 */
showdown.helper.matchRecursiveRegExp = function (str, left, right, flags) {
  'use strict';

  var matchPos = rgxFindMatchPos(str, left, right, flags),
      results = [];

  for (var i = 0; i < matchPos.length; ++i) {
    results.push([str.slice(matchPos[i].wholeMatch.start, matchPos[i].wholeMatch.end), str.slice(matchPos[i].match.start, matchPos[i].match.end), str.slice(matchPos[i].left.start, matchPos[i].left.end), str.slice(matchPos[i].right.start, matchPos[i].right.end)]);
  }
  return results;
};

/**
 *
 * @param {string} str
 * @param {string|function} replacement
 * @param {string} left
 * @param {string} right
 * @param {string} flags
 * @returns {string}
 */
showdown.helper.replaceRecursiveRegExp = function (str, replacement, left, right, flags) {
  'use strict';

  if (!showdown.helper.isFunction(replacement)) {
    var repStr = replacement;
    replacement = function replacement() {
      return repStr;
    };
  }

  var matchPos = rgxFindMatchPos(str, left, right, flags),
      finalStr = str,
      lng = matchPos.length;

  if (lng > 0) {
    var bits = [];
    if (matchPos[0].wholeMatch.start !== 0) {
      bits.push(str.slice(0, matchPos[0].wholeMatch.start));
    }
    for (var i = 0; i < lng; ++i) {
      bits.push(replacement(str.slice(matchPos[i].wholeMatch.start, matchPos[i].wholeMatch.end), str.slice(matchPos[i].match.start, matchPos[i].match.end), str.slice(matchPos[i].left.start, matchPos[i].left.end), str.slice(matchPos[i].right.start, matchPos[i].right.end)));
      if (i < lng - 1) {
        bits.push(str.slice(matchPos[i].wholeMatch.end, matchPos[i + 1].wholeMatch.start));
      }
    }
    if (matchPos[lng - 1].wholeMatch.end < str.length) {
      bits.push(str.slice(matchPos[lng - 1].wholeMatch.end));
    }
    finalStr = bits.join('');
  }
  return finalStr;
};

/**
 * POLYFILLS
 */
if (showdown.helper.isUndefined(console)) {
  console = {
    warn: function warn(msg) {
      'use strict';

      alert(msg);
    },
    log: function log(msg) {
      'use strict';

      alert(msg);
    },
    error: function error(msg) {
      'use strict';

      throw msg;
    }
  };
}

/**
 * Created by Estevao on 31-05-2015.
 */

/**
 * Showdown Converter class
 * @class
 * @param {object} [converterOptions]
 * @returns {Converter}
 */
showdown.Converter = function (converterOptions) {
  'use strict';

  var
  /**
   * Options used by this converter
   * @private
   * @type {{}}
   */
  options = {},


  /**
   * Language extensions used by this converter
   * @private
   * @type {Array}
   */
  langExtensions = [],


  /**
   * Output modifiers extensions used by this converter
   * @private
   * @type {Array}
   */
  outputModifiers = [],


  /**
   * Event listeners
   * @private
   * @type {{}}
   */
  listeners = {};

  _constructor();

  /**
   * Converter constructor
   * @private
   */
  function _constructor() {
    converterOptions = converterOptions || {};

    for (var gOpt in globalOptions) {
      if (globalOptions.hasOwnProperty(gOpt)) {
        options[gOpt] = globalOptions[gOpt];
      }
    }

    // Merge options
    if ((typeof converterOptions === 'undefined' ? 'undefined' : _typeof(converterOptions)) === 'object') {
      for (var opt in converterOptions) {
        if (converterOptions.hasOwnProperty(opt)) {
          options[opt] = converterOptions[opt];
        }
      }
    } else {
      throw Error('Converter expects the passed parameter to be an object, but ' + (typeof converterOptions === 'undefined' ? 'undefined' : _typeof(converterOptions)) + ' was passed instead.');
    }

    if (options.extensions) {
      showdown.helper.forEach(options.extensions, _parseExtension);
    }
  }

  /**
   * Parse extension
   * @param {*} ext
   * @param {string} [name='']
   * @private
   */
  function _parseExtension(ext, name) {

    name = name || null;
    // If it's a string, the extension was previously loaded
    if (showdown.helper.isString(ext)) {
      ext = showdown.helper.stdExtName(ext);
      name = ext;

      // LEGACY_SUPPORT CODE
      if (showdown.extensions[ext]) {
        console.warn('DEPRECATION WARNING: ' + ext + ' is an old extension that uses a deprecated loading method.' + 'Please inform the developer that the extension should be updated!');
        legacyExtensionLoading(showdown.extensions[ext], ext);
        return;
        // END LEGACY SUPPORT CODE
      } else if (!showdown.helper.isUndefined(extensions[ext])) {
        ext = extensions[ext];
      } else {
        throw Error('Extension "' + ext + '" could not be loaded. It was either not found or is not a valid extension.');
      }
    }

    if (typeof ext === 'function') {
      ext = ext();
    }

    if (!showdown.helper.isArray(ext)) {
      ext = [ext];
    }

    var validExt = validate(ext, name);
    if (!validExt.valid) {
      throw Error(validExt.error);
    }

    for (var i = 0; i < ext.length; ++i) {
      switch (ext[i].type) {

        case 'lang':
          langExtensions.push(ext[i]);
          break;

        case 'output':
          outputModifiers.push(ext[i]);
          break;
      }
      if (ext[i].hasOwnProperty(listeners)) {
        for (var ln in ext[i].listeners) {
          if (ext[i].listeners.hasOwnProperty(ln)) {
            listen(ln, ext[i].listeners[ln]);
          }
        }
      }
    }
  }

  /**
   * LEGACY_SUPPORT
   * @param {*} ext
   * @param {string} name
   */
  function legacyExtensionLoading(ext, name) {
    if (typeof ext === 'function') {
      ext = ext(new showdown.Converter());
    }
    if (!showdown.helper.isArray(ext)) {
      ext = [ext];
    }
    var valid = validate(ext, name);

    if (!valid.valid) {
      throw Error(valid.error);
    }

    for (var i = 0; i < ext.length; ++i) {
      switch (ext[i].type) {
        case 'lang':
          langExtensions.push(ext[i]);
          break;
        case 'output':
          outputModifiers.push(ext[i]);
          break;
        default:
          // should never reach here
          throw Error('Extension loader error: Type unrecognized!!!');
      }
    }
  }

  /**
   * Listen to an event
   * @param {string} name
   * @param {function} callback
   */
  function listen(name, callback) {
    if (!showdown.helper.isString(name)) {
      throw Error('Invalid argument in converter.listen() method: name must be a string, but ' + (typeof name === 'undefined' ? 'undefined' : _typeof(name)) + ' given');
    }

    if (typeof callback !== 'function') {
      throw Error('Invalid argument in converter.listen() method: callback must be a function, but ' + (typeof callback === 'undefined' ? 'undefined' : _typeof(callback)) + ' given');
    }

    if (!listeners.hasOwnProperty(name)) {
      listeners[name] = [];
    }
    listeners[name].push(callback);
  }

  function rTrimInputText(text) {
    var rsp = text.match(/^\s*/)[0].length,
        rgx = new RegExp('^\\s{0,' + rsp + '}', 'gm');
    return text.replace(rgx, '');
  }

  /**
   * Dispatch an event
   * @private
   * @param {string} evtName Event name
   * @param {string} text Text
   * @param {{}} options Converter Options
   * @param {{}} globals
   * @returns {string}
   */
  this._dispatch = function dispatch(evtName, text, options, globals) {
    if (listeners.hasOwnProperty(evtName)) {
      for (var ei = 0; ei < listeners[evtName].length; ++ei) {
        var nText = listeners[evtName][ei](evtName, text, this, options, globals);
        if (nText && typeof nText !== 'undefined') {
          text = nText;
        }
      }
    }
    return text;
  };

  /**
   * Listen to an event
   * @param {string} name
   * @param {function} callback
   * @returns {showdown.Converter}
   */
  this.listen = function (name, callback) {
    listen(name, callback);
    return this;
  };

  /**
   * Converts a markdown string into HTML
   * @param {string} text
   * @returns {*}
   */
  this.makeHtml = function (text) {
    //check if text is not falsy
    if (!text) {
      return text;
    }

    var globals = {
      gHtmlBlocks: [],
      gHtmlMdBlocks: [],
      gHtmlSpans: [],
      gUrls: {},
      gTitles: {},
      gDimensions: {},
      gListLevel: 0,
      hashLinkCounts: {},
      langExtensions: langExtensions,
      outputModifiers: outputModifiers,
      converter: this,
      ghCodeBlocks: []
    };

    // attacklab: Replace ~ with ~T
    // This lets us use tilde as an escape char to avoid md5 hashes
    // The choice of character is arbitrary; anything that isn't
    // magic in Markdown will work.
    text = text.replace(/~/g, '~T');

    // attacklab: Replace $ with ~D
    // RegExp interprets $ as a special character
    // when it's in a replacement string
    text = text.replace(/\$/g, '~D');

    // Standardize line endings
    text = text.replace(/\r\n/g, '\n'); // DOS to Unix
    text = text.replace(/\r/g, '\n'); // Mac to Unix

    if (options.smartIndentationFix) {
      text = rTrimInputText(text);
    }

    // Make sure text begins and ends with a couple of newlines:
    //text = '\n\n' + text + '\n\n';
    text = text;
    // detab
    text = showdown.subParser('detab')(text, options, globals);

    // stripBlankLines
    text = showdown.subParser('stripBlankLines')(text, options, globals);

    //run languageExtensions
    showdown.helper.forEach(langExtensions, function (ext) {
      text = showdown.subParser('runExtension')(ext, text, options, globals);
    });

    // run the sub parsers
    text = showdown.subParser('hashPreCodeTags')(text, options, globals);
    text = showdown.subParser('githubCodeBlocks')(text, options, globals);
    text = showdown.subParser('hashHTMLBlocks')(text, options, globals);
    text = showdown.subParser('hashHTMLSpans')(text, options, globals);
    text = showdown.subParser('stripLinkDefinitions')(text, options, globals);
    text = showdown.subParser('blockGamut')(text, options, globals);
    text = showdown.subParser('unhashHTMLSpans')(text, options, globals);
    text = showdown.subParser('unescapeSpecialChars')(text, options, globals);

    // attacklab: Restore dollar signs
    text = text.replace(/~D/g, '$$');

    // attacklab: Restore tildes
    text = text.replace(/~T/g, '~');

    // Run output modifiers
    showdown.helper.forEach(outputModifiers, function (ext) {
      text = showdown.subParser('runExtension')(ext, text, options, globals);
    });
    return text;
  };

  /**
   * Set an option of this Converter instance
   * @param {string} key
   * @param {*} value
   */
  this.setOption = function (key, value) {
    options[key] = value;
  };

  /**
   * Get the option of this Converter instance
   * @param {string} key
   * @returns {*}
   */
  this.getOption = function (key) {
    return options[key];
  };

  /**
   * Get the options of this Converter instance
   * @returns {{}}
   */
  this.getOptions = function () {
    return options;
  };

  /**
   * Add extension to THIS converter
   * @param {{}} extension
   * @param {string} [name=null]
   */
  this.addExtension = function (extension, name) {
    name = name || null;
    _parseExtension(extension, name);
  };

  /**
   * Use a global registered extension with THIS converter
   * @param {string} extensionName Name of the previously registered extension
   */
  this.useExtension = function (extensionName) {
    _parseExtension(extensionName);
  };

  /**
   * Set the flavor THIS converter should use
   * @param {string} name
   */
  this.setFlavor = function (name) {
    if (flavor.hasOwnProperty(name)) {
      var preset = flavor[name];
      for (var option in preset) {
        if (preset.hasOwnProperty(option)) {
          options[option] = preset[option];
        }
      }
    }
  };

  /**
   * Remove an extension from THIS converter.
   * Note: This is a costly operation. It's better to initialize a new converter
   * and specify the extensions you wish to use
   * @param {Array} extension
   */
  this.removeExtension = function (extension) {
    if (!showdown.helper.isArray(extension)) {
      extension = [extension];
    }
    for (var a = 0; a < extension.length; ++a) {
      var ext = extension[a];
      for (var i = 0; i < langExtensions.length; ++i) {
        if (langExtensions[i] === ext) {
          langExtensions[i].splice(i, 1);
        }
      }
      for (var ii = 0; ii < outputModifiers.length; ++i) {
        if (outputModifiers[ii] === ext) {
          outputModifiers[ii].splice(i, 1);
        }
      }
    }
  };

  /**
   * Get all extension of THIS converter
   * @returns {{language: Array, output: Array}}
   */
  this.getAllExtensions = function () {
    return {
      language: langExtensions,
      output: outputModifiers
    };
  };
};

/**
 * Turn Markdown link shortcuts into XHTML <a> tags.
 */
showdown.subParser('anchors', function (text, options, globals) {
  'use strict';

  text = globals.converter._dispatch('anchors.before', text, options, globals);

  var writeAnchorTag = function writeAnchorTag(wholeMatch, m1, m2, m3, m4, m5, m6, m7) {
    if (showdown.helper.isUndefined(m7)) {
      m7 = '';
    }
    wholeMatch = m1;
    var linkText = m2,
        linkId = m3.toLowerCase(),
        url = m4,
        title = m7;

    if (!url) {
      if (!linkId) {
        // lower-case and turn embedded newlines into spaces
        linkId = linkText.toLowerCase().replace(/ ?\n/g, ' ');
      }
      url = '#' + linkId;

      if (!showdown.helper.isUndefined(globals.gUrls[linkId])) {
        url = globals.gUrls[linkId];
        if (!showdown.helper.isUndefined(globals.gTitles[linkId])) {
          title = globals.gTitles[linkId];
        }
      } else {
        if (wholeMatch.search(/\(\s*\)$/m) > -1) {
          // Special case for explicit empty url
          url = '';
        } else {
          return wholeMatch;
        }
      }
    }

    url = showdown.helper.escapeCharacters(url, '*_', false);
    var result = '<a href="' + url + '"';

    if (title !== '' && title !== null) {
      title = title.replace(/"/g, '&quot;');
      title = showdown.helper.escapeCharacters(title, '*_', false);
      result += ' title="' + title + '"';
    }

    result += '>' + linkText + '</a>';

    return result;
  };

  // First, handle reference-style links: [link text] [id]
  /*
   text = text.replace(/
   (							// wrap whole match in $1
   \[
   (
   (?:
   \[[^\]]*\]		// allow brackets nested one level
   |
   [^\[]			// or anything else
   )*
   )
   \]
    [ ]?					// one optional space
   (?:\n[ ]*)?				// one optional newline followed by spaces
    \[
   (.*?)					// id = $3
   \]
   )()()()()					// pad remaining backreferences
   /g,_DoAnchors_callback);
   */
  text = text.replace(/(\[((?:\[[^\]]*]|[^\[\]])*)][ ]?(?:\n[ ]*)?\[(.*?)])()()()()/g, writeAnchorTag);

  //
  // Next, inline-style links: [link text](url "optional title")
  //

  /*
   text = text.replace(/
   (						// wrap whole match in $1
   \[
   (
   (?:
   \[[^\]]*\]	// allow brackets nested one level
   |
   [^\[\]]			// or anything else
   )
   )
   \]
   \(						// literal paren
   [ \t]*
   ()						// no id, so leave $3 empty
   <?(.*?)>?				// href = $4
   [ \t]*
   (						// $5
   (['"])				// quote char = $6
   (.*?)				// Title = $7
   \6					// matching quote
   [ \t]*				// ignore any spaces/tabs between closing quote and )
   )?						// title is optional
   \)
   )
   /g,writeAnchorTag);
   */
  text = text.replace(/(\[((?:\[[^\]]*]|[^\[\]])*)]\([ \t]*()<?(.*?(?:\(.*?\).*?)?)>?[ \t]*((['"])(.*?)\6[ \t]*)?\))/g, writeAnchorTag);

  //
  // Last, handle reference-style shortcuts: [link text]
  // These must come last in case you've also got [link test][1]
  // or [link test](/foo)
  //

  /*
   text = text.replace(/
   (                // wrap whole match in $1
   \[
   ([^\[\]]+)       // link text = $2; can't contain '[' or ']'
   \]
   )()()()()()      // pad rest of backreferences
   /g, writeAnchorTag);
   */
  text = text.replace(/(\[([^\[\]]+)])()()()()()/g, writeAnchorTag);

  text = globals.converter._dispatch('anchors.after', text, options, globals);
  return text;
});

showdown.subParser('autoLinks', function (text, options, globals) {
  'use strict';

  text = globals.converter._dispatch('autoLinks.before', text, options, globals);

  var simpleURLRegex = /\b(((https?|ftp|dict):\/\/|www\.)[^'">\s]+\.[^'">\s]+)(?=\s|$)(?!["<>])/gi,
      delimUrlRegex = /<(((https?|ftp|dict):\/\/|www\.)[^'">\s]+)>/gi,
      simpleMailRegex = /(?:^|[ \n\t])([A-Za-z0-9!#$%&'*+-/=?^_`\{|}~\.]+@[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+)(?:$|[ \n\t])/gi,
      delimMailRegex = /<(?:mailto:)?([-.\w]+@[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+)>/gi;

  text = text.replace(delimUrlRegex, replaceLink);
  text = text.replace(delimMailRegex, replaceMail);
  // simpleURLRegex  = /\b(((https?|ftp|dict):\/\/|www\.)[-.+~:?#@!$&'()*,;=[\]\w]+)\b/gi,
  // Email addresses: <address@domain.foo>

  if (options.simplifiedAutoLink) {
    text = text.replace(simpleURLRegex, replaceLink);
    text = text.replace(simpleMailRegex, replaceMail);
  }

  function replaceLink(wm, link) {
    var lnkTxt = link;
    if (/^www\./i.test(link)) {
      link = link.replace(/^www\./i, 'http://www.');
    }
    return '<a href="' + link + '">' + lnkTxt + '</a>';
  }

  function replaceMail(wholeMatch, m1) {
    var unescapedStr = showdown.subParser('unescapeSpecialChars')(m1);
    return showdown.subParser('encodeEmailAddress')(unescapedStr);
  }

  text = globals.converter._dispatch('autoLinks.after', text, options, globals);

  return text;
});

/**
 * These are all the transformations that form block-level
 * tags like paragraphs, headers, and list items.
 */
showdown.subParser('blockGamut', function (text, options, globals) {
  'use strict';

  text = globals.converter._dispatch('blockGamut.before', text, options, globals);

  // we parse blockquotes first so that we can have headings and hrs
  // inside blockquotes
  text = showdown.subParser('blockQuotes')(text, options, globals);
  text = showdown.subParser('headers')(text, options, globals);

  // Do Horizontal Rules:
  var key = showdown.subParser('hashBlock')('<hr />', options, globals);
  text = text.replace(/^[ ]{0,2}([ ]?\*[ ]?){3,}[ \t]*$/gm, key);
  text = text.replace(/^[ ]{0,2}([ ]?\-[ ]?){3,}[ \t]*$/gm, key);
  text = text.replace(/^[ ]{0,2}([ ]?_[ ]?){3,}[ \t]*$/gm, key);

  text = showdown.subParser('lists')(text, options, globals);
  text = showdown.subParser('codeBlocks')(text, options, globals);
  text = showdown.subParser('tables')(text, options, globals);

  // We already ran _HashHTMLBlocks() before, in Markdown(), but that
  // was to escape raw HTML in the original Markdown source. This time,
  // we're escaping the markup we've just created, so that we don't wrap
  // <p> tags around block-level tags.
  text = showdown.subParser('hashHTMLBlocks')(text, options, globals);
  text = showdown.subParser('paragraphs')(text, options, globals);

  text = globals.converter._dispatch('blockGamut.after', text, options, globals);

  return text;
});

showdown.subParser('blockQuotes', function (text, options, globals) {
  'use strict';

  text = globals.converter._dispatch('blockQuotes.before', text, options, globals);
  /*
   text = text.replace(/
   (								// Wrap whole match in $1
   (
   ^[ \t]*>[ \t]?			// '>' at the start of a line
   .+\n					// rest of the first line
   (.+\n)*					// subsequent consecutive lines
   \n*						// blanks
   )+
   )
   /gm, function(){...});
   */

  text = text.replace(/((^[ \t]{0,3}>[ \t]?.+\n(.+\n)*\n*)+)/gm, function (wholeMatch, m1) {
    var bq = m1;

    // attacklab: hack around Konqueror 3.5.4 bug:
    // "----------bug".replace(/^-/g,"") == "bug"
    bq = bq.replace(/^[ \t]*>[ \t]?/gm, '~0'); // trim one level of quoting

    // attacklab: clean up hack
    bq = bq.replace(/~0/g, '');

    bq = bq.replace(/^[ \t]+$/gm, ''); // trim whitespace-only lines
    bq = showdown.subParser('githubCodeBlocks')(bq, options, globals);
    bq = showdown.subParser('blockGamut')(bq, options, globals); // recurse

    bq = bq.replace(/(^|\n)/g, '$1  ');
    // These leading spaces screw with <pre> content, so we need to fix that:
    bq = bq.replace(/(\s*<pre>[^\r]+?<\/pre>)/gm, function (wholeMatch, m1) {
      var pre = m1;
      // attacklab: hack around Konqueror 3.5.4 bug:
      pre = pre.replace(/^  /mg, '~0');
      pre = pre.replace(/~0/g, '');
      return pre;
    });

    return showdown.subParser('hashBlock')('<blockquote>\n' + bq + '\n</blockquote>', options, globals);
  });

  text = globals.converter._dispatch('blockQuotes.after', text, options, globals);
  return text;
});

/**
 * Process Markdown `<pre><code>` blocks.
 */
showdown.subParser('codeBlocks', function (text, options, globals) {
  'use strict';

  text = globals.converter._dispatch('codeBlocks.before', text, options, globals);
  /*
   text = text.replace(text,
   /(?:\n\n|^)
   (								// $1 = the code block -- one or more lines, starting with a space/tab
   (?:
   (?:[ ]{4}|\t)			// Lines must start with a tab or a tab-width of spaces - attacklab: g_tab_width
   .*\n+
   )+
   )
   (\n*[ ]{0,3}[^ \t\n]|(?=~0))	// attacklab: g_tab_width
   /g,function(){...});
   */

  // attacklab: sentinel workarounds for lack of \A and \Z, safari\khtml bug
  text += '~0';

  var pattern = /(?:\n\n|^)((?:(?:[ ]{4}|\t).*\n+)+)(\n*[ ]{0,3}[^ \t\n]|(?=~0))/g;
  text = text.replace(pattern, function (wholeMatch, m1, m2) {
    var codeblock = m1,
        nextChar = m2,
        end = '\n';

    codeblock = showdown.subParser('outdent')(codeblock);
    codeblock = showdown.subParser('encodeCode')(codeblock);
    codeblock = showdown.subParser('detab')(codeblock);
    codeblock = codeblock.replace(/^\n+/g, ''); // trim leading newlines
    codeblock = codeblock.replace(/\n+$/g, ''); // trim trailing newlines

    if (options.omitExtraWLInCodeBlocks) {
      end = '';
    }

    codeblock = '<pre><code>' + codeblock + end + '</code></pre>';

    return showdown.subParser('hashBlock')(codeblock, options, globals) + nextChar;
  });

  // attacklab: strip sentinel
  text = text.replace(/~0/, '');

  text = globals.converter._dispatch('codeBlocks.after', text, options, globals);
  return text;
});

/**
 *
 *   *  Backtick quotes are used for <code></code> spans.
 *
 *   *  You can use multiple backticks as the delimiters if you want to
 *     include literal backticks in the code span. So, this input:
 *
 *         Just type ``foo `bar` baz`` at the prompt.
 *
 *       Will translate to:
 *
 *         <p>Just type <code>foo `bar` baz</code> at the prompt.</p>
 *
 *    There's no arbitrary limit to the number of backticks you
 *    can use as delimters. If you need three consecutive backticks
 *    in your code, use four for delimiters, etc.
 *
 *  *  You can use spaces to get literal backticks at the edges:
 *
 *         ... type `` `bar` `` ...
 *
 *       Turns to:
 *
 *         ... type <code>`bar`</code> ...
 */
showdown.subParser('codeSpans', function (text, options, globals) {
  'use strict';

  text = globals.converter._dispatch('codeSpans.before', text, options, globals);

  /*
   text = text.replace(/
   (^|[^\\])					// Character before opening ` can't be a backslash
   (`+)						// $2 = Opening run of `
   (							// $3 = The code block
   [^\r]*?
   [^`]					// attacklab: work around lack of lookbehind
   )
   \2							// Matching closer
   (?!`)
   /gm, function(){...});
   */

  if (typeof text === 'undefined') {
    text = '';
  }
  text = text.replace(/(^|[^\\])(`+)([^\r]*?[^`])\2(?!`)/gm, function (wholeMatch, m1, m2, m3) {
    var c = m3;
    c = c.replace(/^([ \t]*)/g, ''); // leading whitespace
    c = c.replace(/[ \t]*$/g, ''); // trailing whitespace
    c = showdown.subParser('encodeCode')(c);
    return m1 + '<code>' + c + '</code>';
  });

  text = globals.converter._dispatch('codeSpans.after', text, options, globals);
  return text;
});

/**
 * Convert all tabs to spaces
 */
showdown.subParser('detab', function (text) {
  'use strict';

  // expand first n-1 tabs

  text = text.replace(/\t(?=\t)/g, '    '); // g_tab_width

  // replace the nth with two sentinels
  text = text.replace(/\t/g, '~A~B');

  // use the sentinel to anchor our regex so it doesn't explode
  text = text.replace(/~B(.+?)~A/g, function (wholeMatch, m1) {
    var leadingText = m1,
        numSpaces = 4 - leadingText.length % 4; // g_tab_width

    // there *must* be a better way to do this:
    for (var i = 0; i < numSpaces; i++) {
      leadingText += ' ';
    }

    return leadingText;
  });

  // clean up sentinels
  text = text.replace(/~A/g, '    '); // g_tab_width
  text = text.replace(/~B/g, '');

  return text;
});

/**
 * Smart processing for ampersands and angle brackets that need to be encoded.
 */
showdown.subParser('encodeAmpsAndAngles', function (text) {
  'use strict';
  // Ampersand-encoding based entirely on Nat Irons's Amputator MT plugin:
  // http://bumppo.net/projects/amputator/

  text = text.replace(/&(?!#?[xX]?(?:[0-9a-fA-F]+|\w+);)/g, '&amp;');

  // Encode naked <'s
  text = text.replace(/<(?![a-z\/?\$!])/gi, '&lt;');

  return text;
});

/**
 * Returns the string, with after processing the following backslash escape sequences.
 *
 * attacklab: The polite way to do this is with the new escapeCharacters() function:
 *
 *    text = escapeCharacters(text,"\\",true);
 *    text = escapeCharacters(text,"`*_{}[]()>#+-.!",true);
 *
 * ...but we're sidestepping its use of the (slow) RegExp constructor
 * as an optimization for Firefox.  This function gets called a LOT.
 */
showdown.subParser('encodeBackslashEscapes', function (text) {
  'use strict';

  text = text.replace(/\\(\\)/g, showdown.helper.escapeCharactersCallback);
  text = text.replace(/\\([`*_{}\[\]()>#+-.!])/g, showdown.helper.escapeCharactersCallback);
  return text;
});

/**
 * Encode/escape certain characters inside Markdown code runs.
 * The point is that in code, these characters are literals,
 * and lose their special Markdown meanings.
 */
showdown.subParser('encodeCode', function (text) {
  'use strict';

  // Encode all ampersands; HTML entities are not
  // entities within a Markdown code span.

  text = text.replace(/&/g, '&amp;');

  // Do the angle bracket song and dance:
  text = text.replace(/</g, '&lt;');
  text = text.replace(/>/g, '&gt;');

  // Now, escape characters that are magic in Markdown:
  text = showdown.helper.escapeCharacters(text, '*_{}[]\\', false);

  // jj the line above breaks this:
  //---
  //* Item
  //   1. Subitem
  //            special char: *
  // ---

  return text;
});

/**
 *  Input: an email address, e.g. "foo@example.com"
 *
 *  Output: the email address as a mailto link, with each character
 *    of the address encoded as either a decimal or hex entity, in
 *    the hopes of foiling most address harvesting spam bots. E.g.:
 *
 *    <a href="&#x6D;&#97;&#105;&#108;&#x74;&#111;:&#102;&#111;&#111;&#64;&#101;
 *       x&#x61;&#109;&#x70;&#108;&#x65;&#x2E;&#99;&#111;&#109;">&#102;&#111;&#111;
 *       &#64;&#101;x&#x61;&#109;&#x70;&#108;&#x65;&#x2E;&#99;&#111;&#109;</a>
 *
 *  Based on a filter by Matthew Wickline, posted to the BBEdit-Talk
 *  mailing list: <http://tinyurl.com/yu7ue>
 *
 */
showdown.subParser('encodeEmailAddress', function (addr) {
  'use strict';

  var encode = [function (ch) {
    return '&#' + ch.charCodeAt(0) + ';';
  }, function (ch) {
    return '&#x' + ch.charCodeAt(0).toString(16) + ';';
  }, function (ch) {
    return ch;
  }];

  addr = 'mailto:' + addr;

  addr = addr.replace(/./g, function (ch) {
    if (ch === '@') {
      // this *must* be encoded. I insist.
      ch = encode[Math.floor(Math.random() * 2)](ch);
    } else if (ch !== ':') {
      // leave ':' alone (to spot mailto: later)
      var r = Math.random();
      // roughly 10% raw, 45% hex, 45% dec
      ch = r > 0.9 ? encode[2](ch) : r > 0.45 ? encode[1](ch) : encode[0](ch);
    }
    return ch;
  });

  addr = '<a href="' + addr + '">' + addr + '</a>';
  addr = addr.replace(/">.+:/g, '">'); // strip the mailto: from the visible part

  return addr;
});

/**
 * Within tags -- meaning between < and > -- encode [\ ` * _] so they
 * don't conflict with their use in Markdown for code, italics and strong.
 */
showdown.subParser('escapeSpecialCharsWithinTagAttributes', function (text) {
  'use strict';

  // Build a regex to find HTML tags and comments.  See Friedl's
  // "Mastering Regular Expressions", 2nd Ed., pp. 200-201.

  var regex = /(<[a-z\/!$]("[^"]*"|'[^']*'|[^'">])*>|<!(--.*?--\s*)+>)/gi;

  text = text.replace(regex, function (wholeMatch) {
    var tag = wholeMatch.replace(/(.)<\/?code>(?=.)/g, '$1`');
    tag = showdown.helper.escapeCharacters(tag, '\\`*_', false);
    return tag;
  });

  return text;
});

/**
 * Handle github codeblocks prior to running HashHTML so that
 * HTML contained within the codeblock gets escaped properly
 * Example:
 * ```ruby
 *     def hello_world(x)
 *       puts "Hello, #{x}"
 *     end
 * ```
 */
showdown.subParser('githubCodeBlocks', function (text, options, globals) {
  'use strict';

  // early exit if option is not enabled

  if (!options.ghCodeBlocks) {
    return text;
  }

  text = globals.converter._dispatch('githubCodeBlocks.before', text, options, globals);

  text += '~0';

  text = text.replace(/(?:^|\n)```(.*)\n([\s\S]*?)\n```/g, function (wholeMatch, language, codeblock) {
    var end = options.omitExtraWLInCodeBlocks ? '' : '\n';

    // First parse the github code block
    codeblock = showdown.subParser('encodeCode')(codeblock);
    codeblock = showdown.subParser('detab')(codeblock);
    codeblock = codeblock.replace(/^\n+/g, ''); // trim leading newlines
    codeblock = codeblock.replace(/\n+$/g, ''); // trim trailing whitespace

    codeblock = '<pre><code' + (language ? ' class="' + language + ' language-' + language + '"' : '') + '>' + codeblock + end + '</code></pre>';

    codeblock = showdown.subParser('hashBlock')(codeblock, options, globals);

    // Since GHCodeblocks can be false positives, we need to
    // store the primitive text and the parsed text in a global var,
    // and then return a token
    return '\n\n~G' + (globals.ghCodeBlocks.push({ text: wholeMatch, codeblock: codeblock }) - 1) + 'G\n\n';
  });

  // attacklab: strip sentinel
  text = text.replace(/~0/, '');

  return globals.converter._dispatch('githubCodeBlocks.after', text, options, globals);
});

showdown.subParser('hashBlock', function (text, options, globals) {
  'use strict';

  text = text.replace(/(^\n+|\n+$)/g, '');
  return '\n\n~K' + (globals.gHtmlBlocks.push(text) - 1) + 'K\n\n';
});

showdown.subParser('hashElement', function (text, options, globals) {
  'use strict';

  return function (wholeMatch, m1) {
    var blockText = m1;

    // Undo double lines
    blockText = blockText.replace(/\n\n/g, '\n');
    blockText = blockText.replace(/^\n/, '');

    // strip trailing blank lines
    blockText = blockText.replace(/\n+$/g, '');

    // Replace the element text with a marker ("~KxK" where x is its key)
    blockText = '\n\n~K' + (globals.gHtmlBlocks.push(blockText) - 1) + 'K\n\n';

    return blockText;
  };
});

showdown.subParser('hashHTMLBlocks', function (text, options, globals) {
  'use strict';

  var blockTags = ['pre', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'table', 'dl', 'ol', 'ul', 'script', 'noscript', 'form', 'fieldset', 'iframe', 'math', 'style', 'section', 'header', 'footer', 'nav', 'article', 'aside', 'address', 'audio', 'canvas', 'figure', 'hgroup', 'output', 'video', 'p'],
      repFunc = function repFunc(wholeMatch, match, left, right) {
    var txt = wholeMatch;
    // check if this html element is marked as markdown
    // if so, it's contents should be parsed as markdown
    if (left.search(/\bmarkdown\b/) !== -1) {
      txt = left + globals.converter.makeHtml(match) + right;
    }
    return '\n\n~K' + (globals.gHtmlBlocks.push(txt) - 1) + 'K\n\n';
  };

  for (var i = 0; i < blockTags.length; ++i) {
    text = showdown.helper.replaceRecursiveRegExp(text, repFunc, '^(?: |\\t){0,3}<' + blockTags[i] + '\\b[^>]*>', '</' + blockTags[i] + '>', 'gim');
  }

  // HR SPECIAL CASE
  text = text.replace(/(\n[ ]{0,3}(<(hr)\b([^<>])*?\/?>)[ \t]*(?=\n{2,}))/g, showdown.subParser('hashElement')(text, options, globals));

  // Special case for standalone HTML comments:
  text = text.replace(/(<!--[\s\S]*?-->)/g, showdown.subParser('hashElement')(text, options, globals));

  // PHP and ASP-style processor instructions (<?...?> and <%...%>)
  text = text.replace(/(?:\n\n)([ ]{0,3}(?:<([?%])[^\r]*?\2>)[ \t]*(?=\n{2,}))/g, showdown.subParser('hashElement')(text, options, globals));
  return text;
});

/**
 * Hash span elements that should not be parsed as markdown
 */
showdown.subParser('hashHTMLSpans', function (text, config, globals) {
  'use strict';

  var matches = showdown.helper.matchRecursiveRegExp(text, '<code\\b[^>]*>', '</code>', 'gi');

  for (var i = 0; i < matches.length; ++i) {
    text = text.replace(matches[i][0], '~L' + (globals.gHtmlSpans.push(matches[i][0]) - 1) + 'L');
  }
  return text;
});

/**
 * Unhash HTML spans
 */
showdown.subParser('unhashHTMLSpans', function (text, config, globals) {
  'use strict';

  for (var i = 0; i < globals.gHtmlSpans.length; ++i) {
    text = text.replace('~L' + i + 'L', globals.gHtmlSpans[i]);
  }

  return text;
});

/**
 * Hash span elements that should not be parsed as markdown
 */
showdown.subParser('hashPreCodeTags', function (text, config, globals) {
  'use strict';

  var repFunc = function repFunc(wholeMatch, match, left, right) {
    // encode html entities
    var codeblock = left + showdown.subParser('encodeCode')(match) + right;
    return '\n\n~G' + (globals.ghCodeBlocks.push({ text: wholeMatch, codeblock: codeblock }) - 1) + 'G\n\n';
  };

  text = showdown.helper.replaceRecursiveRegExp(text, repFunc, '^(?: |\\t){0,3}<pre\\b[^>]*>\\s*<code\\b[^>]*>', '^(?: |\\t){0,3}</code>\\s*</pre>', 'gim');
  return text;
});

showdown.subParser('headers', function (text, options, globals) {
  'use strict';

  text = globals.converter._dispatch('headers.before', text, options, globals);

  var prefixHeader = options.prefixHeaderId,
      headerLevelStart = isNaN(parseInt(options.headerLevelStart)) ? 1 : parseInt(options.headerLevelStart),


  // Set text-style headers:
  //	Header 1
  //	========
  //
  //	Header 2
  //	--------
  //
  setextRegexH1 = options.smoothLivePreview ? /^(.+)[ \t]*\n={2,}[ \t]*\n+/gm : /^(.+)[ \t]*\n=+[ \t]*\n+/gm,
      setextRegexH2 = options.smoothLivePreview ? /^(.+)[ \t]*\n-{2,}[ \t]*\n+/gm : /^(.+)[ \t]*\n-+[ \t]*\n+/gm;

  text = text.replace(setextRegexH1, function (wholeMatch, m1) {

    var spanGamut = showdown.subParser('spanGamut')(m1, options, globals),
        hID = options.noHeaderId ? '' : ' id="' + headerId(m1) + '"',
        hLevel = headerLevelStart,
        hashBlock = '<h' + hLevel + hID + '>' + spanGamut + '</h' + hLevel + '>';
    return showdown.subParser('hashBlock')(hashBlock, options, globals);
  });

  text = text.replace(setextRegexH2, function (matchFound, m1) {
    var spanGamut = showdown.subParser('spanGamut')(m1, options, globals),
        hID = options.noHeaderId ? '' : ' id="' + headerId(m1) + '"',
        hLevel = headerLevelStart + 1,
        hashBlock = '<h' + hLevel + hID + '>' + spanGamut + '</h' + hLevel + '>';
    return showdown.subParser('hashBlock')(hashBlock, options, globals);
  });

  // atx-style headers:
  //  # Header 1
  //  ## Header 2
  //  ## Header 2 with closing hashes ##
  //  ...
  //  ###### Header 6
  //
  text = text.replace(/^(#{1,6})[ \t]*(.+?)[ \t]*#*\n+/gm, function (wholeMatch, m1, m2) {
    var span = showdown.subParser('spanGamut')(m2, options, globals),
        hID = options.noHeaderId ? '' : ' id="' + headerId(m2) + '"',
        hLevel = headerLevelStart - 1 + m1.length,
        header = '<h' + hLevel + hID + '>' + span + '</h' + hLevel + '>';

    return showdown.subParser('hashBlock')(header, options, globals);
  });

  function headerId(m) {
    var title,
        escapedId = m.replace(/[^\w]/g, '').toLowerCase();

    if (globals.hashLinkCounts[escapedId]) {
      title = escapedId + '-' + globals.hashLinkCounts[escapedId]++;
    } else {
      title = escapedId;
      globals.hashLinkCounts[escapedId] = 1;
    }

    // Prefix id to prevent causing inadvertent pre-existing style matches.
    if (prefixHeader === true) {
      prefixHeader = 'section';
    }

    if (showdown.helper.isString(prefixHeader)) {
      return prefixHeader + title;
    }
    return title;
  }

  text = globals.converter._dispatch('headers.after', text, options, globals);
  return text;
});

/**
 * Turn Markdown image shortcuts into <img> tags.
 */
showdown.subParser('images', function (text, options, globals) {
  'use strict';

  text = globals.converter._dispatch('images.before', text, options, globals);

  var inlineRegExp = /!\[(.*?)]\s?\([ \t]*()<?(\S+?)>?(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*(?:(['"])(.*?)\6[ \t]*)?\)/g,
      referenceRegExp = /!\[([^\]]*?)] ?(?:\n *)?\[(.*?)]()()()()()/g;

  function writeImageTag(wholeMatch, altText, linkId, url, width, height, m5, title) {

    var gUrls = globals.gUrls,
        gTitles = globals.gTitles,
        gDims = globals.gDimensions;

    linkId = linkId.toLowerCase();

    if (!title) {
      title = '';
    }

    if (url === '' || url === null) {
      if (linkId === '' || linkId === null) {
        // lower-case and turn embedded newlines into spaces
        linkId = altText.toLowerCase().replace(/ ?\n/g, ' ');
      }
      url = '#' + linkId;

      if (!showdown.helper.isUndefined(gUrls[linkId])) {
        url = gUrls[linkId];
        if (!showdown.helper.isUndefined(gTitles[linkId])) {
          title = gTitles[linkId];
        }
        if (!showdown.helper.isUndefined(gDims[linkId])) {
          width = gDims[linkId].width;
          height = gDims[linkId].height;
        }
      } else {
        return wholeMatch;
      }
    }

    altText = altText.replace(/"/g, '&quot;');
    altText = showdown.helper.escapeCharacters(altText, '*_', false);
    url = showdown.helper.escapeCharacters(url, '*_', false);
    var result = '<img src="' + url + '" alt="' + altText + '"';

    if (title) {
      title = title.replace(/"/g, '&quot;');
      title = showdown.helper.escapeCharacters(title, '*_', false);
      result += ' title="' + title + '"';
    }

    if (width && height) {
      width = width === '*' ? 'auto' : width;
      height = height === '*' ? 'auto' : height;

      result += ' width="' + width + '"';
      result += ' height="' + height + '"';
    }

    result += ' />';
    return result;
  }

  // First, handle reference-style labeled images: ![alt text][id]
  text = text.replace(referenceRegExp, writeImageTag);

  // Next, handle inline images:  ![alt text](url =<width>x<height> "optional title")
  text = text.replace(inlineRegExp, writeImageTag);

  text = globals.converter._dispatch('images.after', text, options, globals);
  return text;
});

showdown.subParser('italicsAndBold', function (text, options, globals) {
  'use strict';

  text = globals.converter._dispatch('italicsAndBold.before', text, options, globals);

  if (options.literalMidWordUnderscores) {
    //underscores
    // Since we are consuming a \s character, we need to add it
    text = text.replace(/(^|\s|>|\b)__(?=\S)([\s\S]+?)__(?=\b|<|\s|$)/gm, '$1<strong>$2</strong>');
    text = text.replace(/(^|\s|>|\b)_(?=\S)([\s\S]+?)_(?=\b|<|\s|$)/gm, '$1<em>$2</em>');
    //asterisks
    text = text.replace(/(\*\*)(?=\S)([^\r]*?\S[*]*)\1/g, '<strong>$2</strong>');
    text = text.replace(/(\*)(?=\S)([^\r]*?\S)\1/g, '<em>$2</em>');
  } else {
    // <strong> must go first:
    text = text.replace(/(\*\*|__)(?=\S)([^\r]*?\S[*_]*)\1/g, '<strong>$2</strong>');
    text = text.replace(/(\*|_)(?=\S)([^\r]*?\S)\1/g, '<em>$2</em>');
  }

  text = globals.converter._dispatch('italicsAndBold.after', text, options, globals);
  return text;
});

/**
 * Form HTML ordered (numbered) and unordered (bulleted) lists.
 */
showdown.subParser('lists', function (text, options, globals) {
  'use strict';

  text = globals.converter._dispatch('lists.before', text, options, globals);
  /**
   * Process the contents of a single ordered or unordered list, splitting it
   * into individual list items.
   * @param {string} listStr
   * @param {boolean} trimTrailing
   * @returns {string}
   */
  function processListItems(listStr, trimTrailing) {
    // The $g_list_level global keeps track of when we're inside a list.
    // Each time we enter a list, we increment it; when we leave a list,
    // we decrement. If it's zero, we're not in a list anymore.
    //
    // We do this because when we're not inside a list, we want to treat
    // something like this:
    //
    //    I recommend upgrading to version
    //    8. Oops, now this line is treated
    //    as a sub-list.
    //
    // As a single paragraph, despite the fact that the second line starts
    // with a digit-period-space sequence.
    //
    // Whereas when we're inside a list (or sub-list), that line will be
    // treated as the start of a sub-list. What a kludge, huh? This is
    // an aspect of Markdown's syntax that's hard to parse perfectly
    // without resorting to mind-reading. Perhaps the solution is to
    // change the syntax rules such that sub-lists must start with a
    // starting cardinal number; e.g. "1." or "a.".
    globals.gListLevel++;

    // trim trailing blank lines:
    listStr = listStr.replace(/\n{2,}$/, '\n');

    // attacklab: add sentinel to emulate \z
    listStr += '~0';

    var rgx = /(\n)?(^[ \t]*)([*+-]|\d+[.])[ \t]+((\[(x|X| )?])?[ \t]*[^\r]+?(\n{1,2}))(?=\n*(~0|\2([*+-]|\d+[.])[ \t]+))/gm,
        isParagraphed = /\n[ \t]*\n(?!~0)/.test(listStr);

    listStr = listStr.replace(rgx, function (wholeMatch, m1, m2, m3, m4, taskbtn, checked) {
      checked = checked && checked.trim() !== '';
      var item = showdown.subParser('outdent')(m4, options, globals),
          bulletStyle = '';

      // Support for github tasklists
      if (taskbtn && options.tasklists) {
        bulletStyle = ' class="task-list-item" style="list-style-type: none;"';
        item = item.replace(/^[ \t]*\[(x|X| )?]/m, function () {
          var otp = '<input type="checkbox" disabled style="margin: 0px 0.35em 0.25em -1.6em; vertical-align: middle;"';
          if (checked) {
            otp += ' checked';
          }
          otp += '>';
          return otp;
        });
      }
      // m1 - Leading line or
      // Has a double return (multi paragraph) or
      // Has sublist
      if (m1 || item.search(/\n{2,}/) > -1) {
        item = showdown.subParser('githubCodeBlocks')(item, options, globals);
        item = showdown.subParser('blockGamut')(item, options, globals);
      } else {
        // Recursion for sub-lists:
        item = showdown.subParser('lists')(item, options, globals);
        item = item.replace(/\n$/, ''); // chomp(item)
        if (isParagraphed) {
          item = showdown.subParser('paragraphs')(item, options, globals);
        } else {
          item = showdown.subParser('spanGamut')(item, options, globals);
        }
      }
      item = '\n<li' + bulletStyle + '>' + item + '</li>\n';
      return item;
    });

    // attacklab: strip sentinel
    listStr = listStr.replace(/~0/g, '');

    globals.gListLevel--;

    if (trimTrailing) {
      listStr = listStr.replace(/\s+$/, '');
    }

    return listStr;
  }

  /**
   * Check and parse consecutive lists (better fix for issue #142)
   * @param {string} list
   * @param {string} listType
   * @param {boolean} trimTrailing
   * @returns {string}
   */
  function parseConsecutiveLists(list, listType, trimTrailing) {
    // check if we caught 2 or more consecutive lists by mistake
    // we use the counterRgx, meaning if listType is UL we look for UL and vice versa
    var counterRxg = listType === 'ul' ? /^ {0,2}\d+\.[ \t]/gm : /^ {0,2}[*+-][ \t]/gm,
        subLists = [],
        result = '';

    if (list.search(counterRxg) !== -1) {
      (function parseCL(txt) {
        var pos = txt.search(counterRxg);
        if (pos !== -1) {
          // slice
          result += '\n\n<' + listType + '>' + processListItems(txt.slice(0, pos), !!trimTrailing) + '</' + listType + '>\n\n';

          // invert counterType and listType
          listType = listType === 'ul' ? 'ol' : 'ul';
          counterRxg = listType === 'ul' ? /^ {0,2}\d+\.[ \t]/gm : /^ {0,2}[*+-][ \t]/gm;

          //recurse
          parseCL(txt.slice(pos));
        } else {
          result += '\n\n<' + listType + '>' + processListItems(txt, !!trimTrailing) + '</' + listType + '>\n\n';
        }
      })(list);
      for (var i = 0; i < subLists.length; ++i) {}
    } else {
      result = '\n\n<' + listType + '>' + processListItems(list, !!trimTrailing) + '</' + listType + '>\n\n';
    }

    return result;
  }

  // attacklab: add sentinel to hack around khtml/safari bug:
  // http://bugs.webkit.org/show_bug.cgi?id=11231
  text += '~0';

  // Re-usable pattern to match any entire ul or ol list:
  var wholeList = /^(([ ]{0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(~0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/gm;

  if (globals.gListLevel) {
    text = text.replace(wholeList, function (wholeMatch, list, m2) {
      var listType = m2.search(/[*+-]/g) > -1 ? 'ul' : 'ol';
      return parseConsecutiveLists(list, listType, true);
    });
  } else {
    wholeList = /(\n\n|^\n?)(([ ]{0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(~0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/gm;
    //wholeList = /(\n\n|^\n?)( {0,3}([*+-]|\d+\.)[ \t]+[\s\S]+?)(?=(~0)|(\n\n(?!\t| {2,}| {0,3}([*+-]|\d+\.)[ \t])))/g;
    text = text.replace(wholeList, function (wholeMatch, m1, list, m3) {

      var listType = m3.search(/[*+-]/g) > -1 ? 'ul' : 'ol';
      return parseConsecutiveLists(list, listType);
    });
  }

  // attacklab: strip sentinel
  text = text.replace(/~0/, '');

  text = globals.converter._dispatch('lists.after', text, options, globals);
  return text;
});

/**
 * Remove one level of line-leading tabs or spaces
 */
showdown.subParser('outdent', function (text) {
  'use strict';

  // attacklab: hack around Konqueror 3.5.4 bug:
  // "----------bug".replace(/^-/g,"") == "bug"

  text = text.replace(/^(\t|[ ]{1,4})/gm, '~0'); // attacklab: g_tab_width

  // attacklab: clean up hack
  text = text.replace(/~0/g, '');

  return text;
});

/**
 *
 */
showdown.subParser('paragraphs', function (text, options, globals) {
  'use strict';

  text = globals.converter._dispatch('paragraphs.before', text, options, globals);
  // Strip leading and trailing lines:
  text = text.replace(/^\n+/g, '');
  text = text.replace(/\n+$/g, '');

  var grafs = text.split(/\n{2,}/g),
      grafsOut = [],
      end = grafs.length; // Wrap <p> tags

  for (var i = 0; i < end; i++) {
    var str = grafs[i];
    // if this is an HTML marker, copy it
    if (str.search(/~(K|G)(\d+)\1/g) >= 0) {
      grafsOut.push(str);
    } else {
      str = showdown.subParser('spanGamut')(str, options, globals);
      str = str.replace(/^([ \t]*)/g, '<p>');
      str += '</p>';
      grafsOut.push(str);
    }
  }

  /** Unhashify HTML blocks */
  end = grafsOut.length;
  for (i = 0; i < end; i++) {
    var blockText = '',
        grafsOutIt = grafsOut[i],
        codeFlag = false;
    // if this is a marker for an html block...
    while (grafsOutIt.search(/~(K|G)(\d+)\1/) >= 0) {
      var delim = RegExp.$1,
          num = RegExp.$2;

      if (delim === 'K') {
        blockText = globals.gHtmlBlocks[num];
      } else {
        // we need to check if ghBlock is a false positive
        if (codeFlag) {
          // use encoded version of all text
          blockText = showdown.subParser('encodeCode')(globals.ghCodeBlocks[num].text);
        } else {
          blockText = globals.ghCodeBlocks[num].codeblock;
        }
      }
      blockText = blockText.replace(/\$/g, '$$$$'); // Escape any dollar signs

      grafsOutIt = grafsOutIt.replace(/(\n\n)?~(K|G)\d+\2(\n\n)?/, blockText);
      // Check if grafsOutIt is a pre->code
      if (/^<pre\b[^>]*>\s*<code\b[^>]*>/.test(grafsOutIt)) {
        codeFlag = true;
      }
    }
    grafsOut[i] = grafsOutIt;
  }
  text = grafsOut.join('\n\n');
  // Strip leading and trailing lines:
  text = text.replace(/^\n+/g, '');
  text = text.replace(/\n+$/g, '');
  return globals.converter._dispatch('paragraphs.after', text, options, globals);
});

/**
 * Run extension
 */
showdown.subParser('runExtension', function (ext, text, options, globals) {
  'use strict';

  if (ext.filter) {
    text = ext.filter(text, globals.converter, options);
  } else if (ext.regex) {
    // TODO remove this when old extension loading mechanism is deprecated
    var re = ext.regex;
    if (!re instanceof RegExp) {
      re = new RegExp(re, 'g');
    }
    text = text.replace(re, ext.replace);
  }

  return text;
});

/**
 * These are all the transformations that occur *within* block-level
 * tags like paragraphs, headers, and list items.
 */
showdown.subParser('spanGamut', function (text, options, globals) {
  'use strict';

  text = globals.converter._dispatch('spanGamut.before', text, options, globals);
  text = showdown.subParser('codeSpans')(text, options, globals);
  text = showdown.subParser('escapeSpecialCharsWithinTagAttributes')(text, options, globals);
  text = showdown.subParser('encodeBackslashEscapes')(text, options, globals);

  // Process anchor and image tags. Images must come first,
  // because ![foo][f] looks like an anchor.
  text = showdown.subParser('images')(text, options, globals);
  text = showdown.subParser('anchors')(text, options, globals);

  // Make links out of things like `<http://example.com/>`
  // Must come after _DoAnchors(), because you can use < and >
  // delimiters in inline links like [this](<url>).
  text = showdown.subParser('autoLinks')(text, options, globals);
  text = showdown.subParser('encodeAmpsAndAngles')(text, options, globals);
  text = showdown.subParser('italicsAndBold')(text, options, globals);
  text = showdown.subParser('strikethrough')(text, options, globals);

  // Do hard breaks:
  text = text.replace(/  +\n/g, ' <br />\n');

  text = globals.converter._dispatch('spanGamut.after', text, options, globals);
  return text;
});

showdown.subParser('strikethrough', function (text, options, globals) {
  'use strict';

  if (options.strikethrough) {
    text = globals.converter._dispatch('strikethrough.before', text, options, globals);
    text = text.replace(/(?:~T){2}([\s\S]+?)(?:~T){2}/g, '<del>$1</del>');
    text = globals.converter._dispatch('strikethrough.after', text, options, globals);
  }

  return text;
});

/**
 * Strip any lines consisting only of spaces and tabs.
 * This makes subsequent regexs easier to write, because we can
 * match consecutive blank lines with /\n+/ instead of something
 * contorted like /[ \t]*\n+/
 */
showdown.subParser('stripBlankLines', function (text) {
  'use strict';

  return text.replace(/^[ \t]+$/mg, '');
});

/**
 * Strips link definitions from text, stores the URLs and titles in
 * hash references.
 * Link defs are in the form: ^[id]: url "optional title"
 *
 * ^[ ]{0,3}\[(.+)\]: // id = $1  attacklab: g_tab_width - 1
 * [ \t]*
 * \n?                  // maybe *one* newline
 * [ \t]*
 * <?(\S+?)>?          // url = $2
 * [ \t]*
 * \n?                // maybe one newline
 * [ \t]*
 * (?:
 * (\n*)              // any lines skipped = $3 attacklab: lookbehind removed
 * ["(]
 * (.+?)              // title = $4
 * [")]
 * [ \t]*
 * )?                 // title is optional
 * (?:\n+|$)
 * /gm,
 * function(){...});
 *
 */
showdown.subParser('stripLinkDefinitions', function (text, options, globals) {
  'use strict';

  var regex = /^ {0,3}\[(.+)]:[ \t]*\n?[ \t]*<?(\S+?)>?(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*\n?[ \t]*(?:(\n*)["|'(](.+?)["|')][ \t]*)?(?:\n+|(?=~0))/gm;

  // attacklab: sentinel workarounds for lack of \A and \Z, safari\khtml bug
  text += '~0';

  text = text.replace(regex, function (wholeMatch, linkId, url, width, height, blankLines, title) {
    linkId = linkId.toLowerCase();
    globals.gUrls[linkId] = showdown.subParser('encodeAmpsAndAngles')(url); // Link IDs are case-insensitive

    if (blankLines) {
      // Oops, found blank lines, so it's not a title.
      // Put back the parenthetical statement we stole.
      return blankLines + title;
    } else {
      if (title) {
        globals.gTitles[linkId] = title.replace(/"|'/g, '&quot;');
      }
      if (options.parseImgDimensions && width && height) {
        globals.gDimensions[linkId] = {
          width: width,
          height: height
        };
      }
    }
    // Completely remove the definition from the text
    return '';
  });

  // attacklab: strip sentinel
  text = text.replace(/~0/, '');

  return text;
});

showdown.subParser('tables', function (text, options, globals) {
  'use strict';

  if (!options.tables) {
    return text;
  }

  var tableRgx = /^[ \t]{0,3}\|?.+\|.+\n[ \t]{0,3}\|?[ \t]*:?[ \t]*(?:-|=){2,}[ \t]*:?[ \t]*\|[ \t]*:?[ \t]*(?:-|=){2,}[\s\S]+?(?:\n\n|~0)/gm;

  function parseStyles(sLine) {
    if (/^:[ \t]*--*$/.test(sLine)) {
      return ' style="text-align:left;"';
    } else if (/^--*[ \t]*:[ \t]*$/.test(sLine)) {
      return ' style="text-align:right;"';
    } else if (/^:[ \t]*--*[ \t]*:$/.test(sLine)) {
      return ' style="text-align:center;"';
    } else {
      return '';
    }
  }

  function parseHeaders(header, style) {
    var id = '';
    header = header.trim();
    if (options.tableHeaderId) {
      id = ' id="' + header.replace(/ /g, '_').toLowerCase() + '"';
    }
    header = showdown.subParser('spanGamut')(header, options, globals);

    return '<th' + id + style + '>' + header + '</th>\n';
  }

  function parseCells(cell, style) {
    var subText = showdown.subParser('spanGamut')(cell, options, globals);
    return '<td' + style + '>' + subText + '</td>\n';
  }

  function buildTable(headers, cells) {
    var tb = '<table>\n<thead>\n<tr>\n',
        tblLgn = headers.length;

    for (var i = 0; i < tblLgn; ++i) {
      tb += headers[i];
    }
    tb += '</tr>\n</thead>\n<tbody>\n';

    for (i = 0; i < cells.length; ++i) {
      tb += '<tr>\n';
      for (var ii = 0; ii < tblLgn; ++ii) {
        tb += cells[i][ii];
      }
      tb += '</tr>\n';
    }
    tb += '</tbody>\n</table>\n';
    return tb;
  }

  text = globals.converter._dispatch('tables.before', text, options, globals);

  text = text.replace(tableRgx, function (rawTable) {

    var i,
        tableLines = rawTable.split('\n');

    // strip wrong first and last column if wrapped tables are used
    for (i = 0; i < tableLines.length; ++i) {
      if (/^[ \t]{0,3}\|/.test(tableLines[i])) {
        tableLines[i] = tableLines[i].replace(/^[ \t]{0,3}\|/, '');
      }
      if (/\|[ \t]*$/.test(tableLines[i])) {
        tableLines[i] = tableLines[i].replace(/\|[ \t]*$/, '');
      }
    }

    var rawHeaders = tableLines[0].split('|').map(function (s) {
      return s.trim();
    }),
        rawStyles = tableLines[1].split('|').map(function (s) {
      return s.trim();
    }),
        rawCells = [],
        headers = [],
        styles = [],
        cells = [];

    tableLines.shift();
    tableLines.shift();

    for (i = 0; i < tableLines.length; ++i) {
      if (tableLines[i].trim() === '') {
        continue;
      }
      rawCells.push(tableLines[i].split('|').map(function (s) {
        return s.trim();
      }));
    }

    if (rawHeaders.length < rawStyles.length) {
      return rawTable;
    }

    for (i = 0; i < rawStyles.length; ++i) {
      styles.push(parseStyles(rawStyles[i]));
    }

    for (i = 0; i < rawHeaders.length; ++i) {
      if (showdown.helper.isUndefined(styles[i])) {
        styles[i] = '';
      }
      headers.push(parseHeaders(rawHeaders[i], styles[i]));
    }

    for (i = 0; i < rawCells.length; ++i) {
      var row = [];
      for (var ii = 0; ii < headers.length; ++ii) {
        if (showdown.helper.isUndefined(rawCells[i][ii])) {}
        row.push(parseCells(rawCells[i][ii], styles[ii]));
      }
      cells.push(row);
    }

    return buildTable(headers, cells);
  });

  text = globals.converter._dispatch('tables.after', text, options, globals);

  return text;
});

/**
 * Swap back in all the special characters we've hidden.
 */
showdown.subParser('unescapeSpecialChars', function (text) {
  'use strict';

  text = text.replace(/~E(\d+)E/g, function (wholeMatch, m1) {
    var charCodeToReplace = parseInt(m1);
    return String.fromCharCode(charCodeToReplace);
  });
  return text;
});
module.exports = showdown;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNob3dkb3duLmpzIl0sIm5hbWVzIjpbImdldERlZmF1bHRPcHRzIiwic2ltcGxlIiwiZGVmYXVsdE9wdGlvbnMiLCJvbWl0RXh0cmFXTEluQ29kZUJsb2NrcyIsImRlZmF1bHRWYWx1ZSIsImRlc2NyaWJlIiwidHlwZSIsIm5vSGVhZGVySWQiLCJwcmVmaXhIZWFkZXJJZCIsImhlYWRlckxldmVsU3RhcnQiLCJwYXJzZUltZ0RpbWVuc2lvbnMiLCJzaW1wbGlmaWVkQXV0b0xpbmsiLCJsaXRlcmFsTWlkV29yZFVuZGVyc2NvcmVzIiwic3RyaWtldGhyb3VnaCIsInRhYmxlcyIsInRhYmxlc0hlYWRlcklkIiwiZ2hDb2RlQmxvY2tzIiwidGFza2xpc3RzIiwic21vb3RoTGl2ZVByZXZpZXciLCJzbWFydEluZGVudGF0aW9uRml4IiwiZGVzY3JpcHRpb24iLCJKU09OIiwicGFyc2UiLCJzdHJpbmdpZnkiLCJyZXQiLCJvcHQiLCJoYXNPd25Qcm9wZXJ0eSIsInNob3dkb3duIiwicGFyc2VycyIsImV4dGVuc2lvbnMiLCJnbG9iYWxPcHRpb25zIiwiZmxhdm9yIiwiZ2l0aHViIiwidmFuaWxsYSIsImhlbHBlciIsInNldE9wdGlvbiIsImtleSIsInZhbHVlIiwiZ2V0T3B0aW9uIiwiZ2V0T3B0aW9ucyIsInJlc2V0T3B0aW9ucyIsInNldEZsYXZvciIsIm5hbWUiLCJwcmVzZXQiLCJvcHRpb24iLCJnZXREZWZhdWx0T3B0aW9ucyIsInN1YlBhcnNlciIsImZ1bmMiLCJpc1N0cmluZyIsIkVycm9yIiwiZXh0ZW5zaW9uIiwiZXh0Iiwic3RkRXh0TmFtZSIsImlzVW5kZWZpbmVkIiwiaXNBcnJheSIsInZhbGlkRXh0ZW5zaW9uIiwidmFsaWRhdGUiLCJ2YWxpZCIsImVycm9yIiwiZ2V0QWxsRXh0ZW5zaW9ucyIsInJlbW92ZUV4dGVuc2lvbiIsInJlc2V0RXh0ZW5zaW9ucyIsImVyck1zZyIsImkiLCJsZW5ndGgiLCJiYXNlTXNnIiwidG9Mb3dlckNhc2UiLCJsaXN0ZW5lcnMiLCJmaWx0ZXIiLCJyZWdleCIsImxuIiwiUmVnRXhwIiwicmVwbGFjZSIsInZhbGlkYXRlRXh0ZW5zaW9uIiwiY29uc29sZSIsIndhcm4iLCJhIiwiU3RyaW5nIiwiaXNGdW5jdGlvbiIsImdldFR5cGUiLCJ0b1N0cmluZyIsImNhbGwiLCJmb3JFYWNoIiwib2JqIiwiY2FsbGJhY2siLCJjb25zdHJ1Y3RvciIsIkFycmF5IiwicyIsImVzY2FwZUNoYXJhY3RlcnNDYWxsYmFjayIsIndob2xlTWF0Y2giLCJtMSIsImNoYXJDb2RlVG9Fc2NhcGUiLCJjaGFyQ29kZUF0IiwiZXNjYXBlQ2hhcmFjdGVycyIsInRleHQiLCJjaGFyc1RvRXNjYXBlIiwiYWZ0ZXJCYWNrc2xhc2giLCJyZWdleFN0cmluZyIsInJneEZpbmRNYXRjaFBvcyIsInN0ciIsImxlZnQiLCJyaWdodCIsImZsYWdzIiwiZiIsImciLCJpbmRleE9mIiwieCIsImwiLCJwb3MiLCJ0IiwibSIsInN0YXJ0IiwiZW5kIiwiZXhlYyIsInRlc3QiLCJsYXN0SW5kZXgiLCJpbmRleCIsIm1hdGNoIiwicHVzaCIsIm1hdGNoUmVjdXJzaXZlUmVnRXhwIiwibWF0Y2hQb3MiLCJyZXN1bHRzIiwic2xpY2UiLCJyZXBsYWNlUmVjdXJzaXZlUmVnRXhwIiwicmVwbGFjZW1lbnQiLCJyZXBTdHIiLCJmaW5hbFN0ciIsImxuZyIsImJpdHMiLCJqb2luIiwibXNnIiwiYWxlcnQiLCJsb2ciLCJDb252ZXJ0ZXIiLCJjb252ZXJ0ZXJPcHRpb25zIiwib3B0aW9ucyIsImxhbmdFeHRlbnNpb25zIiwib3V0cHV0TW9kaWZpZXJzIiwiX2NvbnN0cnVjdG9yIiwiZ09wdCIsIl9wYXJzZUV4dGVuc2lvbiIsImxlZ2FjeUV4dGVuc2lvbkxvYWRpbmciLCJ2YWxpZEV4dCIsImxpc3RlbiIsInJUcmltSW5wdXRUZXh0IiwicnNwIiwicmd4IiwiX2Rpc3BhdGNoIiwiZGlzcGF0Y2giLCJldnROYW1lIiwiZ2xvYmFscyIsImVpIiwiblRleHQiLCJtYWtlSHRtbCIsImdIdG1sQmxvY2tzIiwiZ0h0bWxNZEJsb2NrcyIsImdIdG1sU3BhbnMiLCJnVXJscyIsImdUaXRsZXMiLCJnRGltZW5zaW9ucyIsImdMaXN0TGV2ZWwiLCJoYXNoTGlua0NvdW50cyIsImNvbnZlcnRlciIsImFkZEV4dGVuc2lvbiIsInVzZUV4dGVuc2lvbiIsImV4dGVuc2lvbk5hbWUiLCJzcGxpY2UiLCJpaSIsImxhbmd1YWdlIiwib3V0cHV0Iiwid3JpdGVBbmNob3JUYWciLCJtMiIsIm0zIiwibTQiLCJtNSIsIm02IiwibTciLCJsaW5rVGV4dCIsImxpbmtJZCIsInVybCIsInRpdGxlIiwic2VhcmNoIiwicmVzdWx0Iiwic2ltcGxlVVJMUmVnZXgiLCJkZWxpbVVybFJlZ2V4Iiwic2ltcGxlTWFpbFJlZ2V4IiwiZGVsaW1NYWlsUmVnZXgiLCJyZXBsYWNlTGluayIsInJlcGxhY2VNYWlsIiwid20iLCJsaW5rIiwibG5rVHh0IiwidW5lc2NhcGVkU3RyIiwiYnEiLCJwcmUiLCJwYXR0ZXJuIiwiY29kZWJsb2NrIiwibmV4dENoYXIiLCJjIiwibGVhZGluZ1RleHQiLCJudW1TcGFjZXMiLCJhZGRyIiwiZW5jb2RlIiwiY2giLCJNYXRoIiwiZmxvb3IiLCJyYW5kb20iLCJyIiwidGFnIiwiYmxvY2tUZXh0IiwiYmxvY2tUYWdzIiwicmVwRnVuYyIsInR4dCIsImNvbmZpZyIsIm1hdGNoZXMiLCJwcmVmaXhIZWFkZXIiLCJpc05hTiIsInBhcnNlSW50Iiwic2V0ZXh0UmVnZXhIMSIsInNldGV4dFJlZ2V4SDIiLCJzcGFuR2FtdXQiLCJoSUQiLCJoZWFkZXJJZCIsImhMZXZlbCIsImhhc2hCbG9jayIsIm1hdGNoRm91bmQiLCJzcGFuIiwiaGVhZGVyIiwiZXNjYXBlZElkIiwiaW5saW5lUmVnRXhwIiwicmVmZXJlbmNlUmVnRXhwIiwid3JpdGVJbWFnZVRhZyIsImFsdFRleHQiLCJ3aWR0aCIsImhlaWdodCIsImdEaW1zIiwicHJvY2Vzc0xpc3RJdGVtcyIsImxpc3RTdHIiLCJ0cmltVHJhaWxpbmciLCJpc1BhcmFncmFwaGVkIiwidGFza2J0biIsImNoZWNrZWQiLCJ0cmltIiwiaXRlbSIsImJ1bGxldFN0eWxlIiwib3RwIiwicGFyc2VDb25zZWN1dGl2ZUxpc3RzIiwibGlzdCIsImxpc3RUeXBlIiwiY291bnRlclJ4ZyIsInN1Ykxpc3RzIiwicGFyc2VDTCIsIndob2xlTGlzdCIsImdyYWZzIiwic3BsaXQiLCJncmFmc091dCIsImdyYWZzT3V0SXQiLCJjb2RlRmxhZyIsImRlbGltIiwiJDEiLCJudW0iLCIkMiIsInJlIiwiYmxhbmtMaW5lcyIsInRhYmxlUmd4IiwicGFyc2VTdHlsZXMiLCJzTGluZSIsInBhcnNlSGVhZGVycyIsInN0eWxlIiwiaWQiLCJ0YWJsZUhlYWRlcklkIiwicGFyc2VDZWxscyIsImNlbGwiLCJzdWJUZXh0IiwiYnVpbGRUYWJsZSIsImhlYWRlcnMiLCJjZWxscyIsInRiIiwidGJsTGduIiwicmF3VGFibGUiLCJ0YWJsZUxpbmVzIiwicmF3SGVhZGVycyIsIm1hcCIsInJhd1N0eWxlcyIsInJhd0NlbGxzIiwic3R5bGVzIiwic2hpZnQiLCJyb3ciLCJjaGFyQ29kZVRvUmVwbGFjZSIsImZyb21DaGFyQ29kZSIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7QUFjQSxTQUFTQSxjQUFULENBQXdCQyxNQUF4QixFQUFnQztBQUM5Qjs7QUFFQSxNQUFJQyxpQkFBaUI7QUFDbkJDLDZCQUF5QjtBQUN2QkMsb0JBQWMsS0FEUztBQUV2QkMsZ0JBQVUsdURBRmE7QUFHdkJDLFlBQU07QUFIaUIsS0FETjtBQU1uQkMsZ0JBQVk7QUFDVkgsb0JBQWMsS0FESjtBQUVWQyxnQkFBVSxpQ0FGQTtBQUdWQyxZQUFNO0FBSEksS0FOTztBQVduQkUsb0JBQWdCO0FBQ2RKLG9CQUFjLEtBREE7QUFFZEMsZ0JBQVUsMENBRkk7QUFHZEMsWUFBTTtBQUhRLEtBWEc7QUFnQm5CRyxzQkFBa0I7QUFDaEJMLG9CQUFjLEtBREU7QUFFaEJDLGdC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QU9vTixZQUFQLENBQW9CRCxpQkFBcEIsQ0FBUDtBQUNELEdBSE0sQ0FBUDtBQUlBLFNBQU9sTSxJQUFQO0FBQ0QsQ0FSRDtBQVNBb00sT0FBT0MsT0FBUCxHQUFpQnhRLFFBQWpCIiwiZmlsZSI6InNob3dkb3duLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBcbiAqIHNob3dkb3duOiBodHRwczovL2dpdGh1Yi5jb20vc2hvd2Rvd25qcy9zaG93ZG93blxuICogXG4gKiBhdXRob3I6IERpICjlvq7kv6HlsI/nqIvluo/lvIDlj5Hlt6XnqIvluIgpXG4gKiBvcmdhbml6YXRpb246IFdlQXBwRGV2KOW+ruS/oeWwj+eoi+W6j+W8gOWPkeiuuuWdmykoaHR0cDovL3dlYXBwZGV2LmNvbSlcbiAqICAgICAgICAgICAgICAg5Z6C55u05b6u5L+h5bCP56iL5bqP5byA5Y+R5Lqk5rWB56S+5Yy6XG4gKiBcbiAqIGdpdGh1YuWcsOWdgDogaHR0cHM6Ly9naXRodWIuY29tL2ljaW5keS93eFBhcnNlXG4gKiBcbiAqIGZvcjog5b6u5L+h5bCP56iL5bqP5a+M5paH5pys6Kej5p6QXG4gKiBkZXRhaWwgOiBodHRwOi8vd2VhcHBkZXYuY29tL3Qvd3hwYXJzZS1hbHBoYTAtMS1odG1sLW1hcmtkb3duLzE4NFxuICovXG5cbmZ1bmN0aW9uIGdldERlZmF1bHRPcHRzKHNpbXBsZSkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIGRlZmF1bHRPcHRpb25zID0ge1xuICAgIG9taXRFeHRyYVdMSW5Db2RlQmxvY2tzOiB7XG4gICAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgICAgZGVzY3JpYmU6ICdPbWl0IHRoZSBkZWZhdWx0IGV4dHJhIHdoaXRlbGluZSBhZGRlZCB0byBjb2RlIGJsb2NrcycsXG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICB9LFxuICAgIG5vSGVhZGVySWQ6IHtcbiAgICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgICBkZXNjcmliZTogJ1R1cm4gb24vb2ZmIGdlbmVyYXRlZCBoZWFkZXIgaWQnLFxuICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgfSxcbiAgICBwcmVmaXhIZWFkZXJJZDoge1xuICAgICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICAgIGRlc2NyaWJlOiAnU3BlY2lmeSBhIHByZWZpeCB0byBnZW5lcmF0ZWQgaGVhZGVyIGlkcycsXG4gICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgIH0sXG4gICAgaGVhZGVyTGV2ZWxTdGFydDoge1xuICAgICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICAgIGRlc2NyaWJlOiAnVGhlIGhlYWRlciBibG9ja3MgbGV2ZWwgc3RhcnQnLFxuICAgICAgdHlwZTogJ2ludGVnZXInXG4gICAgfSxcbiAgICBwYXJzZUltZ0RpbWVuc2lvbnM6IHtcbiAgICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgICBkZXNjcmliZTogJ1R1cm4gb24vb2ZmIGltYWdlIGRpbWVuc2lvbiBwYXJzaW5nJyxcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgIH0sXG4gICAgc2ltcGxpZmllZEF1dG9MaW5rOiB7XG4gICAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgICAgZGVzY3JpYmU6ICdUdXJuIG9uL29mZiBHRk0gYXV0b2xpbmsgc3R5bGUnLFxuICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgfSxcbiAgICBsaXRlcmFsTWlkV29yZFVuZGVyc2NvcmVzOiB7XG4gICAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgICAgZGVzY3JpYmU6ICdQYXJzZSBtaWR3b3JkIHVuZGVyc2NvcmVzIGFzIGxpdGVyYWwgdW5kZXJzY29yZXMnLFxuICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgfSxcbiAgICBzdHJpa2V0aHJvdWdoOiB7XG4gICAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgICAgZGVzY3JpYmU6ICdUdXJuIG9uL29mZiBzdHJpa2V0aHJvdWdoIHN1cHBvcnQnLFxuICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgfSxcbiAgICB0YWJsZXM6IHtcbiAgICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgICBkZXNjcmliZTogJ1R1cm4gb24vb2ZmIHRhYmxlcyBzdXBwb3J0JyxcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgIH0sXG4gICAgdGFibGVzSGVhZGVySWQ6IHtcbiAgICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXG4gICAgICBkZXNjcmliZTogJ0FkZCBhbiBpZCB0byB0YWJsZSBoZWFkZXJzJyxcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgIH0sXG4gICAgZ2hDb2RlQmxvY2tzOiB7XG4gICAgICBkZWZhdWx0VmFsdWU6IHRydWUsXG4gICAgICBkZXNjcmliZTogJ1R1cm4gb24vb2ZmIEdGTSBmZW5jZWQgY29kZSBibG9ja3Mgc3VwcG9ydCcsXG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICB9LFxuICAgIHRhc2tsaXN0czoge1xuICAgICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICAgIGRlc2NyaWJlOiAnVHVybiBvbi9vZmYgR0ZNIHRhc2tsaXN0IHN1cHBvcnQnLFxuICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgfSxcbiAgICBzbW9vdGhMaXZlUHJldmlldzoge1xuICAgICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICAgIGRlc2NyaWJlOiAnUHJldmVudHMgd2VpcmQgZWZmZWN0cyBpbiBsaXZlIHByZXZpZXdzIGR1ZSB0byBpbmNvbXBsZXRlIGlucHV0JyxcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgIH0sXG4gICAgc21hcnRJbmRlbnRhdGlvbkZpeDoge1xuICAgICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVHJpZXMgdG8gc21hcnRseSBmaXggaWRlbnRhdGlvbiBpbiBlczYgc3RyaW5ncycsXG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICB9XG4gIH07XG4gIGlmIChzaW1wbGUgPT09IGZhbHNlKSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZGVmYXVsdE9wdGlvbnMpKTtcbiAgfVxuICB2YXIgcmV0ID0ge307XG4gIGZvciAodmFyIG9wdCBpbiBkZWZhdWx0T3B0aW9ucykge1xuICAgIGlmIChkZWZhdWx0T3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShvcHQpKSB7XG4gICAgICByZXRbb3B0XSA9IGRlZmF1bHRPcHRpb25zW29wdF0uZGVmYXVsdFZhbHVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmV0O1xufVxuXG4vKipcbiAqIENyZWF0ZWQgYnkgVGl2aWUgb24gMDYtMDEtMjAxNS5cbiAqL1xuXG4vLyBQcml2YXRlIHByb3BlcnRpZXNcbnZhciBzaG93ZG93biA9IHt9LFxuICAgIHBhcnNlcnMgPSB7fSxcbiAgICBleHRlbnNpb25zID0ge30sXG4gICAgZ2xvYmFsT3B0aW9ucyA9IGdldERlZmF1bHRPcHRzKHRydWUpLFxuICAgIGZsYXZvciA9IHtcbiAgICAgIGdpdGh1Yjoge1xuICAgICAgICBvbWl0RXh0cmFXTEluQ29kZUJsb2NrczogICB0cnVlLFxuICAgICAgICBwcmVmaXhIZWFkZXJJZDogICAgICAgICAgICAndXNlci1jb250ZW50LScsXG4gICAgICAgIHNpbXBsaWZpZWRBdXRvTGluazogICAgICAgIHRydWUsXG4gICAgICAgIGxpdGVyYWxNaWRXb3JkVW5kZXJzY29yZXM6IHRydWUsXG4gICAgICAgIHN0cmlrZXRocm91Z2g6ICAgICAgICAgICAgIHRydWUsXG4gICAgICAgIHRhYmxlczogICAgICAgICAgICAgICAgICAgIHRydWUsXG4gICAgICAgIHRhYmxlc0hlYWRlcklkOiAgICAgICAgICAgIHRydWUsXG4gICAgICAgIGdoQ29kZUJsb2NrczogICAgICAgICAgICAgIHRydWUsXG4gICAgICAgIHRhc2tsaXN0czogICAgICAgICAgICAgICAgIHRydWVcbiAgICAgIH0sXG4gICAgICB2YW5pbGxhOiBnZXREZWZhdWx0T3B0cyh0cnVlKVxuICAgIH07XG5cbi8qKlxuICogaGVscGVyIG5hbWVzcGFjZVxuICogQHR5cGUge3t9fVxuICovXG5zaG93ZG93bi5oZWxwZXIgPSB7fTtcblxuLyoqXG4gKiBUT0RPIExFR0FDWSBTVVBQT1JUIENPREVcbiAqIEB0eXBlIHt7fX1cbiAqL1xuc2hvd2Rvd24uZXh0ZW5zaW9ucyA9IHt9O1xuXG4vKipcbiAqIFNldCBhIGdsb2JhbCBvcHRpb25cbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAqIEBwYXJhbSB7Kn0gdmFsdWVcbiAqIEByZXR1cm5zIHtzaG93ZG93bn1cbiAqL1xuc2hvd2Rvd24uc2V0T3B0aW9uID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICBnbG9iYWxPcHRpb25zW2tleV0gPSB2YWx1ZTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEdldCBhIGdsb2JhbCBvcHRpb25cbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAqIEByZXR1cm5zIHsqfVxuICovXG5zaG93ZG93bi5nZXRPcHRpb24gPSBmdW5jdGlvbiAoa2V5KSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgcmV0dXJuIGdsb2JhbE9wdGlvbnNba2V5XTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBnbG9iYWwgb3B0aW9uc1xuICogQHN0YXRpY1xuICogQHJldHVybnMge3t9fVxuICovXG5zaG93ZG93bi5nZXRPcHRpb25zID0gZnVuY3Rpb24gKCkge1xuICAndXNlIHN0cmljdCc7XG4gIHJldHVybiBnbG9iYWxPcHRpb25zO1xufTtcblxuLyoqXG4gKiBSZXNldCBnbG9iYWwgb3B0aW9ucyB0byB0aGUgZGVmYXVsdCB2YWx1ZXNcbiAqIEBzdGF0aWNcbiAqL1xuc2hvd2Rvd24ucmVzZXRPcHRpb25zID0gZnVuY3Rpb24gKCkge1xuICAndXNlIHN0cmljdCc7XG4gIGdsb2JhbE9wdGlvbnMgPSBnZXREZWZhdWx0T3B0cyh0cnVlKTtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBmbGF2b3Igc2hvd2Rvd24gc2hvdWxkIHVzZSBhcyBkZWZhdWx0XG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICovXG5zaG93ZG93bi5zZXRGbGF2b3IgPSBmdW5jdGlvbiAobmFtZSkge1xuICAndXNlIHN0cmljdCc7XG4gIGlmIChmbGF2b3IuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICB2YXIgcHJlc2V0ID0gZmxhdm9yW25hbWVdO1xuICAgIGZvciAodmFyIG9wdGlvbiBpbiBwcmVzZXQpIHtcbiAgICAgIGlmIChwcmVzZXQuaGFzT3duUHJvcGVydHkob3B0aW9uKSkge1xuICAgICAgICBnbG9iYWxPcHRpb25zW29wdGlvbl0gPSBwcmVzZXRbb3B0aW9uXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogR2V0IHRoZSBkZWZhdWx0IG9wdGlvbnNcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW3NpbXBsZT10cnVlXVxuICogQHJldHVybnMge3t9fVxuICovXG5zaG93ZG93bi5nZXREZWZhdWx0T3B0aW9ucyA9IGZ1bmN0aW9uIChzaW1wbGUpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICByZXR1cm4gZ2V0RGVmYXVsdE9wdHMoc2ltcGxlKTtcbn07XG5cbi8qKlxuICogR2V0IG9yIHNldCBhIHN1YlBhcnNlclxuICpcbiAqIHN1YlBhcnNlcihuYW1lKSAgICAgICAtIEdldCBhIHJlZ2lzdGVyZWQgc3ViUGFyc2VyXG4gKiBzdWJQYXJzZXIobmFtZSwgZnVuYykgLSBSZWdpc3RlciBhIHN1YlBhcnNlclxuICogQHN0YXRpY1xuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IFtmdW5jXVxuICogQHJldHVybnMgeyp9XG4gKi9cbnNob3dkb3duLnN1YlBhcnNlciA9IGZ1bmN0aW9uIChuYW1lLCBmdW5jKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgaWYgKHNob3dkb3duLmhlbHBlci5pc1N0cmluZyhuYW1lKSkge1xuICAgIGlmICh0eXBlb2YgZnVuYyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHBhcnNlcnNbbmFtZV0gPSBmdW5jO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAocGFyc2Vycy5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICByZXR1cm4gcGFyc2Vyc1tuYW1lXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IEVycm9yKCdTdWJQYXJzZXIgbmFtZWQgJyArIG5hbWUgKyAnIG5vdCByZWdpc3RlcmVkIScpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBHZXRzIG9yIHJlZ2lzdGVycyBhbiBleHRlbnNpb25cbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcGFyYW0ge29iamVjdHxmdW5jdGlvbj19IGV4dFxuICogQHJldHVybnMgeyp9XG4gKi9cbnNob3dkb3duLmV4dGVuc2lvbiA9IGZ1bmN0aW9uIChuYW1lLCBleHQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGlmICghc2hvd2Rvd24uaGVscGVyLmlzU3RyaW5nKG5hbWUpKSB7XG4gICAgdGhyb3cgRXJyb3IoJ0V4dGVuc2lvbiBcXCduYW1lXFwnIG11c3QgYmUgYSBzdHJpbmcnKTtcbiAgfVxuXG4gIG5hbWUgPSBzaG93ZG93bi5oZWxwZXIuc3RkRXh0TmFtZShuYW1lKTtcblxuICAvLyBHZXR0ZXJcbiAgaWYgKHNob3dkb3duLmhlbHBlci5pc1VuZGVmaW5lZChleHQpKSB7XG4gICAgaWYgKCFleHRlbnNpb25zLmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICB0aHJvdyBFcnJvcignRXh0ZW5zaW9uIG5hbWVkICcgKyBuYW1lICsgJyBpcyBub3QgcmVnaXN0ZXJlZCEnKTtcbiAgICB9XG4gICAgcmV0dXJuIGV4dGVuc2lvbnNbbmFtZV07XG5cbiAgICAvLyBTZXR0ZXJcbiAgfSBlbHNlIHtcbiAgICAvLyBFeHBhbmQgZXh0ZW5zaW9uIGlmIGl0J3Mgd3JhcHBlZCBpbiBhIGZ1bmN0aW9uXG4gICAgaWYgKHR5cGVvZiBleHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGV4dCA9IGV4dCgpO1xuICAgIH1cblxuICAgIC8vIEVuc3VyZSBleHRlbnNpb24gaXMgYW4gYXJyYXlcbiAgICBpZiAoIXNob3dkb3duLmhlbHBlci5pc0FycmF5KGV4dCkpIHtcbiAgICAgIGV4dCA9IFtleHRdO1xuICAgIH1cblxuICAgIHZhciB2YWxpZEV4dGVuc2lvbiA9IHZhbGlkYXRlKGV4dCwgbmFtZSk7XG5cbiAgICBpZiAodmFsaWRFeHRlbnNpb24udmFsaWQpIHtcbiAgICAgIGV4dGVuc2lvbnNbbmFtZV0gPSBleHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IEVycm9yKHZhbGlkRXh0ZW5zaW9uLmVycm9yKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogR2V0cyBhbGwgZXh0ZW5zaW9ucyByZWdpc3RlcmVkXG4gKiBAcmV0dXJucyB7e319XG4gKi9cbnNob3dkb3duLmdldEFsbEV4dGVuc2lvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgcmV0dXJuIGV4dGVuc2lvbnM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbiBleHRlbnNpb25cbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKi9cbnNob3dkb3duLnJlbW92ZUV4dGVuc2lvbiA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgZGVsZXRlIGV4dGVuc2lvbnNbbmFtZV07XG59O1xuXG4vKipcbiAqIFJlbW92ZXMgYWxsIGV4dGVuc2lvbnNcbiAqL1xuc2hvd2Rvd24ucmVzZXRFeHRlbnNpb25zID0gZnVuY3Rpb24gKCkge1xuICAndXNlIHN0cmljdCc7XG4gIGV4dGVuc2lvbnMgPSB7fTtcbn07XG5cbi8qKlxuICogVmFsaWRhdGUgZXh0ZW5zaW9uXG4gKiBAcGFyYW0ge2FycmF5fSBleHRlbnNpb25cbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJucyB7e3ZhbGlkOiBib29sZWFuLCBlcnJvcjogc3RyaW5nfX1cbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGUoZXh0ZW5zaW9uLCBuYW1lKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgZXJyTXNnID0gKG5hbWUpID8gJ0Vycm9yIGluICcgKyBuYW1lICsgJyBleHRlbnNpb24tPicgOiAnRXJyb3IgaW4gdW5uYW1lZCBleHRlbnNpb24nLFxuICAgIHJldCA9IHtcbiAgICAgIHZhbGlkOiB0cnVlLFxuICAgICAgZXJyb3I6ICcnXG4gICAgfTtcblxuICBpZiAoIXNob3dkb3duLmhlbHBlci5pc0FycmF5KGV4dGVuc2lvbikpIHtcbiAgICBleHRlbnNpb24gPSBbZXh0ZW5zaW9uXTtcbiAgfVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZXh0ZW5zaW9uLmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIGJhc2VNc2cgPSBlcnJNc2cgKyAnIHN1Yi1leHRlbnNpb24gJyArIGkgKyAnOiAnLFxuICAgICAgICBleHQgPSBleHRlbnNpb25baV07XG4gICAgaWYgKHR5cGVvZiBleHQgIT09ICdvYmplY3QnKSB7XG4gICAgICByZXQudmFsaWQgPSBmYWxzZTtcbiAgICAgIHJldC5lcnJvciA9IGJhc2VNc2cgKyAnbXVzdCBiZSBhbiBvYmplY3QsIGJ1dCAnICsgdHlwZW9mIGV4dCArICcgZ2l2ZW4nO1xuICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICBpZiAoIXNob3dkb3duLmhlbHBlci5pc1N0cmluZyhleHQudHlwZSkpIHtcbiAgICAgIHJldC52YWxpZCA9IGZhbHNlO1xuICAgICAgcmV0LmVycm9yID0gYmFzZU1zZyArICdwcm9wZXJ0eSBcInR5cGVcIiBtdXN0IGJlIGEgc3RyaW5nLCBidXQgJyArIHR5cGVvZiBleHQudHlwZSArICcgZ2l2ZW4nO1xuICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICB2YXIgdHlwZSA9IGV4dC50eXBlID0gZXh0LnR5cGUudG9Mb3dlckNhc2UoKTtcblxuICAgIC8vIG5vcm1hbGl6ZSBleHRlbnNpb24gdHlwZVxuICAgIGlmICh0eXBlID09PSAnbGFuZ3VhZ2UnKSB7XG4gICAgICB0eXBlID0gZXh0LnR5cGUgPSAnbGFuZyc7XG4gICAgfVxuXG4gICAgaWYgKHR5cGUgPT09ICdodG1sJykge1xuICAgICAgdHlwZSA9IGV4dC50eXBlID0gJ291dHB1dCc7XG4gICAgfVxuXG4gICAgaWYgKHR5cGUgIT09ICdsYW5nJyAmJiB0eXBlICE9PSAnb3V0cHV0JyAmJiB0eXBlICE9PSAnbGlzdGVuZXInKSB7XG4gICAgICByZXQudmFsaWQgPSBmYWxzZTtcbiAgICAgIHJldC5lcnJvciA9IGJhc2VNc2cgKyAndHlwZSAnICsgdHlwZSArICcgaXMgbm90IHJlY29nbml6ZWQuIFZhbGlkIHZhbHVlczogXCJsYW5nL2xhbmd1YWdlXCIsIFwib3V0cHV0L2h0bWxcIiBvciBcImxpc3RlbmVyXCInO1xuICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICBpZiAodHlwZSA9PT0gJ2xpc3RlbmVyJykge1xuICAgICAgaWYgKHNob3dkb3duLmhlbHBlci5pc1VuZGVmaW5lZChleHQubGlzdGVuZXJzKSkge1xuICAgICAgICByZXQudmFsaWQgPSBmYWxzZTtcbiAgICAgICAgcmV0LmVycm9yID0gYmFzZU1zZyArICcuIEV4dGVuc2lvbnMgb2YgdHlwZSBcImxpc3RlbmVyXCIgbXVzdCBoYXZlIGEgcHJvcGVydHkgY2FsbGVkIFwibGlzdGVuZXJzXCInO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoc2hvd2Rvd24uaGVscGVyLmlzVW5kZWZpbmVkKGV4dC5maWx0ZXIpICYmIHNob3dkb3duLmhlbHBlci5pc1VuZGVmaW5lZChleHQucmVnZXgpKSB7XG4gICAgICAgIHJldC52YWxpZCA9IGZhbHNlO1xuICAgICAgICByZXQuZXJyb3IgPSBiYXNlTXNnICsgdHlwZSArICcgZXh0ZW5zaW9ucyBtdXN0IGRlZmluZSBlaXRoZXIgYSBcInJlZ2V4XCIgcHJvcGVydHkgb3IgYSBcImZpbHRlclwiIG1ldGhvZCc7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGV4dC5saXN0ZW5lcnMpIHtcbiAgICAgIGlmICh0eXBlb2YgZXh0Lmxpc3RlbmVycyAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0LnZhbGlkID0gZmFsc2U7XG4gICAgICAgIHJldC5lcnJvciA9IGJhc2VNc2cgKyAnXCJsaXN0ZW5lcnNcIiBwcm9wZXJ0eSBtdXN0IGJlIGFuIG9iamVjdCBidXQgJyArIHR5cGVvZiBleHQubGlzdGVuZXJzICsgJyBnaXZlbic7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgICB9XG4gICAgICBmb3IgKHZhciBsbiBpbiBleHQubGlzdGVuZXJzKSB7XG4gICAgICAgIGlmIChleHQubGlzdGVuZXJzLmhhc093blByb3BlcnR5KGxuKSkge1xuICAgICAgICAgIGlmICh0eXBlb2YgZXh0Lmxpc3RlbmVyc1tsbl0gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldC52YWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0LmVycm9yID0gYmFzZU1zZyArICdcImxpc3RlbmVyc1wiIHByb3BlcnR5IG11c3QgYmUgYW4gaGFzaCBvZiBbZXZlbnQgbmFtZV06IFtjYWxsYmFja10uIGxpc3RlbmVycy4nICsgbG4gK1xuICAgICAgICAgICAgICAnIG11c3QgYmUgYSBmdW5jdGlvbiBidXQgJyArIHR5cGVvZiBleHQubGlzdGVuZXJzW2xuXSArICcgZ2l2ZW4nO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZXh0LmZpbHRlcikge1xuICAgICAgaWYgKHR5cGVvZiBleHQuZmlsdGVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldC52YWxpZCA9IGZhbHNlO1xuICAgICAgICByZXQuZXJyb3IgPSBiYXNlTXNnICsgJ1wiZmlsdGVyXCIgbXVzdCBiZSBhIGZ1bmN0aW9uLCBidXQgJyArIHR5cGVvZiBleHQuZmlsdGVyICsgJyBnaXZlbic7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChleHQucmVnZXgpIHtcbiAgICAgIGlmIChzaG93ZG93bi5oZWxwZXIuaXNTdHJpbmcoZXh0LnJlZ2V4KSkge1xuICAgICAgICBleHQucmVnZXggPSBuZXcgUmVnRXhwKGV4dC5yZWdleCwgJ2cnKTtcbiAgICAgIH1cbiAgICAgIGlmICghZXh0LnJlZ2V4IGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgIHJldC52YWxpZCA9IGZhbHNlO1xuICAgICAgICByZXQuZXJyb3IgPSBiYXNlTXNnICsgJ1wicmVnZXhcIiBwcm9wZXJ0eSBtdXN0IGVpdGhlciBiZSBhIHN0cmluZyBvciBhIFJlZ0V4cCBvYmplY3QsIGJ1dCAnICsgdHlwZW9mIGV4dC5yZWdleCArICcgZ2l2ZW4nO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgfVxuICAgICAgaWYgKHNob3dkb3duLmhlbHBlci5pc1VuZGVmaW5lZChleHQucmVwbGFjZSkpIHtcbiAgICAgICAgcmV0LnZhbGlkID0gZmFsc2U7XG4gICAgICAgIHJldC5lcnJvciA9IGJhc2VNc2cgKyAnXCJyZWdleFwiIGV4dGVuc2lvbnMgbXVzdCBpbXBsZW1lbnQgYSByZXBsYWNlIHN0cmluZyBvciBmdW5jdGlvbic7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiByZXQ7XG59XG5cbi8qKlxuICogVmFsaWRhdGUgZXh0ZW5zaW9uXG4gKiBAcGFyYW0ge29iamVjdH0gZXh0XG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuc2hvd2Rvd24udmFsaWRhdGVFeHRlbnNpb24gPSBmdW5jdGlvbiAoZXh0KSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgdmFsaWRhdGVFeHRlbnNpb24gPSB2YWxpZGF0ZShleHQsIG51bGwpO1xuICBpZiAoIXZhbGlkYXRlRXh0ZW5zaW9uLnZhbGlkKSB7XG4gICAgY29uc29sZS53YXJuKHZhbGlkYXRlRXh0ZW5zaW9uLmVycm9yKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vKipcbiAqIHNob3dkb3duanMgaGVscGVyIGZ1bmN0aW9uc1xuICovXG5cbmlmICghc2hvd2Rvd24uaGFzT3duUHJvcGVydHkoJ2hlbHBlcicpKSB7XG4gIHNob3dkb3duLmhlbHBlciA9IHt9O1xufVxuXG4vKipcbiAqIENoZWNrIGlmIHZhciBpcyBzdHJpbmdcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7c3RyaW5nfSBhXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuc2hvd2Rvd24uaGVscGVyLmlzU3RyaW5nID0gZnVuY3Rpb24gaXNTdHJpbmcoYSkge1xuICAndXNlIHN0cmljdCc7XG4gIHJldHVybiAodHlwZW9mIGEgPT09ICdzdHJpbmcnIHx8IGEgaW5zdGFuY2VvZiBTdHJpbmcpO1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiB2YXIgaXMgYSBmdW5jdGlvblxuICogQHN0YXRpY1xuICogQHBhcmFtIHtzdHJpbmd9IGFcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5zaG93ZG93bi5oZWxwZXIuaXNGdW5jdGlvbiA9IGZ1bmN0aW9uIGlzRnVuY3Rpb24oYSkge1xuICAndXNlIHN0cmljdCc7XG4gIHZhciBnZXRUeXBlID0ge307XG4gIHJldHVybiBhICYmIGdldFR5cGUudG9TdHJpbmcuY2FsbChhKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcbn07XG5cbi8qKlxuICogRm9yRWFjaCBoZWxwZXIgZnVuY3Rpb25cbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7Kn0gb2JqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFja1xuICovXG5zaG93ZG93bi5oZWxwZXIuZm9yRWFjaCA9IGZ1bmN0aW9uIGZvckVhY2gob2JqLCBjYWxsYmFjaykge1xuICAndXNlIHN0cmljdCc7XG4gIGlmICh0eXBlb2Ygb2JqLmZvckVhY2ggPT09ICdmdW5jdGlvbicpIHtcbiAgICBvYmouZm9yRWFjaChjYWxsYmFjayk7XG4gIH0gZWxzZSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvYmoubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNhbGxiYWNrKG9ialtpXSwgaSwgb2JqKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogaXNBcnJheSBoZWxwZXIgZnVuY3Rpb25cbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7Kn0gYVxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbnNob3dkb3duLmhlbHBlci5pc0FycmF5ID0gZnVuY3Rpb24gaXNBcnJheShhKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgcmV0dXJuIGEuY29uc3RydWN0b3IgPT09IEFycmF5O1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiB2YWx1ZSBpcyB1bmRlZmluZWRcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYHVuZGVmaW5lZGAsIGVsc2UgYGZhbHNlYC5cbiAqL1xuc2hvd2Rvd24uaGVscGVyLmlzVW5kZWZpbmVkID0gZnVuY3Rpb24gaXNVbmRlZmluZWQodmFsdWUpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJztcbn07XG5cbi8qKlxuICogU3RhbmRhcmRpZGl6ZSBleHRlbnNpb24gbmFtZVxuICogQHN0YXRpY1xuICogQHBhcmFtIHtzdHJpbmd9IHMgZXh0ZW5zaW9uIG5hbWVcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbnNob3dkb3duLmhlbHBlci5zdGRFeHROYW1lID0gZnVuY3Rpb24gKHMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICByZXR1cm4gcy5yZXBsYWNlKC9bXy1dfHxcXHMvZywgJycpLnRvTG93ZXJDYXNlKCk7XG59O1xuXG5mdW5jdGlvbiBlc2NhcGVDaGFyYWN0ZXJzQ2FsbGJhY2sod2hvbGVNYXRjaCwgbTEpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICB2YXIgY2hhckNvZGVUb0VzY2FwZSA9IG0xLmNoYXJDb2RlQXQoMCk7XG4gIHJldHVybiAnfkUnICsgY2hhckNvZGVUb0VzY2FwZSArICdFJztcbn1cblxuLyoqXG4gKiBDYWxsYmFjayB1c2VkIHRvIGVzY2FwZSBjaGFyYWN0ZXJzIHdoZW4gcGFzc2luZyB0aHJvdWdoIFN0cmluZy5yZXBsYWNlXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge3N0cmluZ30gd2hvbGVNYXRjaFxuICogQHBhcmFtIHtzdHJpbmd9IG0xXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5zaG93ZG93bi5oZWxwZXIuZXNjYXBlQ2hhcmFjdGVyc0NhbGxiYWNrID0gZXNjYXBlQ2hhcmFjdGVyc0NhbGxiYWNrO1xuXG4vKipcbiAqIEVzY2FwZSBjaGFyYWN0ZXJzIGluIGEgc3RyaW5nXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dFxuICogQHBhcmFtIHtzdHJpbmd9IGNoYXJzVG9Fc2NhcGVcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gYWZ0ZXJCYWNrc2xhc2hcbiAqIEByZXR1cm5zIHtYTUx8c3RyaW5nfHZvaWR8Kn1cbiAqL1xuc2hvd2Rvd24uaGVscGVyLmVzY2FwZUNoYXJhY3RlcnMgPSBmdW5jdGlvbiBlc2NhcGVDaGFyYWN0ZXJzKHRleHQsIGNoYXJzVG9Fc2NhcGUsIGFmdGVyQmFja3NsYXNoKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgLy8gRmlyc3Qgd2UgaGF2ZSB0byBlc2NhcGUgdGhlIGVzY2FwZSBjaGFyYWN0ZXJzIHNvIHRoYXRcbiAgLy8gd2UgY2FuIGJ1aWxkIGEgY2hhcmFjdGVyIGNsYXNzIG91dCBvZiB0aGVtXG4gIHZhciByZWdleFN0cmluZyA9ICcoWycgKyBjaGFyc1RvRXNjYXBlLnJlcGxhY2UoLyhbXFxbXFxdXFxcXF0pL2csICdcXFxcJDEnKSArICddKSc7XG5cbiAgaWYgKGFmdGVyQmFja3NsYXNoKSB7XG4gICAgcmVnZXhTdHJpbmcgPSAnXFxcXFxcXFwnICsgcmVnZXhTdHJpbmc7XG4gIH1cblxuICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKHJlZ2V4U3RyaW5nLCAnZycpO1xuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKHJlZ2V4LCBlc2NhcGVDaGFyYWN0ZXJzQ2FsbGJhY2spO1xuXG4gIHJldHVybiB0ZXh0O1xufTtcblxudmFyIHJneEZpbmRNYXRjaFBvcyA9IGZ1bmN0aW9uIChzdHIsIGxlZnQsIHJpZ2h0LCBmbGFncykge1xuICAndXNlIHN0cmljdCc7XG4gIHZhciBmID0gZmxhZ3MgfHwgJycsXG4gICAgZyA9IGYuaW5kZXhPZignZycpID4gLTEsXG4gICAgeCA9IG5ldyBSZWdFeHAobGVmdCArICd8JyArIHJpZ2h0LCAnZycgKyBmLnJlcGxhY2UoL2cvZywgJycpKSxcbiAgICBsID0gbmV3IFJlZ0V4cChsZWZ0LCBmLnJlcGxhY2UoL2cvZywgJycpKSxcbiAgICBwb3MgPSBbXSxcbiAgICB0LCBzLCBtLCBzdGFydCwgZW5kO1xuXG4gIGRvIHtcbiAgICB0ID0gMDtcbiAgICB3aGlsZSAoKG0gPSB4LmV4ZWMoc3RyKSkpIHtcbiAgICAgIGlmIChsLnRlc3QobVswXSkpIHtcbiAgICAgICAgaWYgKCEodCsrKSkge1xuICAgICAgICAgIHMgPSB4Lmxhc3RJbmRleDtcbiAgICAgICAgICBzdGFydCA9IHMgLSBtWzBdLmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0KSB7XG4gICAgICAgIGlmICghLS10KSB7XG4gICAgICAgICAgZW5kID0gbS5pbmRleCArIG1bMF0ubGVuZ3RoO1xuICAgICAgICAgIHZhciBvYmogPSB7XG4gICAgICAgICAgICBsZWZ0OiB7c3RhcnQ6IHN0YXJ0LCBlbmQ6IHN9LFxuICAgICAgICAgICAgbWF0Y2g6IHtzdGFydDogcywgZW5kOiBtLmluZGV4fSxcbiAgICAgICAgICAgIHJpZ2h0OiB7c3RhcnQ6IG0uaW5kZXgsIGVuZDogZW5kfSxcbiAgICAgICAgICAgIHdob2xlTWF0Y2g6IHtzdGFydDogc3RhcnQsIGVuZDogZW5kfVxuICAgICAgICAgIH07XG4gICAgICAgICAgcG9zLnB1c2gob2JqKTtcbiAgICAgICAgICBpZiAoIWcpIHtcbiAgICAgICAgICAgIHJldHVybiBwb3M7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IHdoaWxlICh0ICYmICh4Lmxhc3RJbmRleCA9IHMpKTtcblxuICByZXR1cm4gcG9zO1xufTtcblxuLyoqXG4gKiBtYXRjaFJlY3Vyc2l2ZVJlZ0V4cFxuICpcbiAqIChjKSAyMDA3IFN0ZXZlbiBMZXZpdGhhbiA8c3RldmVubGV2aXRoYW4uY29tPlxuICogTUlUIExpY2Vuc2VcbiAqXG4gKiBBY2NlcHRzIGEgc3RyaW5nIHRvIHNlYXJjaCwgYSBsZWZ0IGFuZCByaWdodCBmb3JtYXQgZGVsaW1pdGVyXG4gKiBhcyByZWdleCBwYXR0ZXJucywgYW5kIG9wdGlvbmFsIHJlZ2V4IGZsYWdzLiBSZXR1cm5zIGFuIGFycmF5XG4gKiBvZiBtYXRjaGVzLCBhbGxvd2luZyBuZXN0ZWQgaW5zdGFuY2VzIG9mIGxlZnQvcmlnaHQgZGVsaW1pdGVycy5cbiAqIFVzZSB0aGUgXCJnXCIgZmxhZyB0byByZXR1cm4gYWxsIG1hdGNoZXMsIG90aGVyd2lzZSBvbmx5IHRoZVxuICogZmlyc3QgaXMgcmV0dXJuZWQuIEJlIGNhcmVmdWwgdG8gZW5zdXJlIHRoYXQgdGhlIGxlZnQgYW5kXG4gKiByaWdodCBmb3JtYXQgZGVsaW1pdGVycyBwcm9kdWNlIG11dHVhbGx5IGV4Y2x1c2l2ZSBtYXRjaGVzLlxuICogQmFja3JlZmVyZW5jZXMgYXJlIG5vdCBzdXBwb3J0ZWQgd2l0aGluIHRoZSByaWdodCBkZWxpbWl0ZXJcbiAqIGR1ZSB0byBob3cgaXQgaXMgaW50ZXJuYWxseSBjb21iaW5lZCB3aXRoIHRoZSBsZWZ0IGRlbGltaXRlci5cbiAqIFdoZW4gbWF0Y2hpbmcgc3RyaW5ncyB3aG9zZSBmb3JtYXQgZGVsaW1pdGVycyBhcmUgdW5iYWxhbmNlZFxuICogdG8gdGhlIGxlZnQgb3IgcmlnaHQsIHRoZSBvdXRwdXQgaXMgaW50ZW50aW9uYWxseSBhcyBhXG4gKiBjb252ZW50aW9uYWwgcmVnZXggbGlicmFyeSB3aXRoIHJlY3Vyc2lvbiBzdXBwb3J0IHdvdWxkXG4gKiBwcm9kdWNlLCBlLmcuIFwiPDx4PlwiIGFuZCBcIjx4Pj5cIiBib3RoIHByb2R1Y2UgW1wieFwiXSB3aGVuIHVzaW5nXG4gKiBcIjxcIiBhbmQgXCI+XCIgYXMgdGhlIGRlbGltaXRlcnMgKGJvdGggc3RyaW5ncyBjb250YWluIGEgc2luZ2xlLFxuICogYmFsYW5jZWQgaW5zdGFuY2Ugb2YgXCI8eD5cIikuXG4gKlxuICogZXhhbXBsZXM6XG4gKiBtYXRjaFJlY3Vyc2l2ZVJlZ0V4cChcInRlc3RcIiwgXCJcXFxcKFwiLCBcIlxcXFwpXCIpXG4gKiByZXR1cm5zOiBbXVxuICogbWF0Y2hSZWN1cnNpdmVSZWdFeHAoXCI8dDw8ZT4+PHM+PnQ8PlwiLCBcIjxcIiwgXCI+XCIsIFwiZ1wiKVxuICogcmV0dXJuczogW1widDw8ZT4+PHM+XCIsIFwiXCJdXG4gKiBtYXRjaFJlY3Vyc2l2ZVJlZ0V4cChcIjxkaXYgaWQ9XFxcInhcXFwiPnRlc3Q8L2Rpdj5cIiwgXCI8ZGl2XFxcXGJbXj5dKj5cIiwgXCI8L2Rpdj5cIiwgXCJnaVwiKVxuICogcmV0dXJuczogW1widGVzdFwiXVxuICovXG5zaG93ZG93bi5oZWxwZXIubWF0Y2hSZWN1cnNpdmVSZWdFeHAgPSBmdW5jdGlvbiAoc3RyLCBsZWZ0LCByaWdodCwgZmxhZ3MpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBtYXRjaFBvcyA9IHJneEZpbmRNYXRjaFBvcyAoc3RyLCBsZWZ0LCByaWdodCwgZmxhZ3MpLFxuICAgIHJlc3VsdHMgPSBbXTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IG1hdGNoUG9zLmxlbmd0aDsgKytpKSB7XG4gICAgcmVzdWx0cy5wdXNoKFtcbiAgICAgIHN0ci5zbGljZShtYXRjaFBvc1tpXS53aG9sZU1hdGNoLnN0YXJ0LCBtYXRjaFBvc1tpXS53aG9sZU1hdGNoLmVuZCksXG4gICAgICBzdHIuc2xpY2UobWF0Y2hQb3NbaV0ubWF0Y2guc3RhcnQsIG1hdGNoUG9zW2ldLm1hdGNoLmVuZCksXG4gICAgICBzdHIuc2xpY2UobWF0Y2hQb3NbaV0ubGVmdC5zdGFydCwgbWF0Y2hQb3NbaV0ubGVmdC5lbmQpLFxuICAgICAgc3RyLnNsaWNlKG1hdGNoUG9zW2ldLnJpZ2h0LnN0YXJ0LCBtYXRjaFBvc1tpXS5yaWdodC5lbmQpXG4gICAgXSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdHM7XG59O1xuXG4vKipcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyXG4gKiBAcGFyYW0ge3N0cmluZ3xmdW5jdGlvbn0gcmVwbGFjZW1lbnRcbiAqIEBwYXJhbSB7c3RyaW5nfSBsZWZ0XG4gKiBAcGFyYW0ge3N0cmluZ30gcmlnaHRcbiAqIEBwYXJhbSB7c3RyaW5nfSBmbGFnc1xuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuc2hvd2Rvd24uaGVscGVyLnJlcGxhY2VSZWN1cnNpdmVSZWdFeHAgPSBmdW5jdGlvbiAoc3RyLCByZXBsYWNlbWVudCwgbGVmdCwgcmlnaHQsIGZsYWdzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBpZiAoIXNob3dkb3duLmhlbHBlci5pc0Z1bmN0aW9uKHJlcGxhY2VtZW50KSkge1xuICAgIHZhciByZXBTdHIgPSByZXBsYWNlbWVudDtcbiAgICByZXBsYWNlbWVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiByZXBTdHI7XG4gICAgfTtcbiAgfVxuXG4gIHZhciBtYXRjaFBvcyA9IHJneEZpbmRNYXRjaFBvcyhzdHIsIGxlZnQsIHJpZ2h0LCBmbGFncyksXG4gICAgICBmaW5hbFN0ciA9IHN0cixcbiAgICAgIGxuZyA9IG1hdGNoUG9zLmxlbmd0aDtcblxuICBpZiAobG5nID4gMCkge1xuICAgIHZhciBiaXRzID0gW107XG4gICAgaWYgKG1hdGNoUG9zWzBdLndob2xlTWF0Y2guc3RhcnQgIT09IDApIHtcbiAgICAgIGJpdHMucHVzaChzdHIuc2xpY2UoMCwgbWF0Y2hQb3NbMF0ud2hvbGVNYXRjaC5zdGFydCkpO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxuZzsgKytpKSB7XG4gICAgICBiaXRzLnB1c2goXG4gICAgICAgIHJlcGxhY2VtZW50KFxuICAgICAgICAgIHN0ci5zbGljZShtYXRjaFBvc1tpXS53aG9sZU1hdGNoLnN0YXJ0LCBtYXRjaFBvc1tpXS53aG9sZU1hdGNoLmVuZCksXG4gICAgICAgICAgc3RyLnNsaWNlKG1hdGNoUG9zW2ldLm1hdGNoLnN0YXJ0LCBtYXRjaFBvc1tpXS5tYXRjaC5lbmQpLFxuICAgICAgICAgIHN0ci5zbGljZShtYXRjaFBvc1tpXS5sZWZ0LnN0YXJ0LCBtYXRjaFBvc1tpXS5sZWZ0LmVuZCksXG4gICAgICAgICAgc3RyLnNsaWNlKG1hdGNoUG9zW2ldLnJpZ2h0LnN0YXJ0LCBtYXRjaFBvc1tpXS5yaWdodC5lbmQpXG4gICAgICAgIClcbiAgICAgICk7XG4gICAgICBpZiAoaSA8IGxuZyAtIDEpIHtcbiAgICAgICAgYml0cy5wdXNoKHN0ci5zbGljZShtYXRjaFBvc1tpXS53aG9sZU1hdGNoLmVuZCwgbWF0Y2hQb3NbaSArIDFdLndob2xlTWF0Y2guc3RhcnQpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG1hdGNoUG9zW2xuZyAtIDFdLndob2xlTWF0Y2guZW5kIDwgc3RyLmxlbmd0aCkge1xuICAgICAgYml0cy5wdXNoKHN0ci5zbGljZShtYXRjaFBvc1tsbmcgLSAxXS53aG9sZU1hdGNoLmVuZCkpO1xuICAgIH1cbiAgICBmaW5hbFN0ciA9IGJpdHMuam9pbignJyk7XG4gIH1cbiAgcmV0dXJuIGZpbmFsU3RyO1xufTtcblxuLyoqXG4gKiBQT0xZRklMTFNcbiAqL1xuaWYgKHNob3dkb3duLmhlbHBlci5pc1VuZGVmaW5lZChjb25zb2xlKSkge1xuICBjb25zb2xlID0ge1xuICAgIHdhcm46IGZ1bmN0aW9uIChtc2cpIHtcbiAgICAgICd1c2Ugc3RyaWN0JztcbiAgICAgIGFsZXJ0KG1zZyk7XG4gICAgfSxcbiAgICBsb2c6IGZ1bmN0aW9uIChtc2cpIHtcbiAgICAgICd1c2Ugc3RyaWN0JztcbiAgICAgIGFsZXJ0KG1zZyk7XG4gICAgfSxcbiAgICBlcnJvcjogZnVuY3Rpb24gKG1zZykge1xuICAgICAgJ3VzZSBzdHJpY3QnO1xuICAgICAgdGhyb3cgbXNnO1xuICAgIH1cbiAgfTtcbn1cblxuLyoqXG4gKiBDcmVhdGVkIGJ5IEVzdGV2YW8gb24gMzEtMDUtMjAxNS5cbiAqL1xuXG4vKipcbiAqIFNob3dkb3duIENvbnZlcnRlciBjbGFzc1xuICogQGNsYXNzXG4gKiBAcGFyYW0ge29iamVjdH0gW2NvbnZlcnRlck9wdGlvbnNdXG4gKiBAcmV0dXJucyB7Q29udmVydGVyfVxuICovXG5zaG93ZG93bi5Db252ZXJ0ZXIgPSBmdW5jdGlvbiAoY29udmVydGVyT3B0aW9ucykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyXG4gICAgICAvKipcbiAgICAgICAqIE9wdGlvbnMgdXNlZCBieSB0aGlzIGNvbnZlcnRlclxuICAgICAgICogQHByaXZhdGVcbiAgICAgICAqIEB0eXBlIHt7fX1cbiAgICAgICAqL1xuICAgICAgb3B0aW9ucyA9IHt9LFxuXG4gICAgICAvKipcbiAgICAgICAqIExhbmd1YWdlIGV4dGVuc2lvbnMgdXNlZCBieSB0aGlzIGNvbnZlcnRlclxuICAgICAgICogQHByaXZhdGVcbiAgICAgICAqIEB0eXBlIHtBcnJheX1cbiAgICAgICAqL1xuICAgICAgbGFuZ0V4dGVuc2lvbnMgPSBbXSxcblxuICAgICAgLyoqXG4gICAgICAgKiBPdXRwdXQgbW9kaWZpZXJzIGV4dGVuc2lvbnMgdXNlZCBieSB0aGlzIGNvbnZlcnRlclxuICAgICAgICogQHByaXZhdGVcbiAgICAgICAqIEB0eXBlIHtBcnJheX1cbiAgICAgICAqL1xuICAgICAgb3V0cHV0TW9kaWZpZXJzID0gW10sXG5cbiAgICAgIC8qKlxuICAgICAgICogRXZlbnQgbGlzdGVuZXJzXG4gICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICogQHR5cGUge3t9fVxuICAgICAgICovXG4gICAgICBsaXN0ZW5lcnMgPSB7fTtcblxuICBfY29uc3RydWN0b3IoKTtcblxuICAvKipcbiAgICogQ29udmVydGVyIGNvbnN0cnVjdG9yXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiBfY29uc3RydWN0b3IoKSB7XG4gICAgY29udmVydGVyT3B0aW9ucyA9IGNvbnZlcnRlck9wdGlvbnMgfHwge307XG5cbiAgICBmb3IgKHZhciBnT3B0IGluIGdsb2JhbE9wdGlvbnMpIHtcbiAgICAgIGlmIChnbG9iYWxPcHRpb25zLmhhc093blByb3BlcnR5KGdPcHQpKSB7XG4gICAgICAgIG9wdGlvbnNbZ09wdF0gPSBnbG9iYWxPcHRpb25zW2dPcHRdO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE1lcmdlIG9wdGlvbnNcbiAgICBpZiAodHlwZW9mIGNvbnZlcnRlck9wdGlvbnMgPT09ICdvYmplY3QnKSB7XG4gICAgICBmb3IgKHZhciBvcHQgaW4gY29udmVydGVyT3B0aW9ucykge1xuICAgICAgICBpZiAoY29udmVydGVyT3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShvcHQpKSB7XG4gICAgICAgICAgb3B0aW9uc1tvcHRdID0gY29udmVydGVyT3B0aW9uc1tvcHRdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IEVycm9yKCdDb252ZXJ0ZXIgZXhwZWN0cyB0aGUgcGFzc2VkIHBhcmFtZXRlciB0byBiZSBhbiBvYmplY3QsIGJ1dCAnICsgdHlwZW9mIGNvbnZlcnRlck9wdGlvbnMgK1xuICAgICAgJyB3YXMgcGFzc2VkIGluc3RlYWQuJyk7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuZXh0ZW5zaW9ucykge1xuICAgICAgc2hvd2Rvd24uaGVscGVyLmZvckVhY2gob3B0aW9ucy5leHRlbnNpb25zLCBfcGFyc2VFeHRlbnNpb24pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBQYXJzZSBleHRlbnNpb25cbiAgICogQHBhcmFtIHsqfSBleHRcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtuYW1lPScnXVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gX3BhcnNlRXh0ZW5zaW9uKGV4dCwgbmFtZSkge1xuXG4gICAgbmFtZSA9IG5hbWUgfHwgbnVsbDtcbiAgICAvLyBJZiBpdCdzIGEgc3RyaW5nLCB0aGUgZXh0ZW5zaW9uIHdhcyBwcmV2aW91c2x5IGxvYWRlZFxuICAgIGlmIChzaG93ZG93bi5oZWxwZXIuaXNTdHJpbmcoZXh0KSkge1xuICAgICAgZXh0ID0gc2hvd2Rvd24uaGVscGVyLnN0ZEV4dE5hbWUoZXh0KTtcbiAgICAgIG5hbWUgPSBleHQ7XG5cbiAgICAgIC8vIExFR0FDWV9TVVBQT1JUIENPREVcbiAgICAgIGlmIChzaG93ZG93bi5leHRlbnNpb25zW2V4dF0pIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdERVBSRUNBVElPTiBXQVJOSU5HOiAnICsgZXh0ICsgJyBpcyBhbiBvbGQgZXh0ZW5zaW9uIHRoYXQgdXNlcyBhIGRlcHJlY2F0ZWQgbG9hZGluZyBtZXRob2QuJyArXG4gICAgICAgICAgJ1BsZWFzZSBpbmZvcm0gdGhlIGRldmVsb3BlciB0aGF0IHRoZSBleHRlbnNpb24gc2hvdWxkIGJlIHVwZGF0ZWQhJyk7XG4gICAgICAgIGxlZ2FjeUV4dGVuc2lvbkxvYWRpbmcoc2hvd2Rvd24uZXh0ZW5zaW9uc1tleHRdLCBleHQpO1xuICAgICAgICByZXR1cm47XG4gICAgICAvLyBFTkQgTEVHQUNZIFNVUFBPUlQgQ09ERVxuXG4gICAgICB9IGVsc2UgaWYgKCFzaG93ZG93bi5oZWxwZXIuaXNVbmRlZmluZWQoZXh0ZW5zaW9uc1tleHRdKSkge1xuICAgICAgICBleHQgPSBleHRlbnNpb25zW2V4dF07XG5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IEVycm9yKCdFeHRlbnNpb24gXCInICsgZXh0ICsgJ1wiIGNvdWxkIG5vdCBiZSBsb2FkZWQuIEl0IHdhcyBlaXRoZXIgbm90IGZvdW5kIG9yIGlzIG5vdCBhIHZhbGlkIGV4dGVuc2lvbi4nKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGV4dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgZXh0ID0gZXh0KCk7XG4gICAgfVxuXG4gICAgaWYgKCFzaG93ZG93bi5oZWxwZXIuaXNBcnJheShleHQpKSB7XG4gICAgICBleHQgPSBbZXh0XTtcbiAgICB9XG5cbiAgICB2YXIgdmFsaWRFeHQgPSB2YWxpZGF0ZShleHQsIG5hbWUpO1xuICAgIGlmICghdmFsaWRFeHQudmFsaWQpIHtcbiAgICAgIHRocm93IEVycm9yKHZhbGlkRXh0LmVycm9yKTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV4dC5sZW5ndGg7ICsraSkge1xuICAgICAgc3dpdGNoIChleHRbaV0udHlwZSkge1xuXG4gICAgICAgIGNhc2UgJ2xhbmcnOlxuICAgICAgICAgIGxhbmdFeHRlbnNpb25zLnB1c2goZXh0W2ldKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdvdXRwdXQnOlxuICAgICAgICAgIG91dHB1dE1vZGlmaWVycy5wdXNoKGV4dFtpXSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpZiAoZXh0W2ldLmhhc093blByb3BlcnR5KGxpc3RlbmVycykpIHtcbiAgICAgICAgZm9yICh2YXIgbG4gaW4gZXh0W2ldLmxpc3RlbmVycykge1xuICAgICAgICAgIGlmIChleHRbaV0ubGlzdGVuZXJzLmhhc093blByb3BlcnR5KGxuKSkge1xuICAgICAgICAgICAgbGlzdGVuKGxuLCBleHRbaV0ubGlzdGVuZXJzW2xuXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gIH1cblxuICAvKipcbiAgICogTEVHQUNZX1NVUFBPUlRcbiAgICogQHBhcmFtIHsqfSBleHRcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICovXG4gIGZ1bmN0aW9uIGxlZ2FjeUV4dGVuc2lvbkxvYWRpbmcoZXh0LCBuYW1lKSB7XG4gICAgaWYgKHR5cGVvZiBleHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGV4dCA9IGV4dChuZXcgc2hvd2Rvd24uQ29udmVydGVyKCkpO1xuICAgIH1cbiAgICBpZiAoIXNob3dkb3duLmhlbHBlci5pc0FycmF5KGV4dCkpIHtcbiAgICAgIGV4dCA9IFtleHRdO1xuICAgIH1cbiAgICB2YXIgdmFsaWQgPSB2YWxpZGF0ZShleHQsIG5hbWUpO1xuXG4gICAgaWYgKCF2YWxpZC52YWxpZCkge1xuICAgICAgdGhyb3cgRXJyb3IodmFsaWQuZXJyb3IpO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXh0Lmxlbmd0aDsgKytpKSB7XG4gICAgICBzd2l0Y2ggKGV4dFtpXS50eXBlKSB7XG4gICAgICAgIGNhc2UgJ2xhbmcnOlxuICAgICAgICAgIGxhbmdFeHRlbnNpb25zLnB1c2goZXh0W2ldKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnb3V0cHV0JzpcbiAgICAgICAgICBvdXRwdXRNb2RpZmllcnMucHVzaChleHRbaV0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0Oi8vIHNob3VsZCBuZXZlciByZWFjaCBoZXJlXG4gICAgICAgICAgdGhyb3cgRXJyb3IoJ0V4dGVuc2lvbiBsb2FkZXIgZXJyb3I6IFR5cGUgdW5yZWNvZ25pemVkISEhJyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIExpc3RlbiB0byBhbiBldmVudFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFja1xuICAgKi9cbiAgZnVuY3Rpb24gbGlzdGVuKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgaWYgKCFzaG93ZG93bi5oZWxwZXIuaXNTdHJpbmcobmFtZSkpIHtcbiAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIGFyZ3VtZW50IGluIGNvbnZlcnRlci5saXN0ZW4oKSBtZXRob2Q6IG5hbWUgbXVzdCBiZSBhIHN0cmluZywgYnV0ICcgKyB0eXBlb2YgbmFtZSArICcgZ2l2ZW4nKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBhcmd1bWVudCBpbiBjb252ZXJ0ZXIubGlzdGVuKCkgbWV0aG9kOiBjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24sIGJ1dCAnICsgdHlwZW9mIGNhbGxiYWNrICsgJyBnaXZlbicpO1xuICAgIH1cblxuICAgIGlmICghbGlzdGVuZXJzLmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICBsaXN0ZW5lcnNbbmFtZV0gPSBbXTtcbiAgICB9XG4gICAgbGlzdGVuZXJzW25hbWVdLnB1c2goY2FsbGJhY2spO1xuICB9XG5cbiAgZnVuY3Rpb24gclRyaW1JbnB1dFRleHQodGV4dCkge1xuICAgIHZhciByc3AgPSB0ZXh0Lm1hdGNoKC9eXFxzKi8pWzBdLmxlbmd0aCxcbiAgICAgICAgcmd4ID0gbmV3IFJlZ0V4cCgnXlxcXFxzezAsJyArIHJzcCArICd9JywgJ2dtJyk7XG4gICAgcmV0dXJuIHRleHQucmVwbGFjZShyZ3gsICcnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNwYXRjaCBhbiBldmVudFxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZ0TmFtZSBFdmVudCBuYW1lXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IFRleHRcbiAgICogQHBhcmFtIHt7fX0gb3B0aW9ucyBDb252ZXJ0ZXIgT3B0aW9uc1xuICAgKiBAcGFyYW0ge3t9fSBnbG9iYWxzXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAqL1xuICB0aGlzLl9kaXNwYXRjaCA9IGZ1bmN0aW9uIGRpc3BhdGNoIChldnROYW1lLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKSB7XG4gICAgaWYgKGxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShldnROYW1lKSkge1xuICAgICAgZm9yICh2YXIgZWkgPSAwOyBlaSA8IGxpc3RlbmVyc1tldnROYW1lXS5sZW5ndGg7ICsrZWkpIHtcbiAgICAgICAgdmFyIG5UZXh0ID0gbGlzdGVuZXJzW2V2dE5hbWVdW2VpXShldnROYW1lLCB0ZXh0LCB0aGlzLCBvcHRpb25zLCBnbG9iYWxzKTtcbiAgICAgICAgaWYgKG5UZXh0ICYmIHR5cGVvZiBuVGV4dCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICB0ZXh0ID0gblRleHQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRleHQ7XG4gIH07XG5cbiAgLyoqXG4gICAqIExpc3RlbiB0byBhbiBldmVudFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFja1xuICAgKiBAcmV0dXJucyB7c2hvd2Rvd24uQ29udmVydGVyfVxuICAgKi9cbiAgdGhpcy5saXN0ZW4gPSBmdW5jdGlvbiAobmFtZSwgY2FsbGJhY2spIHtcbiAgICBsaXN0ZW4obmFtZSwgY2FsbGJhY2spO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBhIG1hcmtkb3duIHN0cmluZyBpbnRvIEhUTUxcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRleHRcbiAgICogQHJldHVybnMgeyp9XG4gICAqL1xuICB0aGlzLm1ha2VIdG1sID0gZnVuY3Rpb24gKHRleHQpIHtcbiAgICAvL2NoZWNrIGlmIHRleHQgaXMgbm90IGZhbHN5XG4gICAgaWYgKCF0ZXh0KSB7XG4gICAgICByZXR1cm4gdGV4dDtcbiAgICB9XG5cbiAgICB2YXIgZ2xvYmFscyA9IHtcbiAgICAgIGdIdG1sQmxvY2tzOiAgICAgW10sXG4gICAgICBnSHRtbE1kQmxvY2tzOiAgIFtdLFxuICAgICAgZ0h0bWxTcGFuczogICAgICBbXSxcbiAgICAgIGdVcmxzOiAgICAgICAgICAge30sXG4gICAgICBnVGl0bGVzOiAgICAgICAgIHt9LFxuICAgICAgZ0RpbWVuc2lvbnM6ICAgICB7fSxcbiAgICAgIGdMaXN0TGV2ZWw6ICAgICAgMCxcbiAgICAgIGhhc2hMaW5rQ291bnRzOiAge30sXG4gICAgICBsYW5nRXh0ZW5zaW9uczogIGxhbmdFeHRlbnNpb25zLFxuICAgICAgb3V0cHV0TW9kaWZpZXJzOiBvdXRwdXRNb2RpZmllcnMsXG4gICAgICBjb252ZXJ0ZXI6ICAgICAgIHRoaXMsXG4gICAgICBnaENvZGVCbG9ja3M6ICAgIFtdXG4gICAgfTtcblxuICAgIC8vIGF0dGFja2xhYjogUmVwbGFjZSB+IHdpdGggflRcbiAgICAvLyBUaGlzIGxldHMgdXMgdXNlIHRpbGRlIGFzIGFuIGVzY2FwZSBjaGFyIHRvIGF2b2lkIG1kNSBoYXNoZXNcbiAgICAvLyBUaGUgY2hvaWNlIG9mIGNoYXJhY3RlciBpcyBhcmJpdHJhcnk7IGFueXRoaW5nIHRoYXQgaXNuJ3RcbiAgICAvLyBtYWdpYyBpbiBNYXJrZG93biB3aWxsIHdvcmsuXG4gICAgdGV4dCA9IHRleHQucmVwbGFjZSgvfi9nLCAnflQnKTtcblxuICAgIC8vIGF0dGFja2xhYjogUmVwbGFjZSAkIHdpdGggfkRcbiAgICAvLyBSZWdFeHAgaW50ZXJwcmV0cyAkIGFzIGEgc3BlY2lhbCBjaGFyYWN0ZXJcbiAgICAvLyB3aGVuIGl0J3MgaW4gYSByZXBsYWNlbWVudCBzdHJpbmdcbiAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXCQvZywgJ35EJyk7XG5cbiAgICAvLyBTdGFuZGFyZGl6ZSBsaW5lIGVuZGluZ3NcbiAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXHJcXG4vZywgJ1xcbicpOyAvLyBET1MgdG8gVW5peFxuICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xcci9nLCAnXFxuJyk7IC8vIE1hYyB0byBVbml4XG5cbiAgICBpZiAob3B0aW9ucy5zbWFydEluZGVudGF0aW9uRml4KSB7XG4gICAgICB0ZXh0ID0gclRyaW1JbnB1dFRleHQodGV4dCk7XG4gICAgfVxuXG4gICAgLy8gTWFrZSBzdXJlIHRleHQgYmVnaW5zIGFuZCBlbmRzIHdpdGggYSBjb3VwbGUgb2YgbmV3bGluZXM6XG4gICAgLy90ZXh0ID0gJ1xcblxcbicgKyB0ZXh0ICsgJ1xcblxcbic7XG4gICAgdGV4dCA9IHRleHQ7XG4gICAgLy8gZGV0YWJcbiAgICB0ZXh0ID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdkZXRhYicpKHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xuXG4gICAgLy8gc3RyaXBCbGFua0xpbmVzXG4gICAgdGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcignc3RyaXBCbGFua0xpbmVzJykodGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XG5cbiAgICAvL3J1biBsYW5ndWFnZUV4dGVuc2lvbnNcbiAgICBzaG93ZG93bi5oZWxwZXIuZm9yRWFjaChsYW5nRXh0ZW5zaW9ucywgZnVuY3Rpb24gKGV4dCkge1xuICAgICAgdGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcigncnVuRXh0ZW5zaW9uJykoZXh0LCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcbiAgICB9KTtcblxuICAgIC8vIHJ1biB0aGUgc3ViIHBhcnNlcnNcbiAgICB0ZXh0ID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdoYXNoUHJlQ29kZVRhZ3MnKSh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcbiAgICB0ZXh0ID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdnaXRodWJDb2RlQmxvY2tzJykodGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XG4gICAgdGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcignaGFzaEhUTUxCbG9ja3MnKSh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcbiAgICB0ZXh0ID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdoYXNoSFRNTFNwYW5zJykodGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XG4gICAgdGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcignc3RyaXBMaW5rRGVmaW5pdGlvbnMnKSh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcbiAgICB0ZXh0ID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdibG9ja0dhbXV0JykodGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XG4gICAgdGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcigndW5oYXNoSFRNTFNwYW5zJykodGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XG4gICAgdGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcigndW5lc2NhcGVTcGVjaWFsQ2hhcnMnKSh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcblxuICAgIC8vIGF0dGFja2xhYjogUmVzdG9yZSBkb2xsYXIgc2lnbnNcbiAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+RC9nLCAnJCQnKTtcblxuICAgIC8vIGF0dGFja2xhYjogUmVzdG9yZSB0aWxkZXNcbiAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+VC9nLCAnficpO1xuXG4gICAgLy8gUnVuIG91dHB1dCBtb2RpZmllcnNcbiAgICBzaG93ZG93bi5oZWxwZXIuZm9yRWFjaChvdXRwdXRNb2RpZmllcnMsIGZ1bmN0aW9uIChleHQpIHtcbiAgICAgIHRleHQgPSBzaG93ZG93bi5zdWJQYXJzZXIoJ3J1bkV4dGVuc2lvbicpKGV4dCwgdGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHRleHQ7XG4gIH07XG5cbiAgLyoqXG4gICAqIFNldCBhbiBvcHRpb24gb2YgdGhpcyBDb252ZXJ0ZXIgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleVxuICAgKiBAcGFyYW0geyp9IHZhbHVlXG4gICAqL1xuICB0aGlzLnNldE9wdGlvbiA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgb3B0aW9uc1trZXldID0gdmFsdWU7XG4gIH07XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgb3B0aW9uIG9mIHRoaXMgQ29udmVydGVyIGluc3RhbmNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAgICogQHJldHVybnMgeyp9XG4gICAqL1xuICB0aGlzLmdldE9wdGlvbiA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICByZXR1cm4gb3B0aW9uc1trZXldO1xuICB9O1xuXG4gIC8qKlxuICAgKiBHZXQgdGhlIG9wdGlvbnMgb2YgdGhpcyBDb252ZXJ0ZXIgaW5zdGFuY2VcbiAgICogQHJldHVybnMge3t9fVxuICAgKi9cbiAgdGhpcy5nZXRPcHRpb25zID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBvcHRpb25zO1xuICB9O1xuXG4gIC8qKlxuICAgKiBBZGQgZXh0ZW5zaW9uIHRvIFRISVMgY29udmVydGVyXG4gICAqIEBwYXJhbSB7e319IGV4dGVuc2lvblxuICAgKiBAcGFyYW0ge3N0cmluZ30gW25hbWU9bnVsbF1cbiAgICovXG4gIHRoaXMuYWRkRXh0ZW5zaW9uID0gZnVuY3Rpb24gKGV4dGVuc2lvbiwgbmFtZSkge1xuICAgIG5hbWUgPSBuYW1lIHx8IG51bGw7XG4gICAgX3BhcnNlRXh0ZW5zaW9uKGV4dGVuc2lvbiwgbmFtZSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFVzZSBhIGdsb2JhbCByZWdpc3RlcmVkIGV4dGVuc2lvbiB3aXRoIFRISVMgY29udmVydGVyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBleHRlbnNpb25OYW1lIE5hbWUgb2YgdGhlIHByZXZpb3VzbHkgcmVnaXN0ZXJlZCBleHRlbnNpb25cbiAgICovXG4gIHRoaXMudXNlRXh0ZW5zaW9uID0gZnVuY3Rpb24gKGV4dGVuc2lvbk5hbWUpIHtcbiAgICBfcGFyc2VFeHRlbnNpb24oZXh0ZW5zaW9uTmFtZSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgZmxhdm9yIFRISVMgY29udmVydGVyIHNob3VsZCB1c2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICovXG4gIHRoaXMuc2V0Rmxhdm9yID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICBpZiAoZmxhdm9yLmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICB2YXIgcHJlc2V0ID0gZmxhdm9yW25hbWVdO1xuICAgICAgZm9yICh2YXIgb3B0aW9uIGluIHByZXNldCkge1xuICAgICAgICBpZiAocHJlc2V0Lmhhc093blByb3BlcnR5KG9wdGlvbikpIHtcbiAgICAgICAgICBvcHRpb25zW29wdGlvbl0gPSBwcmVzZXRbb3B0aW9uXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogUmVtb3ZlIGFuIGV4dGVuc2lvbiBmcm9tIFRISVMgY29udmVydGVyLlxuICAgKiBOb3RlOiBUaGlzIGlzIGEgY29zdGx5IG9wZXJhdGlvbi4gSXQncyBiZXR0ZXIgdG8gaW5pdGlhbGl6ZSBhIG5ldyBjb252ZXJ0ZXJcbiAgICogYW5kIHNwZWNpZnkgdGhlIGV4dGVuc2lvbnMgeW91IHdpc2ggdG8gdXNlXG4gICAqIEBwYXJhbSB7QXJyYXl9IGV4dGVuc2lvblxuICAgKi9cbiAgdGhpcy5yZW1vdmVFeHRlbnNpb24gPSBmdW5jdGlvbiAoZXh0ZW5zaW9uKSB7XG4gICAgaWYgKCFzaG93ZG93bi5oZWxwZXIuaXNBcnJheShleHRlbnNpb24pKSB7XG4gICAgICBleHRlbnNpb24gPSBbZXh0ZW5zaW9uXTtcbiAgICB9XG4gICAgZm9yICh2YXIgYSA9IDA7IGEgPCBleHRlbnNpb24ubGVuZ3RoOyArK2EpIHtcbiAgICAgIHZhciBleHQgPSBleHRlbnNpb25bYV07XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxhbmdFeHRlbnNpb25zLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChsYW5nRXh0ZW5zaW9uc1tpXSA9PT0gZXh0KSB7XG4gICAgICAgICAgbGFuZ0V4dGVuc2lvbnNbaV0uc3BsaWNlKGksIDEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgb3V0cHV0TW9kaWZpZXJzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChvdXRwdXRNb2RpZmllcnNbaWldID09PSBleHQpIHtcbiAgICAgICAgICBvdXRwdXRNb2RpZmllcnNbaWldLnNwbGljZShpLCAxKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogR2V0IGFsbCBleHRlbnNpb24gb2YgVEhJUyBjb252ZXJ0ZXJcbiAgICogQHJldHVybnMge3tsYW5ndWFnZTogQXJyYXksIG91dHB1dDogQXJyYXl9fVxuICAgKi9cbiAgdGhpcy5nZXRBbGxFeHRlbnNpb25zID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBsYW5ndWFnZTogbGFuZ0V4dGVuc2lvbnMsXG4gICAgICBvdXRwdXQ6IG91dHB1dE1vZGlmaWVyc1xuICAgIH07XG4gIH07XG59O1xuXG4vKipcbiAqIFR1cm4gTWFya2Rvd24gbGluayBzaG9ydGN1dHMgaW50byBYSFRNTCA8YT4gdGFncy5cbiAqL1xuc2hvd2Rvd24uc3ViUGFyc2VyKCdhbmNob3JzJywgZnVuY3Rpb24gKHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHRleHQgPSBnbG9iYWxzLmNvbnZlcnRlci5fZGlzcGF0Y2goJ2FuY2hvcnMuYmVmb3JlJywgdGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XG5cbiAgdmFyIHdyaXRlQW5jaG9yVGFnID0gZnVuY3Rpb24gKHdob2xlTWF0Y2gsIG0xLCBtMiwgbTMsIG00LCBtNSwgbTYsIG03KSB7XG4gICAgaWYgKHNob3dkb3duLmhlbHBlci5pc1VuZGVmaW5lZChtNykpIHtcbiAgICAgIG03ID0gJyc7XG4gICAgfVxuICAgIHdob2xlTWF0Y2ggPSBtMTtcbiAgICB2YXIgbGlua1RleHQgPSBtMixcbiAgICAgICAgbGlua0lkID0gbTMudG9Mb3dlckNhc2UoKSxcbiAgICAgICAgdXJsID0gbTQsXG4gICAgICAgIHRpdGxlID0gbTc7XG5cbiAgICBpZiAoIXVybCkge1xuICAgICAgaWYgKCFsaW5rSWQpIHtcbiAgICAgICAgLy8gbG93ZXItY2FzZSBhbmQgdHVybiBlbWJlZGRlZCBuZXdsaW5lcyBpbnRvIHNwYWNlc1xuICAgICAgICBsaW5rSWQgPSBsaW5rVGV4dC50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoLyA/XFxuL2csICcgJyk7XG4gICAgICB9XG4gICAgICB1cmwgPSAnIycgKyBsaW5rSWQ7XG5cbiAgICAgIGlmICghc2hvd2Rvd24uaGVscGVyLmlzVW5kZWZpbmVkKGdsb2JhbHMuZ1VybHNbbGlua0lkXSkpIHtcbiAgICAgICAgdXJsID0gZ2xvYmFscy5nVXJsc1tsaW5rSWRdO1xuICAgICAgICBpZiAoIXNob3dkb3duLmhlbHBlci5pc1VuZGVmaW5lZChnbG9iYWxzLmdUaXRsZXNbbGlua0lkXSkpIHtcbiAgICAgICAgICB0aXRsZSA9IGdsb2JhbHMuZ1RpdGxlc1tsaW5rSWRdO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAod2hvbGVNYXRjaC5zZWFyY2goL1xcKFxccypcXCkkL20pID4gLTEpIHtcbiAgICAgICAgICAvLyBTcGVjaWFsIGNhc2UgZm9yIGV4cGxpY2l0IGVtcHR5IHVybFxuICAgICAgICAgIHVybCA9ICcnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB3aG9sZU1hdGNoO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdXJsID0gc2hvd2Rvd24uaGVscGVyLmVzY2FwZUNoYXJhY3RlcnModXJsLCAnKl8nLCBmYWxzZSk7XG4gICAgdmFyIHJlc3VsdCA9ICc8YSBocmVmPVwiJyArIHVybCArICdcIic7XG5cbiAgICBpZiAodGl0bGUgIT09ICcnICYmIHRpdGxlICE9PSBudWxsKSB7XG4gICAgICB0aXRsZSA9IHRpdGxlLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKTtcbiAgICAgIHRpdGxlID0gc2hvd2Rvd24uaGVscGVyLmVzY2FwZUNoYXJhY3RlcnModGl0bGUsICcqXycsIGZhbHNlKTtcbiAgICAgIHJlc3VsdCArPSAnIHRpdGxlPVwiJyArIHRpdGxlICsgJ1wiJztcbiAgICB9XG5cbiAgICByZXN1bHQgKz0gJz4nICsgbGlua1RleHQgKyAnPC9hPic7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIEZpcnN0LCBoYW5kbGUgcmVmZXJlbmNlLXN0eWxlIGxpbmtzOiBbbGluayB0ZXh0XSBbaWRdXG4gIC8qXG4gICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cbiAgIChcdFx0XHRcdFx0XHRcdC8vIHdyYXAgd2hvbGUgbWF0Y2ggaW4gJDFcbiAgIFxcW1xuICAgKFxuICAgKD86XG4gICBcXFtbXlxcXV0qXFxdXHRcdC8vIGFsbG93IGJyYWNrZXRzIG5lc3RlZCBvbmUgbGV2ZWxcbiAgIHxcbiAgIFteXFxbXVx0XHRcdC8vIG9yIGFueXRoaW5nIGVsc2VcbiAgICkqXG4gICApXG4gICBcXF1cblxuICAgWyBdP1x0XHRcdFx0XHQvLyBvbmUgb3B0aW9uYWwgc3BhY2VcbiAgICg/OlxcblsgXSopP1x0XHRcdFx0Ly8gb25lIG9wdGlvbmFsIG5ld2xpbmUgZm9sbG93ZWQgYnkgc3BhY2VzXG5cbiAgIFxcW1xuICAgKC4qPylcdFx0XHRcdFx0Ly8gaWQgPSAkM1xuICAgXFxdXG4gICApKCkoKSgpKClcdFx0XHRcdFx0Ly8gcGFkIHJlbWFpbmluZyBiYWNrcmVmZXJlbmNlc1xuICAgL2csX0RvQW5jaG9yc19jYWxsYmFjayk7XG4gICAqL1xuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXFxbKCg/OlxcW1teXFxdXSpdfFteXFxbXFxdXSkqKV1bIF0/KD86XFxuWyBdKik/XFxbKC4qPyldKSgpKCkoKSgpL2csIHdyaXRlQW5jaG9yVGFnKTtcblxuICAvL1xuICAvLyBOZXh0LCBpbmxpbmUtc3R5bGUgbGlua3M6IFtsaW5rIHRleHRdKHVybCBcIm9wdGlvbmFsIHRpdGxlXCIpXG4gIC8vXG5cbiAgLypcbiAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xuICAgKFx0XHRcdFx0XHRcdC8vIHdyYXAgd2hvbGUgbWF0Y2ggaW4gJDFcbiAgIFxcW1xuICAgKFxuICAgKD86XG4gICBcXFtbXlxcXV0qXFxdXHQvLyBhbGxvdyBicmFja2V0cyBuZXN0ZWQgb25lIGxldmVsXG4gICB8XG4gICBbXlxcW1xcXV1cdFx0XHQvLyBvciBhbnl0aGluZyBlbHNlXG4gICApXG4gICApXG4gICBcXF1cbiAgIFxcKFx0XHRcdFx0XHRcdC8vIGxpdGVyYWwgcGFyZW5cbiAgIFsgXFx0XSpcbiAgICgpXHRcdFx0XHRcdFx0Ly8gbm8gaWQsIHNvIGxlYXZlICQzIGVtcHR5XG4gICA8PyguKj8pPj9cdFx0XHRcdC8vIGhyZWYgPSAkNFxuICAgWyBcXHRdKlxuICAgKFx0XHRcdFx0XHRcdC8vICQ1XG4gICAoWydcIl0pXHRcdFx0XHQvLyBxdW90ZSBjaGFyID0gJDZcbiAgICguKj8pXHRcdFx0XHQvLyBUaXRsZSA9ICQ3XG4gICBcXDZcdFx0XHRcdFx0Ly8gbWF0Y2hpbmcgcXVvdGVcbiAgIFsgXFx0XSpcdFx0XHRcdC8vIGlnbm9yZSBhbnkgc3BhY2VzL3RhYnMgYmV0d2VlbiBjbG9zaW5nIHF1b3RlIGFuZCApXG4gICApP1x0XHRcdFx0XHRcdC8vIHRpdGxlIGlzIG9wdGlvbmFsXG4gICBcXClcbiAgIClcbiAgIC9nLHdyaXRlQW5jaG9yVGFnKTtcbiAgICovXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhcXFsoKD86XFxbW15cXF1dKl18W15cXFtcXF1dKSopXVxcKFsgXFx0XSooKTw/KC4qPyg/OlxcKC4qP1xcKS4qPyk/KT4/WyBcXHRdKigoWydcIl0pKC4qPylcXDZbIFxcdF0qKT9cXCkpL2csXG4gICAgICAgICAgICAgICAgICAgICAgd3JpdGVBbmNob3JUYWcpO1xuXG4gIC8vXG4gIC8vIExhc3QsIGhhbmRsZSByZWZlcmVuY2Utc3R5bGUgc2hvcnRjdXRzOiBbbGluayB0ZXh0XVxuICAvLyBUaGVzZSBtdXN0IGNvbWUgbGFzdCBpbiBjYXNlIHlvdSd2ZSBhbHNvIGdvdCBbbGluayB0ZXN0XVsxXVxuICAvLyBvciBbbGluayB0ZXN0XSgvZm9vKVxuICAvL1xuXG4gIC8qXG4gICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cbiAgICggICAgICAgICAgICAgICAgLy8gd3JhcCB3aG9sZSBtYXRjaCBpbiAkMVxuICAgXFxbXG4gICAoW15cXFtcXF1dKykgICAgICAgLy8gbGluayB0ZXh0ID0gJDI7IGNhbid0IGNvbnRhaW4gJ1snIG9yICddJ1xuICAgXFxdXG4gICApKCkoKSgpKCkoKSAgICAgIC8vIHBhZCByZXN0IG9mIGJhY2tyZWZlcmVuY2VzXG4gICAvZywgd3JpdGVBbmNob3JUYWcpO1xuICAgKi9cbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvKFxcWyhbXlxcW1xcXV0rKV0pKCkoKSgpKCkoKS9nLCB3cml0ZUFuY2hvclRhZyk7XG5cbiAgdGV4dCA9IGdsb2JhbHMuY29udmVydGVyLl9kaXNwYXRjaCgnYW5jaG9ycy5hZnRlcicsIHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xuICByZXR1cm4gdGV4dDtcbn0pO1xuXG5zaG93ZG93bi5zdWJQYXJzZXIoJ2F1dG9MaW5rcycsIGZ1bmN0aW9uICh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICB0ZXh0ID0gZ2xvYmFscy5jb252ZXJ0ZXIuX2Rpc3BhdGNoKCdhdXRvTGlua3MuYmVmb3JlJywgdGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XG5cbiAgdmFyIHNpbXBsZVVSTFJlZ2V4ICA9IC9cXGIoKChodHRwcz98ZnRwfGRpY3QpOlxcL1xcL3x3d3dcXC4pW14nXCI+XFxzXStcXC5bXidcIj5cXHNdKykoPz1cXHN8JCkoPyFbXCI8Pl0pL2dpLFxuICAgICAgZGVsaW1VcmxSZWdleCAgID0gLzwoKChodHRwcz98ZnRwfGRpY3QpOlxcL1xcL3x3d3dcXC4pW14nXCI+XFxzXSspPi9naSxcbiAgICAgIHNpbXBsZU1haWxSZWdleCA9IC8oPzpefFsgXFxuXFx0XSkoW0EtWmEtejAtOSEjJCUmJyorLS89P15fYFxce3x9flxcLl0rQFstYS16MC05XSsoXFwuWy1hLXowLTldKykqXFwuW2Etel0rKSg/OiR8WyBcXG5cXHRdKS9naSxcbiAgICAgIGRlbGltTWFpbFJlZ2V4ICA9IC88KD86bWFpbHRvOik/KFstLlxcd10rQFstYS16MC05XSsoXFwuWy1hLXowLTldKykqXFwuW2Etel0rKT4vZ2k7XG5cbiAgdGV4dCA9IHRleHQucmVwbGFjZShkZWxpbVVybFJlZ2V4LCByZXBsYWNlTGluayk7XG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoZGVsaW1NYWlsUmVnZXgsIHJlcGxhY2VNYWlsKTtcbiAgLy8gc2ltcGxlVVJMUmVnZXggID0gL1xcYigoKGh0dHBzP3xmdHB8ZGljdCk6XFwvXFwvfHd3d1xcLilbLS4rfjo/I0AhJCYnKCkqLDs9W1xcXVxcd10rKVxcYi9naSxcbiAgLy8gRW1haWwgYWRkcmVzc2VzOiA8YWRkcmVzc0Bkb21haW4uZm9vPlxuXG4gIGlmIChvcHRpb25zLnNpbXBsaWZpZWRBdXRvTGluaykge1xuICAgIHRleHQgPSB0ZXh0LnJlcGxhY2Uoc2ltcGxlVVJMUmVnZXgsIHJlcGxhY2VMaW5rKTtcbiAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKHNpbXBsZU1haWxSZWdleCwgcmVwbGFjZU1haWwpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVwbGFjZUxpbmsod20sIGxpbmspIHtcbiAgICB2YXIgbG5rVHh0ID0gbGluaztcbiAgICBpZiAoL153d3dcXC4vaS50ZXN0KGxpbmspKSB7XG4gICAgICBsaW5rID0gbGluay5yZXBsYWNlKC9ed3d3XFwuL2ksICdodHRwOi8vd3d3LicpO1xuICAgIH1cbiAgICByZXR1cm4gJzxhIGhyZWY9XCInICsgbGluayArICdcIj4nICsgbG5rVHh0ICsgJzwvYT4nO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVwbGFjZU1haWwod2hvbGVNYXRjaCwgbTEpIHtcbiAgICB2YXIgdW5lc2NhcGVkU3RyID0gc2hvd2Rvd24uc3ViUGFyc2VyKCd1bmVzY2FwZVNwZWNpYWxDaGFycycpKG0xKTtcbiAgICByZXR1cm4gc2hvd2Rvd24uc3ViUGFyc2VyKCdlbmNvZGVFbWFpbEFkZHJlc3MnKSh1bmVzY2FwZWRTdHIpO1xuICB9XG5cbiAgdGV4dCA9IGdsb2JhbHMuY29udmVydGVyLl9kaXNwYXRjaCgnYXV0b0xpbmtzLmFmdGVyJywgdGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XG5cbiAgcmV0dXJuIHRleHQ7XG59KTtcblxuLyoqXG4gKiBUaGVzZSBhcmUgYWxsIHRoZSB0cmFuc2Zvcm1hdGlvbnMgdGhhdCBmb3JtIGJsb2NrLWxldmVsXG4gKiB0YWdzIGxpa2UgcGFyYWdyYXBocywgaGVhZGVycywgYW5kIGxpc3QgaXRlbXMuXG4gKi9cbnNob3dkb3duLnN1YlBhcnNlcignYmxvY2tHYW11dCcsIGZ1bmN0aW9uICh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICB0ZXh0ID0gZ2xvYmFscy5jb252ZXJ0ZXIuX2Rpc3BhdGNoKCdibG9ja0dhbXV0LmJlZm9yZScsIHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xuXG4gIC8vIHdlIHBhcnNlIGJsb2NrcXVvdGVzIGZpcnN0IHNvIHRoYXQgd2UgY2FuIGhhdmUgaGVhZGluZ3MgYW5kIGhyc1xuICAvLyBpbnNpZGUgYmxvY2txdW90ZXNcbiAgdGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcignYmxvY2tRdW90ZXMnKSh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcbiAgdGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcignaGVhZGVycycpKHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xuXG4gIC8vIERvIEhvcml6b250YWwgUnVsZXM6XG4gIHZhciBrZXkgPSBzaG93ZG93bi5zdWJQYXJzZXIoJ2hhc2hCbG9jaycpKCc8aHIgLz4nLCBvcHRpb25zLCBnbG9iYWxzKTtcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvXlsgXXswLDJ9KFsgXT9cXCpbIF0/KXszLH1bIFxcdF0qJC9nbSwga2V5KTtcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvXlsgXXswLDJ9KFsgXT9cXC1bIF0/KXszLH1bIFxcdF0qJC9nbSwga2V5KTtcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvXlsgXXswLDJ9KFsgXT9fWyBdPyl7Myx9WyBcXHRdKiQvZ20sIGtleSk7XG5cbiAgdGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcignbGlzdHMnKSh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcbiAgdGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcignY29kZUJsb2NrcycpKHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xuICB0ZXh0ID0gc2hvd2Rvd24uc3ViUGFyc2VyKCd0YWJsZXMnKSh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcblxuICAvLyBXZSBhbHJlYWR5IHJhbiBfSGFzaEhUTUxCbG9ja3MoKSBiZWZvcmUsIGluIE1hcmtkb3duKCksIGJ1dCB0aGF0XG4gIC8vIHdhcyB0byBlc2NhcGUgcmF3IEhUTUwgaW4gdGhlIG9yaWdpbmFsIE1hcmtkb3duIHNvdXJjZS4gVGhpcyB0aW1lLFxuICAvLyB3ZSdyZSBlc2NhcGluZyB0aGUgbWFya3VwIHdlJ3ZlIGp1c3QgY3JlYXRlZCwgc28gdGhhdCB3ZSBkb24ndCB3cmFwXG4gIC8vIDxwPiB0YWdzIGFyb3VuZCBibG9jay1sZXZlbCB0YWdzLlxuICB0ZXh0ID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdoYXNoSFRNTEJsb2NrcycpKHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xuICB0ZXh0ID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdwYXJhZ3JhcGhzJykodGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XG5cbiAgdGV4dCA9IGdsb2JhbHMuY29udmVydGVyLl9kaXNwYXRjaCgnYmxvY2tHYW11dC5hZnRlcicsIHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xuXG4gIHJldHVybiB0ZXh0O1xufSk7XG5cbnNob3dkb3duLnN1YlBhcnNlcignYmxvY2tRdW90ZXMnLCBmdW5jdGlvbiAodGV4dCwgb3B0aW9ucywgZ2xvYmFscykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdGV4dCA9IGdsb2JhbHMuY29udmVydGVyLl9kaXNwYXRjaCgnYmxvY2tRdW90ZXMuYmVmb3JlJywgdGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XG4gIC8qXG4gICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cbiAgIChcdFx0XHRcdFx0XHRcdFx0Ly8gV3JhcCB3aG9sZSBtYXRjaCBpbiAkMVxuICAgKFxuICAgXlsgXFx0XSo+WyBcXHRdP1x0XHRcdC8vICc+JyBhdCB0aGUgc3RhcnQgb2YgYSBsaW5lXG4gICAuK1xcblx0XHRcdFx0XHQvLyByZXN0IG9mIHRoZSBmaXJzdCBsaW5lXG4gICAoLitcXG4pKlx0XHRcdFx0XHQvLyBzdWJzZXF1ZW50IGNvbnNlY3V0aXZlIGxpbmVzXG4gICBcXG4qXHRcdFx0XHRcdFx0Ly8gYmxhbmtzXG4gICApK1xuICAgKVxuICAgL2dtLCBmdW5jdGlvbigpey4uLn0pO1xuICAgKi9cblxuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oKF5bIFxcdF17MCwzfT5bIFxcdF0/LitcXG4oLitcXG4pKlxcbiopKykvZ20sIGZ1bmN0aW9uICh3aG9sZU1hdGNoLCBtMSkge1xuICAgIHZhciBicSA9IG0xO1xuXG4gICAgLy8gYXR0YWNrbGFiOiBoYWNrIGFyb3VuZCBLb25xdWVyb3IgMy41LjQgYnVnOlxuICAgIC8vIFwiLS0tLS0tLS0tLWJ1Z1wiLnJlcGxhY2UoL14tL2csXCJcIikgPT0gXCJidWdcIlxuICAgIGJxID0gYnEucmVwbGFjZSgvXlsgXFx0XSo+WyBcXHRdPy9nbSwgJ34wJyk7IC8vIHRyaW0gb25lIGxldmVsIG9mIHF1b3RpbmdcblxuICAgIC8vIGF0dGFja2xhYjogY2xlYW4gdXAgaGFja1xuICAgIGJxID0gYnEucmVwbGFjZSgvfjAvZywgJycpO1xuXG4gICAgYnEgPSBicS5yZXBsYWNlKC9eWyBcXHRdKyQvZ20sICcnKTsgLy8gdHJpbSB3aGl0ZXNwYWNlLW9ubHkgbGluZXNcbiAgICBicSA9IHNob3dkb3duLnN1YlBhcnNlcignZ2l0aHViQ29kZUJsb2NrcycpKGJxLCBvcHRpb25zLCBnbG9iYWxzKTtcbiAgICBicSA9IHNob3dkb3duLnN1YlBhcnNlcignYmxvY2tHYW11dCcpKGJxLCBvcHRpb25zLCBnbG9iYWxzKTsgLy8gcmVjdXJzZVxuXG4gICAgYnEgPSBicS5yZXBsYWNlKC8oXnxcXG4pL2csICckMSAgJyk7XG4gICAgLy8gVGhlc2UgbGVhZGluZyBzcGFjZXMgc2NyZXcgd2l0aCA8cHJlPiBjb250ZW50LCBzbyB3ZSBuZWVkIHRvIGZpeCB0aGF0OlxuICAgIGJxID0gYnEucmVwbGFjZSgvKFxccyo8cHJlPlteXFxyXSs/PFxcL3ByZT4pL2dtLCBmdW5jdGlvbiAod2hvbGVNYXRjaCwgbTEpIHtcbiAgICAgIHZhciBwcmUgPSBtMTtcbiAgICAgIC8vIGF0dGFja2xhYjogaGFjayBhcm91bmQgS29ucXVlcm9yIDMuNS40IGJ1ZzpcbiAgICAgIHByZSA9IHByZS5yZXBsYWNlKC9eICAvbWcsICd+MCcpO1xuICAgICAgcHJlID0gcHJlLnJlcGxhY2UoL34wL2csICcnKTtcbiAgICAgIHJldHVybiBwcmU7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gc2hvd2Rvd24uc3ViUGFyc2VyKCdoYXNoQmxvY2snKSgnPGJsb2NrcXVvdGU+XFxuJyArIGJxICsgJ1xcbjwvYmxvY2txdW90ZT4nLCBvcHRpb25zLCBnbG9iYWxzKTtcbiAgfSk7XG5cbiAgdGV4dCA9IGdsb2JhbHMuY29udmVydGVyLl9kaXNwYXRjaCgnYmxvY2tRdW90ZXMuYWZ0ZXInLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcbiAgcmV0dXJuIHRleHQ7XG59KTtcblxuLyoqXG4gKiBQcm9jZXNzIE1hcmtkb3duIGA8cHJlPjxjb2RlPmAgYmxvY2tzLlxuICovXG5zaG93ZG93bi5zdWJQYXJzZXIoJ2NvZGVCbG9ja3MnLCBmdW5jdGlvbiAodGV4dCwgb3B0aW9ucywgZ2xvYmFscykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdGV4dCA9IGdsb2JhbHMuY29udmVydGVyLl9kaXNwYXRjaCgnY29kZUJsb2Nrcy5iZWZvcmUnLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcbiAgLypcbiAgIHRleHQgPSB0ZXh0LnJlcGxhY2UodGV4dCxcbiAgIC8oPzpcXG5cXG58XilcbiAgIChcdFx0XHRcdFx0XHRcdFx0Ly8gJDEgPSB0aGUgY29kZSBibG9jayAtLSBvbmUgb3IgbW9yZSBsaW5lcywgc3RhcnRpbmcgd2l0aCBhIHNwYWNlL3RhYlxuICAgKD86XG4gICAoPzpbIF17NH18XFx0KVx0XHRcdC8vIExpbmVzIG11c3Qgc3RhcnQgd2l0aCBhIHRhYiBvciBhIHRhYi13aWR0aCBvZiBzcGFjZXMgLSBhdHRhY2tsYWI6IGdfdGFiX3dpZHRoXG4gICAuKlxcbitcbiAgICkrXG4gICApXG4gICAoXFxuKlsgXXswLDN9W14gXFx0XFxuXXwoPz1+MCkpXHQvLyBhdHRhY2tsYWI6IGdfdGFiX3dpZHRoXG4gICAvZyxmdW5jdGlvbigpey4uLn0pO1xuICAgKi9cblxuICAvLyBhdHRhY2tsYWI6IHNlbnRpbmVsIHdvcmthcm91bmRzIGZvciBsYWNrIG9mIFxcQSBhbmQgXFxaLCBzYWZhcmlcXGtodG1sIGJ1Z1xuICB0ZXh0ICs9ICd+MCc7XG5cbiAgdmFyIHBhdHRlcm4gPSAvKD86XFxuXFxufF4pKCg/Oig/OlsgXXs0fXxcXHQpLipcXG4rKSspKFxcbipbIF17MCwzfVteIFxcdFxcbl18KD89fjApKS9nO1xuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKHBhdHRlcm4sIGZ1bmN0aW9uICh3aG9sZU1hdGNoLCBtMSwgbTIpIHtcbiAgICB2YXIgY29kZWJsb2NrID0gbTEsXG4gICAgICAgIG5leHRDaGFyID0gbTIsXG4gICAgICAgIGVuZCA9ICdcXG4nO1xuXG4gICAgY29kZWJsb2NrID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdvdXRkZW50JykoY29kZWJsb2NrKTtcbiAgICBjb2RlYmxvY2sgPSBzaG93ZG93bi5zdWJQYXJzZXIoJ2VuY29kZUNvZGUnKShjb2RlYmxvY2spO1xuICAgIGNvZGVibG9jayA9IHNob3dkb3duLnN1YlBhcnNlcignZGV0YWInKShjb2RlYmxvY2spO1xuICAgIGNvZGVibG9jayA9IGNvZGVibG9jay5yZXBsYWNlKC9eXFxuKy9nLCAnJyk7IC8vIHRyaW0gbGVhZGluZyBuZXdsaW5lc1xuICAgIGNvZGVibG9jayA9IGNvZGVibG9jay5yZXBsYWNlKC9cXG4rJC9nLCAnJyk7IC8vIHRyaW0gdHJhaWxpbmcgbmV3bGluZXNcblxuICAgIGlmIChvcHRpb25zLm9taXRFeHRyYVdMSW5Db2RlQmxvY2tzKSB7XG4gICAgICBlbmQgPSAnJztcbiAgICB9XG5cbiAgICBjb2RlYmxvY2sgPSAnPHByZT48Y29kZT4nICsgY29kZWJsb2NrICsgZW5kICsgJzwvY29kZT48L3ByZT4nO1xuXG4gICAgcmV0dXJuIHNob3dkb3duLnN1YlBhcnNlcignaGFzaEJsb2NrJykoY29kZWJsb2NrLCBvcHRpb25zLCBnbG9iYWxzKSArIG5leHRDaGFyO1xuICB9KTtcblxuICAvLyBhdHRhY2tsYWI6IHN0cmlwIHNlbnRpbmVsXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoL34wLywgJycpO1xuXG4gIHRleHQgPSBnbG9iYWxzLmNvbnZlcnRlci5fZGlzcGF0Y2goJ2NvZGVCbG9ja3MuYWZ0ZXInLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcbiAgcmV0dXJuIHRleHQ7XG59KTtcblxuLyoqXG4gKlxuICogICAqICBCYWNrdGljayBxdW90ZXMgYXJlIHVzZWQgZm9yIDxjb2RlPjwvY29kZT4gc3BhbnMuXG4gKlxuICogICAqICBZb3UgY2FuIHVzZSBtdWx0aXBsZSBiYWNrdGlja3MgYXMgdGhlIGRlbGltaXRlcnMgaWYgeW91IHdhbnQgdG9cbiAqICAgICBpbmNsdWRlIGxpdGVyYWwgYmFja3RpY2tzIGluIHRoZSBjb2RlIHNwYW4uIFNvLCB0aGlzIGlucHV0OlxuICpcbiAqICAgICAgICAgSnVzdCB0eXBlIGBgZm9vIGBiYXJgIGJhemBgIGF0IHRoZSBwcm9tcHQuXG4gKlxuICogICAgICAgV2lsbCB0cmFuc2xhdGUgdG86XG4gKlxuICogICAgICAgICA8cD5KdXN0IHR5cGUgPGNvZGU+Zm9vIGBiYXJgIGJhejwvY29kZT4gYXQgdGhlIHByb21wdC48L3A+XG4gKlxuICogICAgVGhlcmUncyBubyBhcmJpdHJhcnkgbGltaXQgdG8gdGhlIG51bWJlciBvZiBiYWNrdGlja3MgeW91XG4gKiAgICBjYW4gdXNlIGFzIGRlbGltdGVycy4gSWYgeW91IG5lZWQgdGhyZWUgY29uc2VjdXRpdmUgYmFja3RpY2tzXG4gKiAgICBpbiB5b3VyIGNvZGUsIHVzZSBmb3VyIGZvciBkZWxpbWl0ZXJzLCBldGMuXG4gKlxuICogICogIFlvdSBjYW4gdXNlIHNwYWNlcyB0byBnZXQgbGl0ZXJhbCBiYWNrdGlja3MgYXQgdGhlIGVkZ2VzOlxuICpcbiAqICAgICAgICAgLi4uIHR5cGUgYGAgYGJhcmAgYGAgLi4uXG4gKlxuICogICAgICAgVHVybnMgdG86XG4gKlxuICogICAgICAgICAuLi4gdHlwZSA8Y29kZT5gYmFyYDwvY29kZT4gLi4uXG4gKi9cbnNob3dkb3duLnN1YlBhcnNlcignY29kZVNwYW5zJywgZnVuY3Rpb24gKHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHRleHQgPSBnbG9iYWxzLmNvbnZlcnRlci5fZGlzcGF0Y2goJ2NvZGVTcGFucy5iZWZvcmUnLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcblxuICAvKlxuICAgdGV4dCA9IHRleHQucmVwbGFjZSgvXG4gICAoXnxbXlxcXFxdKVx0XHRcdFx0XHQvLyBDaGFyYWN0ZXIgYmVmb3JlIG9wZW5pbmcgYCBjYW4ndCBiZSBhIGJhY2tzbGFzaFxuICAgKGArKVx0XHRcdFx0XHRcdC8vICQyID0gT3BlbmluZyBydW4gb2YgYFxuICAgKFx0XHRcdFx0XHRcdFx0Ly8gJDMgPSBUaGUgY29kZSBibG9ja1xuICAgW15cXHJdKj9cbiAgIFteYF1cdFx0XHRcdFx0Ly8gYXR0YWNrbGFiOiB3b3JrIGFyb3VuZCBsYWNrIG9mIGxvb2tiZWhpbmRcbiAgIClcbiAgIFxcMlx0XHRcdFx0XHRcdFx0Ly8gTWF0Y2hpbmcgY2xvc2VyXG4gICAoPyFgKVxuICAgL2dtLCBmdW5jdGlvbigpey4uLn0pO1xuICAgKi9cblxuICBpZiAodHlwZW9mKHRleHQpID09PSAndW5kZWZpbmVkJykge1xuICAgIHRleHQgPSAnJztcbiAgfVxuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXnxbXlxcXFxdKShgKykoW15cXHJdKj9bXmBdKVxcMig/IWApL2dtLFxuICAgIGZ1bmN0aW9uICh3aG9sZU1hdGNoLCBtMSwgbTIsIG0zKSB7XG4gICAgICB2YXIgYyA9IG0zO1xuICAgICAgYyA9IGMucmVwbGFjZSgvXihbIFxcdF0qKS9nLCAnJyk7XHQvLyBsZWFkaW5nIHdoaXRlc3BhY2VcbiAgICAgIGMgPSBjLnJlcGxhY2UoL1sgXFx0XSokL2csICcnKTtcdC8vIHRyYWlsaW5nIHdoaXRlc3BhY2VcbiAgICAgIGMgPSBzaG93ZG93bi5zdWJQYXJzZXIoJ2VuY29kZUNvZGUnKShjKTtcbiAgICAgIHJldHVybiBtMSArICc8Y29kZT4nICsgYyArICc8L2NvZGU+JztcbiAgICB9XG4gICk7XG5cbiAgdGV4dCA9IGdsb2JhbHMuY29udmVydGVyLl9kaXNwYXRjaCgnY29kZVNwYW5zLmFmdGVyJywgdGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XG4gIHJldHVybiB0ZXh0O1xufSk7XG5cbi8qKlxuICogQ29udmVydCBhbGwgdGFicyB0byBzcGFjZXNcbiAqL1xuc2hvd2Rvd24uc3ViUGFyc2VyKCdkZXRhYicsIGZ1bmN0aW9uICh0ZXh0KSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBleHBhbmQgZmlyc3Qgbi0xIHRhYnNcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvXFx0KD89XFx0KS9nLCAnICAgICcpOyAvLyBnX3RhYl93aWR0aFxuXG4gIC8vIHJlcGxhY2UgdGhlIG50aCB3aXRoIHR3byBzZW50aW5lbHNcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvXFx0L2csICd+QX5CJyk7XG5cbiAgLy8gdXNlIHRoZSBzZW50aW5lbCB0byBhbmNob3Igb3VyIHJlZ2V4IHNvIGl0IGRvZXNuJ3QgZXhwbG9kZVxuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+QiguKz8pfkEvZywgZnVuY3Rpb24gKHdob2xlTWF0Y2gsIG0xKSB7XG4gICAgdmFyIGxlYWRpbmdUZXh0ID0gbTEsXG4gICAgICAgIG51bVNwYWNlcyA9IDQgLSBsZWFkaW5nVGV4dC5sZW5ndGggJSA0OyAgLy8gZ190YWJfd2lkdGhcblxuICAgIC8vIHRoZXJlICptdXN0KiBiZSBhIGJldHRlciB3YXkgdG8gZG8gdGhpczpcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bVNwYWNlczsgaSsrKSB7XG4gICAgICBsZWFkaW5nVGV4dCArPSAnICc7XG4gICAgfVxuXG4gICAgcmV0dXJuIGxlYWRpbmdUZXh0O1xuICB9KTtcblxuICAvLyBjbGVhbiB1cCBzZW50aW5lbHNcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvfkEvZywgJyAgICAnKTsgIC8vIGdfdGFiX3dpZHRoXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoL35CL2csICcnKTtcblxuICByZXR1cm4gdGV4dDtcblxufSk7XG5cbi8qKlxuICogU21hcnQgcHJvY2Vzc2luZyBmb3IgYW1wZXJzYW5kcyBhbmQgYW5nbGUgYnJhY2tldHMgdGhhdCBuZWVkIHRvIGJlIGVuY29kZWQuXG4gKi9cbnNob3dkb3duLnN1YlBhcnNlcignZW5jb2RlQW1wc0FuZEFuZ2xlcycsIGZ1bmN0aW9uICh0ZXh0KSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgLy8gQW1wZXJzYW5kLWVuY29kaW5nIGJhc2VkIGVudGlyZWx5IG9uIE5hdCBJcm9ucydzIEFtcHV0YXRvciBNVCBwbHVnaW46XG4gIC8vIGh0dHA6Ly9idW1wcG8ubmV0L3Byb2plY3RzL2FtcHV0YXRvci9cbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvJig/ISM/W3hYXT8oPzpbMC05YS1mQS1GXSt8XFx3Kyk7KS9nLCAnJmFtcDsnKTtcblxuICAvLyBFbmNvZGUgbmFrZWQgPCdzXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoLzwoPyFbYS16XFwvP1xcJCFdKS9naSwgJyZsdDsnKTtcblxuICByZXR1cm4gdGV4dDtcbn0pO1xuXG4vKipcbiAqIFJldHVybnMgdGhlIHN0cmluZywgd2l0aCBhZnRlciBwcm9jZXNzaW5nIHRoZSBmb2xsb3dpbmcgYmFja3NsYXNoIGVzY2FwZSBzZXF1ZW5jZXMuXG4gKlxuICogYXR0YWNrbGFiOiBUaGUgcG9saXRlIHdheSB0byBkbyB0aGlzIGlzIHdpdGggdGhlIG5ldyBlc2NhcGVDaGFyYWN0ZXJzKCkgZnVuY3Rpb246XG4gKlxuICogICAgdGV4dCA9IGVzY2FwZUNoYXJhY3RlcnModGV4dCxcIlxcXFxcIix0cnVlKTtcbiAqICAgIHRleHQgPSBlc2NhcGVDaGFyYWN0ZXJzKHRleHQsXCJgKl97fVtdKCk+IystLiFcIix0cnVlKTtcbiAqXG4gKiAuLi5idXQgd2UncmUgc2lkZXN0ZXBwaW5nIGl0cyB1c2Ugb2YgdGhlIChzbG93KSBSZWdFeHAgY29uc3RydWN0b3JcbiAqIGFzIGFuIG9wdGltaXphdGlvbiBmb3IgRmlyZWZveC4gIFRoaXMgZnVuY3Rpb24gZ2V0cyBjYWxsZWQgYSBMT1QuXG4gKi9cbnNob3dkb3duLnN1YlBhcnNlcignZW5jb2RlQmFja3NsYXNoRXNjYXBlcycsIGZ1bmN0aW9uICh0ZXh0KSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvXFxcXChcXFxcKS9nLCBzaG93ZG93bi5oZWxwZXIuZXNjYXBlQ2hhcmFjdGVyc0NhbGxiYWNrKTtcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvXFxcXChbYCpfe31cXFtcXF0oKT4jKy0uIV0pL2csIHNob3dkb3duLmhlbHBlci5lc2NhcGVDaGFyYWN0ZXJzQ2FsbGJhY2spO1xuICByZXR1cm4gdGV4dDtcbn0pO1xuXG4vKipcbiAqIEVuY29kZS9lc2NhcGUgY2VydGFpbiBjaGFyYWN0ZXJzIGluc2lkZSBNYXJrZG93biBjb2RlIHJ1bnMuXG4gKiBUaGUgcG9pbnQgaXMgdGhhdCBpbiBjb2RlLCB0aGVzZSBjaGFyYWN0ZXJzIGFyZSBsaXRlcmFscyxcbiAqIGFuZCBsb3NlIHRoZWlyIHNwZWNpYWwgTWFya2Rvd24gbWVhbmluZ3MuXG4gKi9cbnNob3dkb3duLnN1YlBhcnNlcignZW5jb2RlQ29kZScsIGZ1bmN0aW9uICh0ZXh0KSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBFbmNvZGUgYWxsIGFtcGVyc2FuZHM7IEhUTUwgZW50aXRpZXMgYXJlIG5vdFxuICAvLyBlbnRpdGllcyB3aXRoaW4gYSBNYXJrZG93biBjb2RlIHNwYW4uXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoLyYvZywgJyZhbXA7Jyk7XG5cbiAgLy8gRG8gdGhlIGFuZ2xlIGJyYWNrZXQgc29uZyBhbmQgZGFuY2U6XG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoLzwvZywgJyZsdDsnKTtcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvPi9nLCAnJmd0OycpO1xuXG4gIC8vIE5vdywgZXNjYXBlIGNoYXJhY3RlcnMgdGhhdCBhcmUgbWFnaWMgaW4gTWFya2Rvd246XG4gIHRleHQgPSBzaG93ZG93bi5oZWxwZXIuZXNjYXBlQ2hhcmFjdGVycyh0ZXh0LCAnKl97fVtdXFxcXCcsIGZhbHNlKTtcblxuICAvLyBqaiB0aGUgbGluZSBhYm92ZSBicmVha3MgdGhpczpcbiAgLy8tLS1cbiAgLy8qIEl0ZW1cbiAgLy8gICAxLiBTdWJpdGVtXG4gIC8vICAgICAgICAgICAgc3BlY2lhbCBjaGFyOiAqXG4gIC8vIC0tLVxuXG4gIHJldHVybiB0ZXh0O1xufSk7XG5cbi8qKlxuICogIElucHV0OiBhbiBlbWFpbCBhZGRyZXNzLCBlLmcuIFwiZm9vQGV4YW1wbGUuY29tXCJcbiAqXG4gKiAgT3V0cHV0OiB0aGUgZW1haWwgYWRkcmVzcyBhcyBhIG1haWx0byBsaW5rLCB3aXRoIGVhY2ggY2hhcmFjdGVyXG4gKiAgICBvZiB0aGUgYWRkcmVzcyBlbmNvZGVkIGFzIGVpdGhlciBhIGRlY2ltYWwgb3IgaGV4IGVudGl0eSwgaW5cbiAqICAgIHRoZSBob3BlcyBvZiBmb2lsaW5nIG1vc3QgYWRkcmVzcyBoYXJ2ZXN0aW5nIHNwYW0gYm90cy4gRS5nLjpcbiAqXG4gKiAgICA8YSBocmVmPVwiJiN4NkQ7JiM5NzsmIzEwNTsmIzEwODsmI3g3NDsmIzExMTs6JiMxMDI7JiMxMTE7JiMxMTE7JiM2NDsmIzEwMTtcbiAqICAgICAgIHgmI3g2MTsmIzEwOTsmI3g3MDsmIzEwODsmI3g2NTsmI3gyRTsmIzk5OyYjMTExOyYjMTA5O1wiPiYjMTAyOyYjMTExOyYjMTExO1xuICogICAgICAgJiM2NDsmIzEwMTt4JiN4NjE7JiMxMDk7JiN4NzA7JiMxMDg7JiN4NjU7JiN4MkU7JiM5OTsmIzExMTsmIzEwOTs8L2E+XG4gKlxuICogIEJhc2VkIG9uIGEgZmlsdGVyIGJ5IE1hdHRoZXcgV2lja2xpbmUsIHBvc3RlZCB0byB0aGUgQkJFZGl0LVRhbGtcbiAqICBtYWlsaW5nIGxpc3Q6IDxodHRwOi8vdGlueXVybC5jb20veXU3dWU+XG4gKlxuICovXG5zaG93ZG93bi5zdWJQYXJzZXIoJ2VuY29kZUVtYWlsQWRkcmVzcycsIGZ1bmN0aW9uIChhZGRyKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgZW5jb2RlID0gW1xuICAgIGZ1bmN0aW9uIChjaCkge1xuICAgICAgcmV0dXJuICcmIycgKyBjaC5jaGFyQ29kZUF0KDApICsgJzsnO1xuICAgIH0sXG4gICAgZnVuY3Rpb24gKGNoKSB7XG4gICAgICByZXR1cm4gJyYjeCcgKyBjaC5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KSArICc7JztcbiAgICB9LFxuICAgIGZ1bmN0aW9uIChjaCkge1xuICAgICAgcmV0dXJuIGNoO1xuICAgIH1cbiAgXTtcblxuICBhZGRyID0gJ21haWx0bzonICsgYWRkcjtcblxuICBhZGRyID0gYWRkci5yZXBsYWNlKC8uL2csIGZ1bmN0aW9uIChjaCkge1xuICAgIGlmIChjaCA9PT0gJ0AnKSB7XG4gICAgICAvLyB0aGlzICptdXN0KiBiZSBlbmNvZGVkLiBJIGluc2lzdC5cbiAgICAgIGNoID0gZW5jb2RlW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpXShjaCk7XG4gICAgfSBlbHNlIGlmIChjaCAhPT0gJzonKSB7XG4gICAgICAvLyBsZWF2ZSAnOicgYWxvbmUgKHRvIHNwb3QgbWFpbHRvOiBsYXRlcilcbiAgICAgIHZhciByID0gTWF0aC5yYW5kb20oKTtcbiAgICAgIC8vIHJvdWdobHkgMTAlIHJhdywgNDUlIGhleCwgNDUlIGRlY1xuICAgICAgY2ggPSAoXG4gICAgICAgIHIgPiAwLjkgPyBlbmNvZGVbMl0oY2gpIDogciA+IDAuNDUgPyBlbmNvZGVbMV0oY2gpIDogZW5jb2RlWzBdKGNoKVxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIGNoO1xuICB9KTtcblxuICBhZGRyID0gJzxhIGhyZWY9XCInICsgYWRkciArICdcIj4nICsgYWRkciArICc8L2E+JztcbiAgYWRkciA9IGFkZHIucmVwbGFjZSgvXCI+Lis6L2csICdcIj4nKTsgLy8gc3RyaXAgdGhlIG1haWx0bzogZnJvbSB0aGUgdmlzaWJsZSBwYXJ0XG5cbiAgcmV0dXJuIGFkZHI7XG59KTtcblxuLyoqXG4gKiBXaXRoaW4gdGFncyAtLSBtZWFuaW5nIGJldHdlZW4gPCBhbmQgPiAtLSBlbmNvZGUgW1xcIGAgKiBfXSBzbyB0aGV5XG4gKiBkb24ndCBjb25mbGljdCB3aXRoIHRoZWlyIHVzZSBpbiBNYXJrZG93biBmb3IgY29kZSwgaXRhbGljcyBhbmQgc3Ryb25nLlxuICovXG5zaG93ZG93bi5zdWJQYXJzZXIoJ2VzY2FwZVNwZWNpYWxDaGFyc1dpdGhpblRhZ0F0dHJpYnV0ZXMnLCBmdW5jdGlvbiAodGV4dCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gQnVpbGQgYSByZWdleCB0byBmaW5kIEhUTUwgdGFncyBhbmQgY29tbWVudHMuICBTZWUgRnJpZWRsJ3NcbiAgLy8gXCJNYXN0ZXJpbmcgUmVndWxhciBFeHByZXNzaW9uc1wiLCAybmQgRWQuLCBwcC4gMjAwLTIwMS5cbiAgdmFyIHJlZ2V4ID0gLyg8W2EtelxcLyEkXShcIlteXCJdKlwifCdbXiddKid8W14nXCI+XSkqPnw8ISgtLS4qPy0tXFxzKikrPikvZ2k7XG5cbiAgdGV4dCA9IHRleHQucmVwbGFjZShyZWdleCwgZnVuY3Rpb24gKHdob2xlTWF0Y2gpIHtcbiAgICB2YXIgdGFnID0gd2hvbGVNYXRjaC5yZXBsYWNlKC8oLik8XFwvP2NvZGU+KD89LikvZywgJyQxYCcpO1xuICAgIHRhZyA9IHNob3dkb3duLmhlbHBlci5lc2NhcGVDaGFyYWN0ZXJzKHRhZywgJ1xcXFxgKl8nLCBmYWxzZSk7XG4gICAgcmV0dXJuIHRhZztcbiAgfSk7XG5cbiAgcmV0dXJuIHRleHQ7XG59KTtcblxuLyoqXG4gKiBIYW5kbGUgZ2l0aHViIGNvZGVibG9ja3MgcHJpb3IgdG8gcnVubmluZyBIYXNoSFRNTCBzbyB0aGF0XG4gKiBIVE1MIGNvbnRhaW5lZCB3aXRoaW4gdGhlIGNvZGVibG9jayBnZXRzIGVzY2FwZWQgcHJvcGVybHlcbiAqIEV4YW1wbGU6XG4gKiBgYGBydWJ5XG4gKiAgICAgZGVmIGhlbGxvX3dvcmxkKHgpXG4gKiAgICAgICBwdXRzIFwiSGVsbG8sICN7eH1cIlxuICogICAgIGVuZFxuICogYGBgXG4gKi9cbnNob3dkb3duLnN1YlBhcnNlcignZ2l0aHViQ29kZUJsb2NrcycsIGZ1bmN0aW9uICh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBlYXJseSBleGl0IGlmIG9wdGlvbiBpcyBub3QgZW5hYmxlZFxuICBpZiAoIW9wdGlvbnMuZ2hDb2RlQmxvY2tzKSB7XG4gICAgcmV0dXJuIHRleHQ7XG4gIH1cblxuICB0ZXh0ID0gZ2xvYmFscy5jb252ZXJ0ZXIuX2Rpc3BhdGNoKCdnaXRodWJDb2RlQmxvY2tzLmJlZm9yZScsIHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xuXG4gIHRleHQgKz0gJ34wJztcblxuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oPzpefFxcbilgYGAoLiopXFxuKFtcXHNcXFNdKj8pXFxuYGBgL2csIGZ1bmN0aW9uICh3aG9sZU1hdGNoLCBsYW5ndWFnZSwgY29kZWJsb2NrKSB7XG4gICAgdmFyIGVuZCA9IChvcHRpb25zLm9taXRFeHRyYVdMSW5Db2RlQmxvY2tzKSA/ICcnIDogJ1xcbic7XG5cbiAgICAvLyBGaXJzdCBwYXJzZSB0aGUgZ2l0aHViIGNvZGUgYmxvY2tcbiAgICBjb2RlYmxvY2sgPSBzaG93ZG93bi5zdWJQYXJzZXIoJ2VuY29kZUNvZGUnKShjb2RlYmxvY2spO1xuICAgIGNvZGVibG9jayA9IHNob3dkb3duLnN1YlBhcnNlcignZGV0YWInKShjb2RlYmxvY2spO1xuICAgIGNvZGVibG9jayA9IGNvZGVibG9jay5yZXBsYWNlKC9eXFxuKy9nLCAnJyk7IC8vIHRyaW0gbGVhZGluZyBuZXdsaW5lc1xuICAgIGNvZGVibG9jayA9IGNvZGVibG9jay5yZXBsYWNlKC9cXG4rJC9nLCAnJyk7IC8vIHRyaW0gdHJhaWxpbmcgd2hpdGVzcGFjZVxuXG4gICAgY29kZWJsb2NrID0gJzxwcmU+PGNvZGUnICsgKGxhbmd1YWdlID8gJyBjbGFzcz1cIicgKyBsYW5ndWFnZSArICcgbGFuZ3VhZ2UtJyArIGxhbmd1YWdlICsgJ1wiJyA6ICcnKSArICc+JyArIGNvZGVibG9jayArIGVuZCArICc8L2NvZGU+PC9wcmU+JztcblxuICAgIGNvZGVibG9jayA9IHNob3dkb3duLnN1YlBhcnNlcignaGFzaEJsb2NrJykoY29kZWJsb2NrLCBvcHRpb25zLCBnbG9iYWxzKTtcblxuICAgIC8vIFNpbmNlIEdIQ29kZWJsb2NrcyBjYW4gYmUgZmFsc2UgcG9zaXRpdmVzLCB3ZSBuZWVkIHRvXG4gICAgLy8gc3RvcmUgdGhlIHByaW1pdGl2ZSB0ZXh0IGFuZCB0aGUgcGFyc2VkIHRleHQgaW4gYSBnbG9iYWwgdmFyLFxuICAgIC8vIGFuZCB0aGVuIHJldHVybiBhIHRva2VuXG4gICAgcmV0dXJuICdcXG5cXG5+RycgKyAoZ2xvYmFscy5naENvZGVCbG9ja3MucHVzaCh7dGV4dDogd2hvbGVNYXRjaCwgY29kZWJsb2NrOiBjb2RlYmxvY2t9KSAtIDEpICsgJ0dcXG5cXG4nO1xuICB9KTtcblxuICAvLyBhdHRhY2tsYWI6IHN0cmlwIHNlbnRpbmVsXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoL34wLywgJycpO1xuXG4gIHJldHVybiBnbG9iYWxzLmNvbnZlcnRlci5fZGlzcGF0Y2goJ2dpdGh1YkNvZGVCbG9ja3MuYWZ0ZXInLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcbn0pO1xuXG5zaG93ZG93bi5zdWJQYXJzZXIoJ2hhc2hCbG9jaycsIGZ1bmN0aW9uICh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvKF5cXG4rfFxcbiskKS9nLCAnJyk7XG4gIHJldHVybiAnXFxuXFxufksnICsgKGdsb2JhbHMuZ0h0bWxCbG9ja3MucHVzaCh0ZXh0KSAtIDEpICsgJ0tcXG5cXG4nO1xufSk7XG5cbnNob3dkb3duLnN1YlBhcnNlcignaGFzaEVsZW1lbnQnLCBmdW5jdGlvbiAodGV4dCwgb3B0aW9ucywgZ2xvYmFscykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uICh3aG9sZU1hdGNoLCBtMSkge1xuICAgIHZhciBibG9ja1RleHQgPSBtMTtcblxuICAgIC8vIFVuZG8gZG91YmxlIGxpbmVzXG4gICAgYmxvY2tUZXh0ID0gYmxvY2tUZXh0LnJlcGxhY2UoL1xcblxcbi9nLCAnXFxuJyk7XG4gICAgYmxvY2tUZXh0ID0gYmxvY2tUZXh0LnJlcGxhY2UoL15cXG4vLCAnJyk7XG5cbiAgICAvLyBzdHJpcCB0cmFpbGluZyBibGFuayBsaW5lc1xuICAgIGJsb2NrVGV4dCA9IGJsb2NrVGV4dC5yZXBsYWNlKC9cXG4rJC9nLCAnJyk7XG5cbiAgICAvLyBSZXBsYWNlIHRoZSBlbGVtZW50IHRleHQgd2l0aCBhIG1hcmtlciAoXCJ+S3hLXCIgd2hlcmUgeCBpcyBpdHMga2V5KVxuICAgIGJsb2NrVGV4dCA9ICdcXG5cXG5+SycgKyAoZ2xvYmFscy5nSHRtbEJsb2Nrcy5wdXNoKGJsb2NrVGV4dCkgLSAxKSArICdLXFxuXFxuJztcblxuICAgIHJldHVybiBibG9ja1RleHQ7XG4gIH07XG59KTtcblxuc2hvd2Rvd24uc3ViUGFyc2VyKCdoYXNoSFRNTEJsb2NrcycsIGZ1bmN0aW9uICh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgYmxvY2tUYWdzID0gW1xuICAgICAgJ3ByZScsXG4gICAgICAnZGl2JyxcbiAgICAgICdoMScsXG4gICAgICAnaDInLFxuICAgICAgJ2gzJyxcbiAgICAgICdoNCcsXG4gICAgICAnaDUnLFxuICAgICAgJ2g2JyxcbiAgICAgICdibG9ja3F1b3RlJyxcbiAgICAgICd0YWJsZScsXG4gICAgICAnZGwnLFxuICAgICAgJ29sJyxcbiAgICAgICd1bCcsXG4gICAgICAnc2NyaXB0JyxcbiAgICAgICdub3NjcmlwdCcsXG4gICAgICAnZm9ybScsXG4gICAgICAnZmllbGRzZXQnLFxuICAgICAgJ2lmcmFtZScsXG4gICAgICAnbWF0aCcsXG4gICAgICAnc3R5bGUnLFxuICAgICAgJ3NlY3Rpb24nLFxuICAgICAgJ2hlYWRlcicsXG4gICAgICAnZm9vdGVyJyxcbiAgICAgICduYXYnLFxuICAgICAgJ2FydGljbGUnLFxuICAgICAgJ2FzaWRlJyxcbiAgICAgICdhZGRyZXNzJyxcbiAgICAgICdhdWRpbycsXG4gICAgICAnY2FudmFzJyxcbiAgICAgICdmaWd1cmUnLFxuICAgICAgJ2hncm91cCcsXG4gICAgICAnb3V0cHV0JyxcbiAgICAgICd2aWRlbycsXG4gICAgICAncCdcbiAgICBdLFxuICAgIHJlcEZ1bmMgPSBmdW5jdGlvbiAod2hvbGVNYXRjaCwgbWF0Y2gsIGxlZnQsIHJpZ2h0KSB7XG4gICAgICB2YXIgdHh0ID0gd2hvbGVNYXRjaDtcbiAgICAgIC8vIGNoZWNrIGlmIHRoaXMgaHRtbCBlbGVtZW50IGlzIG1hcmtlZCBhcyBtYXJrZG93blxuICAgICAgLy8gaWYgc28sIGl0J3MgY29udGVudHMgc2hvdWxkIGJlIHBhcnNlZCBhcyBtYXJrZG93blxuICAgICAgaWYgKGxlZnQuc2VhcmNoKC9cXGJtYXJrZG93blxcYi8pICE9PSAtMSkge1xuICAgICAgICB0eHQgPSBsZWZ0ICsgZ2xvYmFscy5jb252ZXJ0ZXIubWFrZUh0bWwobWF0Y2gpICsgcmlnaHQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gJ1xcblxcbn5LJyArIChnbG9iYWxzLmdIdG1sQmxvY2tzLnB1c2godHh0KSAtIDEpICsgJ0tcXG5cXG4nO1xuICAgIH07XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBibG9ja1RhZ3MubGVuZ3RoOyArK2kpIHtcbiAgICB0ZXh0ID0gc2hvd2Rvd24uaGVscGVyLnJlcGxhY2VSZWN1cnNpdmVSZWdFeHAodGV4dCwgcmVwRnVuYywgJ14oPzogfFxcXFx0KXswLDN9PCcgKyBibG9ja1RhZ3NbaV0gKyAnXFxcXGJbXj5dKj4nLCAnPC8nICsgYmxvY2tUYWdzW2ldICsgJz4nLCAnZ2ltJyk7XG4gIH1cblxuICAvLyBIUiBTUEVDSUFMIENBU0VcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvKFxcblsgXXswLDN9KDwoaHIpXFxiKFtePD5dKSo/XFwvPz4pWyBcXHRdKig/PVxcbnsyLH0pKS9nLFxuICAgIHNob3dkb3duLnN1YlBhcnNlcignaGFzaEVsZW1lbnQnKSh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKSk7XG5cbiAgLy8gU3BlY2lhbCBjYXNlIGZvciBzdGFuZGFsb25lIEhUTUwgY29tbWVudHM6XG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoLyg8IS0tW1xcc1xcU10qPy0tPikvZyxcbiAgICBzaG93ZG93bi5zdWJQYXJzZXIoJ2hhc2hFbGVtZW50JykodGV4dCwgb3B0aW9ucywgZ2xvYmFscykpO1xuXG4gIC8vIFBIUCBhbmQgQVNQLXN0eWxlIHByb2Nlc3NvciBpbnN0cnVjdGlvbnMgKDw/Li4uPz4gYW5kIDwlLi4uJT4pXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoLyg/OlxcblxcbikoWyBdezAsM30oPzo8KFs/JV0pW15cXHJdKj9cXDI+KVsgXFx0XSooPz1cXG57Mix9KSkvZyxcbiAgICBzaG93ZG93bi5zdWJQYXJzZXIoJ2hhc2hFbGVtZW50JykodGV4dCwgb3B0aW9ucywgZ2xvYmFscykpO1xuICByZXR1cm4gdGV4dDtcbn0pO1xuXG4vKipcbiAqIEhhc2ggc3BhbiBlbGVtZW50cyB0aGF0IHNob3VsZCBub3QgYmUgcGFyc2VkIGFzIG1hcmtkb3duXG4gKi9cbnNob3dkb3duLnN1YlBhcnNlcignaGFzaEhUTUxTcGFucycsIGZ1bmN0aW9uICh0ZXh0LCBjb25maWcsIGdsb2JhbHMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBtYXRjaGVzID0gc2hvd2Rvd24uaGVscGVyLm1hdGNoUmVjdXJzaXZlUmVnRXhwKHRleHQsICc8Y29kZVxcXFxiW14+XSo+JywgJzwvY29kZT4nLCAnZ2knKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IG1hdGNoZXMubGVuZ3RoOyArK2kpIHtcbiAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKG1hdGNoZXNbaV1bMF0sICd+TCcgKyAoZ2xvYmFscy5nSHRtbFNwYW5zLnB1c2gobWF0Y2hlc1tpXVswXSkgLSAxKSArICdMJyk7XG4gIH1cbiAgcmV0dXJuIHRleHQ7XG59KTtcblxuLyoqXG4gKiBVbmhhc2ggSFRNTCBzcGFuc1xuICovXG5zaG93ZG93bi5zdWJQYXJzZXIoJ3VuaGFzaEhUTUxTcGFucycsIGZ1bmN0aW9uICh0ZXh0LCBjb25maWcsIGdsb2JhbHMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZ2xvYmFscy5nSHRtbFNwYW5zLmxlbmd0aDsgKytpKSB7XG4gICAgdGV4dCA9IHRleHQucmVwbGFjZSgnfkwnICsgaSArICdMJywgZ2xvYmFscy5nSHRtbFNwYW5zW2ldKTtcbiAgfVxuXG4gIHJldHVybiB0ZXh0O1xufSk7XG5cbi8qKlxuICogSGFzaCBzcGFuIGVsZW1lbnRzIHRoYXQgc2hvdWxkIG5vdCBiZSBwYXJzZWQgYXMgbWFya2Rvd25cbiAqL1xuc2hvd2Rvd24uc3ViUGFyc2VyKCdoYXNoUHJlQ29kZVRhZ3MnLCBmdW5jdGlvbiAodGV4dCwgY29uZmlnLCBnbG9iYWxzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgcmVwRnVuYyA9IGZ1bmN0aW9uICh3aG9sZU1hdGNoLCBtYXRjaCwgbGVmdCwgcmlnaHQpIHtcbiAgICAvLyBlbmNvZGUgaHRtbCBlbnRpdGllc1xuICAgIHZhciBjb2RlYmxvY2sgPSBsZWZ0ICsgc2hvd2Rvd24uc3ViUGFyc2VyKCdlbmNvZGVDb2RlJykobWF0Y2gpICsgcmlnaHQ7XG4gICAgcmV0dXJuICdcXG5cXG5+RycgKyAoZ2xvYmFscy5naENvZGVCbG9ja3MucHVzaCh7dGV4dDogd2hvbGVNYXRjaCwgY29kZWJsb2NrOiBjb2RlYmxvY2t9KSAtIDEpICsgJ0dcXG5cXG4nO1xuICB9O1xuXG4gIHRleHQgPSBzaG93ZG93bi5oZWxwZXIucmVwbGFjZVJlY3Vyc2l2ZVJlZ0V4cCh0ZXh0LCByZXBGdW5jLCAnXig/OiB8XFxcXHQpezAsM308cHJlXFxcXGJbXj5dKj5cXFxccyo8Y29kZVxcXFxiW14+XSo+JywgJ14oPzogfFxcXFx0KXswLDN9PC9jb2RlPlxcXFxzKjwvcHJlPicsICdnaW0nKTtcbiAgcmV0dXJuIHRleHQ7XG59KTtcblxuc2hvd2Rvd24uc3ViUGFyc2VyKCdoZWFkZXJzJywgZnVuY3Rpb24gKHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHRleHQgPSBnbG9iYWxzLmNvbnZlcnRlci5fZGlzcGF0Y2goJ2hlYWRlcnMuYmVmb3JlJywgdGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XG5cbiAgdmFyIHByZWZpeEhlYWRlciA9IG9wdGlvbnMucHJlZml4SGVhZGVySWQsXG4gICAgICBoZWFkZXJMZXZlbFN0YXJ0ID0gKGlzTmFOKHBhcnNlSW50KG9wdGlvbnMuaGVhZGVyTGV2ZWxTdGFydCkpKSA/IDEgOiBwYXJzZUludChvcHRpb25zLmhlYWRlckxldmVsU3RhcnQpLFxuXG4gIC8vIFNldCB0ZXh0LXN0eWxlIGhlYWRlcnM6XG4gIC8vXHRIZWFkZXIgMVxuICAvL1x0PT09PT09PT1cbiAgLy9cbiAgLy9cdEhlYWRlciAyXG4gIC8vXHQtLS0tLS0tLVxuICAvL1xuICAgICAgc2V0ZXh0UmVnZXhIMSA9IChvcHRpb25zLnNtb290aExpdmVQcmV2aWV3KSA/IC9eKC4rKVsgXFx0XSpcXG49ezIsfVsgXFx0XSpcXG4rL2dtIDogL14oLispWyBcXHRdKlxcbj0rWyBcXHRdKlxcbisvZ20sXG4gICAgICBzZXRleHRSZWdleEgyID0gKG9wdGlvbnMuc21vb3RoTGl2ZVByZXZpZXcpID8gL14oLispWyBcXHRdKlxcbi17Mix9WyBcXHRdKlxcbisvZ20gOiAvXiguKylbIFxcdF0qXFxuLStbIFxcdF0qXFxuKy9nbTtcblxuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKHNldGV4dFJlZ2V4SDEsIGZ1bmN0aW9uICh3aG9sZU1hdGNoLCBtMSkge1xuXG4gICAgdmFyIHNwYW5HYW11dCA9IHNob3dkb3duLnN1YlBhcnNlcignc3BhbkdhbXV0JykobTEsIG9wdGlvbnMsIGdsb2JhbHMpLFxuICAgICAgICBoSUQgPSAob3B0aW9ucy5ub0hlYWRlcklkKSA/ICcnIDogJyBpZD1cIicgKyBoZWFkZXJJZChtMSkgKyAnXCInLFxuICAgICAgICBoTGV2ZWwgPSBoZWFkZXJMZXZlbFN0YXJ0LFxuICAgICAgICBoYXNoQmxvY2sgPSAnPGgnICsgaExldmVsICsgaElEICsgJz4nICsgc3BhbkdhbXV0ICsgJzwvaCcgKyBoTGV2ZWwgKyAnPic7XG4gICAgcmV0dXJuIHNob3dkb3duLnN1YlBhcnNlcignaGFzaEJsb2NrJykoaGFzaEJsb2NrLCBvcHRpb25zLCBnbG9iYWxzKTtcbiAgfSk7XG5cbiAgdGV4dCA9IHRleHQucmVwbGFjZShzZXRleHRSZWdleEgyLCBmdW5jdGlvbiAobWF0Y2hGb3VuZCwgbTEpIHtcbiAgICB2YXIgc3BhbkdhbXV0ID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdzcGFuR2FtdXQnKShtMSwgb3B0aW9ucywgZ2xvYmFscyksXG4gICAgICAgIGhJRCA9IChvcHRpb25zLm5vSGVhZGVySWQpID8gJycgOiAnIGlkPVwiJyArIGhlYWRlcklkKG0xKSArICdcIicsXG4gICAgICAgIGhMZXZlbCA9IGhlYWRlckxldmVsU3RhcnQgKyAxLFxuICAgICAgaGFzaEJsb2NrID0gJzxoJyArIGhMZXZlbCArIGhJRCArICc+JyArIHNwYW5HYW11dCArICc8L2gnICsgaExldmVsICsgJz4nO1xuICAgIHJldHVybiBzaG93ZG93bi5zdWJQYXJzZXIoJ2hhc2hCbG9jaycpKGhhc2hCbG9jaywgb3B0aW9ucywgZ2xvYmFscyk7XG4gIH0pO1xuXG4gIC8vIGF0eC1zdHlsZSBoZWFkZXJzOlxuICAvLyAgIyBIZWFkZXIgMVxuICAvLyAgIyMgSGVhZGVyIDJcbiAgLy8gICMjIEhlYWRlciAyIHdpdGggY2xvc2luZyBoYXNoZXMgIyNcbiAgLy8gIC4uLlxuICAvLyAgIyMjIyMjIEhlYWRlciA2XG4gIC8vXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoL14oI3sxLDZ9KVsgXFx0XSooLis/KVsgXFx0XSojKlxcbisvZ20sIGZ1bmN0aW9uICh3aG9sZU1hdGNoLCBtMSwgbTIpIHtcbiAgICB2YXIgc3BhbiA9IHNob3dkb3duLnN1YlBhcnNlcignc3BhbkdhbXV0JykobTIsIG9wdGlvbnMsIGdsb2JhbHMpLFxuICAgICAgICBoSUQgPSAob3B0aW9ucy5ub0hlYWRlcklkKSA/ICcnIDogJyBpZD1cIicgKyBoZWFkZXJJZChtMikgKyAnXCInLFxuICAgICAgICBoTGV2ZWwgPSBoZWFkZXJMZXZlbFN0YXJ0IC0gMSArIG0xLmxlbmd0aCxcbiAgICAgICAgaGVhZGVyID0gJzxoJyArIGhMZXZlbCArIGhJRCArICc+JyArIHNwYW4gKyAnPC9oJyArIGhMZXZlbCArICc+JztcblxuICAgIHJldHVybiBzaG93ZG93bi5zdWJQYXJzZXIoJ2hhc2hCbG9jaycpKGhlYWRlciwgb3B0aW9ucywgZ2xvYmFscyk7XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIGhlYWRlcklkKG0pIHtcbiAgICB2YXIgdGl0bGUsIGVzY2FwZWRJZCA9IG0ucmVwbGFjZSgvW15cXHddL2csICcnKS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgaWYgKGdsb2JhbHMuaGFzaExpbmtDb3VudHNbZXNjYXBlZElkXSkge1xuICAgICAgdGl0bGUgPSBlc2NhcGVkSWQgKyAnLScgKyAoZ2xvYmFscy5oYXNoTGlua0NvdW50c1tlc2NhcGVkSWRdKyspO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aXRsZSA9IGVzY2FwZWRJZDtcbiAgICAgIGdsb2JhbHMuaGFzaExpbmtDb3VudHNbZXNjYXBlZElkXSA9IDE7XG4gICAgfVxuXG4gICAgLy8gUHJlZml4IGlkIHRvIHByZXZlbnQgY2F1c2luZyBpbmFkdmVydGVudCBwcmUtZXhpc3Rpbmcgc3R5bGUgbWF0Y2hlcy5cbiAgICBpZiAocHJlZml4SGVhZGVyID09PSB0cnVlKSB7XG4gICAgICBwcmVmaXhIZWFkZXIgPSAnc2VjdGlvbic7XG4gICAgfVxuXG4gICAgaWYgKHNob3dkb3duLmhlbHBlci5pc1N0cmluZyhwcmVmaXhIZWFkZXIpKSB7XG4gICAgICByZXR1cm4gcHJlZml4SGVhZGVyICsgdGl0bGU7XG4gICAgfVxuICAgIHJldHVybiB0aXRsZTtcbiAgfVxuXG4gIHRleHQgPSBnbG9iYWxzLmNvbnZlcnRlci5fZGlzcGF0Y2goJ2hlYWRlcnMuYWZ0ZXInLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcbiAgcmV0dXJuIHRleHQ7XG59KTtcblxuLyoqXG4gKiBUdXJuIE1hcmtkb3duIGltYWdlIHNob3J0Y3V0cyBpbnRvIDxpbWc+IHRhZ3MuXG4gKi9cbnNob3dkb3duLnN1YlBhcnNlcignaW1hZ2VzJywgZnVuY3Rpb24gKHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHRleHQgPSBnbG9iYWxzLmNvbnZlcnRlci5fZGlzcGF0Y2goJ2ltYWdlcy5iZWZvcmUnLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcblxuICB2YXIgaW5saW5lUmVnRXhwICAgID0gLyFcXFsoLio/KV1cXHM/XFwoWyBcXHRdKigpPD8oXFxTKz8pPj8oPzogPShbKlxcZF0rW0EtWmEteiVdezAsNH0peChbKlxcZF0rW0EtWmEteiVdezAsNH0pKT9bIFxcdF0qKD86KFsnXCJdKSguKj8pXFw2WyBcXHRdKik/XFwpL2csXG4gICAgICByZWZlcmVuY2VSZWdFeHAgPSAvIVxcWyhbXlxcXV0qPyldID8oPzpcXG4gKik/XFxbKC4qPyldKCkoKSgpKCkoKS9nO1xuXG4gIGZ1bmN0aW9uIHdyaXRlSW1hZ2VUYWcgKHdob2xlTWF0Y2gsIGFsdFRleHQsIGxpbmtJZCwgdXJsLCB3aWR0aCwgaGVpZ2h0LCBtNSwgdGl0bGUpIHtcblxuICAgIHZhciBnVXJscyAgID0gZ2xvYmFscy5nVXJscyxcbiAgICAgICAgZ1RpdGxlcyA9IGdsb2JhbHMuZ1RpdGxlcyxcbiAgICAgICAgZ0RpbXMgICA9IGdsb2JhbHMuZ0RpbWVuc2lvbnM7XG5cbiAgICBsaW5rSWQgPSBsaW5rSWQudG9Mb3dlckNhc2UoKTtcblxuICAgIGlmICghdGl0bGUpIHtcbiAgICAgIHRpdGxlID0gJyc7XG4gICAgfVxuXG4gICAgaWYgKHVybCA9PT0gJycgfHwgdXJsID09PSBudWxsKSB7XG4gICAgICBpZiAobGlua0lkID09PSAnJyB8fCBsaW5rSWQgPT09IG51bGwpIHtcbiAgICAgICAgLy8gbG93ZXItY2FzZSBhbmQgdHVybiBlbWJlZGRlZCBuZXdsaW5lcyBpbnRvIHNwYWNlc1xuICAgICAgICBsaW5rSWQgPSBhbHRUZXh0LnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvID9cXG4vZywgJyAnKTtcbiAgICAgIH1cbiAgICAgIHVybCA9ICcjJyArIGxpbmtJZDtcblxuICAgICAgaWYgKCFzaG93ZG93bi5oZWxwZXIuaXNVbmRlZmluZWQoZ1VybHNbbGlua0lkXSkpIHtcbiAgICAgICAgdXJsID0gZ1VybHNbbGlua0lkXTtcbiAgICAgICAgaWYgKCFzaG93ZG93bi5oZWxwZXIuaXNVbmRlZmluZWQoZ1RpdGxlc1tsaW5rSWRdKSkge1xuICAgICAgICAgIHRpdGxlID0gZ1RpdGxlc1tsaW5rSWRdO1xuICAgICAgICB9XG4gICAgICAgIGlmICghc2hvd2Rvd24uaGVscGVyLmlzVW5kZWZpbmVkKGdEaW1zW2xpbmtJZF0pKSB7XG4gICAgICAgICAgd2lkdGggPSBnRGltc1tsaW5rSWRdLndpZHRoO1xuICAgICAgICAgIGhlaWdodCA9IGdEaW1zW2xpbmtJZF0uaGVpZ2h0O1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gd2hvbGVNYXRjaDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBhbHRUZXh0ID0gYWx0VGV4dC5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7Jyk7XG4gICAgYWx0VGV4dCA9IHNob3dkb3duLmhlbHBlci5lc2NhcGVDaGFyYWN0ZXJzKGFsdFRleHQsICcqXycsIGZhbHNlKTtcbiAgICB1cmwgPSBzaG93ZG93bi5oZWxwZXIuZXNjYXBlQ2hhcmFjdGVycyh1cmwsICcqXycsIGZhbHNlKTtcbiAgICB2YXIgcmVzdWx0ID0gJzxpbWcgc3JjPVwiJyArIHVybCArICdcIiBhbHQ9XCInICsgYWx0VGV4dCArICdcIic7XG5cbiAgICBpZiAodGl0bGUpIHtcbiAgICAgIHRpdGxlID0gdGl0bGUucmVwbGFjZSgvXCIvZywgJyZxdW90OycpO1xuICAgICAgdGl0bGUgPSBzaG93ZG93bi5oZWxwZXIuZXNjYXBlQ2hhcmFjdGVycyh0aXRsZSwgJypfJywgZmFsc2UpO1xuICAgICAgcmVzdWx0ICs9ICcgdGl0bGU9XCInICsgdGl0bGUgKyAnXCInO1xuICAgIH1cblxuICAgIGlmICh3aWR0aCAmJiBoZWlnaHQpIHtcbiAgICAgIHdpZHRoICA9ICh3aWR0aCA9PT0gJyonKSA/ICdhdXRvJyA6IHdpZHRoO1xuICAgICAgaGVpZ2h0ID0gKGhlaWdodCA9PT0gJyonKSA/ICdhdXRvJyA6IGhlaWdodDtcblxuICAgICAgcmVzdWx0ICs9ICcgd2lkdGg9XCInICsgd2lkdGggKyAnXCInO1xuICAgICAgcmVzdWx0ICs9ICcgaGVpZ2h0PVwiJyArIGhlaWdodCArICdcIic7XG4gICAgfVxuXG4gICAgcmVzdWx0ICs9ICcgLz4nO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvLyBGaXJzdCwgaGFuZGxlIHJlZmVyZW5jZS1zdHlsZSBsYWJlbGVkIGltYWdlczogIVthbHQgdGV4dF1baWRdXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UocmVmZXJlbmNlUmVnRXhwLCB3cml0ZUltYWdlVGFnKTtcblxuICAvLyBOZXh0LCBoYW5kbGUgaW5saW5lIGltYWdlczogICFbYWx0IHRleHRdKHVybCA9PHdpZHRoPng8aGVpZ2h0PiBcIm9wdGlvbmFsIHRpdGxlXCIpXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoaW5saW5lUmVnRXhwLCB3cml0ZUltYWdlVGFnKTtcblxuICB0ZXh0ID0gZ2xvYmFscy5jb252ZXJ0ZXIuX2Rpc3BhdGNoKCdpbWFnZXMuYWZ0ZXInLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcbiAgcmV0dXJuIHRleHQ7XG59KTtcblxuc2hvd2Rvd24uc3ViUGFyc2VyKCdpdGFsaWNzQW5kQm9sZCcsIGZ1bmN0aW9uICh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICB0ZXh0ID0gZ2xvYmFscy5jb252ZXJ0ZXIuX2Rpc3BhdGNoKCdpdGFsaWNzQW5kQm9sZC5iZWZvcmUnLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcblxuICBpZiAob3B0aW9ucy5saXRlcmFsTWlkV29yZFVuZGVyc2NvcmVzKSB7XG4gICAgLy91bmRlcnNjb3Jlc1xuICAgIC8vIFNpbmNlIHdlIGFyZSBjb25zdW1pbmcgYSBcXHMgY2hhcmFjdGVyLCB3ZSBuZWVkIHRvIGFkZCBpdFxuICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhefFxcc3w+fFxcYilfXyg/PVxcUykoW1xcc1xcU10rPylfXyg/PVxcYnw8fFxcc3wkKS9nbSwgJyQxPHN0cm9uZz4kMjwvc3Ryb25nPicpO1xuICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhefFxcc3w+fFxcYilfKD89XFxTKShbXFxzXFxTXSs/KV8oPz1cXGJ8PHxcXHN8JCkvZ20sICckMTxlbT4kMjwvZW0+Jyk7XG4gICAgLy9hc3Rlcmlza3NcbiAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXFwqXFwqKSg/PVxcUykoW15cXHJdKj9cXFNbKl0qKVxcMS9nLCAnPHN0cm9uZz4kMjwvc3Ryb25nPicpO1xuICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhcXCopKD89XFxTKShbXlxccl0qP1xcUylcXDEvZywgJzxlbT4kMjwvZW0+Jyk7XG5cbiAgfSBlbHNlIHtcbiAgICAvLyA8c3Ryb25nPiBtdXN0IGdvIGZpcnN0OlxuICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhcXCpcXCp8X18pKD89XFxTKShbXlxccl0qP1xcU1sqX10qKVxcMS9nLCAnPHN0cm9uZz4kMjwvc3Ryb25nPicpO1xuICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhcXCp8XykoPz1cXFMpKFteXFxyXSo/XFxTKVxcMS9nLCAnPGVtPiQyPC9lbT4nKTtcbiAgfVxuXG4gIHRleHQgPSBnbG9iYWxzLmNvbnZlcnRlci5fZGlzcGF0Y2goJ2l0YWxpY3NBbmRCb2xkLmFmdGVyJywgdGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XG4gIHJldHVybiB0ZXh0O1xufSk7XG5cbi8qKlxuICogRm9ybSBIVE1MIG9yZGVyZWQgKG51bWJlcmVkKSBhbmQgdW5vcmRlcmVkIChidWxsZXRlZCkgbGlzdHMuXG4gKi9cbnNob3dkb3duLnN1YlBhcnNlcignbGlzdHMnLCBmdW5jdGlvbiAodGV4dCwgb3B0aW9ucywgZ2xvYmFscykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdGV4dCA9IGdsb2JhbHMuY29udmVydGVyLl9kaXNwYXRjaCgnbGlzdHMuYmVmb3JlJywgdGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XG4gIC8qKlxuICAgKiBQcm9jZXNzIHRoZSBjb250ZW50cyBvZiBhIHNpbmdsZSBvcmRlcmVkIG9yIHVub3JkZXJlZCBsaXN0LCBzcGxpdHRpbmcgaXRcbiAgICogaW50byBpbmRpdmlkdWFsIGxpc3QgaXRlbXMuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBsaXN0U3RyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gdHJpbVRyYWlsaW5nXG4gICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAqL1xuICBmdW5jdGlvbiBwcm9jZXNzTGlzdEl0ZW1zIChsaXN0U3RyLCB0cmltVHJhaWxpbmcpIHtcbiAgICAvLyBUaGUgJGdfbGlzdF9sZXZlbCBnbG9iYWwga2VlcHMgdHJhY2sgb2Ygd2hlbiB3ZSdyZSBpbnNpZGUgYSBsaXN0LlxuICAgIC8vIEVhY2ggdGltZSB3ZSBlbnRlciBhIGxpc3QsIHdlIGluY3JlbWVudCBpdDsgd2hlbiB3ZSBsZWF2ZSBhIGxpc3QsXG4gICAgLy8gd2UgZGVjcmVtZW50LiBJZiBpdCdzIHplcm8sIHdlJ3JlIG5vdCBpbiBhIGxpc3QgYW55bW9yZS5cbiAgICAvL1xuICAgIC8vIFdlIGRvIHRoaXMgYmVjYXVzZSB3aGVuIHdlJ3JlIG5vdCBpbnNpZGUgYSBsaXN0LCB3ZSB3YW50IHRvIHRyZWF0XG4gICAgLy8gc29tZXRoaW5nIGxpa2UgdGhpczpcbiAgICAvL1xuICAgIC8vICAgIEkgcmVjb21tZW5kIHVwZ3JhZGluZyB0byB2ZXJzaW9uXG4gICAgLy8gICAgOC4gT29wcywgbm93IHRoaXMgbGluZSBpcyB0cmVhdGVkXG4gICAgLy8gICAgYXMgYSBzdWItbGlzdC5cbiAgICAvL1xuICAgIC8vIEFzIGEgc2luZ2xlIHBhcmFncmFwaCwgZGVzcGl0ZSB0aGUgZmFjdCB0aGF0IHRoZSBzZWNvbmQgbGluZSBzdGFydHNcbiAgICAvLyB3aXRoIGEgZGlnaXQtcGVyaW9kLXNwYWNlIHNlcXVlbmNlLlxuICAgIC8vXG4gICAgLy8gV2hlcmVhcyB3aGVuIHdlJ3JlIGluc2lkZSBhIGxpc3QgKG9yIHN1Yi1saXN0KSwgdGhhdCBsaW5lIHdpbGwgYmVcbiAgICAvLyB0cmVhdGVkIGFzIHRoZSBzdGFydCBvZiBhIHN1Yi1saXN0LiBXaGF0IGEga2x1ZGdlLCBodWg/IFRoaXMgaXNcbiAgICAvLyBhbiBhc3BlY3Qgb2YgTWFya2Rvd24ncyBzeW50YXggdGhhdCdzIGhhcmQgdG8gcGFyc2UgcGVyZmVjdGx5XG4gICAgLy8gd2l0aG91dCByZXNvcnRpbmcgdG8gbWluZC1yZWFkaW5nLiBQZXJoYXBzIHRoZSBzb2x1dGlvbiBpcyB0b1xuICAgIC8vIGNoYW5nZSB0aGUgc3ludGF4IHJ1bGVzIHN1Y2ggdGhhdCBzdWItbGlzdHMgbXVzdCBzdGFydCB3aXRoIGFcbiAgICAvLyBzdGFydGluZyBjYXJkaW5hbCBudW1iZXI7IGUuZy4gXCIxLlwiIG9yIFwiYS5cIi5cbiAgICBnbG9iYWxzLmdMaXN0TGV2ZWwrKztcblxuICAgIC8vIHRyaW0gdHJhaWxpbmcgYmxhbmsgbGluZXM6XG4gICAgbGlzdFN0ciA9IGxpc3RTdHIucmVwbGFjZSgvXFxuezIsfSQvLCAnXFxuJyk7XG5cbiAgICAvLyBhdHRhY2tsYWI6IGFkZCBzZW50aW5lbCB0byBlbXVsYXRlIFxcelxuICAgIGxpc3RTdHIgKz0gJ34wJztcblxuICAgIHZhciByZ3ggPSAvKFxcbik/KF5bIFxcdF0qKShbKistXXxcXGQrWy5dKVsgXFx0XSsoKFxcWyh4fFh8ICk/XSk/WyBcXHRdKlteXFxyXSs/KFxcbnsxLDJ9KSkoPz1cXG4qKH4wfFxcMihbKistXXxcXGQrWy5dKVsgXFx0XSspKS9nbSxcbiAgICAgICAgaXNQYXJhZ3JhcGhlZCA9ICgvXFxuWyBcXHRdKlxcbig/IX4wKS8udGVzdChsaXN0U3RyKSk7XG5cbiAgICBsaXN0U3RyID0gbGlzdFN0ci5yZXBsYWNlKHJneCwgZnVuY3Rpb24gKHdob2xlTWF0Y2gsIG0xLCBtMiwgbTMsIG00LCB0YXNrYnRuLCBjaGVja2VkKSB7XG4gICAgICBjaGVja2VkID0gKGNoZWNrZWQgJiYgY2hlY2tlZC50cmltKCkgIT09ICcnKTtcbiAgICAgIHZhciBpdGVtID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdvdXRkZW50JykobTQsIG9wdGlvbnMsIGdsb2JhbHMpLFxuICAgICAgICAgIGJ1bGxldFN0eWxlID0gJyc7XG5cbiAgICAgIC8vIFN1cHBvcnQgZm9yIGdpdGh1YiB0YXNrbGlzdHNcbiAgICAgIGlmICh0YXNrYnRuICYmIG9wdGlvbnMudGFza2xpc3RzKSB7XG4gICAgICAgIGJ1bGxldFN0eWxlID0gJyBjbGFzcz1cInRhc2stbGlzdC1pdGVtXCIgc3R5bGU9XCJsaXN0LXN0eWxlLXR5cGU6IG5vbmU7XCInO1xuICAgICAgICBpdGVtID0gaXRlbS5yZXBsYWNlKC9eWyBcXHRdKlxcWyh4fFh8ICk/XS9tLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIG90cCA9ICc8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgZGlzYWJsZWQgc3R5bGU9XCJtYXJnaW46IDBweCAwLjM1ZW0gMC4yNWVtIC0xLjZlbTsgdmVydGljYWwtYWxpZ246IG1pZGRsZTtcIic7XG4gICAgICAgICAgaWYgKGNoZWNrZWQpIHtcbiAgICAgICAgICAgIG90cCArPSAnIGNoZWNrZWQnO1xuICAgICAgICAgIH1cbiAgICAgICAgICBvdHAgKz0gJz4nO1xuICAgICAgICAgIHJldHVybiBvdHA7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgLy8gbTEgLSBMZWFkaW5nIGxpbmUgb3JcbiAgICAgIC8vIEhhcyBhIGRvdWJsZSByZXR1cm4gKG11bHRpIHBhcmFncmFwaCkgb3JcbiAgICAgIC8vIEhhcyBzdWJsaXN0XG4gICAgICBpZiAobTEgfHwgKGl0ZW0uc2VhcmNoKC9cXG57Mix9LykgPiAtMSkpIHtcbiAgICAgICAgaXRlbSA9IHNob3dkb3duLnN1YlBhcnNlcignZ2l0aHViQ29kZUJsb2NrcycpKGl0ZW0sIG9wdGlvbnMsIGdsb2JhbHMpO1xuICAgICAgICBpdGVtID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdibG9ja0dhbXV0JykoaXRlbSwgb3B0aW9ucywgZ2xvYmFscyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBSZWN1cnNpb24gZm9yIHN1Yi1saXN0czpcbiAgICAgICAgaXRlbSA9IHNob3dkb3duLnN1YlBhcnNlcignbGlzdHMnKShpdGVtLCBvcHRpb25zLCBnbG9iYWxzKTtcbiAgICAgICAgaXRlbSA9IGl0ZW0ucmVwbGFjZSgvXFxuJC8sICcnKTsgLy8gY2hvbXAoaXRlbSlcbiAgICAgICAgaWYgKGlzUGFyYWdyYXBoZWQpIHtcbiAgICAgICAgICBpdGVtID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdwYXJhZ3JhcGhzJykoaXRlbSwgb3B0aW9ucywgZ2xvYmFscyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaXRlbSA9IHNob3dkb3duLnN1YlBhcnNlcignc3BhbkdhbXV0JykoaXRlbSwgb3B0aW9ucywgZ2xvYmFscyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGl0ZW0gPSAgJ1xcbjxsaScgKyBidWxsZXRTdHlsZSArICc+JyArIGl0ZW0gKyAnPC9saT5cXG4nO1xuICAgICAgcmV0dXJuIGl0ZW07XG4gICAgfSk7XG5cbiAgICAvLyBhdHRhY2tsYWI6IHN0cmlwIHNlbnRpbmVsXG4gICAgbGlzdFN0ciA9IGxpc3RTdHIucmVwbGFjZSgvfjAvZywgJycpO1xuXG4gICAgZ2xvYmFscy5nTGlzdExldmVsLS07XG5cbiAgICBpZiAodHJpbVRyYWlsaW5nKSB7XG4gICAgICBsaXN0U3RyID0gbGlzdFN0ci5yZXBsYWNlKC9cXHMrJC8sICcnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbGlzdFN0cjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBhbmQgcGFyc2UgY29uc2VjdXRpdmUgbGlzdHMgKGJldHRlciBmaXggZm9yIGlzc3VlICMxNDIpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBsaXN0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBsaXN0VHlwZVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHRyaW1UcmFpbGluZ1xuICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgKi9cbiAgZnVuY3Rpb24gcGFyc2VDb25zZWN1dGl2ZUxpc3RzKGxpc3QsIGxpc3RUeXBlLCB0cmltVHJhaWxpbmcpIHtcbiAgICAvLyBjaGVjayBpZiB3ZSBjYXVnaHQgMiBvciBtb3JlIGNvbnNlY3V0aXZlIGxpc3RzIGJ5IG1pc3Rha2VcbiAgICAvLyB3ZSB1c2UgdGhlIGNvdW50ZXJSZ3gsIG1lYW5pbmcgaWYgbGlzdFR5cGUgaXMgVUwgd2UgbG9vayBmb3IgVUwgYW5kIHZpY2UgdmVyc2FcbiAgICB2YXIgY291bnRlclJ4ZyA9IChsaXN0VHlwZSA9PT0gJ3VsJykgPyAvXiB7MCwyfVxcZCtcXC5bIFxcdF0vZ20gOiAvXiB7MCwyfVsqKy1dWyBcXHRdL2dtLFxuICAgICAgc3ViTGlzdHMgPSBbXSxcbiAgICAgIHJlc3VsdCA9ICcnO1xuXG4gICAgaWYgKGxpc3Quc2VhcmNoKGNvdW50ZXJSeGcpICE9PSAtMSkge1xuICAgICAgKGZ1bmN0aW9uIHBhcnNlQ0wodHh0KSB7XG4gICAgICAgIHZhciBwb3MgPSB0eHQuc2VhcmNoKGNvdW50ZXJSeGcpO1xuICAgICAgICBpZiAocG9zICE9PSAtMSkge1xuICAgICAgICAgIC8vIHNsaWNlXG4gICAgICAgICAgcmVzdWx0ICs9ICdcXG5cXG48JyArIGxpc3RUeXBlICsgJz4nICsgcHJvY2Vzc0xpc3RJdGVtcyh0eHQuc2xpY2UoMCwgcG9zKSwgISF0cmltVHJhaWxpbmcpICsgJzwvJyArIGxpc3RUeXBlICsgJz5cXG5cXG4nO1xuXG4gICAgICAgICAgLy8gaW52ZXJ0IGNvdW50ZXJUeXBlIGFuZCBsaXN0VHlwZVxuICAgICAgICAgIGxpc3RUeXBlID0gKGxpc3RUeXBlID09PSAndWwnKSA/ICdvbCcgOiAndWwnO1xuICAgICAgICAgIGNvdW50ZXJSeGcgPSAobGlzdFR5cGUgPT09ICd1bCcpID8gL14gezAsMn1cXGQrXFwuWyBcXHRdL2dtIDogL14gezAsMn1bKistXVsgXFx0XS9nbTtcblxuICAgICAgICAgIC8vcmVjdXJzZVxuICAgICAgICAgIHBhcnNlQ0wodHh0LnNsaWNlKHBvcykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdCArPSAnXFxuXFxuPCcgKyBsaXN0VHlwZSArICc+JyArIHByb2Nlc3NMaXN0SXRlbXModHh0LCAhIXRyaW1UcmFpbGluZykgKyAnPC8nICsgbGlzdFR5cGUgKyAnPlxcblxcbic7XG4gICAgICAgIH1cbiAgICAgIH0pKGxpc3QpO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdWJMaXN0cy5sZW5ndGg7ICsraSkge1xuXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCA9ICdcXG5cXG48JyArIGxpc3RUeXBlICsgJz4nICsgcHJvY2Vzc0xpc3RJdGVtcyhsaXN0LCAhIXRyaW1UcmFpbGluZykgKyAnPC8nICsgbGlzdFR5cGUgKyAnPlxcblxcbic7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8vIGF0dGFja2xhYjogYWRkIHNlbnRpbmVsIHRvIGhhY2sgYXJvdW5kIGtodG1sL3NhZmFyaSBidWc6XG4gIC8vIGh0dHA6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTExMjMxXG4gIHRleHQgKz0gJ34wJztcblxuICAvLyBSZS11c2FibGUgcGF0dGVybiB0byBtYXRjaCBhbnkgZW50aXJlIHVsIG9yIG9sIGxpc3Q6XG4gIHZhciB3aG9sZUxpc3QgPSAvXigoWyBdezAsM30oWyorLV18XFxkK1suXSlbIFxcdF0rKVteXFxyXSs/KH4wfFxcbnsyLH0oPz1cXFMpKD8hWyBcXHRdKig/OlsqKy1dfFxcZCtbLl0pWyBcXHRdKykpKS9nbTtcblxuICBpZiAoZ2xvYmFscy5nTGlzdExldmVsKSB7XG4gICAgdGV4dCA9IHRleHQucmVwbGFjZSh3aG9sZUxpc3QsIGZ1bmN0aW9uICh3aG9sZU1hdGNoLCBsaXN0LCBtMikge1xuICAgICAgdmFyIGxpc3RUeXBlID0gKG0yLnNlYXJjaCgvWyorLV0vZykgPiAtMSkgPyAndWwnIDogJ29sJztcbiAgICAgIHJldHVybiBwYXJzZUNvbnNlY3V0aXZlTGlzdHMobGlzdCwgbGlzdFR5cGUsIHRydWUpO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHdob2xlTGlzdCA9IC8oXFxuXFxufF5cXG4/KSgoWyBdezAsM30oWyorLV18XFxkK1suXSlbIFxcdF0rKVteXFxyXSs/KH4wfFxcbnsyLH0oPz1cXFMpKD8hWyBcXHRdKig/OlsqKy1dfFxcZCtbLl0pWyBcXHRdKykpKS9nbTtcbiAgICAvL3dob2xlTGlzdCA9IC8oXFxuXFxufF5cXG4/KSggezAsM30oWyorLV18XFxkK1xcLilbIFxcdF0rW1xcc1xcU10rPykoPz0ofjApfChcXG5cXG4oPyFcXHR8IHsyLH18IHswLDN9KFsqKy1dfFxcZCtcXC4pWyBcXHRdKSkpL2c7XG4gICAgdGV4dCA9IHRleHQucmVwbGFjZSh3aG9sZUxpc3QsIGZ1bmN0aW9uICh3aG9sZU1hdGNoLCBtMSwgbGlzdCwgbTMpIHtcblxuICAgICAgdmFyIGxpc3RUeXBlID0gKG0zLnNlYXJjaCgvWyorLV0vZykgPiAtMSkgPyAndWwnIDogJ29sJztcbiAgICAgIHJldHVybiBwYXJzZUNvbnNlY3V0aXZlTGlzdHMobGlzdCwgbGlzdFR5cGUpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gYXR0YWNrbGFiOiBzdHJpcCBzZW50aW5lbFxuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+MC8sICcnKTtcblxuICB0ZXh0ID0gZ2xvYmFscy5jb252ZXJ0ZXIuX2Rpc3BhdGNoKCdsaXN0cy5hZnRlcicsIHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xuICByZXR1cm4gdGV4dDtcbn0pO1xuXG4vKipcbiAqIFJlbW92ZSBvbmUgbGV2ZWwgb2YgbGluZS1sZWFkaW5nIHRhYnMgb3Igc3BhY2VzXG4gKi9cbnNob3dkb3duLnN1YlBhcnNlcignb3V0ZGVudCcsIGZ1bmN0aW9uICh0ZXh0KSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBhdHRhY2tsYWI6IGhhY2sgYXJvdW5kIEtvbnF1ZXJvciAzLjUuNCBidWc6XG4gIC8vIFwiLS0tLS0tLS0tLWJ1Z1wiLnJlcGxhY2UoL14tL2csXCJcIikgPT0gXCJidWdcIlxuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eKFxcdHxbIF17MSw0fSkvZ20sICd+MCcpOyAvLyBhdHRhY2tsYWI6IGdfdGFiX3dpZHRoXG5cbiAgLy8gYXR0YWNrbGFiOiBjbGVhbiB1cCBoYWNrXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoL34wL2csICcnKTtcblxuICByZXR1cm4gdGV4dDtcbn0pO1xuXG4vKipcbiAqXG4gKi9cbnNob3dkb3duLnN1YlBhcnNlcigncGFyYWdyYXBocycsIGZ1bmN0aW9uICh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICB0ZXh0ID0gZ2xvYmFscy5jb252ZXJ0ZXIuX2Rpc3BhdGNoKCdwYXJhZ3JhcGhzLmJlZm9yZScsIHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xuICAvLyBTdHJpcCBsZWFkaW5nIGFuZCB0cmFpbGluZyBsaW5lczpcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvXlxcbisvZywgJycpO1xuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXG4rJC9nLCAnJyk7XG5cbiAgdmFyIGdyYWZzID0gdGV4dC5zcGxpdCgvXFxuezIsfS9nKSxcbiAgICAgIGdyYWZzT3V0ID0gW10sXG4gICAgICBlbmQgPSBncmFmcy5sZW5ndGg7IC8vIFdyYXAgPHA+IHRhZ3NcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgdmFyIHN0ciA9IGdyYWZzW2ldO1xuICAgIC8vIGlmIHRoaXMgaXMgYW4gSFRNTCBtYXJrZXIsIGNvcHkgaXRcbiAgICBpZiAoc3RyLnNlYXJjaCgvfihLfEcpKFxcZCspXFwxL2cpID49IDApIHtcbiAgICAgIGdyYWZzT3V0LnB1c2goc3RyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdzcGFuR2FtdXQnKShzdHIsIG9wdGlvbnMsIGdsb2JhbHMpO1xuICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL14oWyBcXHRdKikvZywgJzxwPicpO1xuICAgICAgc3RyICs9ICc8L3A+JztcbiAgICAgIGdyYWZzT3V0LnB1c2goc3RyKTtcbiAgICB9XG4gIH1cblxuICAvKiogVW5oYXNoaWZ5IEhUTUwgYmxvY2tzICovXG4gIGVuZCA9IGdyYWZzT3V0Lmxlbmd0aDtcbiAgZm9yIChpID0gMDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgdmFyIGJsb2NrVGV4dCA9ICcnLFxuICAgICAgICBncmFmc091dEl0ID0gZ3JhZnNPdXRbaV0sXG4gICAgICAgIGNvZGVGbGFnID0gZmFsc2U7XG4gICAgLy8gaWYgdGhpcyBpcyBhIG1hcmtlciBmb3IgYW4gaHRtbCBibG9jay4uLlxuICAgIHdoaWxlIChncmFmc091dEl0LnNlYXJjaCgvfihLfEcpKFxcZCspXFwxLykgPj0gMCkge1xuICAgICAgdmFyIGRlbGltID0gUmVnRXhwLiQxLFxuICAgICAgICAgIG51bSAgID0gUmVnRXhwLiQyO1xuXG4gICAgICBpZiAoZGVsaW0gPT09ICdLJykge1xuICAgICAgICBibG9ja1RleHQgPSBnbG9iYWxzLmdIdG1sQmxvY2tzW251bV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyB3ZSBuZWVkIHRvIGNoZWNrIGlmIGdoQmxvY2sgaXMgYSBmYWxzZSBwb3NpdGl2ZVxuICAgICAgICBpZiAoY29kZUZsYWcpIHtcbiAgICAgICAgICAvLyB1c2UgZW5jb2RlZCB2ZXJzaW9uIG9mIGFsbCB0ZXh0XG4gICAgICAgICAgYmxvY2tUZXh0ID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdlbmNvZGVDb2RlJykoZ2xvYmFscy5naENvZGVCbG9ja3NbbnVtXS50ZXh0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBibG9ja1RleHQgPSBnbG9iYWxzLmdoQ29kZUJsb2Nrc1tudW1dLmNvZGVibG9jaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYmxvY2tUZXh0ID0gYmxvY2tUZXh0LnJlcGxhY2UoL1xcJC9nLCAnJCQkJCcpOyAvLyBFc2NhcGUgYW55IGRvbGxhciBzaWduc1xuXG4gICAgICBncmFmc091dEl0ID0gZ3JhZnNPdXRJdC5yZXBsYWNlKC8oXFxuXFxuKT9+KEt8RylcXGQrXFwyKFxcblxcbik/LywgYmxvY2tUZXh0KTtcbiAgICAgIC8vIENoZWNrIGlmIGdyYWZzT3V0SXQgaXMgYSBwcmUtPmNvZGVcbiAgICAgIGlmICgvXjxwcmVcXGJbXj5dKj5cXHMqPGNvZGVcXGJbXj5dKj4vLnRlc3QoZ3JhZnNPdXRJdCkpIHtcbiAgICAgICAgY29kZUZsYWcgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICBncmFmc091dFtpXSA9IGdyYWZzT3V0SXQ7XG4gIH1cbiAgdGV4dCA9IGdyYWZzT3V0LmpvaW4oJ1xcblxcbicpO1xuICAvLyBTdHJpcCBsZWFkaW5nIGFuZCB0cmFpbGluZyBsaW5lczpcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvXlxcbisvZywgJycpO1xuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXG4rJC9nLCAnJyk7XG4gIHJldHVybiBnbG9iYWxzLmNvbnZlcnRlci5fZGlzcGF0Y2goJ3BhcmFncmFwaHMuYWZ0ZXInLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcbn0pO1xuXG4vKipcbiAqIFJ1biBleHRlbnNpb25cbiAqL1xuc2hvd2Rvd24uc3ViUGFyc2VyKCdydW5FeHRlbnNpb24nLCBmdW5jdGlvbiAoZXh0LCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBpZiAoZXh0LmZpbHRlcikge1xuICAgIHRleHQgPSBleHQuZmlsdGVyKHRleHQsIGdsb2JhbHMuY29udmVydGVyLCBvcHRpb25zKTtcblxuICB9IGVsc2UgaWYgKGV4dC5yZWdleCkge1xuICAgIC8vIFRPRE8gcmVtb3ZlIHRoaXMgd2hlbiBvbGQgZXh0ZW5zaW9uIGxvYWRpbmcgbWVjaGFuaXNtIGlzIGRlcHJlY2F0ZWRcbiAgICB2YXIgcmUgPSBleHQucmVnZXg7XG4gICAgaWYgKCFyZSBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgcmUgPSBuZXcgUmVnRXhwKHJlLCAnZycpO1xuICAgIH1cbiAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKHJlLCBleHQucmVwbGFjZSk7XG4gIH1cblxuICByZXR1cm4gdGV4dDtcbn0pO1xuXG4vKipcbiAqIFRoZXNlIGFyZSBhbGwgdGhlIHRyYW5zZm9ybWF0aW9ucyB0aGF0IG9jY3VyICp3aXRoaW4qIGJsb2NrLWxldmVsXG4gKiB0YWdzIGxpa2UgcGFyYWdyYXBocywgaGVhZGVycywgYW5kIGxpc3QgaXRlbXMuXG4gKi9cbnNob3dkb3duLnN1YlBhcnNlcignc3BhbkdhbXV0JywgZnVuY3Rpb24gKHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHRleHQgPSBnbG9iYWxzLmNvbnZlcnRlci5fZGlzcGF0Y2goJ3NwYW5HYW11dC5iZWZvcmUnLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcbiAgdGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcignY29kZVNwYW5zJykodGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XG4gIHRleHQgPSBzaG93ZG93bi5zdWJQYXJzZXIoJ2VzY2FwZVNwZWNpYWxDaGFyc1dpdGhpblRhZ0F0dHJpYnV0ZXMnKSh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcbiAgdGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcignZW5jb2RlQmFja3NsYXNoRXNjYXBlcycpKHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xuXG4gIC8vIFByb2Nlc3MgYW5jaG9yIGFuZCBpbWFnZSB0YWdzLiBJbWFnZXMgbXVzdCBjb21lIGZpcnN0LFxuICAvLyBiZWNhdXNlICFbZm9vXVtmXSBsb29rcyBsaWtlIGFuIGFuY2hvci5cbiAgdGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcignaW1hZ2VzJykodGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XG4gIHRleHQgPSBzaG93ZG93bi5zdWJQYXJzZXIoJ2FuY2hvcnMnKSh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcblxuICAvLyBNYWtlIGxpbmtzIG91dCBvZiB0aGluZ3MgbGlrZSBgPGh0dHA6Ly9leGFtcGxlLmNvbS8+YFxuICAvLyBNdXN0IGNvbWUgYWZ0ZXIgX0RvQW5jaG9ycygpLCBiZWNhdXNlIHlvdSBjYW4gdXNlIDwgYW5kID5cbiAgLy8gZGVsaW1pdGVycyBpbiBpbmxpbmUgbGlua3MgbGlrZSBbdGhpc10oPHVybD4pLlxuICB0ZXh0ID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdhdXRvTGlua3MnKSh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcbiAgdGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcignZW5jb2RlQW1wc0FuZEFuZ2xlcycpKHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xuICB0ZXh0ID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdpdGFsaWNzQW5kQm9sZCcpKHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xuICB0ZXh0ID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdzdHJpa2V0aHJvdWdoJykodGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XG5cbiAgLy8gRG8gaGFyZCBicmVha3M6XG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoLyAgK1xcbi9nLCAnIDxiciAvPlxcbicpO1xuXG4gIHRleHQgPSBnbG9iYWxzLmNvbnZlcnRlci5fZGlzcGF0Y2goJ3NwYW5HYW11dC5hZnRlcicsIHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xuICByZXR1cm4gdGV4dDtcbn0pO1xuXG5zaG93ZG93bi5zdWJQYXJzZXIoJ3N0cmlrZXRocm91Z2gnLCBmdW5jdGlvbiAodGV4dCwgb3B0aW9ucywgZ2xvYmFscykge1xuICAndXNlIHN0cmljdCc7XG5cbiAgaWYgKG9wdGlvbnMuc3RyaWtldGhyb3VnaCkge1xuICAgIHRleHQgPSBnbG9iYWxzLmNvbnZlcnRlci5fZGlzcGF0Y2goJ3N0cmlrZXRocm91Z2guYmVmb3JlJywgdGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XG4gICAgdGV4dCA9IHRleHQucmVwbGFjZSgvKD86flQpezJ9KFtcXHNcXFNdKz8pKD86flQpezJ9L2csICc8ZGVsPiQxPC9kZWw+Jyk7XG4gICAgdGV4dCA9IGdsb2JhbHMuY29udmVydGVyLl9kaXNwYXRjaCgnc3RyaWtldGhyb3VnaC5hZnRlcicsIHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xuICB9XG5cbiAgcmV0dXJuIHRleHQ7XG59KTtcblxuLyoqXG4gKiBTdHJpcCBhbnkgbGluZXMgY29uc2lzdGluZyBvbmx5IG9mIHNwYWNlcyBhbmQgdGFicy5cbiAqIFRoaXMgbWFrZXMgc3Vic2VxdWVudCByZWdleHMgZWFzaWVyIHRvIHdyaXRlLCBiZWNhdXNlIHdlIGNhblxuICogbWF0Y2ggY29uc2VjdXRpdmUgYmxhbmsgbGluZXMgd2l0aCAvXFxuKy8gaW5zdGVhZCBvZiBzb21ldGhpbmdcbiAqIGNvbnRvcnRlZCBsaWtlIC9bIFxcdF0qXFxuKy9cbiAqL1xuc2hvd2Rvd24uc3ViUGFyc2VyKCdzdHJpcEJsYW5rTGluZXMnLCBmdW5jdGlvbiAodGV4dCkge1xuICAndXNlIHN0cmljdCc7XG4gIHJldHVybiB0ZXh0LnJlcGxhY2UoL15bIFxcdF0rJC9tZywgJycpO1xufSk7XG5cbi8qKlxuICogU3RyaXBzIGxpbmsgZGVmaW5pdGlvbnMgZnJvbSB0ZXh0LCBzdG9yZXMgdGhlIFVSTHMgYW5kIHRpdGxlcyBpblxuICogaGFzaCByZWZlcmVuY2VzLlxuICogTGluayBkZWZzIGFyZSBpbiB0aGUgZm9ybTogXltpZF06IHVybCBcIm9wdGlvbmFsIHRpdGxlXCJcbiAqXG4gKiBeWyBdezAsM31cXFsoLispXFxdOiAvLyBpZCA9ICQxICBhdHRhY2tsYWI6IGdfdGFiX3dpZHRoIC0gMVxuICogWyBcXHRdKlxuICogXFxuPyAgICAgICAgICAgICAgICAgIC8vIG1heWJlICpvbmUqIG5ld2xpbmVcbiAqIFsgXFx0XSpcbiAqIDw/KFxcUys/KT4/ICAgICAgICAgIC8vIHVybCA9ICQyXG4gKiBbIFxcdF0qXG4gKiBcXG4/ICAgICAgICAgICAgICAgIC8vIG1heWJlIG9uZSBuZXdsaW5lXG4gKiBbIFxcdF0qXG4gKiAoPzpcbiAqIChcXG4qKSAgICAgICAgICAgICAgLy8gYW55IGxpbmVzIHNraXBwZWQgPSAkMyBhdHRhY2tsYWI6IGxvb2tiZWhpbmQgcmVtb3ZlZFxuICogW1wiKF1cbiAqICguKz8pICAgICAgICAgICAgICAvLyB0aXRsZSA9ICQ0XG4gKiBbXCIpXVxuICogWyBcXHRdKlxuICogKT8gICAgICAgICAgICAgICAgIC8vIHRpdGxlIGlzIG9wdGlvbmFsXG4gKiAoPzpcXG4rfCQpXG4gKiAvZ20sXG4gKiBmdW5jdGlvbigpey4uLn0pO1xuICpcbiAqL1xuc2hvd2Rvd24uc3ViUGFyc2VyKCdzdHJpcExpbmtEZWZpbml0aW9ucycsIGZ1bmN0aW9uICh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgcmVnZXggPSAvXiB7MCwzfVxcWyguKyldOlsgXFx0XSpcXG4/WyBcXHRdKjw/KFxcUys/KT4/KD86ID0oWypcXGRdK1tBLVphLXolXXswLDR9KXgoWypcXGRdK1tBLVphLXolXXswLDR9KSk/WyBcXHRdKlxcbj9bIFxcdF0qKD86KFxcbiopW1wifCcoXSguKz8pW1wifCcpXVsgXFx0XSopPyg/Olxcbit8KD89fjApKS9nbTtcblxuICAvLyBhdHRhY2tsYWI6IHNlbnRpbmVsIHdvcmthcm91bmRzIGZvciBsYWNrIG9mIFxcQSBhbmQgXFxaLCBzYWZhcmlcXGtodG1sIGJ1Z1xuICB0ZXh0ICs9ICd+MCc7XG5cbiAgdGV4dCA9IHRleHQucmVwbGFjZShyZWdleCwgZnVuY3Rpb24gKHdob2xlTWF0Y2gsIGxpbmtJZCwgdXJsLCB3aWR0aCwgaGVpZ2h0LCBibGFua0xpbmVzLCB0aXRsZSkge1xuICAgIGxpbmtJZCA9IGxpbmtJZC50b0xvd2VyQ2FzZSgpO1xuICAgIGdsb2JhbHMuZ1VybHNbbGlua0lkXSA9IHNob3dkb3duLnN1YlBhcnNlcignZW5jb2RlQW1wc0FuZEFuZ2xlcycpKHVybCk7ICAvLyBMaW5rIElEcyBhcmUgY2FzZS1pbnNlbnNpdGl2ZVxuXG4gICAgaWYgKGJsYW5rTGluZXMpIHtcbiAgICAgIC8vIE9vcHMsIGZvdW5kIGJsYW5rIGxpbmVzLCBzbyBpdCdzIG5vdCBhIHRpdGxlLlxuICAgICAgLy8gUHV0IGJhY2sgdGhlIHBhcmVudGhldGljYWwgc3RhdGVtZW50IHdlIHN0b2xlLlxuICAgICAgcmV0dXJuIGJsYW5rTGluZXMgKyB0aXRsZTtcblxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGl0bGUpIHtcbiAgICAgICAgZ2xvYmFscy5nVGl0bGVzW2xpbmtJZF0gPSB0aXRsZS5yZXBsYWNlKC9cInwnL2csICcmcXVvdDsnKTtcbiAgICAgIH1cbiAgICAgIGlmIChvcHRpb25zLnBhcnNlSW1nRGltZW5zaW9ucyAmJiB3aWR0aCAmJiBoZWlnaHQpIHtcbiAgICAgICAgZ2xvYmFscy5nRGltZW5zaW9uc1tsaW5rSWRdID0ge1xuICAgICAgICAgIHdpZHRoOiAgd2lkdGgsXG4gICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gQ29tcGxldGVseSByZW1vdmUgdGhlIGRlZmluaXRpb24gZnJvbSB0aGUgdGV4dFxuICAgIHJldHVybiAnJztcbiAgfSk7XG5cbiAgLy8gYXR0YWNrbGFiOiBzdHJpcCBzZW50aW5lbFxuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+MC8sICcnKTtcblxuICByZXR1cm4gdGV4dDtcbn0pO1xuXG5zaG93ZG93bi5zdWJQYXJzZXIoJ3RhYmxlcycsIGZ1bmN0aW9uICh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBpZiAoIW9wdGlvbnMudGFibGVzKSB7XG4gICAgcmV0dXJuIHRleHQ7XG4gIH1cblxuICB2YXIgdGFibGVSZ3ggPSAvXlsgXFx0XXswLDN9XFx8Py4rXFx8LitcXG5bIFxcdF17MCwzfVxcfD9bIFxcdF0qOj9bIFxcdF0qKD86LXw9KXsyLH1bIFxcdF0qOj9bIFxcdF0qXFx8WyBcXHRdKjo/WyBcXHRdKig/Oi18PSl7Mix9W1xcc1xcU10rPyg/Olxcblxcbnx+MCkvZ207XG5cbiAgZnVuY3Rpb24gcGFyc2VTdHlsZXMoc0xpbmUpIHtcbiAgICBpZiAoL146WyBcXHRdKi0tKiQvLnRlc3Qoc0xpbmUpKSB7XG4gICAgICByZXR1cm4gJyBzdHlsZT1cInRleHQtYWxpZ246bGVmdDtcIic7XG4gICAgfSBlbHNlIGlmICgvXi0tKlsgXFx0XSo6WyBcXHRdKiQvLnRlc3Qoc0xpbmUpKSB7XG4gICAgICByZXR1cm4gJyBzdHlsZT1cInRleHQtYWxpZ246cmlnaHQ7XCInO1xuICAgIH0gZWxzZSBpZiAoL146WyBcXHRdKi0tKlsgXFx0XSo6JC8udGVzdChzTGluZSkpIHtcbiAgICAgIHJldHVybiAnIHN0eWxlPVwidGV4dC1hbGlnbjpjZW50ZXI7XCInO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2VIZWFkZXJzKGhlYWRlciwgc3R5bGUpIHtcbiAgICB2YXIgaWQgPSAnJztcbiAgICBoZWFkZXIgPSBoZWFkZXIudHJpbSgpO1xuICAgIGlmIChvcHRpb25zLnRhYmxlSGVhZGVySWQpIHtcbiAgICAgIGlkID0gJyBpZD1cIicgKyBoZWFkZXIucmVwbGFjZSgvIC9nLCAnXycpLnRvTG93ZXJDYXNlKCkgKyAnXCInO1xuICAgIH1cbiAgICBoZWFkZXIgPSBzaG93ZG93bi5zdWJQYXJzZXIoJ3NwYW5HYW11dCcpKGhlYWRlciwgb3B0aW9ucywgZ2xvYmFscyk7XG5cbiAgICByZXR1cm4gJzx0aCcgKyBpZCArIHN0eWxlICsgJz4nICsgaGVhZGVyICsgJzwvdGg+XFxuJztcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlQ2VsbHMoY2VsbCwgc3R5bGUpIHtcbiAgICB2YXIgc3ViVGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcignc3BhbkdhbXV0JykoY2VsbCwgb3B0aW9ucywgZ2xvYmFscyk7XG4gICAgcmV0dXJuICc8dGQnICsgc3R5bGUgKyAnPicgKyBzdWJUZXh0ICsgJzwvdGQ+XFxuJztcbiAgfVxuXG4gIGZ1bmN0aW9uIGJ1aWxkVGFibGUoaGVhZGVycywgY2VsbHMpIHtcbiAgICB2YXIgdGIgPSAnPHRhYmxlPlxcbjx0aGVhZD5cXG48dHI+XFxuJyxcbiAgICAgICAgdGJsTGduID0gaGVhZGVycy5sZW5ndGg7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRibExnbjsgKytpKSB7XG4gICAgICB0YiArPSBoZWFkZXJzW2ldO1xuICAgIH1cbiAgICB0YiArPSAnPC90cj5cXG48L3RoZWFkPlxcbjx0Ym9keT5cXG4nO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGNlbGxzLmxlbmd0aDsgKytpKSB7XG4gICAgICB0YiArPSAnPHRyPlxcbic7XG4gICAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgdGJsTGduOyArK2lpKSB7XG4gICAgICAgIHRiICs9IGNlbGxzW2ldW2lpXTtcbiAgICAgIH1cbiAgICAgIHRiICs9ICc8L3RyPlxcbic7XG4gICAgfVxuICAgIHRiICs9ICc8L3Rib2R5PlxcbjwvdGFibGU+XFxuJztcbiAgICByZXR1cm4gdGI7XG4gIH1cblxuICB0ZXh0ID0gZ2xvYmFscy5jb252ZXJ0ZXIuX2Rpc3BhdGNoKCd0YWJsZXMuYmVmb3JlJywgdGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XG5cbiAgdGV4dCA9IHRleHQucmVwbGFjZSh0YWJsZVJneCwgZnVuY3Rpb24gKHJhd1RhYmxlKSB7XG5cbiAgICB2YXIgaSwgdGFibGVMaW5lcyA9IHJhd1RhYmxlLnNwbGl0KCdcXG4nKTtcblxuICAgIC8vIHN0cmlwIHdyb25nIGZpcnN0IGFuZCBsYXN0IGNvbHVtbiBpZiB3cmFwcGVkIHRhYmxlcyBhcmUgdXNlZFxuICAgIGZvciAoaSA9IDA7IGkgPCB0YWJsZUxpbmVzLmxlbmd0aDsgKytpKSB7XG4gICAgICBpZiAoL15bIFxcdF17MCwzfVxcfC8udGVzdCh0YWJsZUxpbmVzW2ldKSkge1xuICAgICAgICB0YWJsZUxpbmVzW2ldID0gdGFibGVMaW5lc1tpXS5yZXBsYWNlKC9eWyBcXHRdezAsM31cXHwvLCAnJyk7XG4gICAgICB9XG4gICAgICBpZiAoL1xcfFsgXFx0XSokLy50ZXN0KHRhYmxlTGluZXNbaV0pKSB7XG4gICAgICAgIHRhYmxlTGluZXNbaV0gPSB0YWJsZUxpbmVzW2ldLnJlcGxhY2UoL1xcfFsgXFx0XSokLywgJycpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciByYXdIZWFkZXJzID0gdGFibGVMaW5lc1swXS5zcGxpdCgnfCcpLm1hcChmdW5jdGlvbiAocykgeyByZXR1cm4gcy50cmltKCk7fSksXG4gICAgICAgIHJhd1N0eWxlcyA9IHRhYmxlTGluZXNbMV0uc3BsaXQoJ3wnKS5tYXAoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMudHJpbSgpO30pLFxuICAgICAgICByYXdDZWxscyA9IFtdLFxuICAgICAgICBoZWFkZXJzID0gW10sXG4gICAgICAgIHN0eWxlcyA9IFtdLFxuICAgICAgICBjZWxscyA9IFtdO1xuXG4gICAgdGFibGVMaW5lcy5zaGlmdCgpO1xuICAgIHRhYmxlTGluZXMuc2hpZnQoKTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCB0YWJsZUxpbmVzLmxlbmd0aDsgKytpKSB7XG4gICAgICBpZiAodGFibGVMaW5lc1tpXS50cmltKCkgPT09ICcnKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgcmF3Q2VsbHMucHVzaChcbiAgICAgICAgdGFibGVMaW5lc1tpXVxuICAgICAgICAgIC5zcGxpdCgnfCcpXG4gICAgICAgICAgLm1hcChmdW5jdGlvbiAocykge1xuICAgICAgICAgICAgcmV0dXJuIHMudHJpbSgpO1xuICAgICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmIChyYXdIZWFkZXJzLmxlbmd0aCA8IHJhd1N0eWxlcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiByYXdUYWJsZTtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgcmF3U3R5bGVzLmxlbmd0aDsgKytpKSB7XG4gICAgICBzdHlsZXMucHVzaChwYXJzZVN0eWxlcyhyYXdTdHlsZXNbaV0pKTtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgcmF3SGVhZGVycy5sZW5ndGg7ICsraSkge1xuICAgICAgaWYgKHNob3dkb3duLmhlbHBlci5pc1VuZGVmaW5lZChzdHlsZXNbaV0pKSB7XG4gICAgICAgIHN0eWxlc1tpXSA9ICcnO1xuICAgICAgfVxuICAgICAgaGVhZGVycy5wdXNoKHBhcnNlSGVhZGVycyhyYXdIZWFkZXJzW2ldLCBzdHlsZXNbaV0pKTtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgcmF3Q2VsbHMubGVuZ3RoOyArK2kpIHtcbiAgICAgIHZhciByb3cgPSBbXTtcbiAgICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCBoZWFkZXJzLmxlbmd0aDsgKytpaSkge1xuICAgICAgICBpZiAoc2hvd2Rvd24uaGVscGVyLmlzVW5kZWZpbmVkKHJhd0NlbGxzW2ldW2lpXSkpIHtcblxuICAgICAgICB9XG4gICAgICAgIHJvdy5wdXNoKHBhcnNlQ2VsbHMocmF3Q2VsbHNbaV1baWldLCBzdHlsZXNbaWldKSk7XG4gICAgICB9XG4gICAgICBjZWxscy5wdXNoKHJvdyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1aWxkVGFibGUoaGVhZGVycywgY2VsbHMpO1xuICB9KTtcblxuICB0ZXh0ID0gZ2xvYmFscy5jb252ZXJ0ZXIuX2Rpc3BhdGNoKCd0YWJsZXMuYWZ0ZXInLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcblxuICByZXR1cm4gdGV4dDtcbn0pO1xuXG4vKipcbiAqIFN3YXAgYmFjayBpbiBhbGwgdGhlIHNwZWNpYWwgY2hhcmFjdGVycyB3ZSd2ZSBoaWRkZW4uXG4gKi9cbnNob3dkb3duLnN1YlBhcnNlcigndW5lc2NhcGVTcGVjaWFsQ2hhcnMnLCBmdW5jdGlvbiAodGV4dCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvfkUoXFxkKylFL2csIGZ1bmN0aW9uICh3aG9sZU1hdGNoLCBtMSkge1xuICAgIHZhciBjaGFyQ29kZVRvUmVwbGFjZSA9IHBhcnNlSW50KG0xKTtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShjaGFyQ29kZVRvUmVwbGFjZSk7XG4gIH0pO1xuICByZXR1cm4gdGV4dDtcbn0pO1xubW9kdWxlLmV4cG9ydHMgPSBzaG93ZG93bjtcbiJdfQ==