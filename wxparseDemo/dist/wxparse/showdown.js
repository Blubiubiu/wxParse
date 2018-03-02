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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNob3dkb3duLmpzIl0sIm5hbWVzIjpbImdldERlZmF1bHRPcHRzIiwic2ltcGxlIiwiZGVmYXVsdE9wdGlvbnMiLCJvbWl0RXh0cmFXTEluQ29kZUJsb2NrcyIsImRlZmF1bHRWYWx1ZSIsImRlc2NyaWJlIiwidHlwZSIsIm5vSGVhZGVySWQiLCJwcmVmaXhIZWFkZXJJZCIsImhlYWRlckxldmVsU3RhcnQiLCJwYXJzZUltZ0RpbWVuc2lvbnMiLCJzaW1wbGlmaWVkQXV0b0xpbmsiLCJsaXRlcmFsTWlkV29yZFVuZGVyc2NvcmVzIiwic3RyaWtldGhyb3VnaCIsInRhYmxlcyIsInRhYmxlc0hlYWRlcklkIiwiZ2hDb2RlQmxvY2tzIiwidGFza2xpc3RzIiwic21vb3RoTGl2ZVByZXZpZXciLCJzbWFydEluZGVudGF0aW9uRml4IiwiZGVzY3JpcHRpb24iLCJKU09OIiwicGFyc2UiLCJzdHJpbmdpZnkiLCJyZXQiLCJvcHQiLCJoYXNPd25Qcm9wZXJ0eSIsInNob3dkb3duIiwicGFyc2VycyIsImV4dGVuc2lvbnMiLCJnbG9iYWxPcHRpb25zIiwiZmxhdm9yIiwiZ2l0aHViIiwidmFuaWxsYSIsImhlbHBlciIsInNldE9wdGlvbiIsImtleSIsInZhbHVlIiwiZ2V0T3B0aW9uIiwiZ2V0T3B0aW9ucyIsInJlc2V0T3B0aW9ucyIsInNldEZsYXZvciIsIm5hbWUiLCJwcmVzZXQiLCJvcHRpb24iLCJnZXREZWZhdWx0T3B0aW9ucyIsInN1YlBhcnNlciIsImZ1bmMiLCJpc1N0cmluZyIsIkVycm9yIiwiZXh0ZW5zaW9uIiwiZXh0Iiwic3RkRXh0TmFtZSIsImlzVW5kZWZpbmVkIiwiaXNBcnJheSIsInZhbGlkRXh0ZW5zaW9uIiwidmFsaWRhdGUiLCJ2YWxpZCIsImVycm9yIiwiZ2V0QWxsRXh0ZW5zaW9ucyIsInJlbW92ZUV4dGVuc2lvbiIsInJlc2V0RXh0ZW5zaW9ucyIsImVyck1zZyIsImkiLCJsZW5ndGgiLCJiYXNlTXNnIiwidG9Mb3dlckNhc2UiLCJsaXN0ZW5lcnMiLCJmaWx0ZXIiLCJyZWdleCIsImxuIiwiUmVnRXhwIiwicmVwbGFjZSIsInZhbGlkYXRlRXh0ZW5zaW9uIiwiY29uc29sZSIsIndhcm4iLCJhIiwiU3RyaW5nIiwiaXNGdW5jdGlvbiIsImdldFR5cGUiLCJ0b1N0cmluZyIsImNhbGwiLCJmb3JFYWNoIiwib2JqIiwiY2FsbGJhY2siLCJjb25zdHJ1Y3RvciIsIkFycmF5IiwicyIsImVzY2FwZUNoYXJhY3RlcnNDYWxsYmFjayIsIndob2xlTWF0Y2giLCJtMSIsImNoYXJDb2RlVG9Fc2NhcGUiLCJjaGFyQ29kZUF0IiwiZXNjYXBlQ2hhcmFjdGVycyIsInRleHQiLCJjaGFyc1RvRXNjYXBlIiwiYWZ0ZXJCYWNrc2xhc2giLCJyZWdleFN0cmluZyIsInJneEZpbmRNYXRjaFBvcyIsInN0ciIsImxlZnQiLCJyaWdodCIsImZsYWdzIiwiZiIsImciLCJpbmRleE9mIiwieCIsImwiLCJwb3MiLCJ0IiwibSIsInN0YXJ0IiwiZW5kIiwiZXhlYyIsInRlc3QiLCJsYXN0SW5kZXgiLCJpbmRleCIsIm1hdGNoIiwicHVzaCIsIm1hdGNoUmVjdXJzaXZlUmVnRXhwIiwibWF0Y2hQb3MiLCJyZXN1bHRzIiwic2xpY2UiLCJyZXBsYWNlUmVjdXJzaXZlUmVnRXhwIiwicmVwbGFjZW1lbnQiLCJyZXBTdHIiLCJmaW5hbFN0ciIsImxuZyIsImJpdHMiLCJqb2luIiwibXNnIiwiYWxlcnQiLCJsb2ciLCJDb252ZXJ0ZXIiLCJjb252ZXJ0ZXJPcHRpb25zIiwib3B0aW9ucyIsImxhbmdFeHRlbnNpb25zIiwib3V0cHV0TW9kaWZpZXJzIiwiX2NvbnN0cnVjdG9yIiwiZ09wdCIsIl9wYXJzZUV4dGVuc2lvbiIsImxlZ2FjeUV4dGVuc2lvbkxvYWRpbmciLCJ2YWxpZEV4dCIsImxpc3RlbiIsInJUcmltSW5wdXRUZXh0IiwicnNwIiwicmd4IiwiX2Rpc3BhdGNoIiwiZGlzcGF0Y2giLCJldnROYW1lIiwiZ2xvYmFscyIsImVpIiwiblRleHQiLCJtYWtlSHRtbCIsImdIdG1sQmxvY2tzIiwiZ0h0bWxNZEJsb2NrcyIsImdIdG1sU3BhbnMiLCJnVXJscyIsImdUaXRsZXMiLCJnRGltZW5zaW9ucyIsImdMaXN0TGV2ZWwiLCJoYXNoTGlua0NvdW50cyIsImNvbnZlcnRlciIsImFkZEV4dGVuc2lvbiIsInVzZUV4dGVuc2lvbiIsImV4dGVuc2lvbk5hbWUiLCJzcGxpY2UiLCJpaSIsImxhbmd1YWdlIiwib3V0cHV0Iiwid3JpdGVBbmNob3JUYWciLCJtMiIsIm0zIiwibTQiLCJtNSIsIm02IiwibTciLCJsaW5rVGV4dCIsImxpbmtJZCIsInVybCIsInRpdGxlIiwic2VhcmNoIiwicmVzdWx0Iiwic2ltcGxlVVJMUmVnZXgiLCJkZWxpbVVybFJlZ2V4Iiwic2ltcGxlTWFpbFJlZ2V4IiwiZGVsaW1NYWlsUmVnZXgiLCJyZXBsYWNlTGluayIsInJlcGxhY2VNYWlsIiwid20iLCJsaW5rIiwibG5rVHh0IiwidW5lc2NhcGVkU3RyIiwiYnEiLCJwcmUiLCJwYXR0ZXJuIiwiY29kZWJsb2NrIiwibmV4dENoYXIiLCJjIiwibGVhZGluZ1RleHQiLCJudW1TcGFjZXMiLCJhZGRyIiwiZW5jb2RlIiwiY2giLCJNYXRoIiwiZmxvb3IiLCJyYW5kb20iLCJyIiwidGFnIiwiYmxvY2tUZXh0IiwiYmxvY2tUYWdzIiwicmVwRnVuYyIsInR4dCIsImNvbmZpZyIsIm1hdGNoZXMiLCJwcmVmaXhIZWFkZXIiLCJpc05hTiIsInBhcnNlSW50Iiwic2V0ZXh0UmVnZXhIMSIsInNldGV4dFJlZ2V4SDIiLCJzcGFuR2FtdXQiLCJoSUQiLCJoZWFkZXJJZCIsImhMZXZlbCIsImhhc2hCbG9jayIsIm1hdGNoRm91bmQiLCJzcGFuIiwiaGVhZGVyIiwiZXNjYXBlZElkIiwiaW5saW5lUmVnRXhwIiwicmVmZXJlbmNlUmVnRXhwIiwid3JpdGVJbWFnZVRhZyIsImFsdFRleHQiLCJ3aWR0aCIsImhlaWdodCIsImdEaW1zIiwicHJvY2Vzc0xpc3RJdGVtcyIsImxpc3RTdHIiLCJ0cmltVHJhaWxpbmciLCJpc1BhcmFncmFwaGVkIiwidGFza2J0biIsImNoZWNrZWQiLCJ0cmltIiwiaXRlbSIsImJ1bGxldFN0eWxlIiwib3RwIiwicGFyc2VDb25zZWN1dGl2ZUxpc3RzIiwibGlzdCIsImxpc3RUeXBlIiwiY291bnRlclJ4ZyIsInN1Ykxpc3RzIiwicGFyc2VDTCIsIndob2xlTGlzdCIsImdyYWZzIiwic3BsaXQiLCJncmFmc091dCIsImdyYWZzT3V0SXQiLCJjb2RlRmxhZyIsImRlbGltIiwiJDEiLCJudW0iLCIkMiIsInJlIiwiYmxhbmtMaW5lcyIsInRhYmxlUmd4IiwicGFyc2VTdHlsZXMiLCJzTGluZSIsInBhcnNlSGVhZGVycyIsInN0eWxlIiwiaWQiLCJ0YWJsZUhlYWRlcklkIiwicGFyc2VDZWxscyIsImNlbGwiLCJzdWJUZXh0IiwiYnVpbGRUYWJsZSIsImhlYWRlcnMiLCJjZWxscyIsInRiIiwidGJsTGduIiwicmF3VGFibGUiLCJ0YWJsZUxpbmVzIiwicmF3SGVhZGVycyIsIm1hcCIsInJhd1N0eWxlcyIsInJhd0NlbGxzIiwic3R5bGVzIiwic2hpZnQiLCJyb3ciLCJjaGFyQ29kZVRvUmVwbGFjZSIsImZyb21DaGFyQ29kZSIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7QUFjQSxTQUFTQSxjQUFULENBQXdCQyxNQUF4QixFQUFnQztBQUM5Qjs7QUFFQSxNQUFJQyxpQkFBaUI7QUFDbkJDLDZCQUF5QjtBQUN2QkMsb0JBQWMsS0FEUztBQUV2QkMsZ0JBQVUsdURBRmE7QUFHdkJDLFlBQU07QUFIaUIsS0FETjtBQU1uQkMsZ0JBQVk7QUFDVkgsb0JBQWMsS0FESjtBQUVWQyxnQkFBVSxpQ0FGQTtBQUdWQyxZQUFNO0FBSEksS0FOTztBQVduQkUsb0JBQWdCO0FBQ2RKLG9CQUFjLEtBREE7QUFFZEMsZ0JBQVUsMENBRkk7QUFHZEMsWUFBTTtBQUhRLEtBWEc7QUFnQm5CRyxzQkFBa0I7QUFDaEJMLG9CQUFjLEtBREU7QUFFaEJDLGdC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QU9vTixZQUFQLENBQW9CRCxpQkFBcEIsQ0FBUDtBQUNELEdBSE0sQ0FBUDtBQUlBLFNBQU9sTSxJQUFQO0FBQ0QsQ0FSRDtBQVNBb00sT0FBT0MsT0FBUCxHQUFpQnhRLFFBQWpCIiwiZmlsZSI6InNob3dkb3duLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIFxyXG4gKiBzaG93ZG93bjogaHR0cHM6Ly9naXRodWIuY29tL3Nob3dkb3duanMvc2hvd2Rvd25cclxuICogXHJcbiAqIGF1dGhvcjogRGkgKOW+ruS/oeWwj+eoi+W6j+W8gOWPkeW3peeoi+W4iClcclxuICogb3JnYW5pemF0aW9uOiBXZUFwcERldijlvq7kv6HlsI/nqIvluo/lvIDlj5HorrrlnZspKGh0dHA6Ly93ZWFwcGRldi5jb20pXHJcbiAqICAgICAgICAgICAgICAg5Z6C55u05b6u5L+h5bCP56iL5bqP5byA5Y+R5Lqk5rWB56S+5Yy6XHJcbiAqIFxyXG4gKiBnaXRodWLlnLDlnYA6IGh0dHBzOi8vZ2l0aHViLmNvbS9pY2luZHkvd3hQYXJzZVxyXG4gKiBcclxuICogZm9yOiDlvq7kv6HlsI/nqIvluo/lr4zmlofmnKzop6PmnpBcclxuICogZGV0YWlsIDogaHR0cDovL3dlYXBwZGV2LmNvbS90L3d4cGFyc2UtYWxwaGEwLTEtaHRtbC1tYXJrZG93bi8xODRcclxuICovXHJcblxyXG5mdW5jdGlvbiBnZXREZWZhdWx0T3B0cyhzaW1wbGUpIHtcclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIHZhciBkZWZhdWx0T3B0aW9ucyA9IHtcclxuICAgIG9taXRFeHRyYVdMSW5Db2RlQmxvY2tzOiB7XHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXHJcbiAgICAgIGRlc2NyaWJlOiAnT21pdCB0aGUgZGVmYXVsdCBleHRyYSB3aGl0ZWxpbmUgYWRkZWQgdG8gY29kZSBibG9ja3MnLFxyXG4gICAgICB0eXBlOiAnYm9vbGVhbidcclxuICAgIH0sXHJcbiAgICBub0hlYWRlcklkOiB7XHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXHJcbiAgICAgIGRlc2NyaWJlOiAnVHVybiBvbi9vZmYgZ2VuZXJhdGVkIGhlYWRlciBpZCcsXHJcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xyXG4gICAgfSxcclxuICAgIHByZWZpeEhlYWRlcklkOiB7XHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXHJcbiAgICAgIGRlc2NyaWJlOiAnU3BlY2lmeSBhIHByZWZpeCB0byBnZW5lcmF0ZWQgaGVhZGVyIGlkcycsXHJcbiAgICAgIHR5cGU6ICdzdHJpbmcnXHJcbiAgICB9LFxyXG4gICAgaGVhZGVyTGV2ZWxTdGFydDoge1xyXG4gICAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxyXG4gICAgICBkZXNjcmliZTogJ1RoZSBoZWFkZXIgYmxvY2tzIGxldmVsIHN0YXJ0JyxcclxuICAgICAgdHlwZTogJ2ludGVnZXInXHJcbiAgICB9LFxyXG4gICAgcGFyc2VJbWdEaW1lbnNpb25zOiB7XHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXHJcbiAgICAgIGRlc2NyaWJlOiAnVHVybiBvbi9vZmYgaW1hZ2UgZGltZW5zaW9uIHBhcnNpbmcnLFxyXG4gICAgICB0eXBlOiAnYm9vbGVhbidcclxuICAgIH0sXHJcbiAgICBzaW1wbGlmaWVkQXV0b0xpbms6IHtcclxuICAgICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcclxuICAgICAgZGVzY3JpYmU6ICdUdXJuIG9uL29mZiBHRk0gYXV0b2xpbmsgc3R5bGUnLFxyXG4gICAgICB0eXBlOiAnYm9vbGVhbidcclxuICAgIH0sXHJcbiAgICBsaXRlcmFsTWlkV29yZFVuZGVyc2NvcmVzOiB7XHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXHJcbiAgICAgIGRlc2NyaWJlOiAnUGFyc2UgbWlkd29yZCB1bmRlcnNjb3JlcyBhcyBsaXRlcmFsIHVuZGVyc2NvcmVzJyxcclxuICAgICAgdHlwZTogJ2Jvb2xlYW4nXHJcbiAgICB9LFxyXG4gICAgc3RyaWtldGhyb3VnaDoge1xyXG4gICAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxyXG4gICAgICBkZXNjcmliZTogJ1R1cm4gb24vb2ZmIHN0cmlrZXRocm91Z2ggc3VwcG9ydCcsXHJcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xyXG4gICAgfSxcclxuICAgIHRhYmxlczoge1xyXG4gICAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxyXG4gICAgICBkZXNjcmliZTogJ1R1cm4gb24vb2ZmIHRhYmxlcyBzdXBwb3J0JyxcclxuICAgICAgdHlwZTogJ2Jvb2xlYW4nXHJcbiAgICB9LFxyXG4gICAgdGFibGVzSGVhZGVySWQ6IHtcclxuICAgICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcclxuICAgICAgZGVzY3JpYmU6ICdBZGQgYW4gaWQgdG8gdGFibGUgaGVhZGVycycsXHJcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xyXG4gICAgfSxcclxuICAgIGdoQ29kZUJsb2Nrczoge1xyXG4gICAgICBkZWZhdWx0VmFsdWU6IHRydWUsXHJcbiAgICAgIGRlc2NyaWJlOiAnVHVybiBvbi9vZmYgR0ZNIGZlbmNlZCBjb2RlIGJsb2NrcyBzdXBwb3J0JyxcclxuICAgICAgdHlwZTogJ2Jvb2xlYW4nXHJcbiAgICB9LFxyXG4gICAgdGFza2xpc3RzOiB7XHJcbiAgICAgIGRlZmF1bHRWYWx1ZTogZmFsc2UsXHJcbiAgICAgIGRlc2NyaWJlOiAnVHVybiBvbi9vZmYgR0ZNIHRhc2tsaXN0IHN1cHBvcnQnLFxyXG4gICAgICB0eXBlOiAnYm9vbGVhbidcclxuICAgIH0sXHJcbiAgICBzbW9vdGhMaXZlUHJldmlldzoge1xyXG4gICAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxyXG4gICAgICBkZXNjcmliZTogJ1ByZXZlbnRzIHdlaXJkIGVmZmVjdHMgaW4gbGl2ZSBwcmV2aWV3cyBkdWUgdG8gaW5jb21wbGV0ZSBpbnB1dCcsXHJcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xyXG4gICAgfSxcclxuICAgIHNtYXJ0SW5kZW50YXRpb25GaXg6IHtcclxuICAgICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcclxuICAgICAgZGVzY3JpcHRpb246ICdUcmllcyB0byBzbWFydGx5IGZpeCBpZGVudGF0aW9uIGluIGVzNiBzdHJpbmdzJyxcclxuICAgICAgdHlwZTogJ2Jvb2xlYW4nXHJcbiAgICB9XHJcbiAgfTtcclxuICBpZiAoc2ltcGxlID09PSBmYWxzZSkge1xyXG4gICAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZGVmYXVsdE9wdGlvbnMpKTtcclxuICB9XHJcbiAgdmFyIHJldCA9IHt9O1xyXG4gIGZvciAodmFyIG9wdCBpbiBkZWZhdWx0T3B0aW9ucykge1xyXG4gICAgaWYgKGRlZmF1bHRPcHRpb25zLmhhc093blByb3BlcnR5KG9wdCkpIHtcclxuICAgICAgcmV0W29wdF0gPSBkZWZhdWx0T3B0aW9uc1tvcHRdLmRlZmF1bHRWYWx1ZTtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIHJldDtcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZWQgYnkgVGl2aWUgb24gMDYtMDEtMjAxNS5cclxuICovXHJcblxyXG4vLyBQcml2YXRlIHByb3BlcnRpZXNcclxudmFyIHNob3dkb3duID0ge30sXHJcbiAgICBwYXJzZXJzID0ge30sXHJcbiAgICBleHRlbnNpb25zID0ge30sXHJcbiAgICBnbG9iYWxPcHRpb25zID0gZ2V0RGVmYXVsdE9wdHModHJ1ZSksXHJcbiAgICBmbGF2b3IgPSB7XHJcbiAgICAgIGdpdGh1Yjoge1xyXG4gICAgICAgIG9taXRFeHRyYVdMSW5Db2RlQmxvY2tzOiAgIHRydWUsXHJcbiAgICAgICAgcHJlZml4SGVhZGVySWQ6ICAgICAgICAgICAgJ3VzZXItY29udGVudC0nLFxyXG4gICAgICAgIHNpbXBsaWZpZWRBdXRvTGluazogICAgICAgIHRydWUsXHJcbiAgICAgICAgbGl0ZXJhbE1pZFdvcmRVbmRlcnNjb3JlczogdHJ1ZSxcclxuICAgICAgICBzdHJpa2V0aHJvdWdoOiAgICAgICAgICAgICB0cnVlLFxyXG4gICAgICAgIHRhYmxlczogICAgICAgICAgICAgICAgICAgIHRydWUsXHJcbiAgICAgICAgdGFibGVzSGVhZGVySWQ6ICAgICAgICAgICAgdHJ1ZSxcclxuICAgICAgICBnaENvZGVCbG9ja3M6ICAgICAgICAgICAgICB0cnVlLFxyXG4gICAgICAgIHRhc2tsaXN0czogICAgICAgICAgICAgICAgIHRydWVcclxuICAgICAgfSxcclxuICAgICAgdmFuaWxsYTogZ2V0RGVmYXVsdE9wdHModHJ1ZSlcclxuICAgIH07XHJcblxyXG4vKipcclxuICogaGVscGVyIG5hbWVzcGFjZVxyXG4gKiBAdHlwZSB7e319XHJcbiAqL1xyXG5zaG93ZG93bi5oZWxwZXIgPSB7fTtcclxuXHJcbi8qKlxyXG4gKiBUT0RPIExFR0FDWSBTVVBQT1JUIENPREVcclxuICogQHR5cGUge3t9fVxyXG4gKi9cclxuc2hvd2Rvd24uZXh0ZW5zaW9ucyA9IHt9O1xyXG5cclxuLyoqXHJcbiAqIFNldCBhIGdsb2JhbCBvcHRpb25cclxuICogQHN0YXRpY1xyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5XHJcbiAqIEBwYXJhbSB7Kn0gdmFsdWVcclxuICogQHJldHVybnMge3Nob3dkb3dufVxyXG4gKi9cclxuc2hvd2Rvd24uc2V0T3B0aW9uID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcclxuICAndXNlIHN0cmljdCc7XHJcbiAgZ2xvYmFsT3B0aW9uc1trZXldID0gdmFsdWU7XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IGEgZ2xvYmFsIG9wdGlvblxyXG4gKiBAc3RhdGljXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcclxuICogQHJldHVybnMgeyp9XHJcbiAqL1xyXG5zaG93ZG93bi5nZXRPcHRpb24gPSBmdW5jdGlvbiAoa2V5KSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG4gIHJldHVybiBnbG9iYWxPcHRpb25zW2tleV07XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IHRoZSBnbG9iYWwgb3B0aW9uc1xyXG4gKiBAc3RhdGljXHJcbiAqIEByZXR1cm5zIHt7fX1cclxuICovXHJcbnNob3dkb3duLmdldE9wdGlvbnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG4gIHJldHVybiBnbG9iYWxPcHRpb25zO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlc2V0IGdsb2JhbCBvcHRpb25zIHRvIHRoZSBkZWZhdWx0IHZhbHVlc1xyXG4gKiBAc3RhdGljXHJcbiAqL1xyXG5zaG93ZG93bi5yZXNldE9wdGlvbnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG4gIGdsb2JhbE9wdGlvbnMgPSBnZXREZWZhdWx0T3B0cyh0cnVlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXQgdGhlIGZsYXZvciBzaG93ZG93biBzaG91bGQgdXNlIGFzIGRlZmF1bHRcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICovXHJcbnNob3dkb3duLnNldEZsYXZvciA9IGZ1bmN0aW9uIChuYW1lKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG4gIGlmIChmbGF2b3IuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcclxuICAgIHZhciBwcmVzZXQgPSBmbGF2b3JbbmFtZV07XHJcbiAgICBmb3IgKHZhciBvcHRpb24gaW4gcHJlc2V0KSB7XHJcbiAgICAgIGlmIChwcmVzZXQuaGFzT3duUHJvcGVydHkob3B0aW9uKSkge1xyXG4gICAgICAgIGdsb2JhbE9wdGlvbnNbb3B0aW9uXSA9IHByZXNldFtvcHRpb25dO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldCB0aGUgZGVmYXVsdCBvcHRpb25zXHJcbiAqIEBzdGF0aWNcclxuICogQHBhcmFtIHtib29sZWFufSBbc2ltcGxlPXRydWVdXHJcbiAqIEByZXR1cm5zIHt7fX1cclxuICovXHJcbnNob3dkb3duLmdldERlZmF1bHRPcHRpb25zID0gZnVuY3Rpb24gKHNpbXBsZSkge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuICByZXR1cm4gZ2V0RGVmYXVsdE9wdHMoc2ltcGxlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgb3Igc2V0IGEgc3ViUGFyc2VyXHJcbiAqXHJcbiAqIHN1YlBhcnNlcihuYW1lKSAgICAgICAtIEdldCBhIHJlZ2lzdGVyZWQgc3ViUGFyc2VyXHJcbiAqIHN1YlBhcnNlcihuYW1lLCBmdW5jKSAtIFJlZ2lzdGVyIGEgc3ViUGFyc2VyXHJcbiAqIEBzdGF0aWNcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHBhcmFtIHtmdW5jdGlvbn0gW2Z1bmNdXHJcbiAqIEByZXR1cm5zIHsqfVxyXG4gKi9cclxuc2hvd2Rvd24uc3ViUGFyc2VyID0gZnVuY3Rpb24gKG5hbWUsIGZ1bmMpIHtcclxuICAndXNlIHN0cmljdCc7XHJcbiAgaWYgKHNob3dkb3duLmhlbHBlci5pc1N0cmluZyhuYW1lKSkge1xyXG4gICAgaWYgKHR5cGVvZiBmdW5jICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICBwYXJzZXJzW25hbWVdID0gZnVuYztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmIChwYXJzZXJzLmhhc093blByb3BlcnR5KG5hbWUpKSB7XHJcbiAgICAgICAgcmV0dXJuIHBhcnNlcnNbbmFtZV07XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgRXJyb3IoJ1N1YlBhcnNlciBuYW1lZCAnICsgbmFtZSArICcgbm90IHJlZ2lzdGVyZWQhJyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0cyBvciByZWdpc3RlcnMgYW4gZXh0ZW5zaW9uXHJcbiAqIEBzdGF0aWNcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHBhcmFtIHtvYmplY3R8ZnVuY3Rpb249fSBleHRcclxuICogQHJldHVybnMgeyp9XHJcbiAqL1xyXG5zaG93ZG93bi5leHRlbnNpb24gPSBmdW5jdGlvbiAobmFtZSwgZXh0KSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICBpZiAoIXNob3dkb3duLmhlbHBlci5pc1N0cmluZyhuYW1lKSkge1xyXG4gICAgdGhyb3cgRXJyb3IoJ0V4dGVuc2lvbiBcXCduYW1lXFwnIG11c3QgYmUgYSBzdHJpbmcnKTtcclxuICB9XHJcblxyXG4gIG5hbWUgPSBzaG93ZG93bi5oZWxwZXIuc3RkRXh0TmFtZShuYW1lKTtcclxuXHJcbiAgLy8gR2V0dGVyXHJcbiAgaWYgKHNob3dkb3duLmhlbHBlci5pc1VuZGVmaW5lZChleHQpKSB7XHJcbiAgICBpZiAoIWV4dGVuc2lvbnMuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcclxuICAgICAgdGhyb3cgRXJyb3IoJ0V4dGVuc2lvbiBuYW1lZCAnICsgbmFtZSArICcgaXMgbm90IHJlZ2lzdGVyZWQhJyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZXh0ZW5zaW9uc1tuYW1lXTtcclxuXHJcbiAgICAvLyBTZXR0ZXJcclxuICB9IGVsc2Uge1xyXG4gICAgLy8gRXhwYW5kIGV4dGVuc2lvbiBpZiBpdCdzIHdyYXBwZWQgaW4gYSBmdW5jdGlvblxyXG4gICAgaWYgKHR5cGVvZiBleHQgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgZXh0ID0gZXh0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRW5zdXJlIGV4dGVuc2lvbiBpcyBhbiBhcnJheVxyXG4gICAgaWYgKCFzaG93ZG93bi5oZWxwZXIuaXNBcnJheShleHQpKSB7XHJcbiAgICAgIGV4dCA9IFtleHRdO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB2YWxpZEV4dGVuc2lvbiA9IHZhbGlkYXRlKGV4dCwgbmFtZSk7XHJcblxyXG4gICAgaWYgKHZhbGlkRXh0ZW5zaW9uLnZhbGlkKSB7XHJcbiAgICAgIGV4dGVuc2lvbnNbbmFtZV0gPSBleHQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyBFcnJvcih2YWxpZEV4dGVuc2lvbi5lcnJvcik7XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYWxsIGV4dGVuc2lvbnMgcmVnaXN0ZXJlZFxyXG4gKiBAcmV0dXJucyB7e319XHJcbiAqL1xyXG5zaG93ZG93bi5nZXRBbGxFeHRlbnNpb25zID0gZnVuY3Rpb24gKCkge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuICByZXR1cm4gZXh0ZW5zaW9ucztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZW1vdmUgYW4gZXh0ZW5zaW9uXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqL1xyXG5zaG93ZG93bi5yZW1vdmVFeHRlbnNpb24gPSBmdW5jdGlvbiAobmFtZSkge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuICBkZWxldGUgZXh0ZW5zaW9uc1tuYW1lXTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGFsbCBleHRlbnNpb25zXHJcbiAqL1xyXG5zaG93ZG93bi5yZXNldEV4dGVuc2lvbnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG4gIGV4dGVuc2lvbnMgPSB7fTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBWYWxpZGF0ZSBleHRlbnNpb25cclxuICogQHBhcmFtIHthcnJheX0gZXh0ZW5zaW9uXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm5zIHt7dmFsaWQ6IGJvb2xlYW4sIGVycm9yOiBzdHJpbmd9fVxyXG4gKi9cclxuZnVuY3Rpb24gdmFsaWRhdGUoZXh0ZW5zaW9uLCBuYW1lKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICB2YXIgZXJyTXNnID0gKG5hbWUpID8gJ0Vycm9yIGluICcgKyBuYW1lICsgJyBleHRlbnNpb24tPicgOiAnRXJyb3IgaW4gdW5uYW1lZCBleHRlbnNpb24nLFxyXG4gICAgcmV0ID0ge1xyXG4gICAgICB2YWxpZDogdHJ1ZSxcclxuICAgICAgZXJyb3I6ICcnXHJcbiAgICB9O1xyXG5cclxuICBpZiAoIXNob3dkb3duLmhlbHBlci5pc0FycmF5KGV4dGVuc2lvbikpIHtcclxuICAgIGV4dGVuc2lvbiA9IFtleHRlbnNpb25dO1xyXG4gIH1cclxuXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBleHRlbnNpb24ubGVuZ3RoOyArK2kpIHtcclxuICAgIHZhciBiYXNlTXNnID0gZXJyTXNnICsgJyBzdWItZXh0ZW5zaW9uICcgKyBpICsgJzogJyxcclxuICAgICAgICBleHQgPSBleHRlbnNpb25baV07XHJcbiAgICBpZiAodHlwZW9mIGV4dCAhPT0gJ29iamVjdCcpIHtcclxuICAgICAgcmV0LnZhbGlkID0gZmFsc2U7XHJcbiAgICAgIHJldC5lcnJvciA9IGJhc2VNc2cgKyAnbXVzdCBiZSBhbiBvYmplY3QsIGJ1dCAnICsgdHlwZW9mIGV4dCArICcgZ2l2ZW4nO1xyXG4gICAgICByZXR1cm4gcmV0O1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghc2hvd2Rvd24uaGVscGVyLmlzU3RyaW5nKGV4dC50eXBlKSkge1xyXG4gICAgICByZXQudmFsaWQgPSBmYWxzZTtcclxuICAgICAgcmV0LmVycm9yID0gYmFzZU1zZyArICdwcm9wZXJ0eSBcInR5cGVcIiBtdXN0IGJlIGEgc3RyaW5nLCBidXQgJyArIHR5cGVvZiBleHQudHlwZSArICcgZ2l2ZW4nO1xyXG4gICAgICByZXR1cm4gcmV0O1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB0eXBlID0gZXh0LnR5cGUgPSBleHQudHlwZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgIC8vIG5vcm1hbGl6ZSBleHRlbnNpb24gdHlwZVxyXG4gICAgaWYgKHR5cGUgPT09ICdsYW5ndWFnZScpIHtcclxuICAgICAgdHlwZSA9IGV4dC50eXBlID0gJ2xhbmcnO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlID09PSAnaHRtbCcpIHtcclxuICAgICAgdHlwZSA9IGV4dC50eXBlID0gJ291dHB1dCc7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGUgIT09ICdsYW5nJyAmJiB0eXBlICE9PSAnb3V0cHV0JyAmJiB0eXBlICE9PSAnbGlzdGVuZXInKSB7XHJcbiAgICAgIHJldC52YWxpZCA9IGZhbHNlO1xyXG4gICAgICByZXQuZXJyb3IgPSBiYXNlTXNnICsgJ3R5cGUgJyArIHR5cGUgKyAnIGlzIG5vdCByZWNvZ25pemVkLiBWYWxpZCB2YWx1ZXM6IFwibGFuZy9sYW5ndWFnZVwiLCBcIm91dHB1dC9odG1sXCIgb3IgXCJsaXN0ZW5lclwiJztcclxuICAgICAgcmV0dXJuIHJldDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZSA9PT0gJ2xpc3RlbmVyJykge1xyXG4gICAgICBpZiAoc2hvd2Rvd24uaGVscGVyLmlzVW5kZWZpbmVkKGV4dC5saXN0ZW5lcnMpKSB7XHJcbiAgICAgICAgcmV0LnZhbGlkID0gZmFsc2U7XHJcbiAgICAgICAgcmV0LmVycm9yID0gYmFzZU1zZyArICcuIEV4dGVuc2lvbnMgb2YgdHlwZSBcImxpc3RlbmVyXCIgbXVzdCBoYXZlIGEgcHJvcGVydHkgY2FsbGVkIFwibGlzdGVuZXJzXCInO1xyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmIChzaG93ZG93bi5oZWxwZXIuaXNVbmRlZmluZWQoZXh0LmZpbHRlcikgJiYgc2hvd2Rvd24uaGVscGVyLmlzVW5kZWZpbmVkKGV4dC5yZWdleCkpIHtcclxuICAgICAgICByZXQudmFsaWQgPSBmYWxzZTtcclxuICAgICAgICByZXQuZXJyb3IgPSBiYXNlTXNnICsgdHlwZSArICcgZXh0ZW5zaW9ucyBtdXN0IGRlZmluZSBlaXRoZXIgYSBcInJlZ2V4XCIgcHJvcGVydHkgb3IgYSBcImZpbHRlclwiIG1ldGhvZCc7XHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChleHQubGlzdGVuZXJzKSB7XHJcbiAgICAgIGlmICh0eXBlb2YgZXh0Lmxpc3RlbmVycyAhPT0gJ29iamVjdCcpIHtcclxuICAgICAgICByZXQudmFsaWQgPSBmYWxzZTtcclxuICAgICAgICByZXQuZXJyb3IgPSBiYXNlTXNnICsgJ1wibGlzdGVuZXJzXCIgcHJvcGVydHkgbXVzdCBiZSBhbiBvYmplY3QgYnV0ICcgKyB0eXBlb2YgZXh0Lmxpc3RlbmVycyArICcgZ2l2ZW4nO1xyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICAgIH1cclxuICAgICAgZm9yICh2YXIgbG4gaW4gZXh0Lmxpc3RlbmVycykge1xyXG4gICAgICAgIGlmIChleHQubGlzdGVuZXJzLmhhc093blByb3BlcnR5KGxuKSkge1xyXG4gICAgICAgICAgaWYgKHR5cGVvZiBleHQubGlzdGVuZXJzW2xuXSAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICByZXQudmFsaWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgcmV0LmVycm9yID0gYmFzZU1zZyArICdcImxpc3RlbmVyc1wiIHByb3BlcnR5IG11c3QgYmUgYW4gaGFzaCBvZiBbZXZlbnQgbmFtZV06IFtjYWxsYmFja10uIGxpc3RlbmVycy4nICsgbG4gK1xyXG4gICAgICAgICAgICAgICcgbXVzdCBiZSBhIGZ1bmN0aW9uIGJ1dCAnICsgdHlwZW9mIGV4dC5saXN0ZW5lcnNbbG5dICsgJyBnaXZlbic7XHJcbiAgICAgICAgICAgIHJldHVybiByZXQ7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGV4dC5maWx0ZXIpIHtcclxuICAgICAgaWYgKHR5cGVvZiBleHQuZmlsdGVyICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgcmV0LnZhbGlkID0gZmFsc2U7XHJcbiAgICAgICAgcmV0LmVycm9yID0gYmFzZU1zZyArICdcImZpbHRlclwiIG11c3QgYmUgYSBmdW5jdGlvbiwgYnV0ICcgKyB0eXBlb2YgZXh0LmZpbHRlciArICcgZ2l2ZW4nO1xyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAoZXh0LnJlZ2V4KSB7XHJcbiAgICAgIGlmIChzaG93ZG93bi5oZWxwZXIuaXNTdHJpbmcoZXh0LnJlZ2V4KSkge1xyXG4gICAgICAgIGV4dC5yZWdleCA9IG5ldyBSZWdFeHAoZXh0LnJlZ2V4LCAnZycpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICghZXh0LnJlZ2V4IGluc3RhbmNlb2YgUmVnRXhwKSB7XHJcbiAgICAgICAgcmV0LnZhbGlkID0gZmFsc2U7XHJcbiAgICAgICAgcmV0LmVycm9yID0gYmFzZU1zZyArICdcInJlZ2V4XCIgcHJvcGVydHkgbXVzdCBlaXRoZXIgYmUgYSBzdHJpbmcgb3IgYSBSZWdFeHAgb2JqZWN0LCBidXQgJyArIHR5cGVvZiBleHQucmVnZXggKyAnIGdpdmVuJztcclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChzaG93ZG93bi5oZWxwZXIuaXNVbmRlZmluZWQoZXh0LnJlcGxhY2UpKSB7XHJcbiAgICAgICAgcmV0LnZhbGlkID0gZmFsc2U7XHJcbiAgICAgICAgcmV0LmVycm9yID0gYmFzZU1zZyArICdcInJlZ2V4XCIgZXh0ZW5zaW9ucyBtdXN0IGltcGxlbWVudCBhIHJlcGxhY2Ugc3RyaW5nIG9yIGZ1bmN0aW9uJztcclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiByZXQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBWYWxpZGF0ZSBleHRlbnNpb25cclxuICogQHBhcmFtIHtvYmplY3R9IGV4dFxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICovXHJcbnNob3dkb3duLnZhbGlkYXRlRXh0ZW5zaW9uID0gZnVuY3Rpb24gKGV4dCkge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgdmFyIHZhbGlkYXRlRXh0ZW5zaW9uID0gdmFsaWRhdGUoZXh0LCBudWxsKTtcclxuICBpZiAoIXZhbGlkYXRlRXh0ZW5zaW9uLnZhbGlkKSB7XHJcbiAgICBjb25zb2xlLndhcm4odmFsaWRhdGVFeHRlbnNpb24uZXJyb3IpO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuICByZXR1cm4gdHJ1ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBzaG93ZG93bmpzIGhlbHBlciBmdW5jdGlvbnNcclxuICovXHJcblxyXG5pZiAoIXNob3dkb3duLmhhc093blByb3BlcnR5KCdoZWxwZXInKSkge1xyXG4gIHNob3dkb3duLmhlbHBlciA9IHt9O1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2sgaWYgdmFyIGlzIHN0cmluZ1xyXG4gKiBAc3RhdGljXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBhXHJcbiAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gKi9cclxuc2hvd2Rvd24uaGVscGVyLmlzU3RyaW5nID0gZnVuY3Rpb24gaXNTdHJpbmcoYSkge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuICByZXR1cm4gKHR5cGVvZiBhID09PSAnc3RyaW5nJyB8fCBhIGluc3RhbmNlb2YgU3RyaW5nKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDaGVjayBpZiB2YXIgaXMgYSBmdW5jdGlvblxyXG4gKiBAc3RhdGljXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBhXHJcbiAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gKi9cclxuc2hvd2Rvd24uaGVscGVyLmlzRnVuY3Rpb24gPSBmdW5jdGlvbiBpc0Z1bmN0aW9uKGEpIHtcclxuICAndXNlIHN0cmljdCc7XHJcbiAgdmFyIGdldFR5cGUgPSB7fTtcclxuICByZXR1cm4gYSAmJiBnZXRUeXBlLnRvU3RyaW5nLmNhbGwoYSkgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XHJcbn07XHJcblxyXG4vKipcclxuICogRm9yRWFjaCBoZWxwZXIgZnVuY3Rpb25cclxuICogQHN0YXRpY1xyXG4gKiBAcGFyYW0geyp9IG9ialxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFja1xyXG4gKi9cclxuc2hvd2Rvd24uaGVscGVyLmZvckVhY2ggPSBmdW5jdGlvbiBmb3JFYWNoKG9iaiwgY2FsbGJhY2spIHtcclxuICAndXNlIHN0cmljdCc7XHJcbiAgaWYgKHR5cGVvZiBvYmouZm9yRWFjaCA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgb2JqLmZvckVhY2goY2FsbGJhY2spO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9iai5sZW5ndGg7IGkrKykge1xyXG4gICAgICBjYWxsYmFjayhvYmpbaV0sIGksIG9iaik7XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIGlzQXJyYXkgaGVscGVyIGZ1bmN0aW9uXHJcbiAqIEBzdGF0aWNcclxuICogQHBhcmFtIHsqfSBhXHJcbiAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gKi9cclxuc2hvd2Rvd24uaGVscGVyLmlzQXJyYXkgPSBmdW5jdGlvbiBpc0FycmF5KGEpIHtcclxuICAndXNlIHN0cmljdCc7XHJcbiAgcmV0dXJuIGEuY29uc3RydWN0b3IgPT09IEFycmF5O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENoZWNrIGlmIHZhbHVlIGlzIHVuZGVmaW5lZFxyXG4gKiBAc3RhdGljXHJcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBgdW5kZWZpbmVkYCwgZWxzZSBgZmFsc2VgLlxyXG4gKi9cclxuc2hvd2Rvd24uaGVscGVyLmlzVW5kZWZpbmVkID0gZnVuY3Rpb24gaXNVbmRlZmluZWQodmFsdWUpIHtcclxuICAndXNlIHN0cmljdCc7XHJcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCc7XHJcbn07XHJcblxyXG4vKipcclxuICogU3RhbmRhcmRpZGl6ZSBleHRlbnNpb24gbmFtZVxyXG4gKiBAc3RhdGljXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzIGV4dGVuc2lvbiBuYW1lXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAqL1xyXG5zaG93ZG93bi5oZWxwZXIuc3RkRXh0TmFtZSA9IGZ1bmN0aW9uIChzKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG4gIHJldHVybiBzLnJlcGxhY2UoL1tfLV18fFxccy9nLCAnJykudG9Mb3dlckNhc2UoKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIGVzY2FwZUNoYXJhY3RlcnNDYWxsYmFjayh3aG9sZU1hdGNoLCBtMSkge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuICB2YXIgY2hhckNvZGVUb0VzY2FwZSA9IG0xLmNoYXJDb2RlQXQoMCk7XHJcbiAgcmV0dXJuICd+RScgKyBjaGFyQ29kZVRvRXNjYXBlICsgJ0UnO1xyXG59XHJcblxyXG4vKipcclxuICogQ2FsbGJhY2sgdXNlZCB0byBlc2NhcGUgY2hhcmFjdGVycyB3aGVuIHBhc3NpbmcgdGhyb3VnaCBTdHJpbmcucmVwbGFjZVxyXG4gKiBAc3RhdGljXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB3aG9sZU1hdGNoXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtMVxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gKi9cclxuc2hvd2Rvd24uaGVscGVyLmVzY2FwZUNoYXJhY3RlcnNDYWxsYmFjayA9IGVzY2FwZUNoYXJhY3RlcnNDYWxsYmFjaztcclxuXHJcbi8qKlxyXG4gKiBFc2NhcGUgY2hhcmFjdGVycyBpbiBhIHN0cmluZ1xyXG4gKiBAc3RhdGljXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBjaGFyc1RvRXNjYXBlXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gYWZ0ZXJCYWNrc2xhc2hcclxuICogQHJldHVybnMge1hNTHxzdHJpbmd8dm9pZHwqfVxyXG4gKi9cclxuc2hvd2Rvd24uaGVscGVyLmVzY2FwZUNoYXJhY3RlcnMgPSBmdW5jdGlvbiBlc2NhcGVDaGFyYWN0ZXJzKHRleHQsIGNoYXJzVG9Fc2NhcGUsIGFmdGVyQmFja3NsYXNoKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG4gIC8vIEZpcnN0IHdlIGhhdmUgdG8gZXNjYXBlIHRoZSBlc2NhcGUgY2hhcmFjdGVycyBzbyB0aGF0XHJcbiAgLy8gd2UgY2FuIGJ1aWxkIGEgY2hhcmFjdGVyIGNsYXNzIG91dCBvZiB0aGVtXHJcbiAgdmFyIHJlZ2V4U3RyaW5nID0gJyhbJyArIGNoYXJzVG9Fc2NhcGUucmVwbGFjZSgvKFtcXFtcXF1cXFxcXSkvZywgJ1xcXFwkMScpICsgJ10pJztcclxuXHJcbiAgaWYgKGFmdGVyQmFja3NsYXNoKSB7XHJcbiAgICByZWdleFN0cmluZyA9ICdcXFxcXFxcXCcgKyByZWdleFN0cmluZztcclxuICB9XHJcblxyXG4gIHZhciByZWdleCA9IG5ldyBSZWdFeHAocmVnZXhTdHJpbmcsICdnJyk7XHJcbiAgdGV4dCA9IHRleHQucmVwbGFjZShyZWdleCwgZXNjYXBlQ2hhcmFjdGVyc0NhbGxiYWNrKTtcclxuXHJcbiAgcmV0dXJuIHRleHQ7XHJcbn07XHJcblxyXG52YXIgcmd4RmluZE1hdGNoUG9zID0gZnVuY3Rpb24gKHN0ciwgbGVmdCwgcmlnaHQsIGZsYWdzKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG4gIHZhciBmID0gZmxhZ3MgfHwgJycsXHJcbiAgICBnID0gZi5pbmRleE9mKCdnJykgPiAtMSxcclxuICAgIHggPSBuZXcgUmVnRXhwKGxlZnQgKyAnfCcgKyByaWdodCwgJ2cnICsgZi5yZXBsYWNlKC9nL2csICcnKSksXHJcbiAgICBsID0gbmV3IFJlZ0V4cChsZWZ0LCBmLnJlcGxhY2UoL2cvZywgJycpKSxcclxuICAgIHBvcyA9IFtdLFxyXG4gICAgdCwgcywgbSwgc3RhcnQsIGVuZDtcclxuXHJcbiAgZG8ge1xyXG4gICAgdCA9IDA7XHJcbiAgICB3aGlsZSAoKG0gPSB4LmV4ZWMoc3RyKSkpIHtcclxuICAgICAgaWYgKGwudGVzdChtWzBdKSkge1xyXG4gICAgICAgIGlmICghKHQrKykpIHtcclxuICAgICAgICAgIHMgPSB4Lmxhc3RJbmRleDtcclxuICAgICAgICAgIHN0YXJ0ID0gcyAtIG1bMF0ubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIGlmICh0KSB7XHJcbiAgICAgICAgaWYgKCEtLXQpIHtcclxuICAgICAgICAgIGVuZCA9IG0uaW5kZXggKyBtWzBdLmxlbmd0aDtcclxuICAgICAgICAgIHZhciBvYmogPSB7XHJcbiAgICAgICAgICAgIGxlZnQ6IHtzdGFydDogc3RhcnQsIGVuZDogc30sXHJcbiAgICAgICAgICAgIG1hdGNoOiB7c3RhcnQ6IHMsIGVuZDogbS5pbmRleH0sXHJcbiAgICAgICAgICAgIHJpZ2h0OiB7c3RhcnQ6IG0uaW5kZXgsIGVuZDogZW5kfSxcclxuICAgICAgICAgICAgd2hvbGVNYXRjaDoge3N0YXJ0OiBzdGFydCwgZW5kOiBlbmR9XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgcG9zLnB1c2gob2JqKTtcclxuICAgICAgICAgIGlmICghZykge1xyXG4gICAgICAgICAgICByZXR1cm4gcG9zO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0gd2hpbGUgKHQgJiYgKHgubGFzdEluZGV4ID0gcykpO1xyXG5cclxuICByZXR1cm4gcG9zO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIG1hdGNoUmVjdXJzaXZlUmVnRXhwXHJcbiAqXHJcbiAqIChjKSAyMDA3IFN0ZXZlbiBMZXZpdGhhbiA8c3RldmVubGV2aXRoYW4uY29tPlxyXG4gKiBNSVQgTGljZW5zZVxyXG4gKlxyXG4gKiBBY2NlcHRzIGEgc3RyaW5nIHRvIHNlYXJjaCwgYSBsZWZ0IGFuZCByaWdodCBmb3JtYXQgZGVsaW1pdGVyXHJcbiAqIGFzIHJlZ2V4IHBhdHRlcm5zLCBhbmQgb3B0aW9uYWwgcmVnZXggZmxhZ3MuIFJldHVybnMgYW4gYXJyYXlcclxuICogb2YgbWF0Y2hlcywgYWxsb3dpbmcgbmVzdGVkIGluc3RhbmNlcyBvZiBsZWZ0L3JpZ2h0IGRlbGltaXRlcnMuXHJcbiAqIFVzZSB0aGUgXCJnXCIgZmxhZyB0byByZXR1cm4gYWxsIG1hdGNoZXMsIG90aGVyd2lzZSBvbmx5IHRoZVxyXG4gKiBmaXJzdCBpcyByZXR1cm5lZC4gQmUgY2FyZWZ1bCB0byBlbnN1cmUgdGhhdCB0aGUgbGVmdCBhbmRcclxuICogcmlnaHQgZm9ybWF0IGRlbGltaXRlcnMgcHJvZHVjZSBtdXR1YWxseSBleGNsdXNpdmUgbWF0Y2hlcy5cclxuICogQmFja3JlZmVyZW5jZXMgYXJlIG5vdCBzdXBwb3J0ZWQgd2l0aGluIHRoZSByaWdodCBkZWxpbWl0ZXJcclxuICogZHVlIHRvIGhvdyBpdCBpcyBpbnRlcm5hbGx5IGNvbWJpbmVkIHdpdGggdGhlIGxlZnQgZGVsaW1pdGVyLlxyXG4gKiBXaGVuIG1hdGNoaW5nIHN0cmluZ3Mgd2hvc2UgZm9ybWF0IGRlbGltaXRlcnMgYXJlIHVuYmFsYW5jZWRcclxuICogdG8gdGhlIGxlZnQgb3IgcmlnaHQsIHRoZSBvdXRwdXQgaXMgaW50ZW50aW9uYWxseSBhcyBhXHJcbiAqIGNvbnZlbnRpb25hbCByZWdleCBsaWJyYXJ5IHdpdGggcmVjdXJzaW9uIHN1cHBvcnQgd291bGRcclxuICogcHJvZHVjZSwgZS5nLiBcIjw8eD5cIiBhbmQgXCI8eD4+XCIgYm90aCBwcm9kdWNlIFtcInhcIl0gd2hlbiB1c2luZ1xyXG4gKiBcIjxcIiBhbmQgXCI+XCIgYXMgdGhlIGRlbGltaXRlcnMgKGJvdGggc3RyaW5ncyBjb250YWluIGEgc2luZ2xlLFxyXG4gKiBiYWxhbmNlZCBpbnN0YW5jZSBvZiBcIjx4PlwiKS5cclxuICpcclxuICogZXhhbXBsZXM6XHJcbiAqIG1hdGNoUmVjdXJzaXZlUmVnRXhwKFwidGVzdFwiLCBcIlxcXFwoXCIsIFwiXFxcXClcIilcclxuICogcmV0dXJuczogW11cclxuICogbWF0Y2hSZWN1cnNpdmVSZWdFeHAoXCI8dDw8ZT4+PHM+PnQ8PlwiLCBcIjxcIiwgXCI+XCIsIFwiZ1wiKVxyXG4gKiByZXR1cm5zOiBbXCJ0PDxlPj48cz5cIiwgXCJcIl1cclxuICogbWF0Y2hSZWN1cnNpdmVSZWdFeHAoXCI8ZGl2IGlkPVxcXCJ4XFxcIj50ZXN0PC9kaXY+XCIsIFwiPGRpdlxcXFxiW14+XSo+XCIsIFwiPC9kaXY+XCIsIFwiZ2lcIilcclxuICogcmV0dXJuczogW1widGVzdFwiXVxyXG4gKi9cclxuc2hvd2Rvd24uaGVscGVyLm1hdGNoUmVjdXJzaXZlUmVnRXhwID0gZnVuY3Rpb24gKHN0ciwgbGVmdCwgcmlnaHQsIGZsYWdzKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICB2YXIgbWF0Y2hQb3MgPSByZ3hGaW5kTWF0Y2hQb3MgKHN0ciwgbGVmdCwgcmlnaHQsIGZsYWdzKSxcclxuICAgIHJlc3VsdHMgPSBbXTtcclxuXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBtYXRjaFBvcy5sZW5ndGg7ICsraSkge1xyXG4gICAgcmVzdWx0cy5wdXNoKFtcclxuICAgICAgc3RyLnNsaWNlKG1hdGNoUG9zW2ldLndob2xlTWF0Y2guc3RhcnQsIG1hdGNoUG9zW2ldLndob2xlTWF0Y2guZW5kKSxcclxuICAgICAgc3RyLnNsaWNlKG1hdGNoUG9zW2ldLm1hdGNoLnN0YXJ0LCBtYXRjaFBvc1tpXS5tYXRjaC5lbmQpLFxyXG4gICAgICBzdHIuc2xpY2UobWF0Y2hQb3NbaV0ubGVmdC5zdGFydCwgbWF0Y2hQb3NbaV0ubGVmdC5lbmQpLFxyXG4gICAgICBzdHIuc2xpY2UobWF0Y2hQb3NbaV0ucmlnaHQuc3RhcnQsIG1hdGNoUG9zW2ldLnJpZ2h0LmVuZClcclxuICAgIF0pO1xyXG4gIH1cclxuICByZXR1cm4gcmVzdWx0cztcclxufTtcclxuXHJcbi8qKlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyXHJcbiAqIEBwYXJhbSB7c3RyaW5nfGZ1bmN0aW9ufSByZXBsYWNlbWVudFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbGVmdFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcmlnaHRcclxuICogQHBhcmFtIHtzdHJpbmd9IGZsYWdzXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAqL1xyXG5zaG93ZG93bi5oZWxwZXIucmVwbGFjZVJlY3Vyc2l2ZVJlZ0V4cCA9IGZ1bmN0aW9uIChzdHIsIHJlcGxhY2VtZW50LCBsZWZ0LCByaWdodCwgZmxhZ3MpIHtcclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIGlmICghc2hvd2Rvd24uaGVscGVyLmlzRnVuY3Rpb24ocmVwbGFjZW1lbnQpKSB7XHJcbiAgICB2YXIgcmVwU3RyID0gcmVwbGFjZW1lbnQ7XHJcbiAgICByZXBsYWNlbWVudCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIHJlcFN0cjtcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICB2YXIgbWF0Y2hQb3MgPSByZ3hGaW5kTWF0Y2hQb3Moc3RyLCBsZWZ0LCByaWdodCwgZmxhZ3MpLFxyXG4gICAgICBmaW5hbFN0ciA9IHN0cixcclxuICAgICAgbG5nID0gbWF0Y2hQb3MubGVuZ3RoO1xyXG5cclxuICBpZiAobG5nID4gMCkge1xyXG4gICAgdmFyIGJpdHMgPSBbXTtcclxuICAgIGlmIChtYXRjaFBvc1swXS53aG9sZU1hdGNoLnN0YXJ0ICE9PSAwKSB7XHJcbiAgICAgIGJpdHMucHVzaChzdHIuc2xpY2UoMCwgbWF0Y2hQb3NbMF0ud2hvbGVNYXRjaC5zdGFydCkpO1xyXG4gICAgfVxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsbmc7ICsraSkge1xyXG4gICAgICBiaXRzLnB1c2goXHJcbiAgICAgICAgcmVwbGFjZW1lbnQoXHJcbiAgICAgICAgICBzdHIuc2xpY2UobWF0Y2hQb3NbaV0ud2hvbGVNYXRjaC5zdGFydCwgbWF0Y2hQb3NbaV0ud2hvbGVNYXRjaC5lbmQpLFxyXG4gICAgICAgICAgc3RyLnNsaWNlKG1hdGNoUG9zW2ldLm1hdGNoLnN0YXJ0LCBtYXRjaFBvc1tpXS5tYXRjaC5lbmQpLFxyXG4gICAgICAgICAgc3RyLnNsaWNlKG1hdGNoUG9zW2ldLmxlZnQuc3RhcnQsIG1hdGNoUG9zW2ldLmxlZnQuZW5kKSxcclxuICAgICAgICAgIHN0ci5zbGljZShtYXRjaFBvc1tpXS5yaWdodC5zdGFydCwgbWF0Y2hQb3NbaV0ucmlnaHQuZW5kKVxyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuICAgICAgaWYgKGkgPCBsbmcgLSAxKSB7XHJcbiAgICAgICAgYml0cy5wdXNoKHN0ci5zbGljZShtYXRjaFBvc1tpXS53aG9sZU1hdGNoLmVuZCwgbWF0Y2hQb3NbaSArIDFdLndob2xlTWF0Y2guc3RhcnQpKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKG1hdGNoUG9zW2xuZyAtIDFdLndob2xlTWF0Y2guZW5kIDwgc3RyLmxlbmd0aCkge1xyXG4gICAgICBiaXRzLnB1c2goc3RyLnNsaWNlKG1hdGNoUG9zW2xuZyAtIDFdLndob2xlTWF0Y2guZW5kKSk7XHJcbiAgICB9XHJcbiAgICBmaW5hbFN0ciA9IGJpdHMuam9pbignJyk7XHJcbiAgfVxyXG4gIHJldHVybiBmaW5hbFN0cjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBQT0xZRklMTFNcclxuICovXHJcbmlmIChzaG93ZG93bi5oZWxwZXIuaXNVbmRlZmluZWQoY29uc29sZSkpIHtcclxuICBjb25zb2xlID0ge1xyXG4gICAgd2FybjogZnVuY3Rpb24gKG1zZykge1xyXG4gICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgIGFsZXJ0KG1zZyk7XHJcbiAgICB9LFxyXG4gICAgbG9nOiBmdW5jdGlvbiAobXNnKSB7XHJcbiAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgYWxlcnQobXNnKTtcclxuICAgIH0sXHJcbiAgICBlcnJvcjogZnVuY3Rpb24gKG1zZykge1xyXG4gICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgIHRocm93IG1zZztcclxuICAgIH1cclxuICB9O1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlZCBieSBFc3RldmFvIG9uIDMxLTA1LTIwMTUuXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFNob3dkb3duIENvbnZlcnRlciBjbGFzc1xyXG4gKiBAY2xhc3NcclxuICogQHBhcmFtIHtvYmplY3R9IFtjb252ZXJ0ZXJPcHRpb25zXVxyXG4gKiBAcmV0dXJucyB7Q29udmVydGVyfVxyXG4gKi9cclxuc2hvd2Rvd24uQ29udmVydGVyID0gZnVuY3Rpb24gKGNvbnZlcnRlck9wdGlvbnMpIHtcclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIHZhclxyXG4gICAgICAvKipcclxuICAgICAgICogT3B0aW9ucyB1c2VkIGJ5IHRoaXMgY29udmVydGVyXHJcbiAgICAgICAqIEBwcml2YXRlXHJcbiAgICAgICAqIEB0eXBlIHt7fX1cclxuICAgICAgICovXHJcbiAgICAgIG9wdGlvbnMgPSB7fSxcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBMYW5ndWFnZSBleHRlbnNpb25zIHVzZWQgYnkgdGhpcyBjb252ZXJ0ZXJcclxuICAgICAgICogQHByaXZhdGVcclxuICAgICAgICogQHR5cGUge0FycmF5fVxyXG4gICAgICAgKi9cclxuICAgICAgbGFuZ0V4dGVuc2lvbnMgPSBbXSxcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBPdXRwdXQgbW9kaWZpZXJzIGV4dGVuc2lvbnMgdXNlZCBieSB0aGlzIGNvbnZlcnRlclxyXG4gICAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICAgKiBAdHlwZSB7QXJyYXl9XHJcbiAgICAgICAqL1xyXG4gICAgICBvdXRwdXRNb2RpZmllcnMgPSBbXSxcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBFdmVudCBsaXN0ZW5lcnNcclxuICAgICAgICogQHByaXZhdGVcclxuICAgICAgICogQHR5cGUge3t9fVxyXG4gICAgICAgKi9cclxuICAgICAgbGlzdGVuZXJzID0ge307XHJcblxyXG4gIF9jb25zdHJ1Y3RvcigpO1xyXG5cclxuICAvKipcclxuICAgKiBDb252ZXJ0ZXIgY29uc3RydWN0b3JcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIF9jb25zdHJ1Y3RvcigpIHtcclxuICAgIGNvbnZlcnRlck9wdGlvbnMgPSBjb252ZXJ0ZXJPcHRpb25zIHx8IHt9O1xyXG5cclxuICAgIGZvciAodmFyIGdPcHQgaW4gZ2xvYmFsT3B0aW9ucykge1xyXG4gICAgICBpZiAoZ2xvYmFsT3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShnT3B0KSkge1xyXG4gICAgICAgIG9wdGlvbnNbZ09wdF0gPSBnbG9iYWxPcHRpb25zW2dPcHRdO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTWVyZ2Ugb3B0aW9uc1xyXG4gICAgaWYgKHR5cGVvZiBjb252ZXJ0ZXJPcHRpb25zID09PSAnb2JqZWN0Jykge1xyXG4gICAgICBmb3IgKHZhciBvcHQgaW4gY29udmVydGVyT3B0aW9ucykge1xyXG4gICAgICAgIGlmIChjb252ZXJ0ZXJPcHRpb25zLmhhc093blByb3BlcnR5KG9wdCkpIHtcclxuICAgICAgICAgIG9wdGlvbnNbb3B0XSA9IGNvbnZlcnRlck9wdGlvbnNbb3B0XTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRocm93IEVycm9yKCdDb252ZXJ0ZXIgZXhwZWN0cyB0aGUgcGFzc2VkIHBhcmFtZXRlciB0byBiZSBhbiBvYmplY3QsIGJ1dCAnICsgdHlwZW9mIGNvbnZlcnRlck9wdGlvbnMgK1xyXG4gICAgICAnIHdhcyBwYXNzZWQgaW5zdGVhZC4nKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAob3B0aW9ucy5leHRlbnNpb25zKSB7XHJcbiAgICAgIHNob3dkb3duLmhlbHBlci5mb3JFYWNoKG9wdGlvbnMuZXh0ZW5zaW9ucywgX3BhcnNlRXh0ZW5zaW9uKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFBhcnNlIGV4dGVuc2lvblxyXG4gICAqIEBwYXJhbSB7Kn0gZXh0XHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtuYW1lPScnXVxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gX3BhcnNlRXh0ZW5zaW9uKGV4dCwgbmFtZSkge1xyXG5cclxuICAgIG5hbWUgPSBuYW1lIHx8IG51bGw7XHJcbiAgICAvLyBJZiBpdCdzIGEgc3RyaW5nLCB0aGUgZXh0ZW5zaW9uIHdhcyBwcmV2aW91c2x5IGxvYWRlZFxyXG4gICAgaWYgKHNob3dkb3duLmhlbHBlci5pc1N0cmluZyhleHQpKSB7XHJcbiAgICAgIGV4dCA9IHNob3dkb3duLmhlbHBlci5zdGRFeHROYW1lKGV4dCk7XHJcbiAgICAgIG5hbWUgPSBleHQ7XHJcblxyXG4gICAgICAvLyBMRUdBQ1lfU1VQUE9SVCBDT0RFXHJcbiAgICAgIGlmIChzaG93ZG93bi5leHRlbnNpb25zW2V4dF0pIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oJ0RFUFJFQ0FUSU9OIFdBUk5JTkc6ICcgKyBleHQgKyAnIGlzIGFuIG9sZCBleHRlbnNpb24gdGhhdCB1c2VzIGEgZGVwcmVjYXRlZCBsb2FkaW5nIG1ldGhvZC4nICtcclxuICAgICAgICAgICdQbGVhc2UgaW5mb3JtIHRoZSBkZXZlbG9wZXIgdGhhdCB0aGUgZXh0ZW5zaW9uIHNob3VsZCBiZSB1cGRhdGVkIScpO1xyXG4gICAgICAgIGxlZ2FjeUV4dGVuc2lvbkxvYWRpbmcoc2hvd2Rvd24uZXh0ZW5zaW9uc1tleHRdLCBleHQpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgLy8gRU5EIExFR0FDWSBTVVBQT1JUIENPREVcclxuXHJcbiAgICAgIH0gZWxzZSBpZiAoIXNob3dkb3duLmhlbHBlci5pc1VuZGVmaW5lZChleHRlbnNpb25zW2V4dF0pKSB7XHJcbiAgICAgICAgZXh0ID0gZXh0ZW5zaW9uc1tleHRdO1xyXG5cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aHJvdyBFcnJvcignRXh0ZW5zaW9uIFwiJyArIGV4dCArICdcIiBjb3VsZCBub3QgYmUgbG9hZGVkLiBJdCB3YXMgZWl0aGVyIG5vdCBmb3VuZCBvciBpcyBub3QgYSB2YWxpZCBleHRlbnNpb24uJyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIGV4dCA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICBleHQgPSBleHQoKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXNob3dkb3duLmhlbHBlci5pc0FycmF5KGV4dCkpIHtcclxuICAgICAgZXh0ID0gW2V4dF07XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHZhbGlkRXh0ID0gdmFsaWRhdGUoZXh0LCBuYW1lKTtcclxuICAgIGlmICghdmFsaWRFeHQudmFsaWQpIHtcclxuICAgICAgdGhyb3cgRXJyb3IodmFsaWRFeHQuZXJyb3IpO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXh0Lmxlbmd0aDsgKytpKSB7XHJcbiAgICAgIHN3aXRjaCAoZXh0W2ldLnR5cGUpIHtcclxuXHJcbiAgICAgICAgY2FzZSAnbGFuZyc6XHJcbiAgICAgICAgICBsYW5nRXh0ZW5zaW9ucy5wdXNoKGV4dFtpXSk7XHJcbiAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgY2FzZSAnb3V0cHV0JzpcclxuICAgICAgICAgIG91dHB1dE1vZGlmaWVycy5wdXNoKGV4dFtpXSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgICBpZiAoZXh0W2ldLmhhc093blByb3BlcnR5KGxpc3RlbmVycykpIHtcclxuICAgICAgICBmb3IgKHZhciBsbiBpbiBleHRbaV0ubGlzdGVuZXJzKSB7XHJcbiAgICAgICAgICBpZiAoZXh0W2ldLmxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShsbikpIHtcclxuICAgICAgICAgICAgbGlzdGVuKGxuLCBleHRbaV0ubGlzdGVuZXJzW2xuXSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTEVHQUNZX1NVUFBPUlRcclxuICAgKiBAcGFyYW0geyp9IGV4dFxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gbGVnYWN5RXh0ZW5zaW9uTG9hZGluZyhleHQsIG5hbWUpIHtcclxuICAgIGlmICh0eXBlb2YgZXh0ID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIGV4dCA9IGV4dChuZXcgc2hvd2Rvd24uQ29udmVydGVyKCkpO1xyXG4gICAgfVxyXG4gICAgaWYgKCFzaG93ZG93bi5oZWxwZXIuaXNBcnJheShleHQpKSB7XHJcbiAgICAgIGV4dCA9IFtleHRdO1xyXG4gICAgfVxyXG4gICAgdmFyIHZhbGlkID0gdmFsaWRhdGUoZXh0LCBuYW1lKTtcclxuXHJcbiAgICBpZiAoIXZhbGlkLnZhbGlkKSB7XHJcbiAgICAgIHRocm93IEVycm9yKHZhbGlkLmVycm9yKTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV4dC5sZW5ndGg7ICsraSkge1xyXG4gICAgICBzd2l0Y2ggKGV4dFtpXS50eXBlKSB7XHJcbiAgICAgICAgY2FzZSAnbGFuZyc6XHJcbiAgICAgICAgICBsYW5nRXh0ZW5zaW9ucy5wdXNoKGV4dFtpXSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdvdXRwdXQnOlxyXG4gICAgICAgICAgb3V0cHV0TW9kaWZpZXJzLnB1c2goZXh0W2ldKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6Ly8gc2hvdWxkIG5ldmVyIHJlYWNoIGhlcmVcclxuICAgICAgICAgIHRocm93IEVycm9yKCdFeHRlbnNpb24gbG9hZGVyIGVycm9yOiBUeXBlIHVucmVjb2duaXplZCEhIScpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBMaXN0ZW4gdG8gYW4gZXZlbnRcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gbGlzdGVuKG5hbWUsIGNhbGxiYWNrKSB7XHJcbiAgICBpZiAoIXNob3dkb3duLmhlbHBlci5pc1N0cmluZyhuYW1lKSkge1xyXG4gICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBhcmd1bWVudCBpbiBjb252ZXJ0ZXIubGlzdGVuKCkgbWV0aG9kOiBuYW1lIG11c3QgYmUgYSBzdHJpbmcsIGJ1dCAnICsgdHlwZW9mIG5hbWUgKyAnIGdpdmVuJyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBhcmd1bWVudCBpbiBjb252ZXJ0ZXIubGlzdGVuKCkgbWV0aG9kOiBjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24sIGJ1dCAnICsgdHlwZW9mIGNhbGxiYWNrICsgJyBnaXZlbicpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghbGlzdGVuZXJzLmhhc093blByb3BlcnR5KG5hbWUpKSB7XHJcbiAgICAgIGxpc3RlbmVyc1tuYW1lXSA9IFtdO1xyXG4gICAgfVxyXG4gICAgbGlzdGVuZXJzW25hbWVdLnB1c2goY2FsbGJhY2spO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gclRyaW1JbnB1dFRleHQodGV4dCkge1xyXG4gICAgdmFyIHJzcCA9IHRleHQubWF0Y2goL15cXHMqLylbMF0ubGVuZ3RoLFxyXG4gICAgICAgIHJneCA9IG5ldyBSZWdFeHAoJ15cXFxcc3swLCcgKyByc3AgKyAnfScsICdnbScpO1xyXG4gICAgcmV0dXJuIHRleHQucmVwbGFjZShyZ3gsICcnKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERpc3BhdGNoIGFuIGV2ZW50XHJcbiAgICogQHByaXZhdGVcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZ0TmFtZSBFdmVudCBuYW1lXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRleHQgVGV4dFxyXG4gICAqIEBwYXJhbSB7e319IG9wdGlvbnMgQ29udmVydGVyIE9wdGlvbnNcclxuICAgKiBAcGFyYW0ge3t9fSBnbG9iYWxzXHJcbiAgICogQHJldHVybnMge3N0cmluZ31cclxuICAgKi9cclxuICB0aGlzLl9kaXNwYXRjaCA9IGZ1bmN0aW9uIGRpc3BhdGNoIChldnROYW1lLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKSB7XHJcbiAgICBpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGV2dE5hbWUpKSB7XHJcbiAgICAgIGZvciAodmFyIGVpID0gMDsgZWkgPCBsaXN0ZW5lcnNbZXZ0TmFtZV0ubGVuZ3RoOyArK2VpKSB7XHJcbiAgICAgICAgdmFyIG5UZXh0ID0gbGlzdGVuZXJzW2V2dE5hbWVdW2VpXShldnROYW1lLCB0ZXh0LCB0aGlzLCBvcHRpb25zLCBnbG9iYWxzKTtcclxuICAgICAgICBpZiAoblRleHQgJiYgdHlwZW9mIG5UZXh0ICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgdGV4dCA9IG5UZXh0O1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRleHQ7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogTGlzdGVuIHRvIGFuIGV2ZW50XHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFja1xyXG4gICAqIEByZXR1cm5zIHtzaG93ZG93bi5Db252ZXJ0ZXJ9XHJcbiAgICovXHJcbiAgdGhpcy5saXN0ZW4gPSBmdW5jdGlvbiAobmFtZSwgY2FsbGJhY2spIHtcclxuICAgIGxpc3RlbihuYW1lLCBjYWxsYmFjayk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBDb252ZXJ0cyBhIG1hcmtkb3duIHN0cmluZyBpbnRvIEhUTUxcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGV4dFxyXG4gICAqIEByZXR1cm5zIHsqfVxyXG4gICAqL1xyXG4gIHRoaXMubWFrZUh0bWwgPSBmdW5jdGlvbiAodGV4dCkge1xyXG4gICAgLy9jaGVjayBpZiB0ZXh0IGlzIG5vdCBmYWxzeVxyXG4gICAgaWYgKCF0ZXh0KSB7XHJcbiAgICAgIHJldHVybiB0ZXh0O1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBnbG9iYWxzID0ge1xyXG4gICAgICBnSHRtbEJsb2NrczogICAgIFtdLFxyXG4gICAgICBnSHRtbE1kQmxvY2tzOiAgIFtdLFxyXG4gICAgICBnSHRtbFNwYW5zOiAgICAgIFtdLFxyXG4gICAgICBnVXJsczogICAgICAgICAgIHt9LFxyXG4gICAgICBnVGl0bGVzOiAgICAgICAgIHt9LFxyXG4gICAgICBnRGltZW5zaW9uczogICAgIHt9LFxyXG4gICAgICBnTGlzdExldmVsOiAgICAgIDAsXHJcbiAgICAgIGhhc2hMaW5rQ291bnRzOiAge30sXHJcbiAgICAgIGxhbmdFeHRlbnNpb25zOiAgbGFuZ0V4dGVuc2lvbnMsXHJcbiAgICAgIG91dHB1dE1vZGlmaWVyczogb3V0cHV0TW9kaWZpZXJzLFxyXG4gICAgICBjb252ZXJ0ZXI6ICAgICAgIHRoaXMsXHJcbiAgICAgIGdoQ29kZUJsb2NrczogICAgW11cclxuICAgIH07XHJcblxyXG4gICAgLy8gYXR0YWNrbGFiOiBSZXBsYWNlIH4gd2l0aCB+VFxyXG4gICAgLy8gVGhpcyBsZXRzIHVzIHVzZSB0aWxkZSBhcyBhbiBlc2NhcGUgY2hhciB0byBhdm9pZCBtZDUgaGFzaGVzXHJcbiAgICAvLyBUaGUgY2hvaWNlIG9mIGNoYXJhY3RlciBpcyBhcmJpdHJhcnk7IGFueXRoaW5nIHRoYXQgaXNuJ3RcclxuICAgIC8vIG1hZ2ljIGluIE1hcmtkb3duIHdpbGwgd29yay5cclxuICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoL34vZywgJ35UJyk7XHJcblxyXG4gICAgLy8gYXR0YWNrbGFiOiBSZXBsYWNlICQgd2l0aCB+RFxyXG4gICAgLy8gUmVnRXhwIGludGVycHJldHMgJCBhcyBhIHNwZWNpYWwgY2hhcmFjdGVyXHJcbiAgICAvLyB3aGVuIGl0J3MgaW4gYSByZXBsYWNlbWVudCBzdHJpbmdcclxuICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xcJC9nLCAnfkQnKTtcclxuXHJcbiAgICAvLyBTdGFuZGFyZGl6ZSBsaW5lIGVuZGluZ3NcclxuICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xcclxcbi9nLCAnXFxuJyk7IC8vIERPUyB0byBVbml4XHJcbiAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cXHIvZywgJ1xcbicpOyAvLyBNYWMgdG8gVW5peFxyXG5cclxuICAgIGlmIChvcHRpb25zLnNtYXJ0SW5kZW50YXRpb25GaXgpIHtcclxuICAgICAgdGV4dCA9IHJUcmltSW5wdXRUZXh0KHRleHQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE1ha2Ugc3VyZSB0ZXh0IGJlZ2lucyBhbmQgZW5kcyB3aXRoIGEgY291cGxlIG9mIG5ld2xpbmVzOlxyXG4gICAgLy90ZXh0ID0gJ1xcblxcbicgKyB0ZXh0ICsgJ1xcblxcbic7XHJcbiAgICB0ZXh0ID0gdGV4dDtcclxuICAgIC8vIGRldGFiXHJcbiAgICB0ZXh0ID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdkZXRhYicpKHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xyXG5cclxuICAgIC8vIHN0cmlwQmxhbmtMaW5lc1xyXG4gICAgdGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcignc3RyaXBCbGFua0xpbmVzJykodGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XHJcblxyXG4gICAgLy9ydW4gbGFuZ3VhZ2VFeHRlbnNpb25zXHJcbiAgICBzaG93ZG93bi5oZWxwZXIuZm9yRWFjaChsYW5nRXh0ZW5zaW9ucywgZnVuY3Rpb24gKGV4dCkge1xyXG4gICAgICB0ZXh0ID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdydW5FeHRlbnNpb24nKShleHQsIHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gcnVuIHRoZSBzdWIgcGFyc2Vyc1xyXG4gICAgdGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcignaGFzaFByZUNvZGVUYWdzJykodGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XHJcbiAgICB0ZXh0ID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdnaXRodWJDb2RlQmxvY2tzJykodGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XHJcbiAgICB0ZXh0ID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdoYXNoSFRNTEJsb2NrcycpKHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xyXG4gICAgdGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcignaGFzaEhUTUxTcGFucycpKHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xyXG4gICAgdGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcignc3RyaXBMaW5rRGVmaW5pdGlvbnMnKSh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcclxuICAgIHRleHQgPSBzaG93ZG93bi5zdWJQYXJzZXIoJ2Jsb2NrR2FtdXQnKSh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcclxuICAgIHRleHQgPSBzaG93ZG93bi5zdWJQYXJzZXIoJ3VuaGFzaEhUTUxTcGFucycpKHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xyXG4gICAgdGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcigndW5lc2NhcGVTcGVjaWFsQ2hhcnMnKSh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcclxuXHJcbiAgICAvLyBhdHRhY2tsYWI6IFJlc3RvcmUgZG9sbGFyIHNpZ25zXHJcbiAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+RC9nLCAnJCQnKTtcclxuXHJcbiAgICAvLyBhdHRhY2tsYWI6IFJlc3RvcmUgdGlsZGVzXHJcbiAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9+VC9nLCAnficpO1xyXG5cclxuICAgIC8vIFJ1biBvdXRwdXQgbW9kaWZpZXJzXHJcbiAgICBzaG93ZG93bi5oZWxwZXIuZm9yRWFjaChvdXRwdXRNb2RpZmllcnMsIGZ1bmN0aW9uIChleHQpIHtcclxuICAgICAgdGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcigncnVuRXh0ZW5zaW9uJykoZXh0LCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHRleHQ7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IGFuIG9wdGlvbiBvZiB0aGlzIENvbnZlcnRlciBpbnN0YW5jZVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcclxuICAgKiBAcGFyYW0geyp9IHZhbHVlXHJcbiAgICovXHJcbiAgdGhpcy5zZXRPcHRpb24gPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xyXG4gICAgb3B0aW9uc1trZXldID0gdmFsdWU7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBvcHRpb24gb2YgdGhpcyBDb252ZXJ0ZXIgaW5zdGFuY2VcclxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5XHJcbiAgICogQHJldHVybnMgeyp9XHJcbiAgICovXHJcbiAgdGhpcy5nZXRPcHRpb24gPSBmdW5jdGlvbiAoa2V5KSB7XHJcbiAgICByZXR1cm4gb3B0aW9uc1trZXldO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCB0aGUgb3B0aW9ucyBvZiB0aGlzIENvbnZlcnRlciBpbnN0YW5jZVxyXG4gICAqIEByZXR1cm5zIHt7fX1cclxuICAgKi9cclxuICB0aGlzLmdldE9wdGlvbnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gb3B0aW9ucztcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBBZGQgZXh0ZW5zaW9uIHRvIFRISVMgY29udmVydGVyXHJcbiAgICogQHBhcmFtIHt7fX0gZXh0ZW5zaW9uXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtuYW1lPW51bGxdXHJcbiAgICovXHJcbiAgdGhpcy5hZGRFeHRlbnNpb24gPSBmdW5jdGlvbiAoZXh0ZW5zaW9uLCBuYW1lKSB7XHJcbiAgICBuYW1lID0gbmFtZSB8fCBudWxsO1xyXG4gICAgX3BhcnNlRXh0ZW5zaW9uKGV4dGVuc2lvbiwgbmFtZSk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogVXNlIGEgZ2xvYmFsIHJlZ2lzdGVyZWQgZXh0ZW5zaW9uIHdpdGggVEhJUyBjb252ZXJ0ZXJcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXh0ZW5zaW9uTmFtZSBOYW1lIG9mIHRoZSBwcmV2aW91c2x5IHJlZ2lzdGVyZWQgZXh0ZW5zaW9uXHJcbiAgICovXHJcbiAgdGhpcy51c2VFeHRlbnNpb24gPSBmdW5jdGlvbiAoZXh0ZW5zaW9uTmFtZSkge1xyXG4gICAgX3BhcnNlRXh0ZW5zaW9uKGV4dGVuc2lvbk5hbWUpO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCB0aGUgZmxhdm9yIFRISVMgY29udmVydGVyIHNob3VsZCB1c2VcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gICAqL1xyXG4gIHRoaXMuc2V0Rmxhdm9yID0gZnVuY3Rpb24gKG5hbWUpIHtcclxuICAgIGlmIChmbGF2b3IuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcclxuICAgICAgdmFyIHByZXNldCA9IGZsYXZvcltuYW1lXTtcclxuICAgICAgZm9yICh2YXIgb3B0aW9uIGluIHByZXNldCkge1xyXG4gICAgICAgIGlmIChwcmVzZXQuaGFzT3duUHJvcGVydHkob3B0aW9uKSkge1xyXG4gICAgICAgICAgb3B0aW9uc1tvcHRpb25dID0gcHJlc2V0W29wdGlvbl07XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlIGFuIGV4dGVuc2lvbiBmcm9tIFRISVMgY29udmVydGVyLlxyXG4gICAqIE5vdGU6IFRoaXMgaXMgYSBjb3N0bHkgb3BlcmF0aW9uLiBJdCdzIGJldHRlciB0byBpbml0aWFsaXplIGEgbmV3IGNvbnZlcnRlclxyXG4gICAqIGFuZCBzcGVjaWZ5IHRoZSBleHRlbnNpb25zIHlvdSB3aXNoIHRvIHVzZVxyXG4gICAqIEBwYXJhbSB7QXJyYXl9IGV4dGVuc2lvblxyXG4gICAqL1xyXG4gIHRoaXMucmVtb3ZlRXh0ZW5zaW9uID0gZnVuY3Rpb24gKGV4dGVuc2lvbikge1xyXG4gICAgaWYgKCFzaG93ZG93bi5oZWxwZXIuaXNBcnJheShleHRlbnNpb24pKSB7XHJcbiAgICAgIGV4dGVuc2lvbiA9IFtleHRlbnNpb25dO1xyXG4gICAgfVxyXG4gICAgZm9yICh2YXIgYSA9IDA7IGEgPCBleHRlbnNpb24ubGVuZ3RoOyArK2EpIHtcclxuICAgICAgdmFyIGV4dCA9IGV4dGVuc2lvblthXTtcclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYW5nRXh0ZW5zaW9ucy5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgIGlmIChsYW5nRXh0ZW5zaW9uc1tpXSA9PT0gZXh0KSB7XHJcbiAgICAgICAgICBsYW5nRXh0ZW5zaW9uc1tpXS5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCBvdXRwdXRNb2RpZmllcnMubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICBpZiAob3V0cHV0TW9kaWZpZXJzW2lpXSA9PT0gZXh0KSB7XHJcbiAgICAgICAgICBvdXRwdXRNb2RpZmllcnNbaWldLnNwbGljZShpLCAxKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBHZXQgYWxsIGV4dGVuc2lvbiBvZiBUSElTIGNvbnZlcnRlclxyXG4gICAqIEByZXR1cm5zIHt7bGFuZ3VhZ2U6IEFycmF5LCBvdXRwdXQ6IEFycmF5fX1cclxuICAgKi9cclxuICB0aGlzLmdldEFsbEV4dGVuc2lvbnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBsYW5ndWFnZTogbGFuZ0V4dGVuc2lvbnMsXHJcbiAgICAgIG91dHB1dDogb3V0cHV0TW9kaWZpZXJzXHJcbiAgICB9O1xyXG4gIH07XHJcbn07XHJcblxyXG4vKipcclxuICogVHVybiBNYXJrZG93biBsaW5rIHNob3J0Y3V0cyBpbnRvIFhIVE1MIDxhPiB0YWdzLlxyXG4gKi9cclxuc2hvd2Rvd24uc3ViUGFyc2VyKCdhbmNob3JzJywgZnVuY3Rpb24gKHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpIHtcclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIHRleHQgPSBnbG9iYWxzLmNvbnZlcnRlci5fZGlzcGF0Y2goJ2FuY2hvcnMuYmVmb3JlJywgdGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XHJcblxyXG4gIHZhciB3cml0ZUFuY2hvclRhZyA9IGZ1bmN0aW9uICh3aG9sZU1hdGNoLCBtMSwgbTIsIG0zLCBtNCwgbTUsIG02LCBtNykge1xyXG4gICAgaWYgKHNob3dkb3duLmhlbHBlci5pc1VuZGVmaW5lZChtNykpIHtcclxuICAgICAgbTcgPSAnJztcclxuICAgIH1cclxuICAgIHdob2xlTWF0Y2ggPSBtMTtcclxuICAgIHZhciBsaW5rVGV4dCA9IG0yLFxyXG4gICAgICAgIGxpbmtJZCA9IG0zLnRvTG93ZXJDYXNlKCksXHJcbiAgICAgICAgdXJsID0gbTQsXHJcbiAgICAgICAgdGl0bGUgPSBtNztcclxuXHJcbiAgICBpZiAoIXVybCkge1xyXG4gICAgICBpZiAoIWxpbmtJZCkge1xyXG4gICAgICAgIC8vIGxvd2VyLWNhc2UgYW5kIHR1cm4gZW1iZWRkZWQgbmV3bGluZXMgaW50byBzcGFjZXNcclxuICAgICAgICBsaW5rSWQgPSBsaW5rVGV4dC50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoLyA/XFxuL2csICcgJyk7XHJcbiAgICAgIH1cclxuICAgICAgdXJsID0gJyMnICsgbGlua0lkO1xyXG5cclxuICAgICAgaWYgKCFzaG93ZG93bi5oZWxwZXIuaXNVbmRlZmluZWQoZ2xvYmFscy5nVXJsc1tsaW5rSWRdKSkge1xyXG4gICAgICAgIHVybCA9IGdsb2JhbHMuZ1VybHNbbGlua0lkXTtcclxuICAgICAgICBpZiAoIXNob3dkb3duLmhlbHBlci5pc1VuZGVmaW5lZChnbG9iYWxzLmdUaXRsZXNbbGlua0lkXSkpIHtcclxuICAgICAgICAgIHRpdGxlID0gZ2xvYmFscy5nVGl0bGVzW2xpbmtJZF07XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmICh3aG9sZU1hdGNoLnNlYXJjaCgvXFwoXFxzKlxcKSQvbSkgPiAtMSkge1xyXG4gICAgICAgICAgLy8gU3BlY2lhbCBjYXNlIGZvciBleHBsaWNpdCBlbXB0eSB1cmxcclxuICAgICAgICAgIHVybCA9ICcnO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZXR1cm4gd2hvbGVNYXRjaDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB1cmwgPSBzaG93ZG93bi5oZWxwZXIuZXNjYXBlQ2hhcmFjdGVycyh1cmwsICcqXycsIGZhbHNlKTtcclxuICAgIHZhciByZXN1bHQgPSAnPGEgaHJlZj1cIicgKyB1cmwgKyAnXCInO1xyXG5cclxuICAgIGlmICh0aXRsZSAhPT0gJycgJiYgdGl0bGUgIT09IG51bGwpIHtcclxuICAgICAgdGl0bGUgPSB0aXRsZS5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7Jyk7XHJcbiAgICAgIHRpdGxlID0gc2hvd2Rvd24uaGVscGVyLmVzY2FwZUNoYXJhY3RlcnModGl0bGUsICcqXycsIGZhbHNlKTtcclxuICAgICAgcmVzdWx0ICs9ICcgdGl0bGU9XCInICsgdGl0bGUgKyAnXCInO1xyXG4gICAgfVxyXG5cclxuICAgIHJlc3VsdCArPSAnPicgKyBsaW5rVGV4dCArICc8L2E+JztcclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH07XHJcblxyXG4gIC8vIEZpcnN0LCBoYW5kbGUgcmVmZXJlbmNlLXN0eWxlIGxpbmtzOiBbbGluayB0ZXh0XSBbaWRdXHJcbiAgLypcclxuICAgdGV4dCA9IHRleHQucmVwbGFjZSgvXHJcbiAgIChcdFx0XHRcdFx0XHRcdC8vIHdyYXAgd2hvbGUgbWF0Y2ggaW4gJDFcclxuICAgXFxbXHJcbiAgIChcclxuICAgKD86XHJcbiAgIFxcW1teXFxdXSpcXF1cdFx0Ly8gYWxsb3cgYnJhY2tldHMgbmVzdGVkIG9uZSBsZXZlbFxyXG4gICB8XHJcbiAgIFteXFxbXVx0XHRcdC8vIG9yIGFueXRoaW5nIGVsc2VcclxuICAgKSpcclxuICAgKVxyXG4gICBcXF1cclxuXHJcbiAgIFsgXT9cdFx0XHRcdFx0Ly8gb25lIG9wdGlvbmFsIHNwYWNlXHJcbiAgICg/OlxcblsgXSopP1x0XHRcdFx0Ly8gb25lIG9wdGlvbmFsIG5ld2xpbmUgZm9sbG93ZWQgYnkgc3BhY2VzXHJcblxyXG4gICBcXFtcclxuICAgKC4qPylcdFx0XHRcdFx0Ly8gaWQgPSAkM1xyXG4gICBcXF1cclxuICAgKSgpKCkoKSgpXHRcdFx0XHRcdC8vIHBhZCByZW1haW5pbmcgYmFja3JlZmVyZW5jZXNcclxuICAgL2csX0RvQW5jaG9yc19jYWxsYmFjayk7XHJcbiAgICovXHJcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvKFxcWygoPzpcXFtbXlxcXV0qXXxbXlxcW1xcXV0pKildWyBdPyg/OlxcblsgXSopP1xcWyguKj8pXSkoKSgpKCkoKS9nLCB3cml0ZUFuY2hvclRhZyk7XHJcblxyXG4gIC8vXHJcbiAgLy8gTmV4dCwgaW5saW5lLXN0eWxlIGxpbmtzOiBbbGluayB0ZXh0XSh1cmwgXCJvcHRpb25hbCB0aXRsZVwiKVxyXG4gIC8vXHJcblxyXG4gIC8qXHJcbiAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xyXG4gICAoXHRcdFx0XHRcdFx0Ly8gd3JhcCB3aG9sZSBtYXRjaCBpbiAkMVxyXG4gICBcXFtcclxuICAgKFxyXG4gICAoPzpcclxuICAgXFxbW15cXF1dKlxcXVx0Ly8gYWxsb3cgYnJhY2tldHMgbmVzdGVkIG9uZSBsZXZlbFxyXG4gICB8XHJcbiAgIFteXFxbXFxdXVx0XHRcdC8vIG9yIGFueXRoaW5nIGVsc2VcclxuICAgKVxyXG4gICApXHJcbiAgIFxcXVxyXG4gICBcXChcdFx0XHRcdFx0XHQvLyBsaXRlcmFsIHBhcmVuXHJcbiAgIFsgXFx0XSpcclxuICAgKClcdFx0XHRcdFx0XHQvLyBubyBpZCwgc28gbGVhdmUgJDMgZW1wdHlcclxuICAgPD8oLio/KT4/XHRcdFx0XHQvLyBocmVmID0gJDRcclxuICAgWyBcXHRdKlxyXG4gICAoXHRcdFx0XHRcdFx0Ly8gJDVcclxuICAgKFsnXCJdKVx0XHRcdFx0Ly8gcXVvdGUgY2hhciA9ICQ2XHJcbiAgICguKj8pXHRcdFx0XHQvLyBUaXRsZSA9ICQ3XHJcbiAgIFxcNlx0XHRcdFx0XHQvLyBtYXRjaGluZyBxdW90ZVxyXG4gICBbIFxcdF0qXHRcdFx0XHQvLyBpZ25vcmUgYW55IHNwYWNlcy90YWJzIGJldHdlZW4gY2xvc2luZyBxdW90ZSBhbmQgKVxyXG4gICApP1x0XHRcdFx0XHRcdC8vIHRpdGxlIGlzIG9wdGlvbmFsXHJcbiAgIFxcKVxyXG4gICApXHJcbiAgIC9nLHdyaXRlQW5jaG9yVGFnKTtcclxuICAgKi9cclxuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXFxbKCg/OlxcW1teXFxdXSpdfFteXFxbXFxdXSkqKV1cXChbIFxcdF0qKCk8PyguKj8oPzpcXCguKj9cXCkuKj8pPyk+P1sgXFx0XSooKFsnXCJdKSguKj8pXFw2WyBcXHRdKik/XFwpKS9nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgd3JpdGVBbmNob3JUYWcpO1xyXG5cclxuICAvL1xyXG4gIC8vIExhc3QsIGhhbmRsZSByZWZlcmVuY2Utc3R5bGUgc2hvcnRjdXRzOiBbbGluayB0ZXh0XVxyXG4gIC8vIFRoZXNlIG11c3QgY29tZSBsYXN0IGluIGNhc2UgeW91J3ZlIGFsc28gZ290IFtsaW5rIHRlc3RdWzFdXHJcbiAgLy8gb3IgW2xpbmsgdGVzdF0oL2ZvbylcclxuICAvL1xyXG5cclxuICAvKlxyXG4gICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cclxuICAgKCAgICAgICAgICAgICAgICAvLyB3cmFwIHdob2xlIG1hdGNoIGluICQxXHJcbiAgIFxcW1xyXG4gICAoW15cXFtcXF1dKykgICAgICAgLy8gbGluayB0ZXh0ID0gJDI7IGNhbid0IGNvbnRhaW4gJ1snIG9yICddJ1xyXG4gICBcXF1cclxuICAgKSgpKCkoKSgpKCkgICAgICAvLyBwYWQgcmVzdCBvZiBiYWNrcmVmZXJlbmNlc1xyXG4gICAvZywgd3JpdGVBbmNob3JUYWcpO1xyXG4gICAqL1xyXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhcXFsoW15cXFtcXF1dKyldKSgpKCkoKSgpKCkvZywgd3JpdGVBbmNob3JUYWcpO1xyXG5cclxuICB0ZXh0ID0gZ2xvYmFscy5jb252ZXJ0ZXIuX2Rpc3BhdGNoKCdhbmNob3JzLmFmdGVyJywgdGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XHJcbiAgcmV0dXJuIHRleHQ7XHJcbn0pO1xyXG5cclxuc2hvd2Rvd24uc3ViUGFyc2VyKCdhdXRvTGlua3MnLCBmdW5jdGlvbiAodGV4dCwgb3B0aW9ucywgZ2xvYmFscykge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgdGV4dCA9IGdsb2JhbHMuY29udmVydGVyLl9kaXNwYXRjaCgnYXV0b0xpbmtzLmJlZm9yZScsIHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xyXG5cclxuICB2YXIgc2ltcGxlVVJMUmVnZXggID0gL1xcYigoKGh0dHBzP3xmdHB8ZGljdCk6XFwvXFwvfHd3d1xcLilbXidcIj5cXHNdK1xcLlteJ1wiPlxcc10rKSg/PVxcc3wkKSg/IVtcIjw+XSkvZ2ksXHJcbiAgICAgIGRlbGltVXJsUmVnZXggICA9IC88KCgoaHR0cHM/fGZ0cHxkaWN0KTpcXC9cXC98d3d3XFwuKVteJ1wiPlxcc10rKT4vZ2ksXHJcbiAgICAgIHNpbXBsZU1haWxSZWdleCA9IC8oPzpefFsgXFxuXFx0XSkoW0EtWmEtejAtOSEjJCUmJyorLS89P15fYFxce3x9flxcLl0rQFstYS16MC05XSsoXFwuWy1hLXowLTldKykqXFwuW2Etel0rKSg/OiR8WyBcXG5cXHRdKS9naSxcclxuICAgICAgZGVsaW1NYWlsUmVnZXggID0gLzwoPzptYWlsdG86KT8oWy0uXFx3XStAWy1hLXowLTldKyhcXC5bLWEtejAtOV0rKSpcXC5bYS16XSspPi9naTtcclxuXHJcbiAgdGV4dCA9IHRleHQucmVwbGFjZShkZWxpbVVybFJlZ2V4LCByZXBsYWNlTGluayk7XHJcbiAgdGV4dCA9IHRleHQucmVwbGFjZShkZWxpbU1haWxSZWdleCwgcmVwbGFjZU1haWwpO1xyXG4gIC8vIHNpbXBsZVVSTFJlZ2V4ICA9IC9cXGIoKChodHRwcz98ZnRwfGRpY3QpOlxcL1xcL3x3d3dcXC4pWy0uK346PyNAISQmJygpKiw7PVtcXF1cXHddKylcXGIvZ2ksXHJcbiAgLy8gRW1haWwgYWRkcmVzc2VzOiA8YWRkcmVzc0Bkb21haW4uZm9vPlxyXG5cclxuICBpZiAob3B0aW9ucy5zaW1wbGlmaWVkQXV0b0xpbmspIHtcclxuICAgIHRleHQgPSB0ZXh0LnJlcGxhY2Uoc2ltcGxlVVJMUmVnZXgsIHJlcGxhY2VMaW5rKTtcclxuICAgIHRleHQgPSB0ZXh0LnJlcGxhY2Uoc2ltcGxlTWFpbFJlZ2V4LCByZXBsYWNlTWFpbCk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiByZXBsYWNlTGluayh3bSwgbGluaykge1xyXG4gICAgdmFyIGxua1R4dCA9IGxpbms7XHJcbiAgICBpZiAoL153d3dcXC4vaS50ZXN0KGxpbmspKSB7XHJcbiAgICAgIGxpbmsgPSBsaW5rLnJlcGxhY2UoL153d3dcXC4vaSwgJ2h0dHA6Ly93d3cuJyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gJzxhIGhyZWY9XCInICsgbGluayArICdcIj4nICsgbG5rVHh0ICsgJzwvYT4nO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gcmVwbGFjZU1haWwod2hvbGVNYXRjaCwgbTEpIHtcclxuICAgIHZhciB1bmVzY2FwZWRTdHIgPSBzaG93ZG93bi5zdWJQYXJzZXIoJ3VuZXNjYXBlU3BlY2lhbENoYXJzJykobTEpO1xyXG4gICAgcmV0dXJuIHNob3dkb3duLnN1YlBhcnNlcignZW5jb2RlRW1haWxBZGRyZXNzJykodW5lc2NhcGVkU3RyKTtcclxuICB9XHJcblxyXG4gIHRleHQgPSBnbG9iYWxzLmNvbnZlcnRlci5fZGlzcGF0Y2goJ2F1dG9MaW5rcy5hZnRlcicsIHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xyXG5cclxuICByZXR1cm4gdGV4dDtcclxufSk7XHJcblxyXG4vKipcclxuICogVGhlc2UgYXJlIGFsbCB0aGUgdHJhbnNmb3JtYXRpb25zIHRoYXQgZm9ybSBibG9jay1sZXZlbFxyXG4gKiB0YWdzIGxpa2UgcGFyYWdyYXBocywgaGVhZGVycywgYW5kIGxpc3QgaXRlbXMuXHJcbiAqL1xyXG5zaG93ZG93bi5zdWJQYXJzZXIoJ2Jsb2NrR2FtdXQnLCBmdW5jdGlvbiAodGV4dCwgb3B0aW9ucywgZ2xvYmFscykge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgdGV4dCA9IGdsb2JhbHMuY29udmVydGVyLl9kaXNwYXRjaCgnYmxvY2tHYW11dC5iZWZvcmUnLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcclxuXHJcbiAgLy8gd2UgcGFyc2UgYmxvY2txdW90ZXMgZmlyc3Qgc28gdGhhdCB3ZSBjYW4gaGF2ZSBoZWFkaW5ncyBhbmQgaHJzXHJcbiAgLy8gaW5zaWRlIGJsb2NrcXVvdGVzXHJcbiAgdGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcignYmxvY2tRdW90ZXMnKSh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcclxuICB0ZXh0ID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdoZWFkZXJzJykodGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XHJcblxyXG4gIC8vIERvIEhvcml6b250YWwgUnVsZXM6XHJcbiAgdmFyIGtleSA9IHNob3dkb3duLnN1YlBhcnNlcignaGFzaEJsb2NrJykoJzxociAvPicsIG9wdGlvbnMsIGdsb2JhbHMpO1xyXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoL15bIF17MCwyfShbIF0/XFwqWyBdPyl7Myx9WyBcXHRdKiQvZ20sIGtleSk7XHJcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvXlsgXXswLDJ9KFsgXT9cXC1bIF0/KXszLH1bIFxcdF0qJC9nbSwga2V5KTtcclxuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eWyBdezAsMn0oWyBdP19bIF0/KXszLH1bIFxcdF0qJC9nbSwga2V5KTtcclxuXHJcbiAgdGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcignbGlzdHMnKSh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcclxuICB0ZXh0ID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdjb2RlQmxvY2tzJykodGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XHJcbiAgdGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcigndGFibGVzJykodGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XHJcblxyXG4gIC8vIFdlIGFscmVhZHkgcmFuIF9IYXNoSFRNTEJsb2NrcygpIGJlZm9yZSwgaW4gTWFya2Rvd24oKSwgYnV0IHRoYXRcclxuICAvLyB3YXMgdG8gZXNjYXBlIHJhdyBIVE1MIGluIHRoZSBvcmlnaW5hbCBNYXJrZG93biBzb3VyY2UuIFRoaXMgdGltZSxcclxuICAvLyB3ZSdyZSBlc2NhcGluZyB0aGUgbWFya3VwIHdlJ3ZlIGp1c3QgY3JlYXRlZCwgc28gdGhhdCB3ZSBkb24ndCB3cmFwXHJcbiAgLy8gPHA+IHRhZ3MgYXJvdW5kIGJsb2NrLWxldmVsIHRhZ3MuXHJcbiAgdGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcignaGFzaEhUTUxCbG9ja3MnKSh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcclxuICB0ZXh0ID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdwYXJhZ3JhcGhzJykodGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XHJcblxyXG4gIHRleHQgPSBnbG9iYWxzLmNvbnZlcnRlci5fZGlzcGF0Y2goJ2Jsb2NrR2FtdXQuYWZ0ZXInLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcclxuXHJcbiAgcmV0dXJuIHRleHQ7XHJcbn0pO1xyXG5cclxuc2hvd2Rvd24uc3ViUGFyc2VyKCdibG9ja1F1b3RlcycsIGZ1bmN0aW9uICh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICB0ZXh0ID0gZ2xvYmFscy5jb252ZXJ0ZXIuX2Rpc3BhdGNoKCdibG9ja1F1b3Rlcy5iZWZvcmUnLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcclxuICAvKlxyXG4gICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9cclxuICAgKFx0XHRcdFx0XHRcdFx0XHQvLyBXcmFwIHdob2xlIG1hdGNoIGluICQxXHJcbiAgIChcclxuICAgXlsgXFx0XSo+WyBcXHRdP1x0XHRcdC8vICc+JyBhdCB0aGUgc3RhcnQgb2YgYSBsaW5lXHJcbiAgIC4rXFxuXHRcdFx0XHRcdC8vIHJlc3Qgb2YgdGhlIGZpcnN0IGxpbmVcclxuICAgKC4rXFxuKSpcdFx0XHRcdFx0Ly8gc3Vic2VxdWVudCBjb25zZWN1dGl2ZSBsaW5lc1xyXG4gICBcXG4qXHRcdFx0XHRcdFx0Ly8gYmxhbmtzXHJcbiAgICkrXHJcbiAgIClcclxuICAgL2dtLCBmdW5jdGlvbigpey4uLn0pO1xyXG4gICAqL1xyXG5cclxuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oKF5bIFxcdF17MCwzfT5bIFxcdF0/LitcXG4oLitcXG4pKlxcbiopKykvZ20sIGZ1bmN0aW9uICh3aG9sZU1hdGNoLCBtMSkge1xyXG4gICAgdmFyIGJxID0gbTE7XHJcblxyXG4gICAgLy8gYXR0YWNrbGFiOiBoYWNrIGFyb3VuZCBLb25xdWVyb3IgMy41LjQgYnVnOlxyXG4gICAgLy8gXCItLS0tLS0tLS0tYnVnXCIucmVwbGFjZSgvXi0vZyxcIlwiKSA9PSBcImJ1Z1wiXHJcbiAgICBicSA9IGJxLnJlcGxhY2UoL15bIFxcdF0qPlsgXFx0XT8vZ20sICd+MCcpOyAvLyB0cmltIG9uZSBsZXZlbCBvZiBxdW90aW5nXHJcblxyXG4gICAgLy8gYXR0YWNrbGFiOiBjbGVhbiB1cCBoYWNrXHJcbiAgICBicSA9IGJxLnJlcGxhY2UoL34wL2csICcnKTtcclxuXHJcbiAgICBicSA9IGJxLnJlcGxhY2UoL15bIFxcdF0rJC9nbSwgJycpOyAvLyB0cmltIHdoaXRlc3BhY2Utb25seSBsaW5lc1xyXG4gICAgYnEgPSBzaG93ZG93bi5zdWJQYXJzZXIoJ2dpdGh1YkNvZGVCbG9ja3MnKShicSwgb3B0aW9ucywgZ2xvYmFscyk7XHJcbiAgICBicSA9IHNob3dkb3duLnN1YlBhcnNlcignYmxvY2tHYW11dCcpKGJxLCBvcHRpb25zLCBnbG9iYWxzKTsgLy8gcmVjdXJzZVxyXG5cclxuICAgIGJxID0gYnEucmVwbGFjZSgvKF58XFxuKS9nLCAnJDEgICcpO1xyXG4gICAgLy8gVGhlc2UgbGVhZGluZyBzcGFjZXMgc2NyZXcgd2l0aCA8cHJlPiBjb250ZW50LCBzbyB3ZSBuZWVkIHRvIGZpeCB0aGF0OlxyXG4gICAgYnEgPSBicS5yZXBsYWNlKC8oXFxzKjxwcmU+W15cXHJdKz88XFwvcHJlPikvZ20sIGZ1bmN0aW9uICh3aG9sZU1hdGNoLCBtMSkge1xyXG4gICAgICB2YXIgcHJlID0gbTE7XHJcbiAgICAgIC8vIGF0dGFja2xhYjogaGFjayBhcm91bmQgS29ucXVlcm9yIDMuNS40IGJ1ZzpcclxuICAgICAgcHJlID0gcHJlLnJlcGxhY2UoL14gIC9tZywgJ34wJyk7XHJcbiAgICAgIHByZSA9IHByZS5yZXBsYWNlKC9+MC9nLCAnJyk7XHJcbiAgICAgIHJldHVybiBwcmU7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gc2hvd2Rvd24uc3ViUGFyc2VyKCdoYXNoQmxvY2snKSgnPGJsb2NrcXVvdGU+XFxuJyArIGJxICsgJ1xcbjwvYmxvY2txdW90ZT4nLCBvcHRpb25zLCBnbG9iYWxzKTtcclxuICB9KTtcclxuXHJcbiAgdGV4dCA9IGdsb2JhbHMuY29udmVydGVyLl9kaXNwYXRjaCgnYmxvY2tRdW90ZXMuYWZ0ZXInLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcclxuICByZXR1cm4gdGV4dDtcclxufSk7XHJcblxyXG4vKipcclxuICogUHJvY2VzcyBNYXJrZG93biBgPHByZT48Y29kZT5gIGJsb2Nrcy5cclxuICovXHJcbnNob3dkb3duLnN1YlBhcnNlcignY29kZUJsb2NrcycsIGZ1bmN0aW9uICh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICB0ZXh0ID0gZ2xvYmFscy5jb252ZXJ0ZXIuX2Rpc3BhdGNoKCdjb2RlQmxvY2tzLmJlZm9yZScsIHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xyXG4gIC8qXHJcbiAgIHRleHQgPSB0ZXh0LnJlcGxhY2UodGV4dCxcclxuICAgLyg/OlxcblxcbnxeKVxyXG4gICAoXHRcdFx0XHRcdFx0XHRcdC8vICQxID0gdGhlIGNvZGUgYmxvY2sgLS0gb25lIG9yIG1vcmUgbGluZXMsIHN0YXJ0aW5nIHdpdGggYSBzcGFjZS90YWJcclxuICAgKD86XHJcbiAgICg/OlsgXXs0fXxcXHQpXHRcdFx0Ly8gTGluZXMgbXVzdCBzdGFydCB3aXRoIGEgdGFiIG9yIGEgdGFiLXdpZHRoIG9mIHNwYWNlcyAtIGF0dGFja2xhYjogZ190YWJfd2lkdGhcclxuICAgLipcXG4rXHJcbiAgICkrXHJcbiAgIClcclxuICAgKFxcbipbIF17MCwzfVteIFxcdFxcbl18KD89fjApKVx0Ly8gYXR0YWNrbGFiOiBnX3RhYl93aWR0aFxyXG4gICAvZyxmdW5jdGlvbigpey4uLn0pO1xyXG4gICAqL1xyXG5cclxuICAvLyBhdHRhY2tsYWI6IHNlbnRpbmVsIHdvcmthcm91bmRzIGZvciBsYWNrIG9mIFxcQSBhbmQgXFxaLCBzYWZhcmlcXGtodG1sIGJ1Z1xyXG4gIHRleHQgKz0gJ34wJztcclxuXHJcbiAgdmFyIHBhdHRlcm4gPSAvKD86XFxuXFxufF4pKCg/Oig/OlsgXXs0fXxcXHQpLipcXG4rKSspKFxcbipbIF17MCwzfVteIFxcdFxcbl18KD89fjApKS9nO1xyXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UocGF0dGVybiwgZnVuY3Rpb24gKHdob2xlTWF0Y2gsIG0xLCBtMikge1xyXG4gICAgdmFyIGNvZGVibG9jayA9IG0xLFxyXG4gICAgICAgIG5leHRDaGFyID0gbTIsXHJcbiAgICAgICAgZW5kID0gJ1xcbic7XHJcblxyXG4gICAgY29kZWJsb2NrID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdvdXRkZW50JykoY29kZWJsb2NrKTtcclxuICAgIGNvZGVibG9jayA9IHNob3dkb3duLnN1YlBhcnNlcignZW5jb2RlQ29kZScpKGNvZGVibG9jayk7XHJcbiAgICBjb2RlYmxvY2sgPSBzaG93ZG93bi5zdWJQYXJzZXIoJ2RldGFiJykoY29kZWJsb2NrKTtcclxuICAgIGNvZGVibG9jayA9IGNvZGVibG9jay5yZXBsYWNlKC9eXFxuKy9nLCAnJyk7IC8vIHRyaW0gbGVhZGluZyBuZXdsaW5lc1xyXG4gICAgY29kZWJsb2NrID0gY29kZWJsb2NrLnJlcGxhY2UoL1xcbiskL2csICcnKTsgLy8gdHJpbSB0cmFpbGluZyBuZXdsaW5lc1xyXG5cclxuICAgIGlmIChvcHRpb25zLm9taXRFeHRyYVdMSW5Db2RlQmxvY2tzKSB7XHJcbiAgICAgIGVuZCA9ICcnO1xyXG4gICAgfVxyXG5cclxuICAgIGNvZGVibG9jayA9ICc8cHJlPjxjb2RlPicgKyBjb2RlYmxvY2sgKyBlbmQgKyAnPC9jb2RlPjwvcHJlPic7XHJcblxyXG4gICAgcmV0dXJuIHNob3dkb3duLnN1YlBhcnNlcignaGFzaEJsb2NrJykoY29kZWJsb2NrLCBvcHRpb25zLCBnbG9iYWxzKSArIG5leHRDaGFyO1xyXG4gIH0pO1xyXG5cclxuICAvLyBhdHRhY2tsYWI6IHN0cmlwIHNlbnRpbmVsXHJcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvfjAvLCAnJyk7XHJcblxyXG4gIHRleHQgPSBnbG9iYWxzLmNvbnZlcnRlci5fZGlzcGF0Y2goJ2NvZGVCbG9ja3MuYWZ0ZXInLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcclxuICByZXR1cm4gdGV4dDtcclxufSk7XHJcblxyXG4vKipcclxuICpcclxuICogICAqICBCYWNrdGljayBxdW90ZXMgYXJlIHVzZWQgZm9yIDxjb2RlPjwvY29kZT4gc3BhbnMuXHJcbiAqXHJcbiAqICAgKiAgWW91IGNhbiB1c2UgbXVsdGlwbGUgYmFja3RpY2tzIGFzIHRoZSBkZWxpbWl0ZXJzIGlmIHlvdSB3YW50IHRvXHJcbiAqICAgICBpbmNsdWRlIGxpdGVyYWwgYmFja3RpY2tzIGluIHRoZSBjb2RlIHNwYW4uIFNvLCB0aGlzIGlucHV0OlxyXG4gKlxyXG4gKiAgICAgICAgIEp1c3QgdHlwZSBgYGZvbyBgYmFyYCBiYXpgYCBhdCB0aGUgcHJvbXB0LlxyXG4gKlxyXG4gKiAgICAgICBXaWxsIHRyYW5zbGF0ZSB0bzpcclxuICpcclxuICogICAgICAgICA8cD5KdXN0IHR5cGUgPGNvZGU+Zm9vIGBiYXJgIGJhejwvY29kZT4gYXQgdGhlIHByb21wdC48L3A+XHJcbiAqXHJcbiAqICAgIFRoZXJlJ3Mgbm8gYXJiaXRyYXJ5IGxpbWl0IHRvIHRoZSBudW1iZXIgb2YgYmFja3RpY2tzIHlvdVxyXG4gKiAgICBjYW4gdXNlIGFzIGRlbGltdGVycy4gSWYgeW91IG5lZWQgdGhyZWUgY29uc2VjdXRpdmUgYmFja3RpY2tzXHJcbiAqICAgIGluIHlvdXIgY29kZSwgdXNlIGZvdXIgZm9yIGRlbGltaXRlcnMsIGV0Yy5cclxuICpcclxuICogICogIFlvdSBjYW4gdXNlIHNwYWNlcyB0byBnZXQgbGl0ZXJhbCBiYWNrdGlja3MgYXQgdGhlIGVkZ2VzOlxyXG4gKlxyXG4gKiAgICAgICAgIC4uLiB0eXBlIGBgIGBiYXJgIGBgIC4uLlxyXG4gKlxyXG4gKiAgICAgICBUdXJucyB0bzpcclxuICpcclxuICogICAgICAgICAuLi4gdHlwZSA8Y29kZT5gYmFyYDwvY29kZT4gLi4uXHJcbiAqL1xyXG5zaG93ZG93bi5zdWJQYXJzZXIoJ2NvZGVTcGFucycsIGZ1bmN0aW9uICh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICB0ZXh0ID0gZ2xvYmFscy5jb252ZXJ0ZXIuX2Rpc3BhdGNoKCdjb2RlU3BhbnMuYmVmb3JlJywgdGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XHJcblxyXG4gIC8qXHJcbiAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xyXG4gICAoXnxbXlxcXFxdKVx0XHRcdFx0XHQvLyBDaGFyYWN0ZXIgYmVmb3JlIG9wZW5pbmcgYCBjYW4ndCBiZSBhIGJhY2tzbGFzaFxyXG4gICAoYCspXHRcdFx0XHRcdFx0Ly8gJDIgPSBPcGVuaW5nIHJ1biBvZiBgXHJcbiAgIChcdFx0XHRcdFx0XHRcdC8vICQzID0gVGhlIGNvZGUgYmxvY2tcclxuICAgW15cXHJdKj9cclxuICAgW15gXVx0XHRcdFx0XHQvLyBhdHRhY2tsYWI6IHdvcmsgYXJvdW5kIGxhY2sgb2YgbG9va2JlaGluZFxyXG4gICApXHJcbiAgIFxcMlx0XHRcdFx0XHRcdFx0Ly8gTWF0Y2hpbmcgY2xvc2VyXHJcbiAgICg/IWApXHJcbiAgIC9nbSwgZnVuY3Rpb24oKXsuLi59KTtcclxuICAgKi9cclxuXHJcbiAgaWYgKHR5cGVvZih0ZXh0KSA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIHRleHQgPSAnJztcclxuICB9XHJcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvKF58W15cXFxcXSkoYCspKFteXFxyXSo/W15gXSlcXDIoPyFgKS9nbSxcclxuICAgIGZ1bmN0aW9uICh3aG9sZU1hdGNoLCBtMSwgbTIsIG0zKSB7XHJcbiAgICAgIHZhciBjID0gbTM7XHJcbiAgICAgIGMgPSBjLnJlcGxhY2UoL14oWyBcXHRdKikvZywgJycpO1x0Ly8gbGVhZGluZyB3aGl0ZXNwYWNlXHJcbiAgICAgIGMgPSBjLnJlcGxhY2UoL1sgXFx0XSokL2csICcnKTtcdC8vIHRyYWlsaW5nIHdoaXRlc3BhY2VcclxuICAgICAgYyA9IHNob3dkb3duLnN1YlBhcnNlcignZW5jb2RlQ29kZScpKGMpO1xyXG4gICAgICByZXR1cm4gbTEgKyAnPGNvZGU+JyArIGMgKyAnPC9jb2RlPic7XHJcbiAgICB9XHJcbiAgKTtcclxuXHJcbiAgdGV4dCA9IGdsb2JhbHMuY29udmVydGVyLl9kaXNwYXRjaCgnY29kZVNwYW5zLmFmdGVyJywgdGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XHJcbiAgcmV0dXJuIHRleHQ7XHJcbn0pO1xyXG5cclxuLyoqXHJcbiAqIENvbnZlcnQgYWxsIHRhYnMgdG8gc3BhY2VzXHJcbiAqL1xyXG5zaG93ZG93bi5zdWJQYXJzZXIoJ2RldGFiJywgZnVuY3Rpb24gKHRleHQpIHtcclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIC8vIGV4cGFuZCBmaXJzdCBuLTEgdGFic1xyXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xcdCg/PVxcdCkvZywgJyAgICAnKTsgLy8gZ190YWJfd2lkdGhcclxuXHJcbiAgLy8gcmVwbGFjZSB0aGUgbnRoIHdpdGggdHdvIHNlbnRpbmVsc1xyXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xcdC9nLCAnfkF+QicpO1xyXG5cclxuICAvLyB1c2UgdGhlIHNlbnRpbmVsIHRvIGFuY2hvciBvdXIgcmVnZXggc28gaXQgZG9lc24ndCBleHBsb2RlXHJcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvfkIoLis/KX5BL2csIGZ1bmN0aW9uICh3aG9sZU1hdGNoLCBtMSkge1xyXG4gICAgdmFyIGxlYWRpbmdUZXh0ID0gbTEsXHJcbiAgICAgICAgbnVtU3BhY2VzID0gNCAtIGxlYWRpbmdUZXh0Lmxlbmd0aCAlIDQ7ICAvLyBnX3RhYl93aWR0aFxyXG5cclxuICAgIC8vIHRoZXJlICptdXN0KiBiZSBhIGJldHRlciB3YXkgdG8gZG8gdGhpczpcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtU3BhY2VzOyBpKyspIHtcclxuICAgICAgbGVhZGluZ1RleHQgKz0gJyAnO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBsZWFkaW5nVGV4dDtcclxuICB9KTtcclxuXHJcbiAgLy8gY2xlYW4gdXAgc2VudGluZWxzXHJcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvfkEvZywgJyAgICAnKTsgIC8vIGdfdGFiX3dpZHRoXHJcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvfkIvZywgJycpO1xyXG5cclxuICByZXR1cm4gdGV4dDtcclxuXHJcbn0pO1xyXG5cclxuLyoqXHJcbiAqIFNtYXJ0IHByb2Nlc3NpbmcgZm9yIGFtcGVyc2FuZHMgYW5kIGFuZ2xlIGJyYWNrZXRzIHRoYXQgbmVlZCB0byBiZSBlbmNvZGVkLlxyXG4gKi9cclxuc2hvd2Rvd24uc3ViUGFyc2VyKCdlbmNvZGVBbXBzQW5kQW5nbGVzJywgZnVuY3Rpb24gKHRleHQpIHtcclxuICAndXNlIHN0cmljdCc7XHJcbiAgLy8gQW1wZXJzYW5kLWVuY29kaW5nIGJhc2VkIGVudGlyZWx5IG9uIE5hdCBJcm9ucydzIEFtcHV0YXRvciBNVCBwbHVnaW46XHJcbiAgLy8gaHR0cDovL2J1bXBwby5uZXQvcHJvamVjdHMvYW1wdXRhdG9yL1xyXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoLyYoPyEjP1t4WF0/KD86WzAtOWEtZkEtRl0rfFxcdyspOykvZywgJyZhbXA7Jyk7XHJcblxyXG4gIC8vIEVuY29kZSBuYWtlZCA8J3NcclxuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC88KD8hW2EtelxcLz9cXCQhXSkvZ2ksICcmbHQ7Jyk7XHJcblxyXG4gIHJldHVybiB0ZXh0O1xyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBzdHJpbmcsIHdpdGggYWZ0ZXIgcHJvY2Vzc2luZyB0aGUgZm9sbG93aW5nIGJhY2tzbGFzaCBlc2NhcGUgc2VxdWVuY2VzLlxyXG4gKlxyXG4gKiBhdHRhY2tsYWI6IFRoZSBwb2xpdGUgd2F5IHRvIGRvIHRoaXMgaXMgd2l0aCB0aGUgbmV3IGVzY2FwZUNoYXJhY3RlcnMoKSBmdW5jdGlvbjpcclxuICpcclxuICogICAgdGV4dCA9IGVzY2FwZUNoYXJhY3RlcnModGV4dCxcIlxcXFxcIix0cnVlKTtcclxuICogICAgdGV4dCA9IGVzY2FwZUNoYXJhY3RlcnModGV4dCxcImAqX3t9W10oKT4jKy0uIVwiLHRydWUpO1xyXG4gKlxyXG4gKiAuLi5idXQgd2UncmUgc2lkZXN0ZXBwaW5nIGl0cyB1c2Ugb2YgdGhlIChzbG93KSBSZWdFeHAgY29uc3RydWN0b3JcclxuICogYXMgYW4gb3B0aW1pemF0aW9uIGZvciBGaXJlZm94LiAgVGhpcyBmdW5jdGlvbiBnZXRzIGNhbGxlZCBhIExPVC5cclxuICovXHJcbnNob3dkb3duLnN1YlBhcnNlcignZW5jb2RlQmFja3NsYXNoRXNjYXBlcycsIGZ1bmN0aW9uICh0ZXh0KSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoL1xcXFwoXFxcXCkvZywgc2hvd2Rvd24uaGVscGVyLmVzY2FwZUNoYXJhY3RlcnNDYWxsYmFjayk7XHJcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvXFxcXChbYCpfe31cXFtcXF0oKT4jKy0uIV0pL2csIHNob3dkb3duLmhlbHBlci5lc2NhcGVDaGFyYWN0ZXJzQ2FsbGJhY2spO1xyXG4gIHJldHVybiB0ZXh0O1xyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBFbmNvZGUvZXNjYXBlIGNlcnRhaW4gY2hhcmFjdGVycyBpbnNpZGUgTWFya2Rvd24gY29kZSBydW5zLlxyXG4gKiBUaGUgcG9pbnQgaXMgdGhhdCBpbiBjb2RlLCB0aGVzZSBjaGFyYWN0ZXJzIGFyZSBsaXRlcmFscyxcclxuICogYW5kIGxvc2UgdGhlaXIgc3BlY2lhbCBNYXJrZG93biBtZWFuaW5ncy5cclxuICovXHJcbnNob3dkb3duLnN1YlBhcnNlcignZW5jb2RlQ29kZScsIGZ1bmN0aW9uICh0ZXh0KSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAvLyBFbmNvZGUgYWxsIGFtcGVyc2FuZHM7IEhUTUwgZW50aXRpZXMgYXJlIG5vdFxyXG4gIC8vIGVudGl0aWVzIHdpdGhpbiBhIE1hcmtkb3duIGNvZGUgc3Bhbi5cclxuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC8mL2csICcmYW1wOycpO1xyXG5cclxuICAvLyBEbyB0aGUgYW5nbGUgYnJhY2tldCBzb25nIGFuZCBkYW5jZTpcclxuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC88L2csICcmbHQ7Jyk7XHJcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvPi9nLCAnJmd0OycpO1xyXG5cclxuICAvLyBOb3csIGVzY2FwZSBjaGFyYWN0ZXJzIHRoYXQgYXJlIG1hZ2ljIGluIE1hcmtkb3duOlxyXG4gIHRleHQgPSBzaG93ZG93bi5oZWxwZXIuZXNjYXBlQ2hhcmFjdGVycyh0ZXh0LCAnKl97fVtdXFxcXCcsIGZhbHNlKTtcclxuXHJcbiAgLy8gamogdGhlIGxpbmUgYWJvdmUgYnJlYWtzIHRoaXM6XHJcbiAgLy8tLS1cclxuICAvLyogSXRlbVxyXG4gIC8vICAgMS4gU3ViaXRlbVxyXG4gIC8vICAgICAgICAgICAgc3BlY2lhbCBjaGFyOiAqXHJcbiAgLy8gLS0tXHJcblxyXG4gIHJldHVybiB0ZXh0O1xyXG59KTtcclxuXHJcbi8qKlxyXG4gKiAgSW5wdXQ6IGFuIGVtYWlsIGFkZHJlc3MsIGUuZy4gXCJmb29AZXhhbXBsZS5jb21cIlxyXG4gKlxyXG4gKiAgT3V0cHV0OiB0aGUgZW1haWwgYWRkcmVzcyBhcyBhIG1haWx0byBsaW5rLCB3aXRoIGVhY2ggY2hhcmFjdGVyXHJcbiAqICAgIG9mIHRoZSBhZGRyZXNzIGVuY29kZWQgYXMgZWl0aGVyIGEgZGVjaW1hbCBvciBoZXggZW50aXR5LCBpblxyXG4gKiAgICB0aGUgaG9wZXMgb2YgZm9pbGluZyBtb3N0IGFkZHJlc3MgaGFydmVzdGluZyBzcGFtIGJvdHMuIEUuZy46XHJcbiAqXHJcbiAqICAgIDxhIGhyZWY9XCImI3g2RDsmIzk3OyYjMTA1OyYjMTA4OyYjeDc0OyYjMTExOzomIzEwMjsmIzExMTsmIzExMTsmIzY0OyYjMTAxO1xyXG4gKiAgICAgICB4JiN4NjE7JiMxMDk7JiN4NzA7JiMxMDg7JiN4NjU7JiN4MkU7JiM5OTsmIzExMTsmIzEwOTtcIj4mIzEwMjsmIzExMTsmIzExMTtcclxuICogICAgICAgJiM2NDsmIzEwMTt4JiN4NjE7JiMxMDk7JiN4NzA7JiMxMDg7JiN4NjU7JiN4MkU7JiM5OTsmIzExMTsmIzEwOTs8L2E+XHJcbiAqXHJcbiAqICBCYXNlZCBvbiBhIGZpbHRlciBieSBNYXR0aGV3IFdpY2tsaW5lLCBwb3N0ZWQgdG8gdGhlIEJCRWRpdC1UYWxrXHJcbiAqICBtYWlsaW5nIGxpc3Q6IDxodHRwOi8vdGlueXVybC5jb20veXU3dWU+XHJcbiAqXHJcbiAqL1xyXG5zaG93ZG93bi5zdWJQYXJzZXIoJ2VuY29kZUVtYWlsQWRkcmVzcycsIGZ1bmN0aW9uIChhZGRyKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICB2YXIgZW5jb2RlID0gW1xyXG4gICAgZnVuY3Rpb24gKGNoKSB7XHJcbiAgICAgIHJldHVybiAnJiMnICsgY2guY2hhckNvZGVBdCgwKSArICc7JztcclxuICAgIH0sXHJcbiAgICBmdW5jdGlvbiAoY2gpIHtcclxuICAgICAgcmV0dXJuICcmI3gnICsgY2guY2hhckNvZGVBdCgwKS50b1N0cmluZygxNikgKyAnOyc7XHJcbiAgICB9LFxyXG4gICAgZnVuY3Rpb24gKGNoKSB7XHJcbiAgICAgIHJldHVybiBjaDtcclxuICAgIH1cclxuICBdO1xyXG5cclxuICBhZGRyID0gJ21haWx0bzonICsgYWRkcjtcclxuXHJcbiAgYWRkciA9IGFkZHIucmVwbGFjZSgvLi9nLCBmdW5jdGlvbiAoY2gpIHtcclxuICAgIGlmIChjaCA9PT0gJ0AnKSB7XHJcbiAgICAgIC8vIHRoaXMgKm11c3QqIGJlIGVuY29kZWQuIEkgaW5zaXN0LlxyXG4gICAgICBjaCA9IGVuY29kZVtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyKV0oY2gpO1xyXG4gICAgfSBlbHNlIGlmIChjaCAhPT0gJzonKSB7XHJcbiAgICAgIC8vIGxlYXZlICc6JyBhbG9uZSAodG8gc3BvdCBtYWlsdG86IGxhdGVyKVxyXG4gICAgICB2YXIgciA9IE1hdGgucmFuZG9tKCk7XHJcbiAgICAgIC8vIHJvdWdobHkgMTAlIHJhdywgNDUlIGhleCwgNDUlIGRlY1xyXG4gICAgICBjaCA9IChcclxuICAgICAgICByID4gMC45ID8gZW5jb2RlWzJdKGNoKSA6IHIgPiAwLjQ1ID8gZW5jb2RlWzFdKGNoKSA6IGVuY29kZVswXShjaClcclxuICAgICAgKTtcclxuICAgIH1cclxuICAgIHJldHVybiBjaDtcclxuICB9KTtcclxuXHJcbiAgYWRkciA9ICc8YSBocmVmPVwiJyArIGFkZHIgKyAnXCI+JyArIGFkZHIgKyAnPC9hPic7XHJcbiAgYWRkciA9IGFkZHIucmVwbGFjZSgvXCI+Lis6L2csICdcIj4nKTsgLy8gc3RyaXAgdGhlIG1haWx0bzogZnJvbSB0aGUgdmlzaWJsZSBwYXJ0XHJcblxyXG4gIHJldHVybiBhZGRyO1xyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBXaXRoaW4gdGFncyAtLSBtZWFuaW5nIGJldHdlZW4gPCBhbmQgPiAtLSBlbmNvZGUgW1xcIGAgKiBfXSBzbyB0aGV5XHJcbiAqIGRvbid0IGNvbmZsaWN0IHdpdGggdGhlaXIgdXNlIGluIE1hcmtkb3duIGZvciBjb2RlLCBpdGFsaWNzIGFuZCBzdHJvbmcuXHJcbiAqL1xyXG5zaG93ZG93bi5zdWJQYXJzZXIoJ2VzY2FwZVNwZWNpYWxDaGFyc1dpdGhpblRhZ0F0dHJpYnV0ZXMnLCBmdW5jdGlvbiAodGV4dCkge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgLy8gQnVpbGQgYSByZWdleCB0byBmaW5kIEhUTUwgdGFncyBhbmQgY29tbWVudHMuICBTZWUgRnJpZWRsJ3NcclxuICAvLyBcIk1hc3RlcmluZyBSZWd1bGFyIEV4cHJlc3Npb25zXCIsIDJuZCBFZC4sIHBwLiAyMDAtMjAxLlxyXG4gIHZhciByZWdleCA9IC8oPFthLXpcXC8hJF0oXCJbXlwiXSpcInwnW14nXSonfFteJ1wiPl0pKj58PCEoLS0uKj8tLVxccyopKz4pL2dpO1xyXG5cclxuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKHJlZ2V4LCBmdW5jdGlvbiAod2hvbGVNYXRjaCkge1xyXG4gICAgdmFyIHRhZyA9IHdob2xlTWF0Y2gucmVwbGFjZSgvKC4pPFxcLz9jb2RlPig/PS4pL2csICckMWAnKTtcclxuICAgIHRhZyA9IHNob3dkb3duLmhlbHBlci5lc2NhcGVDaGFyYWN0ZXJzKHRhZywgJ1xcXFxgKl8nLCBmYWxzZSk7XHJcbiAgICByZXR1cm4gdGFnO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gdGV4dDtcclxufSk7XHJcblxyXG4vKipcclxuICogSGFuZGxlIGdpdGh1YiBjb2RlYmxvY2tzIHByaW9yIHRvIHJ1bm5pbmcgSGFzaEhUTUwgc28gdGhhdFxyXG4gKiBIVE1MIGNvbnRhaW5lZCB3aXRoaW4gdGhlIGNvZGVibG9jayBnZXRzIGVzY2FwZWQgcHJvcGVybHlcclxuICogRXhhbXBsZTpcclxuICogYGBgcnVieVxyXG4gKiAgICAgZGVmIGhlbGxvX3dvcmxkKHgpXHJcbiAqICAgICAgIHB1dHMgXCJIZWxsbywgI3t4fVwiXHJcbiAqICAgICBlbmRcclxuICogYGBgXHJcbiAqL1xyXG5zaG93ZG93bi5zdWJQYXJzZXIoJ2dpdGh1YkNvZGVCbG9ja3MnLCBmdW5jdGlvbiAodGV4dCwgb3B0aW9ucywgZ2xvYmFscykge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgLy8gZWFybHkgZXhpdCBpZiBvcHRpb24gaXMgbm90IGVuYWJsZWRcclxuICBpZiAoIW9wdGlvbnMuZ2hDb2RlQmxvY2tzKSB7XHJcbiAgICByZXR1cm4gdGV4dDtcclxuICB9XHJcblxyXG4gIHRleHQgPSBnbG9iYWxzLmNvbnZlcnRlci5fZGlzcGF0Y2goJ2dpdGh1YkNvZGVCbG9ja3MuYmVmb3JlJywgdGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XHJcblxyXG4gIHRleHQgKz0gJ34wJztcclxuXHJcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvKD86XnxcXG4pYGBgKC4qKVxcbihbXFxzXFxTXSo/KVxcbmBgYC9nLCBmdW5jdGlvbiAod2hvbGVNYXRjaCwgbGFuZ3VhZ2UsIGNvZGVibG9jaykge1xyXG4gICAgdmFyIGVuZCA9IChvcHRpb25zLm9taXRFeHRyYVdMSW5Db2RlQmxvY2tzKSA/ICcnIDogJ1xcbic7XHJcblxyXG4gICAgLy8gRmlyc3QgcGFyc2UgdGhlIGdpdGh1YiBjb2RlIGJsb2NrXHJcbiAgICBjb2RlYmxvY2sgPSBzaG93ZG93bi5zdWJQYXJzZXIoJ2VuY29kZUNvZGUnKShjb2RlYmxvY2spO1xyXG4gICAgY29kZWJsb2NrID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdkZXRhYicpKGNvZGVibG9jayk7XHJcbiAgICBjb2RlYmxvY2sgPSBjb2RlYmxvY2sucmVwbGFjZSgvXlxcbisvZywgJycpOyAvLyB0cmltIGxlYWRpbmcgbmV3bGluZXNcclxuICAgIGNvZGVibG9jayA9IGNvZGVibG9jay5yZXBsYWNlKC9cXG4rJC9nLCAnJyk7IC8vIHRyaW0gdHJhaWxpbmcgd2hpdGVzcGFjZVxyXG5cclxuICAgIGNvZGVibG9jayA9ICc8cHJlPjxjb2RlJyArIChsYW5ndWFnZSA/ICcgY2xhc3M9XCInICsgbGFuZ3VhZ2UgKyAnIGxhbmd1YWdlLScgKyBsYW5ndWFnZSArICdcIicgOiAnJykgKyAnPicgKyBjb2RlYmxvY2sgKyBlbmQgKyAnPC9jb2RlPjwvcHJlPic7XHJcblxyXG4gICAgY29kZWJsb2NrID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdoYXNoQmxvY2snKShjb2RlYmxvY2ssIG9wdGlvbnMsIGdsb2JhbHMpO1xyXG5cclxuICAgIC8vIFNpbmNlIEdIQ29kZWJsb2NrcyBjYW4gYmUgZmFsc2UgcG9zaXRpdmVzLCB3ZSBuZWVkIHRvXHJcbiAgICAvLyBzdG9yZSB0aGUgcHJpbWl0aXZlIHRleHQgYW5kIHRoZSBwYXJzZWQgdGV4dCBpbiBhIGdsb2JhbCB2YXIsXHJcbiAgICAvLyBhbmQgdGhlbiByZXR1cm4gYSB0b2tlblxyXG4gICAgcmV0dXJuICdcXG5cXG5+RycgKyAoZ2xvYmFscy5naENvZGVCbG9ja3MucHVzaCh7dGV4dDogd2hvbGVNYXRjaCwgY29kZWJsb2NrOiBjb2RlYmxvY2t9KSAtIDEpICsgJ0dcXG5cXG4nO1xyXG4gIH0pO1xyXG5cclxuICAvLyBhdHRhY2tsYWI6IHN0cmlwIHNlbnRpbmVsXHJcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvfjAvLCAnJyk7XHJcblxyXG4gIHJldHVybiBnbG9iYWxzLmNvbnZlcnRlci5fZGlzcGF0Y2goJ2dpdGh1YkNvZGVCbG9ja3MuYWZ0ZXInLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcclxufSk7XHJcblxyXG5zaG93ZG93bi5zdWJQYXJzZXIoJ2hhc2hCbG9jaycsIGZ1bmN0aW9uICh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoLyheXFxuK3xcXG4rJCkvZywgJycpO1xyXG4gIHJldHVybiAnXFxuXFxufksnICsgKGdsb2JhbHMuZ0h0bWxCbG9ja3MucHVzaCh0ZXh0KSAtIDEpICsgJ0tcXG5cXG4nO1xyXG59KTtcclxuXHJcbnNob3dkb3duLnN1YlBhcnNlcignaGFzaEVsZW1lbnQnLCBmdW5jdGlvbiAodGV4dCwgb3B0aW9ucywgZ2xvYmFscykge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgcmV0dXJuIGZ1bmN0aW9uICh3aG9sZU1hdGNoLCBtMSkge1xyXG4gICAgdmFyIGJsb2NrVGV4dCA9IG0xO1xyXG5cclxuICAgIC8vIFVuZG8gZG91YmxlIGxpbmVzXHJcbiAgICBibG9ja1RleHQgPSBibG9ja1RleHQucmVwbGFjZSgvXFxuXFxuL2csICdcXG4nKTtcclxuICAgIGJsb2NrVGV4dCA9IGJsb2NrVGV4dC5yZXBsYWNlKC9eXFxuLywgJycpO1xyXG5cclxuICAgIC8vIHN0cmlwIHRyYWlsaW5nIGJsYW5rIGxpbmVzXHJcbiAgICBibG9ja1RleHQgPSBibG9ja1RleHQucmVwbGFjZSgvXFxuKyQvZywgJycpO1xyXG5cclxuICAgIC8vIFJlcGxhY2UgdGhlIGVsZW1lbnQgdGV4dCB3aXRoIGEgbWFya2VyIChcIn5LeEtcIiB3aGVyZSB4IGlzIGl0cyBrZXkpXHJcbiAgICBibG9ja1RleHQgPSAnXFxuXFxufksnICsgKGdsb2JhbHMuZ0h0bWxCbG9ja3MucHVzaChibG9ja1RleHQpIC0gMSkgKyAnS1xcblxcbic7XHJcblxyXG4gICAgcmV0dXJuIGJsb2NrVGV4dDtcclxuICB9O1xyXG59KTtcclxuXHJcbnNob3dkb3duLnN1YlBhcnNlcignaGFzaEhUTUxCbG9ja3MnLCBmdW5jdGlvbiAodGV4dCwgb3B0aW9ucywgZ2xvYmFscykge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgdmFyIGJsb2NrVGFncyA9IFtcclxuICAgICAgJ3ByZScsXHJcbiAgICAgICdkaXYnLFxyXG4gICAgICAnaDEnLFxyXG4gICAgICAnaDInLFxyXG4gICAgICAnaDMnLFxyXG4gICAgICAnaDQnLFxyXG4gICAgICAnaDUnLFxyXG4gICAgICAnaDYnLFxyXG4gICAgICAnYmxvY2txdW90ZScsXHJcbiAgICAgICd0YWJsZScsXHJcbiAgICAgICdkbCcsXHJcbiAgICAgICdvbCcsXHJcbiAgICAgICd1bCcsXHJcbiAgICAgICdzY3JpcHQnLFxyXG4gICAgICAnbm9zY3JpcHQnLFxyXG4gICAgICAnZm9ybScsXHJcbiAgICAgICdmaWVsZHNldCcsXHJcbiAgICAgICdpZnJhbWUnLFxyXG4gICAgICAnbWF0aCcsXHJcbiAgICAgICdzdHlsZScsXHJcbiAgICAgICdzZWN0aW9uJyxcclxuICAgICAgJ2hlYWRlcicsXHJcbiAgICAgICdmb290ZXInLFxyXG4gICAgICAnbmF2JyxcclxuICAgICAgJ2FydGljbGUnLFxyXG4gICAgICAnYXNpZGUnLFxyXG4gICAgICAnYWRkcmVzcycsXHJcbiAgICAgICdhdWRpbycsXHJcbiAgICAgICdjYW52YXMnLFxyXG4gICAgICAnZmlndXJlJyxcclxuICAgICAgJ2hncm91cCcsXHJcbiAgICAgICdvdXRwdXQnLFxyXG4gICAgICAndmlkZW8nLFxyXG4gICAgICAncCdcclxuICAgIF0sXHJcbiAgICByZXBGdW5jID0gZnVuY3Rpb24gKHdob2xlTWF0Y2gsIG1hdGNoLCBsZWZ0LCByaWdodCkge1xyXG4gICAgICB2YXIgdHh0ID0gd2hvbGVNYXRjaDtcclxuICAgICAgLy8gY2hlY2sgaWYgdGhpcyBodG1sIGVsZW1lbnQgaXMgbWFya2VkIGFzIG1hcmtkb3duXHJcbiAgICAgIC8vIGlmIHNvLCBpdCdzIGNvbnRlbnRzIHNob3VsZCBiZSBwYXJzZWQgYXMgbWFya2Rvd25cclxuICAgICAgaWYgKGxlZnQuc2VhcmNoKC9cXGJtYXJrZG93blxcYi8pICE9PSAtMSkge1xyXG4gICAgICAgIHR4dCA9IGxlZnQgKyBnbG9iYWxzLmNvbnZlcnRlci5tYWtlSHRtbChtYXRjaCkgKyByaWdodDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gJ1xcblxcbn5LJyArIChnbG9iYWxzLmdIdG1sQmxvY2tzLnB1c2godHh0KSAtIDEpICsgJ0tcXG5cXG4nO1xyXG4gICAgfTtcclxuXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBibG9ja1RhZ3MubGVuZ3RoOyArK2kpIHtcclxuICAgIHRleHQgPSBzaG93ZG93bi5oZWxwZXIucmVwbGFjZVJlY3Vyc2l2ZVJlZ0V4cCh0ZXh0LCByZXBGdW5jLCAnXig/OiB8XFxcXHQpezAsM308JyArIGJsb2NrVGFnc1tpXSArICdcXFxcYltePl0qPicsICc8LycgKyBibG9ja1RhZ3NbaV0gKyAnPicsICdnaW0nKTtcclxuICB9XHJcblxyXG4gIC8vIEhSIFNQRUNJQUwgQ0FTRVxyXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhcXG5bIF17MCwzfSg8KGhyKVxcYihbXjw+XSkqP1xcLz8+KVsgXFx0XSooPz1cXG57Mix9KSkvZyxcclxuICAgIHNob3dkb3duLnN1YlBhcnNlcignaGFzaEVsZW1lbnQnKSh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKSk7XHJcblxyXG4gIC8vIFNwZWNpYWwgY2FzZSBmb3Igc3RhbmRhbG9uZSBIVE1MIGNvbW1lbnRzOlxyXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoLyg8IS0tW1xcc1xcU10qPy0tPikvZyxcclxuICAgIHNob3dkb3duLnN1YlBhcnNlcignaGFzaEVsZW1lbnQnKSh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKSk7XHJcblxyXG4gIC8vIFBIUCBhbmQgQVNQLXN0eWxlIHByb2Nlc3NvciBpbnN0cnVjdGlvbnMgKDw/Li4uPz4gYW5kIDwlLi4uJT4pXHJcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvKD86XFxuXFxuKShbIF17MCwzfSg/OjwoWz8lXSlbXlxccl0qP1xcMj4pWyBcXHRdKig/PVxcbnsyLH0pKS9nLFxyXG4gICAgc2hvd2Rvd24uc3ViUGFyc2VyKCdoYXNoRWxlbWVudCcpKHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpKTtcclxuICByZXR1cm4gdGV4dDtcclxufSk7XHJcblxyXG4vKipcclxuICogSGFzaCBzcGFuIGVsZW1lbnRzIHRoYXQgc2hvdWxkIG5vdCBiZSBwYXJzZWQgYXMgbWFya2Rvd25cclxuICovXHJcbnNob3dkb3duLnN1YlBhcnNlcignaGFzaEhUTUxTcGFucycsIGZ1bmN0aW9uICh0ZXh0LCBjb25maWcsIGdsb2JhbHMpIHtcclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIHZhciBtYXRjaGVzID0gc2hvd2Rvd24uaGVscGVyLm1hdGNoUmVjdXJzaXZlUmVnRXhwKHRleHQsICc8Y29kZVxcXFxiW14+XSo+JywgJzwvY29kZT4nLCAnZ2knKTtcclxuXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBtYXRjaGVzLmxlbmd0aDsgKytpKSB7XHJcbiAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKG1hdGNoZXNbaV1bMF0sICd+TCcgKyAoZ2xvYmFscy5nSHRtbFNwYW5zLnB1c2gobWF0Y2hlc1tpXVswXSkgLSAxKSArICdMJyk7XHJcbiAgfVxyXG4gIHJldHVybiB0ZXh0O1xyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBVbmhhc2ggSFRNTCBzcGFuc1xyXG4gKi9cclxuc2hvd2Rvd24uc3ViUGFyc2VyKCd1bmhhc2hIVE1MU3BhbnMnLCBmdW5jdGlvbiAodGV4dCwgY29uZmlnLCBnbG9iYWxzKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICBmb3IgKHZhciBpID0gMDsgaSA8IGdsb2JhbHMuZ0h0bWxTcGFucy5sZW5ndGg7ICsraSkge1xyXG4gICAgdGV4dCA9IHRleHQucmVwbGFjZSgnfkwnICsgaSArICdMJywgZ2xvYmFscy5nSHRtbFNwYW5zW2ldKTtcclxuICB9XHJcblxyXG4gIHJldHVybiB0ZXh0O1xyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBIYXNoIHNwYW4gZWxlbWVudHMgdGhhdCBzaG91bGQgbm90IGJlIHBhcnNlZCBhcyBtYXJrZG93blxyXG4gKi9cclxuc2hvd2Rvd24uc3ViUGFyc2VyKCdoYXNoUHJlQ29kZVRhZ3MnLCBmdW5jdGlvbiAodGV4dCwgY29uZmlnLCBnbG9iYWxzKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICB2YXIgcmVwRnVuYyA9IGZ1bmN0aW9uICh3aG9sZU1hdGNoLCBtYXRjaCwgbGVmdCwgcmlnaHQpIHtcclxuICAgIC8vIGVuY29kZSBodG1sIGVudGl0aWVzXHJcbiAgICB2YXIgY29kZWJsb2NrID0gbGVmdCArIHNob3dkb3duLnN1YlBhcnNlcignZW5jb2RlQ29kZScpKG1hdGNoKSArIHJpZ2h0O1xyXG4gICAgcmV0dXJuICdcXG5cXG5+RycgKyAoZ2xvYmFscy5naENvZGVCbG9ja3MucHVzaCh7dGV4dDogd2hvbGVNYXRjaCwgY29kZWJsb2NrOiBjb2RlYmxvY2t9KSAtIDEpICsgJ0dcXG5cXG4nO1xyXG4gIH07XHJcblxyXG4gIHRleHQgPSBzaG93ZG93bi5oZWxwZXIucmVwbGFjZVJlY3Vyc2l2ZVJlZ0V4cCh0ZXh0LCByZXBGdW5jLCAnXig/OiB8XFxcXHQpezAsM308cHJlXFxcXGJbXj5dKj5cXFxccyo8Y29kZVxcXFxiW14+XSo+JywgJ14oPzogfFxcXFx0KXswLDN9PC9jb2RlPlxcXFxzKjwvcHJlPicsICdnaW0nKTtcclxuICByZXR1cm4gdGV4dDtcclxufSk7XHJcblxyXG5zaG93ZG93bi5zdWJQYXJzZXIoJ2hlYWRlcnMnLCBmdW5jdGlvbiAodGV4dCwgb3B0aW9ucywgZ2xvYmFscykge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgdGV4dCA9IGdsb2JhbHMuY29udmVydGVyLl9kaXNwYXRjaCgnaGVhZGVycy5iZWZvcmUnLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcclxuXHJcbiAgdmFyIHByZWZpeEhlYWRlciA9IG9wdGlvbnMucHJlZml4SGVhZGVySWQsXHJcbiAgICAgIGhlYWRlckxldmVsU3RhcnQgPSAoaXNOYU4ocGFyc2VJbnQob3B0aW9ucy5oZWFkZXJMZXZlbFN0YXJ0KSkpID8gMSA6IHBhcnNlSW50KG9wdGlvbnMuaGVhZGVyTGV2ZWxTdGFydCksXHJcblxyXG4gIC8vIFNldCB0ZXh0LXN0eWxlIGhlYWRlcnM6XHJcbiAgLy9cdEhlYWRlciAxXHJcbiAgLy9cdD09PT09PT09XHJcbiAgLy9cclxuICAvL1x0SGVhZGVyIDJcclxuICAvL1x0LS0tLS0tLS1cclxuICAvL1xyXG4gICAgICBzZXRleHRSZWdleEgxID0gKG9wdGlvbnMuc21vb3RoTGl2ZVByZXZpZXcpID8gL14oLispWyBcXHRdKlxcbj17Mix9WyBcXHRdKlxcbisvZ20gOiAvXiguKylbIFxcdF0qXFxuPStbIFxcdF0qXFxuKy9nbSxcclxuICAgICAgc2V0ZXh0UmVnZXhIMiA9IChvcHRpb25zLnNtb290aExpdmVQcmV2aWV3KSA/IC9eKC4rKVsgXFx0XSpcXG4tezIsfVsgXFx0XSpcXG4rL2dtIDogL14oLispWyBcXHRdKlxcbi0rWyBcXHRdKlxcbisvZ207XHJcblxyXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2Uoc2V0ZXh0UmVnZXhIMSwgZnVuY3Rpb24gKHdob2xlTWF0Y2gsIG0xKSB7XHJcblxyXG4gICAgdmFyIHNwYW5HYW11dCA9IHNob3dkb3duLnN1YlBhcnNlcignc3BhbkdhbXV0JykobTEsIG9wdGlvbnMsIGdsb2JhbHMpLFxyXG4gICAgICAgIGhJRCA9IChvcHRpb25zLm5vSGVhZGVySWQpID8gJycgOiAnIGlkPVwiJyArIGhlYWRlcklkKG0xKSArICdcIicsXHJcbiAgICAgICAgaExldmVsID0gaGVhZGVyTGV2ZWxTdGFydCxcclxuICAgICAgICBoYXNoQmxvY2sgPSAnPGgnICsgaExldmVsICsgaElEICsgJz4nICsgc3BhbkdhbXV0ICsgJzwvaCcgKyBoTGV2ZWwgKyAnPic7XHJcbiAgICByZXR1cm4gc2hvd2Rvd24uc3ViUGFyc2VyKCdoYXNoQmxvY2snKShoYXNoQmxvY2ssIG9wdGlvbnMsIGdsb2JhbHMpO1xyXG4gIH0pO1xyXG5cclxuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKHNldGV4dFJlZ2V4SDIsIGZ1bmN0aW9uIChtYXRjaEZvdW5kLCBtMSkge1xyXG4gICAgdmFyIHNwYW5HYW11dCA9IHNob3dkb3duLnN1YlBhcnNlcignc3BhbkdhbXV0JykobTEsIG9wdGlvbnMsIGdsb2JhbHMpLFxyXG4gICAgICAgIGhJRCA9IChvcHRpb25zLm5vSGVhZGVySWQpID8gJycgOiAnIGlkPVwiJyArIGhlYWRlcklkKG0xKSArICdcIicsXHJcbiAgICAgICAgaExldmVsID0gaGVhZGVyTGV2ZWxTdGFydCArIDEsXHJcbiAgICAgIGhhc2hCbG9jayA9ICc8aCcgKyBoTGV2ZWwgKyBoSUQgKyAnPicgKyBzcGFuR2FtdXQgKyAnPC9oJyArIGhMZXZlbCArICc+JztcclxuICAgIHJldHVybiBzaG93ZG93bi5zdWJQYXJzZXIoJ2hhc2hCbG9jaycpKGhhc2hCbG9jaywgb3B0aW9ucywgZ2xvYmFscyk7XHJcbiAgfSk7XHJcblxyXG4gIC8vIGF0eC1zdHlsZSBoZWFkZXJzOlxyXG4gIC8vICAjIEhlYWRlciAxXHJcbiAgLy8gICMjIEhlYWRlciAyXHJcbiAgLy8gICMjIEhlYWRlciAyIHdpdGggY2xvc2luZyBoYXNoZXMgIyNcclxuICAvLyAgLi4uXHJcbiAgLy8gICMjIyMjIyBIZWFkZXIgNlxyXG4gIC8vXHJcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvXigjezEsNn0pWyBcXHRdKiguKz8pWyBcXHRdKiMqXFxuKy9nbSwgZnVuY3Rpb24gKHdob2xlTWF0Y2gsIG0xLCBtMikge1xyXG4gICAgdmFyIHNwYW4gPSBzaG93ZG93bi5zdWJQYXJzZXIoJ3NwYW5HYW11dCcpKG0yLCBvcHRpb25zLCBnbG9iYWxzKSxcclxuICAgICAgICBoSUQgPSAob3B0aW9ucy5ub0hlYWRlcklkKSA/ICcnIDogJyBpZD1cIicgKyBoZWFkZXJJZChtMikgKyAnXCInLFxyXG4gICAgICAgIGhMZXZlbCA9IGhlYWRlckxldmVsU3RhcnQgLSAxICsgbTEubGVuZ3RoLFxyXG4gICAgICAgIGhlYWRlciA9ICc8aCcgKyBoTGV2ZWwgKyBoSUQgKyAnPicgKyBzcGFuICsgJzwvaCcgKyBoTGV2ZWwgKyAnPic7XHJcblxyXG4gICAgcmV0dXJuIHNob3dkb3duLnN1YlBhcnNlcignaGFzaEJsb2NrJykoaGVhZGVyLCBvcHRpb25zLCBnbG9iYWxzKTtcclxuICB9KTtcclxuXHJcbiAgZnVuY3Rpb24gaGVhZGVySWQobSkge1xyXG4gICAgdmFyIHRpdGxlLCBlc2NhcGVkSWQgPSBtLnJlcGxhY2UoL1teXFx3XS9nLCAnJykudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICBpZiAoZ2xvYmFscy5oYXNoTGlua0NvdW50c1tlc2NhcGVkSWRdKSB7XHJcbiAgICAgIHRpdGxlID0gZXNjYXBlZElkICsgJy0nICsgKGdsb2JhbHMuaGFzaExpbmtDb3VudHNbZXNjYXBlZElkXSsrKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRpdGxlID0gZXNjYXBlZElkO1xyXG4gICAgICBnbG9iYWxzLmhhc2hMaW5rQ291bnRzW2VzY2FwZWRJZF0gPSAxO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFByZWZpeCBpZCB0byBwcmV2ZW50IGNhdXNpbmcgaW5hZHZlcnRlbnQgcHJlLWV4aXN0aW5nIHN0eWxlIG1hdGNoZXMuXHJcbiAgICBpZiAocHJlZml4SGVhZGVyID09PSB0cnVlKSB7XHJcbiAgICAgIHByZWZpeEhlYWRlciA9ICdzZWN0aW9uJztcclxuICAgIH1cclxuXHJcbiAgICBpZiAoc2hvd2Rvd24uaGVscGVyLmlzU3RyaW5nKHByZWZpeEhlYWRlcikpIHtcclxuICAgICAgcmV0dXJuIHByZWZpeEhlYWRlciArIHRpdGxlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRpdGxlO1xyXG4gIH1cclxuXHJcbiAgdGV4dCA9IGdsb2JhbHMuY29udmVydGVyLl9kaXNwYXRjaCgnaGVhZGVycy5hZnRlcicsIHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xyXG4gIHJldHVybiB0ZXh0O1xyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBUdXJuIE1hcmtkb3duIGltYWdlIHNob3J0Y3V0cyBpbnRvIDxpbWc+IHRhZ3MuXHJcbiAqL1xyXG5zaG93ZG93bi5zdWJQYXJzZXIoJ2ltYWdlcycsIGZ1bmN0aW9uICh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICB0ZXh0ID0gZ2xvYmFscy5jb252ZXJ0ZXIuX2Rpc3BhdGNoKCdpbWFnZXMuYmVmb3JlJywgdGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XHJcblxyXG4gIHZhciBpbmxpbmVSZWdFeHAgICAgPSAvIVxcWyguKj8pXVxccz9cXChbIFxcdF0qKCk8PyhcXFMrPyk+Pyg/OiA9KFsqXFxkXStbQS1aYS16JV17MCw0fSl4KFsqXFxkXStbQS1aYS16JV17MCw0fSkpP1sgXFx0XSooPzooWydcIl0pKC4qPylcXDZbIFxcdF0qKT9cXCkvZyxcclxuICAgICAgcmVmZXJlbmNlUmVnRXhwID0gLyFcXFsoW15cXF1dKj8pXSA/KD86XFxuICopP1xcWyguKj8pXSgpKCkoKSgpKCkvZztcclxuXHJcbiAgZnVuY3Rpb24gd3JpdGVJbWFnZVRhZyAod2hvbGVNYXRjaCwgYWx0VGV4dCwgbGlua0lkLCB1cmwsIHdpZHRoLCBoZWlnaHQsIG01LCB0aXRsZSkge1xyXG5cclxuICAgIHZhciBnVXJscyAgID0gZ2xvYmFscy5nVXJscyxcclxuICAgICAgICBnVGl0bGVzID0gZ2xvYmFscy5nVGl0bGVzLFxyXG4gICAgICAgIGdEaW1zICAgPSBnbG9iYWxzLmdEaW1lbnNpb25zO1xyXG5cclxuICAgIGxpbmtJZCA9IGxpbmtJZC50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgIGlmICghdGl0bGUpIHtcclxuICAgICAgdGl0bGUgPSAnJztcclxuICAgIH1cclxuXHJcbiAgICBpZiAodXJsID09PSAnJyB8fCB1cmwgPT09IG51bGwpIHtcclxuICAgICAgaWYgKGxpbmtJZCA9PT0gJycgfHwgbGlua0lkID09PSBudWxsKSB7XHJcbiAgICAgICAgLy8gbG93ZXItY2FzZSBhbmQgdHVybiBlbWJlZGRlZCBuZXdsaW5lcyBpbnRvIHNwYWNlc1xyXG4gICAgICAgIGxpbmtJZCA9IGFsdFRleHQudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC8gP1xcbi9nLCAnICcpO1xyXG4gICAgICB9XHJcbiAgICAgIHVybCA9ICcjJyArIGxpbmtJZDtcclxuXHJcbiAgICAgIGlmICghc2hvd2Rvd24uaGVscGVyLmlzVW5kZWZpbmVkKGdVcmxzW2xpbmtJZF0pKSB7XHJcbiAgICAgICAgdXJsID0gZ1VybHNbbGlua0lkXTtcclxuICAgICAgICBpZiAoIXNob3dkb3duLmhlbHBlci5pc1VuZGVmaW5lZChnVGl0bGVzW2xpbmtJZF0pKSB7XHJcbiAgICAgICAgICB0aXRsZSA9IGdUaXRsZXNbbGlua0lkXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFzaG93ZG93bi5oZWxwZXIuaXNVbmRlZmluZWQoZ0RpbXNbbGlua0lkXSkpIHtcclxuICAgICAgICAgIHdpZHRoID0gZ0RpbXNbbGlua0lkXS53aWR0aDtcclxuICAgICAgICAgIGhlaWdodCA9IGdEaW1zW2xpbmtJZF0uaGVpZ2h0O1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gd2hvbGVNYXRjaDtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFsdFRleHQgPSBhbHRUZXh0LnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKTtcclxuICAgIGFsdFRleHQgPSBzaG93ZG93bi5oZWxwZXIuZXNjYXBlQ2hhcmFjdGVycyhhbHRUZXh0LCAnKl8nLCBmYWxzZSk7XHJcbiAgICB1cmwgPSBzaG93ZG93bi5oZWxwZXIuZXNjYXBlQ2hhcmFjdGVycyh1cmwsICcqXycsIGZhbHNlKTtcclxuICAgIHZhciByZXN1bHQgPSAnPGltZyBzcmM9XCInICsgdXJsICsgJ1wiIGFsdD1cIicgKyBhbHRUZXh0ICsgJ1wiJztcclxuXHJcbiAgICBpZiAodGl0bGUpIHtcclxuICAgICAgdGl0bGUgPSB0aXRsZS5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7Jyk7XHJcbiAgICAgIHRpdGxlID0gc2hvd2Rvd24uaGVscGVyLmVzY2FwZUNoYXJhY3RlcnModGl0bGUsICcqXycsIGZhbHNlKTtcclxuICAgICAgcmVzdWx0ICs9ICcgdGl0bGU9XCInICsgdGl0bGUgKyAnXCInO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh3aWR0aCAmJiBoZWlnaHQpIHtcclxuICAgICAgd2lkdGggID0gKHdpZHRoID09PSAnKicpID8gJ2F1dG8nIDogd2lkdGg7XHJcbiAgICAgIGhlaWdodCA9IChoZWlnaHQgPT09ICcqJykgPyAnYXV0bycgOiBoZWlnaHQ7XHJcblxyXG4gICAgICByZXN1bHQgKz0gJyB3aWR0aD1cIicgKyB3aWR0aCArICdcIic7XHJcbiAgICAgIHJlc3VsdCArPSAnIGhlaWdodD1cIicgKyBoZWlnaHQgKyAnXCInO1xyXG4gICAgfVxyXG5cclxuICAgIHJlc3VsdCArPSAnIC8+JztcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG5cclxuICAvLyBGaXJzdCwgaGFuZGxlIHJlZmVyZW5jZS1zdHlsZSBsYWJlbGVkIGltYWdlczogIVthbHQgdGV4dF1baWRdXHJcbiAgdGV4dCA9IHRleHQucmVwbGFjZShyZWZlcmVuY2VSZWdFeHAsIHdyaXRlSW1hZ2VUYWcpO1xyXG5cclxuICAvLyBOZXh0LCBoYW5kbGUgaW5saW5lIGltYWdlczogICFbYWx0IHRleHRdKHVybCA9PHdpZHRoPng8aGVpZ2h0PiBcIm9wdGlvbmFsIHRpdGxlXCIpXHJcbiAgdGV4dCA9IHRleHQucmVwbGFjZShpbmxpbmVSZWdFeHAsIHdyaXRlSW1hZ2VUYWcpO1xyXG5cclxuICB0ZXh0ID0gZ2xvYmFscy5jb252ZXJ0ZXIuX2Rpc3BhdGNoKCdpbWFnZXMuYWZ0ZXInLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcclxuICByZXR1cm4gdGV4dDtcclxufSk7XHJcblxyXG5zaG93ZG93bi5zdWJQYXJzZXIoJ2l0YWxpY3NBbmRCb2xkJywgZnVuY3Rpb24gKHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpIHtcclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIHRleHQgPSBnbG9iYWxzLmNvbnZlcnRlci5fZGlzcGF0Y2goJ2l0YWxpY3NBbmRCb2xkLmJlZm9yZScsIHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xyXG5cclxuICBpZiAob3B0aW9ucy5saXRlcmFsTWlkV29yZFVuZGVyc2NvcmVzKSB7XHJcbiAgICAvL3VuZGVyc2NvcmVzXHJcbiAgICAvLyBTaW5jZSB3ZSBhcmUgY29uc3VtaW5nIGEgXFxzIGNoYXJhY3Rlciwgd2UgbmVlZCB0byBhZGQgaXRcclxuICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhefFxcc3w+fFxcYilfXyg/PVxcUykoW1xcc1xcU10rPylfXyg/PVxcYnw8fFxcc3wkKS9nbSwgJyQxPHN0cm9uZz4kMjwvc3Ryb25nPicpO1xyXG4gICAgdGV4dCA9IHRleHQucmVwbGFjZSgvKF58XFxzfD58XFxiKV8oPz1cXFMpKFtcXHNcXFNdKz8pXyg/PVxcYnw8fFxcc3wkKS9nbSwgJyQxPGVtPiQyPC9lbT4nKTtcclxuICAgIC8vYXN0ZXJpc2tzXHJcbiAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXFwqXFwqKSg/PVxcUykoW15cXHJdKj9cXFNbKl0qKVxcMS9nLCAnPHN0cm9uZz4kMjwvc3Ryb25nPicpO1xyXG4gICAgdGV4dCA9IHRleHQucmVwbGFjZSgvKFxcKikoPz1cXFMpKFteXFxyXSo/XFxTKVxcMS9nLCAnPGVtPiQyPC9lbT4nKTtcclxuXHJcbiAgfSBlbHNlIHtcclxuICAgIC8vIDxzdHJvbmc+IG11c3QgZ28gZmlyc3Q6XHJcbiAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXFwqXFwqfF9fKSg/PVxcUykoW15cXHJdKj9cXFNbKl9dKilcXDEvZywgJzxzdHJvbmc+JDI8L3N0cm9uZz4nKTtcclxuICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhcXCp8XykoPz1cXFMpKFteXFxyXSo/XFxTKVxcMS9nLCAnPGVtPiQyPC9lbT4nKTtcclxuICB9XHJcblxyXG4gIHRleHQgPSBnbG9iYWxzLmNvbnZlcnRlci5fZGlzcGF0Y2goJ2l0YWxpY3NBbmRCb2xkLmFmdGVyJywgdGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XHJcbiAgcmV0dXJuIHRleHQ7XHJcbn0pO1xyXG5cclxuLyoqXHJcbiAqIEZvcm0gSFRNTCBvcmRlcmVkIChudW1iZXJlZCkgYW5kIHVub3JkZXJlZCAoYnVsbGV0ZWQpIGxpc3RzLlxyXG4gKi9cclxuc2hvd2Rvd24uc3ViUGFyc2VyKCdsaXN0cycsIGZ1bmN0aW9uICh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICB0ZXh0ID0gZ2xvYmFscy5jb252ZXJ0ZXIuX2Rpc3BhdGNoKCdsaXN0cy5iZWZvcmUnLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcclxuICAvKipcclxuICAgKiBQcm9jZXNzIHRoZSBjb250ZW50cyBvZiBhIHNpbmdsZSBvcmRlcmVkIG9yIHVub3JkZXJlZCBsaXN0LCBzcGxpdHRpbmcgaXRcclxuICAgKiBpbnRvIGluZGl2aWR1YWwgbGlzdCBpdGVtcy5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbGlzdFN0clxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gdHJpbVRyYWlsaW5nXHJcbiAgICogQHJldHVybnMge3N0cmluZ31cclxuICAgKi9cclxuICBmdW5jdGlvbiBwcm9jZXNzTGlzdEl0ZW1zIChsaXN0U3RyLCB0cmltVHJhaWxpbmcpIHtcclxuICAgIC8vIFRoZSAkZ19saXN0X2xldmVsIGdsb2JhbCBrZWVwcyB0cmFjayBvZiB3aGVuIHdlJ3JlIGluc2lkZSBhIGxpc3QuXHJcbiAgICAvLyBFYWNoIHRpbWUgd2UgZW50ZXIgYSBsaXN0LCB3ZSBpbmNyZW1lbnQgaXQ7IHdoZW4gd2UgbGVhdmUgYSBsaXN0LFxyXG4gICAgLy8gd2UgZGVjcmVtZW50LiBJZiBpdCdzIHplcm8sIHdlJ3JlIG5vdCBpbiBhIGxpc3QgYW55bW9yZS5cclxuICAgIC8vXHJcbiAgICAvLyBXZSBkbyB0aGlzIGJlY2F1c2Ugd2hlbiB3ZSdyZSBub3QgaW5zaWRlIGEgbGlzdCwgd2Ugd2FudCB0byB0cmVhdFxyXG4gICAgLy8gc29tZXRoaW5nIGxpa2UgdGhpczpcclxuICAgIC8vXHJcbiAgICAvLyAgICBJIHJlY29tbWVuZCB1cGdyYWRpbmcgdG8gdmVyc2lvblxyXG4gICAgLy8gICAgOC4gT29wcywgbm93IHRoaXMgbGluZSBpcyB0cmVhdGVkXHJcbiAgICAvLyAgICBhcyBhIHN1Yi1saXN0LlxyXG4gICAgLy9cclxuICAgIC8vIEFzIGEgc2luZ2xlIHBhcmFncmFwaCwgZGVzcGl0ZSB0aGUgZmFjdCB0aGF0IHRoZSBzZWNvbmQgbGluZSBzdGFydHNcclxuICAgIC8vIHdpdGggYSBkaWdpdC1wZXJpb2Qtc3BhY2Ugc2VxdWVuY2UuXHJcbiAgICAvL1xyXG4gICAgLy8gV2hlcmVhcyB3aGVuIHdlJ3JlIGluc2lkZSBhIGxpc3QgKG9yIHN1Yi1saXN0KSwgdGhhdCBsaW5lIHdpbGwgYmVcclxuICAgIC8vIHRyZWF0ZWQgYXMgdGhlIHN0YXJ0IG9mIGEgc3ViLWxpc3QuIFdoYXQgYSBrbHVkZ2UsIGh1aD8gVGhpcyBpc1xyXG4gICAgLy8gYW4gYXNwZWN0IG9mIE1hcmtkb3duJ3Mgc3ludGF4IHRoYXQncyBoYXJkIHRvIHBhcnNlIHBlcmZlY3RseVxyXG4gICAgLy8gd2l0aG91dCByZXNvcnRpbmcgdG8gbWluZC1yZWFkaW5nLiBQZXJoYXBzIHRoZSBzb2x1dGlvbiBpcyB0b1xyXG4gICAgLy8gY2hhbmdlIHRoZSBzeW50YXggcnVsZXMgc3VjaCB0aGF0IHN1Yi1saXN0cyBtdXN0IHN0YXJ0IHdpdGggYVxyXG4gICAgLy8gc3RhcnRpbmcgY2FyZGluYWwgbnVtYmVyOyBlLmcuIFwiMS5cIiBvciBcImEuXCIuXHJcbiAgICBnbG9iYWxzLmdMaXN0TGV2ZWwrKztcclxuXHJcbiAgICAvLyB0cmltIHRyYWlsaW5nIGJsYW5rIGxpbmVzOlxyXG4gICAgbGlzdFN0ciA9IGxpc3RTdHIucmVwbGFjZSgvXFxuezIsfSQvLCAnXFxuJyk7XHJcblxyXG4gICAgLy8gYXR0YWNrbGFiOiBhZGQgc2VudGluZWwgdG8gZW11bGF0ZSBcXHpcclxuICAgIGxpc3RTdHIgKz0gJ34wJztcclxuXHJcbiAgICB2YXIgcmd4ID0gLyhcXG4pPyheWyBcXHRdKikoWyorLV18XFxkK1suXSlbIFxcdF0rKChcXFsoeHxYfCApP10pP1sgXFx0XSpbXlxccl0rPyhcXG57MSwyfSkpKD89XFxuKih+MHxcXDIoWyorLV18XFxkK1suXSlbIFxcdF0rKSkvZ20sXHJcbiAgICAgICAgaXNQYXJhZ3JhcGhlZCA9ICgvXFxuWyBcXHRdKlxcbig/IX4wKS8udGVzdChsaXN0U3RyKSk7XHJcblxyXG4gICAgbGlzdFN0ciA9IGxpc3RTdHIucmVwbGFjZShyZ3gsIGZ1bmN0aW9uICh3aG9sZU1hdGNoLCBtMSwgbTIsIG0zLCBtNCwgdGFza2J0biwgY2hlY2tlZCkge1xyXG4gICAgICBjaGVja2VkID0gKGNoZWNrZWQgJiYgY2hlY2tlZC50cmltKCkgIT09ICcnKTtcclxuICAgICAgdmFyIGl0ZW0gPSBzaG93ZG93bi5zdWJQYXJzZXIoJ291dGRlbnQnKShtNCwgb3B0aW9ucywgZ2xvYmFscyksXHJcbiAgICAgICAgICBidWxsZXRTdHlsZSA9ICcnO1xyXG5cclxuICAgICAgLy8gU3VwcG9ydCBmb3IgZ2l0aHViIHRhc2tsaXN0c1xyXG4gICAgICBpZiAodGFza2J0biAmJiBvcHRpb25zLnRhc2tsaXN0cykge1xyXG4gICAgICAgIGJ1bGxldFN0eWxlID0gJyBjbGFzcz1cInRhc2stbGlzdC1pdGVtXCIgc3R5bGU9XCJsaXN0LXN0eWxlLXR5cGU6IG5vbmU7XCInO1xyXG4gICAgICAgIGl0ZW0gPSBpdGVtLnJlcGxhY2UoL15bIFxcdF0qXFxbKHh8WHwgKT9dL20sIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHZhciBvdHAgPSAnPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIGRpc2FibGVkIHN0eWxlPVwibWFyZ2luOiAwcHggMC4zNWVtIDAuMjVlbSAtMS42ZW07IHZlcnRpY2FsLWFsaWduOiBtaWRkbGU7XCInO1xyXG4gICAgICAgICAgaWYgKGNoZWNrZWQpIHtcclxuICAgICAgICAgICAgb3RwICs9ICcgY2hlY2tlZCc7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBvdHAgKz0gJz4nO1xyXG4gICAgICAgICAgcmV0dXJuIG90cDtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgICAvLyBtMSAtIExlYWRpbmcgbGluZSBvclxyXG4gICAgICAvLyBIYXMgYSBkb3VibGUgcmV0dXJuIChtdWx0aSBwYXJhZ3JhcGgpIG9yXHJcbiAgICAgIC8vIEhhcyBzdWJsaXN0XHJcbiAgICAgIGlmIChtMSB8fCAoaXRlbS5zZWFyY2goL1xcbnsyLH0vKSA+IC0xKSkge1xyXG4gICAgICAgIGl0ZW0gPSBzaG93ZG93bi5zdWJQYXJzZXIoJ2dpdGh1YkNvZGVCbG9ja3MnKShpdGVtLCBvcHRpb25zLCBnbG9iYWxzKTtcclxuICAgICAgICBpdGVtID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdibG9ja0dhbXV0JykoaXRlbSwgb3B0aW9ucywgZ2xvYmFscyk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gUmVjdXJzaW9uIGZvciBzdWItbGlzdHM6XHJcbiAgICAgICAgaXRlbSA9IHNob3dkb3duLnN1YlBhcnNlcignbGlzdHMnKShpdGVtLCBvcHRpb25zLCBnbG9iYWxzKTtcclxuICAgICAgICBpdGVtID0gaXRlbS5yZXBsYWNlKC9cXG4kLywgJycpOyAvLyBjaG9tcChpdGVtKVxyXG4gICAgICAgIGlmIChpc1BhcmFncmFwaGVkKSB7XHJcbiAgICAgICAgICBpdGVtID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdwYXJhZ3JhcGhzJykoaXRlbSwgb3B0aW9ucywgZ2xvYmFscyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGl0ZW0gPSBzaG93ZG93bi5zdWJQYXJzZXIoJ3NwYW5HYW11dCcpKGl0ZW0sIG9wdGlvbnMsIGdsb2JhbHMpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBpdGVtID0gICdcXG48bGknICsgYnVsbGV0U3R5bGUgKyAnPicgKyBpdGVtICsgJzwvbGk+XFxuJztcclxuICAgICAgcmV0dXJuIGl0ZW07XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBhdHRhY2tsYWI6IHN0cmlwIHNlbnRpbmVsXHJcbiAgICBsaXN0U3RyID0gbGlzdFN0ci5yZXBsYWNlKC9+MC9nLCAnJyk7XHJcblxyXG4gICAgZ2xvYmFscy5nTGlzdExldmVsLS07XHJcblxyXG4gICAgaWYgKHRyaW1UcmFpbGluZykge1xyXG4gICAgICBsaXN0U3RyID0gbGlzdFN0ci5yZXBsYWNlKC9cXHMrJC8sICcnKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbGlzdFN0cjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENoZWNrIGFuZCBwYXJzZSBjb25zZWN1dGl2ZSBsaXN0cyAoYmV0dGVyIGZpeCBmb3IgaXNzdWUgIzE0MilcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbGlzdFxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBsaXN0VHlwZVxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gdHJpbVRyYWlsaW5nXHJcbiAgICogQHJldHVybnMge3N0cmluZ31cclxuICAgKi9cclxuICBmdW5jdGlvbiBwYXJzZUNvbnNlY3V0aXZlTGlzdHMobGlzdCwgbGlzdFR5cGUsIHRyaW1UcmFpbGluZykge1xyXG4gICAgLy8gY2hlY2sgaWYgd2UgY2F1Z2h0IDIgb3IgbW9yZSBjb25zZWN1dGl2ZSBsaXN0cyBieSBtaXN0YWtlXHJcbiAgICAvLyB3ZSB1c2UgdGhlIGNvdW50ZXJSZ3gsIG1lYW5pbmcgaWYgbGlzdFR5cGUgaXMgVUwgd2UgbG9vayBmb3IgVUwgYW5kIHZpY2UgdmVyc2FcclxuICAgIHZhciBjb3VudGVyUnhnID0gKGxpc3RUeXBlID09PSAndWwnKSA/IC9eIHswLDJ9XFxkK1xcLlsgXFx0XS9nbSA6IC9eIHswLDJ9WyorLV1bIFxcdF0vZ20sXHJcbiAgICAgIHN1Ykxpc3RzID0gW10sXHJcbiAgICAgIHJlc3VsdCA9ICcnO1xyXG5cclxuICAgIGlmIChsaXN0LnNlYXJjaChjb3VudGVyUnhnKSAhPT0gLTEpIHtcclxuICAgICAgKGZ1bmN0aW9uIHBhcnNlQ0wodHh0KSB7XHJcbiAgICAgICAgdmFyIHBvcyA9IHR4dC5zZWFyY2goY291bnRlclJ4Zyk7XHJcbiAgICAgICAgaWYgKHBvcyAhPT0gLTEpIHtcclxuICAgICAgICAgIC8vIHNsaWNlXHJcbiAgICAgICAgICByZXN1bHQgKz0gJ1xcblxcbjwnICsgbGlzdFR5cGUgKyAnPicgKyBwcm9jZXNzTGlzdEl0ZW1zKHR4dC5zbGljZSgwLCBwb3MpLCAhIXRyaW1UcmFpbGluZykgKyAnPC8nICsgbGlzdFR5cGUgKyAnPlxcblxcbic7XHJcblxyXG4gICAgICAgICAgLy8gaW52ZXJ0IGNvdW50ZXJUeXBlIGFuZCBsaXN0VHlwZVxyXG4gICAgICAgICAgbGlzdFR5cGUgPSAobGlzdFR5cGUgPT09ICd1bCcpID8gJ29sJyA6ICd1bCc7XHJcbiAgICAgICAgICBjb3VudGVyUnhnID0gKGxpc3RUeXBlID09PSAndWwnKSA/IC9eIHswLDJ9XFxkK1xcLlsgXFx0XS9nbSA6IC9eIHswLDJ9WyorLV1bIFxcdF0vZ207XHJcblxyXG4gICAgICAgICAgLy9yZWN1cnNlXHJcbiAgICAgICAgICBwYXJzZUNMKHR4dC5zbGljZShwb3MpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcmVzdWx0ICs9ICdcXG5cXG48JyArIGxpc3RUeXBlICsgJz4nICsgcHJvY2Vzc0xpc3RJdGVtcyh0eHQsICEhdHJpbVRyYWlsaW5nKSArICc8LycgKyBsaXN0VHlwZSArICc+XFxuXFxuJztcclxuICAgICAgICB9XHJcbiAgICAgIH0pKGxpc3QpO1xyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN1Ykxpc3RzLmxlbmd0aDsgKytpKSB7XHJcblxyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXN1bHQgPSAnXFxuXFxuPCcgKyBsaXN0VHlwZSArICc+JyArIHByb2Nlc3NMaXN0SXRlbXMobGlzdCwgISF0cmltVHJhaWxpbmcpICsgJzwvJyArIGxpc3RUeXBlICsgJz5cXG5cXG4nO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG5cclxuICAvLyBhdHRhY2tsYWI6IGFkZCBzZW50aW5lbCB0byBoYWNrIGFyb3VuZCBraHRtbC9zYWZhcmkgYnVnOlxyXG4gIC8vIGh0dHA6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTExMjMxXHJcbiAgdGV4dCArPSAnfjAnO1xyXG5cclxuICAvLyBSZS11c2FibGUgcGF0dGVybiB0byBtYXRjaCBhbnkgZW50aXJlIHVsIG9yIG9sIGxpc3Q6XHJcbiAgdmFyIHdob2xlTGlzdCA9IC9eKChbIF17MCwzfShbKistXXxcXGQrWy5dKVsgXFx0XSspW15cXHJdKz8ofjB8XFxuezIsfSg/PVxcUykoPyFbIFxcdF0qKD86WyorLV18XFxkK1suXSlbIFxcdF0rKSkpL2dtO1xyXG5cclxuICBpZiAoZ2xvYmFscy5nTGlzdExldmVsKSB7XHJcbiAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKHdob2xlTGlzdCwgZnVuY3Rpb24gKHdob2xlTWF0Y2gsIGxpc3QsIG0yKSB7XHJcbiAgICAgIHZhciBsaXN0VHlwZSA9IChtMi5zZWFyY2goL1sqKy1dL2cpID4gLTEpID8gJ3VsJyA6ICdvbCc7XHJcbiAgICAgIHJldHVybiBwYXJzZUNvbnNlY3V0aXZlTGlzdHMobGlzdCwgbGlzdFR5cGUsIHRydWUpO1xyXG4gICAgfSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHdob2xlTGlzdCA9IC8oXFxuXFxufF5cXG4/KSgoWyBdezAsM30oWyorLV18XFxkK1suXSlbIFxcdF0rKVteXFxyXSs/KH4wfFxcbnsyLH0oPz1cXFMpKD8hWyBcXHRdKig/OlsqKy1dfFxcZCtbLl0pWyBcXHRdKykpKS9nbTtcclxuICAgIC8vd2hvbGVMaXN0ID0gLyhcXG5cXG58Xlxcbj8pKCB7MCwzfShbKistXXxcXGQrXFwuKVsgXFx0XStbXFxzXFxTXSs/KSg/PSh+MCl8KFxcblxcbig/IVxcdHwgezIsfXwgezAsM30oWyorLV18XFxkK1xcLilbIFxcdF0pKSkvZztcclxuICAgIHRleHQgPSB0ZXh0LnJlcGxhY2Uod2hvbGVMaXN0LCBmdW5jdGlvbiAod2hvbGVNYXRjaCwgbTEsIGxpc3QsIG0zKSB7XHJcblxyXG4gICAgICB2YXIgbGlzdFR5cGUgPSAobTMuc2VhcmNoKC9bKistXS9nKSA+IC0xKSA/ICd1bCcgOiAnb2wnO1xyXG4gICAgICByZXR1cm4gcGFyc2VDb25zZWN1dGl2ZUxpc3RzKGxpc3QsIGxpc3RUeXBlKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLy8gYXR0YWNrbGFiOiBzdHJpcCBzZW50aW5lbFxyXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoL34wLywgJycpO1xyXG5cclxuICB0ZXh0ID0gZ2xvYmFscy5jb252ZXJ0ZXIuX2Rpc3BhdGNoKCdsaXN0cy5hZnRlcicsIHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xyXG4gIHJldHVybiB0ZXh0O1xyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBSZW1vdmUgb25lIGxldmVsIG9mIGxpbmUtbGVhZGluZyB0YWJzIG9yIHNwYWNlc1xyXG4gKi9cclxuc2hvd2Rvd24uc3ViUGFyc2VyKCdvdXRkZW50JywgZnVuY3Rpb24gKHRleHQpIHtcclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIC8vIGF0dGFja2xhYjogaGFjayBhcm91bmQgS29ucXVlcm9yIDMuNS40IGJ1ZzpcclxuICAvLyBcIi0tLS0tLS0tLS1idWdcIi5yZXBsYWNlKC9eLS9nLFwiXCIpID09IFwiYnVnXCJcclxuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eKFxcdHxbIF17MSw0fSkvZ20sICd+MCcpOyAvLyBhdHRhY2tsYWI6IGdfdGFiX3dpZHRoXHJcblxyXG4gIC8vIGF0dGFja2xhYjogY2xlYW4gdXAgaGFja1xyXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoL34wL2csICcnKTtcclxuXHJcbiAgcmV0dXJuIHRleHQ7XHJcbn0pO1xyXG5cclxuLyoqXHJcbiAqXHJcbiAqL1xyXG5zaG93ZG93bi5zdWJQYXJzZXIoJ3BhcmFncmFwaHMnLCBmdW5jdGlvbiAodGV4dCwgb3B0aW9ucywgZ2xvYmFscykge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgdGV4dCA9IGdsb2JhbHMuY29udmVydGVyLl9kaXNwYXRjaCgncGFyYWdyYXBocy5iZWZvcmUnLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcclxuICAvLyBTdHJpcCBsZWFkaW5nIGFuZCB0cmFpbGluZyBsaW5lczpcclxuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eXFxuKy9nLCAnJyk7XHJcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvXFxuKyQvZywgJycpO1xyXG5cclxuICB2YXIgZ3JhZnMgPSB0ZXh0LnNwbGl0KC9cXG57Mix9L2cpLFxyXG4gICAgICBncmFmc091dCA9IFtdLFxyXG4gICAgICBlbmQgPSBncmFmcy5sZW5ndGg7IC8vIFdyYXAgPHA+IHRhZ3NcclxuXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbmQ7IGkrKykge1xyXG4gICAgdmFyIHN0ciA9IGdyYWZzW2ldO1xyXG4gICAgLy8gaWYgdGhpcyBpcyBhbiBIVE1MIG1hcmtlciwgY29weSBpdFxyXG4gICAgaWYgKHN0ci5zZWFyY2goL34oS3xHKShcXGQrKVxcMS9nKSA+PSAwKSB7XHJcbiAgICAgIGdyYWZzT3V0LnB1c2goc3RyKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHN0ciA9IHNob3dkb3duLnN1YlBhcnNlcignc3BhbkdhbXV0Jykoc3RyLCBvcHRpb25zLCBnbG9iYWxzKTtcclxuICAgICAgc3RyID0gc3RyLnJlcGxhY2UoL14oWyBcXHRdKikvZywgJzxwPicpO1xyXG4gICAgICBzdHIgKz0gJzwvcD4nO1xyXG4gICAgICBncmFmc091dC5wdXNoKHN0cik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKiogVW5oYXNoaWZ5IEhUTUwgYmxvY2tzICovXHJcbiAgZW5kID0gZ3JhZnNPdXQubGVuZ3RoO1xyXG4gIGZvciAoaSA9IDA7IGkgPCBlbmQ7IGkrKykge1xyXG4gICAgdmFyIGJsb2NrVGV4dCA9ICcnLFxyXG4gICAgICAgIGdyYWZzT3V0SXQgPSBncmFmc091dFtpXSxcclxuICAgICAgICBjb2RlRmxhZyA9IGZhbHNlO1xyXG4gICAgLy8gaWYgdGhpcyBpcyBhIG1hcmtlciBmb3IgYW4gaHRtbCBibG9jay4uLlxyXG4gICAgd2hpbGUgKGdyYWZzT3V0SXQuc2VhcmNoKC9+KEt8RykoXFxkKylcXDEvKSA+PSAwKSB7XHJcbiAgICAgIHZhciBkZWxpbSA9IFJlZ0V4cC4kMSxcclxuICAgICAgICAgIG51bSAgID0gUmVnRXhwLiQyO1xyXG5cclxuICAgICAgaWYgKGRlbGltID09PSAnSycpIHtcclxuICAgICAgICBibG9ja1RleHQgPSBnbG9iYWxzLmdIdG1sQmxvY2tzW251bV07XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gd2UgbmVlZCB0byBjaGVjayBpZiBnaEJsb2NrIGlzIGEgZmFsc2UgcG9zaXRpdmVcclxuICAgICAgICBpZiAoY29kZUZsYWcpIHtcclxuICAgICAgICAgIC8vIHVzZSBlbmNvZGVkIHZlcnNpb24gb2YgYWxsIHRleHRcclxuICAgICAgICAgIGJsb2NrVGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcignZW5jb2RlQ29kZScpKGdsb2JhbHMuZ2hDb2RlQmxvY2tzW251bV0udGV4dCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGJsb2NrVGV4dCA9IGdsb2JhbHMuZ2hDb2RlQmxvY2tzW251bV0uY29kZWJsb2NrO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBibG9ja1RleHQgPSBibG9ja1RleHQucmVwbGFjZSgvXFwkL2csICckJCQkJyk7IC8vIEVzY2FwZSBhbnkgZG9sbGFyIHNpZ25zXHJcblxyXG4gICAgICBncmFmc091dEl0ID0gZ3JhZnNPdXRJdC5yZXBsYWNlKC8oXFxuXFxuKT9+KEt8RylcXGQrXFwyKFxcblxcbik/LywgYmxvY2tUZXh0KTtcclxuICAgICAgLy8gQ2hlY2sgaWYgZ3JhZnNPdXRJdCBpcyBhIHByZS0+Y29kZVxyXG4gICAgICBpZiAoL148cHJlXFxiW14+XSo+XFxzKjxjb2RlXFxiW14+XSo+Ly50ZXN0KGdyYWZzT3V0SXQpKSB7XHJcbiAgICAgICAgY29kZUZsYWcgPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBncmFmc091dFtpXSA9IGdyYWZzT3V0SXQ7XHJcbiAgfVxyXG4gIHRleHQgPSBncmFmc091dC5qb2luKCdcXG5cXG4nKTtcclxuICAvLyBTdHJpcCBsZWFkaW5nIGFuZCB0cmFpbGluZyBsaW5lczpcclxuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eXFxuKy9nLCAnJyk7XHJcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvXFxuKyQvZywgJycpO1xyXG4gIHJldHVybiBnbG9iYWxzLmNvbnZlcnRlci5fZGlzcGF0Y2goJ3BhcmFncmFwaHMuYWZ0ZXInLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcclxufSk7XHJcblxyXG4vKipcclxuICogUnVuIGV4dGVuc2lvblxyXG4gKi9cclxuc2hvd2Rvd24uc3ViUGFyc2VyKCdydW5FeHRlbnNpb24nLCBmdW5jdGlvbiAoZXh0LCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICBpZiAoZXh0LmZpbHRlcikge1xyXG4gICAgdGV4dCA9IGV4dC5maWx0ZXIodGV4dCwgZ2xvYmFscy5jb252ZXJ0ZXIsIG9wdGlvbnMpO1xyXG5cclxuICB9IGVsc2UgaWYgKGV4dC5yZWdleCkge1xyXG4gICAgLy8gVE9ETyByZW1vdmUgdGhpcyB3aGVuIG9sZCBleHRlbnNpb24gbG9hZGluZyBtZWNoYW5pc20gaXMgZGVwcmVjYXRlZFxyXG4gICAgdmFyIHJlID0gZXh0LnJlZ2V4O1xyXG4gICAgaWYgKCFyZSBpbnN0YW5jZW9mIFJlZ0V4cCkge1xyXG4gICAgICByZSA9IG5ldyBSZWdFeHAocmUsICdnJyk7XHJcbiAgICB9XHJcbiAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKHJlLCBleHQucmVwbGFjZSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gdGV4dDtcclxufSk7XHJcblxyXG4vKipcclxuICogVGhlc2UgYXJlIGFsbCB0aGUgdHJhbnNmb3JtYXRpb25zIHRoYXQgb2NjdXIgKndpdGhpbiogYmxvY2stbGV2ZWxcclxuICogdGFncyBsaWtlIHBhcmFncmFwaHMsIGhlYWRlcnMsIGFuZCBsaXN0IGl0ZW1zLlxyXG4gKi9cclxuc2hvd2Rvd24uc3ViUGFyc2VyKCdzcGFuR2FtdXQnLCBmdW5jdGlvbiAodGV4dCwgb3B0aW9ucywgZ2xvYmFscykge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgdGV4dCA9IGdsb2JhbHMuY29udmVydGVyLl9kaXNwYXRjaCgnc3BhbkdhbXV0LmJlZm9yZScsIHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xyXG4gIHRleHQgPSBzaG93ZG93bi5zdWJQYXJzZXIoJ2NvZGVTcGFucycpKHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xyXG4gIHRleHQgPSBzaG93ZG93bi5zdWJQYXJzZXIoJ2VzY2FwZVNwZWNpYWxDaGFyc1dpdGhpblRhZ0F0dHJpYnV0ZXMnKSh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcclxuICB0ZXh0ID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdlbmNvZGVCYWNrc2xhc2hFc2NhcGVzJykodGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XHJcblxyXG4gIC8vIFByb2Nlc3MgYW5jaG9yIGFuZCBpbWFnZSB0YWdzLiBJbWFnZXMgbXVzdCBjb21lIGZpcnN0LFxyXG4gIC8vIGJlY2F1c2UgIVtmb29dW2ZdIGxvb2tzIGxpa2UgYW4gYW5jaG9yLlxyXG4gIHRleHQgPSBzaG93ZG93bi5zdWJQYXJzZXIoJ2ltYWdlcycpKHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xyXG4gIHRleHQgPSBzaG93ZG93bi5zdWJQYXJzZXIoJ2FuY2hvcnMnKSh0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcclxuXHJcbiAgLy8gTWFrZSBsaW5rcyBvdXQgb2YgdGhpbmdzIGxpa2UgYDxodHRwOi8vZXhhbXBsZS5jb20vPmBcclxuICAvLyBNdXN0IGNvbWUgYWZ0ZXIgX0RvQW5jaG9ycygpLCBiZWNhdXNlIHlvdSBjYW4gdXNlIDwgYW5kID5cclxuICAvLyBkZWxpbWl0ZXJzIGluIGlubGluZSBsaW5rcyBsaWtlIFt0aGlzXSg8dXJsPikuXHJcbiAgdGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcignYXV0b0xpbmtzJykodGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XHJcbiAgdGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcignZW5jb2RlQW1wc0FuZEFuZ2xlcycpKHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xyXG4gIHRleHQgPSBzaG93ZG93bi5zdWJQYXJzZXIoJ2l0YWxpY3NBbmRCb2xkJykodGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XHJcbiAgdGV4dCA9IHNob3dkb3duLnN1YlBhcnNlcignc3RyaWtldGhyb3VnaCcpKHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpO1xyXG5cclxuICAvLyBEbyBoYXJkIGJyZWFrczpcclxuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC8gICtcXG4vZywgJyA8YnIgLz5cXG4nKTtcclxuXHJcbiAgdGV4dCA9IGdsb2JhbHMuY29udmVydGVyLl9kaXNwYXRjaCgnc3BhbkdhbXV0LmFmdGVyJywgdGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XHJcbiAgcmV0dXJuIHRleHQ7XHJcbn0pO1xyXG5cclxuc2hvd2Rvd24uc3ViUGFyc2VyKCdzdHJpa2V0aHJvdWdoJywgZnVuY3Rpb24gKHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpIHtcclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIGlmIChvcHRpb25zLnN0cmlrZXRocm91Z2gpIHtcclxuICAgIHRleHQgPSBnbG9iYWxzLmNvbnZlcnRlci5fZGlzcGF0Y2goJ3N0cmlrZXRocm91Z2guYmVmb3JlJywgdGV4dCwgb3B0aW9ucywgZ2xvYmFscyk7XHJcbiAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oPzp+VCl7Mn0oW1xcc1xcU10rPykoPzp+VCl7Mn0vZywgJzxkZWw+JDE8L2RlbD4nKTtcclxuICAgIHRleHQgPSBnbG9iYWxzLmNvbnZlcnRlci5fZGlzcGF0Y2goJ3N0cmlrZXRocm91Z2guYWZ0ZXInLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcclxuICB9XHJcblxyXG4gIHJldHVybiB0ZXh0O1xyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBTdHJpcCBhbnkgbGluZXMgY29uc2lzdGluZyBvbmx5IG9mIHNwYWNlcyBhbmQgdGFicy5cclxuICogVGhpcyBtYWtlcyBzdWJzZXF1ZW50IHJlZ2V4cyBlYXNpZXIgdG8gd3JpdGUsIGJlY2F1c2Ugd2UgY2FuXHJcbiAqIG1hdGNoIGNvbnNlY3V0aXZlIGJsYW5rIGxpbmVzIHdpdGggL1xcbisvIGluc3RlYWQgb2Ygc29tZXRoaW5nXHJcbiAqIGNvbnRvcnRlZCBsaWtlIC9bIFxcdF0qXFxuKy9cclxuICovXHJcbnNob3dkb3duLnN1YlBhcnNlcignc3RyaXBCbGFua0xpbmVzJywgZnVuY3Rpb24gKHRleHQpIHtcclxuICAndXNlIHN0cmljdCc7XHJcbiAgcmV0dXJuIHRleHQucmVwbGFjZSgvXlsgXFx0XSskL21nLCAnJyk7XHJcbn0pO1xyXG5cclxuLyoqXHJcbiAqIFN0cmlwcyBsaW5rIGRlZmluaXRpb25zIGZyb20gdGV4dCwgc3RvcmVzIHRoZSBVUkxzIGFuZCB0aXRsZXMgaW5cclxuICogaGFzaCByZWZlcmVuY2VzLlxyXG4gKiBMaW5rIGRlZnMgYXJlIGluIHRoZSBmb3JtOiBeW2lkXTogdXJsIFwib3B0aW9uYWwgdGl0bGVcIlxyXG4gKlxyXG4gKiBeWyBdezAsM31cXFsoLispXFxdOiAvLyBpZCA9ICQxICBhdHRhY2tsYWI6IGdfdGFiX3dpZHRoIC0gMVxyXG4gKiBbIFxcdF0qXHJcbiAqIFxcbj8gICAgICAgICAgICAgICAgICAvLyBtYXliZSAqb25lKiBuZXdsaW5lXHJcbiAqIFsgXFx0XSpcclxuICogPD8oXFxTKz8pPj8gICAgICAgICAgLy8gdXJsID0gJDJcclxuICogWyBcXHRdKlxyXG4gKiBcXG4/ICAgICAgICAgICAgICAgIC8vIG1heWJlIG9uZSBuZXdsaW5lXHJcbiAqIFsgXFx0XSpcclxuICogKD86XHJcbiAqIChcXG4qKSAgICAgICAgICAgICAgLy8gYW55IGxpbmVzIHNraXBwZWQgPSAkMyBhdHRhY2tsYWI6IGxvb2tiZWhpbmQgcmVtb3ZlZFxyXG4gKiBbXCIoXVxyXG4gKiAoLis/KSAgICAgICAgICAgICAgLy8gdGl0bGUgPSAkNFxyXG4gKiBbXCIpXVxyXG4gKiBbIFxcdF0qXHJcbiAqICk/ICAgICAgICAgICAgICAgICAvLyB0aXRsZSBpcyBvcHRpb25hbFxyXG4gKiAoPzpcXG4rfCQpXHJcbiAqIC9nbSxcclxuICogZnVuY3Rpb24oKXsuLi59KTtcclxuICpcclxuICovXHJcbnNob3dkb3duLnN1YlBhcnNlcignc3RyaXBMaW5rRGVmaW5pdGlvbnMnLCBmdW5jdGlvbiAodGV4dCwgb3B0aW9ucywgZ2xvYmFscykge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgdmFyIHJlZ2V4ID0gL14gezAsM31cXFsoLispXTpbIFxcdF0qXFxuP1sgXFx0XSo8PyhcXFMrPyk+Pyg/OiA9KFsqXFxkXStbQS1aYS16JV17MCw0fSl4KFsqXFxkXStbQS1aYS16JV17MCw0fSkpP1sgXFx0XSpcXG4/WyBcXHRdKig/OihcXG4qKVtcInwnKF0oLis/KVtcInwnKV1bIFxcdF0qKT8oPzpcXG4rfCg/PX4wKSkvZ207XHJcblxyXG4gIC8vIGF0dGFja2xhYjogc2VudGluZWwgd29ya2Fyb3VuZHMgZm9yIGxhY2sgb2YgXFxBIGFuZCBcXFosIHNhZmFyaVxca2h0bWwgYnVnXHJcbiAgdGV4dCArPSAnfjAnO1xyXG5cclxuICB0ZXh0ID0gdGV4dC5yZXBsYWNlKHJlZ2V4LCBmdW5jdGlvbiAod2hvbGVNYXRjaCwgbGlua0lkLCB1cmwsIHdpZHRoLCBoZWlnaHQsIGJsYW5rTGluZXMsIHRpdGxlKSB7XHJcbiAgICBsaW5rSWQgPSBsaW5rSWQudG9Mb3dlckNhc2UoKTtcclxuICAgIGdsb2JhbHMuZ1VybHNbbGlua0lkXSA9IHNob3dkb3duLnN1YlBhcnNlcignZW5jb2RlQW1wc0FuZEFuZ2xlcycpKHVybCk7ICAvLyBMaW5rIElEcyBhcmUgY2FzZS1pbnNlbnNpdGl2ZVxyXG5cclxuICAgIGlmIChibGFua0xpbmVzKSB7XHJcbiAgICAgIC8vIE9vcHMsIGZvdW5kIGJsYW5rIGxpbmVzLCBzbyBpdCdzIG5vdCBhIHRpdGxlLlxyXG4gICAgICAvLyBQdXQgYmFjayB0aGUgcGFyZW50aGV0aWNhbCBzdGF0ZW1lbnQgd2Ugc3RvbGUuXHJcbiAgICAgIHJldHVybiBibGFua0xpbmVzICsgdGl0bGU7XHJcblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKHRpdGxlKSB7XHJcbiAgICAgICAgZ2xvYmFscy5nVGl0bGVzW2xpbmtJZF0gPSB0aXRsZS5yZXBsYWNlKC9cInwnL2csICcmcXVvdDsnKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAob3B0aW9ucy5wYXJzZUltZ0RpbWVuc2lvbnMgJiYgd2lkdGggJiYgaGVpZ2h0KSB7XHJcbiAgICAgICAgZ2xvYmFscy5nRGltZW5zaW9uc1tsaW5rSWRdID0ge1xyXG4gICAgICAgICAgd2lkdGg6ICB3aWR0aCxcclxuICAgICAgICAgIGhlaWdodDogaGVpZ2h0XHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gQ29tcGxldGVseSByZW1vdmUgdGhlIGRlZmluaXRpb24gZnJvbSB0aGUgdGV4dFxyXG4gICAgcmV0dXJuICcnO1xyXG4gIH0pO1xyXG5cclxuICAvLyBhdHRhY2tsYWI6IHN0cmlwIHNlbnRpbmVsXHJcbiAgdGV4dCA9IHRleHQucmVwbGFjZSgvfjAvLCAnJyk7XHJcblxyXG4gIHJldHVybiB0ZXh0O1xyXG59KTtcclxuXHJcbnNob3dkb3duLnN1YlBhcnNlcigndGFibGVzJywgZnVuY3Rpb24gKHRleHQsIG9wdGlvbnMsIGdsb2JhbHMpIHtcclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIGlmICghb3B0aW9ucy50YWJsZXMpIHtcclxuICAgIHJldHVybiB0ZXh0O1xyXG4gIH1cclxuXHJcbiAgdmFyIHRhYmxlUmd4ID0gL15bIFxcdF17MCwzfVxcfD8uK1xcfC4rXFxuWyBcXHRdezAsM31cXHw/WyBcXHRdKjo/WyBcXHRdKig/Oi18PSl7Mix9WyBcXHRdKjo/WyBcXHRdKlxcfFsgXFx0XSo6P1sgXFx0XSooPzotfD0pezIsfVtcXHNcXFNdKz8oPzpcXG5cXG58fjApL2dtO1xyXG5cclxuICBmdW5jdGlvbiBwYXJzZVN0eWxlcyhzTGluZSkge1xyXG4gICAgaWYgKC9eOlsgXFx0XSotLSokLy50ZXN0KHNMaW5lKSkge1xyXG4gICAgICByZXR1cm4gJyBzdHlsZT1cInRleHQtYWxpZ246bGVmdDtcIic7XHJcbiAgICB9IGVsc2UgaWYgKC9eLS0qWyBcXHRdKjpbIFxcdF0qJC8udGVzdChzTGluZSkpIHtcclxuICAgICAgcmV0dXJuICcgc3R5bGU9XCJ0ZXh0LWFsaWduOnJpZ2h0O1wiJztcclxuICAgIH0gZWxzZSBpZiAoL146WyBcXHRdKi0tKlsgXFx0XSo6JC8udGVzdChzTGluZSkpIHtcclxuICAgICAgcmV0dXJuICcgc3R5bGU9XCJ0ZXh0LWFsaWduOmNlbnRlcjtcIic7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gJyc7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBwYXJzZUhlYWRlcnMoaGVhZGVyLCBzdHlsZSkge1xyXG4gICAgdmFyIGlkID0gJyc7XHJcbiAgICBoZWFkZXIgPSBoZWFkZXIudHJpbSgpO1xyXG4gICAgaWYgKG9wdGlvbnMudGFibGVIZWFkZXJJZCkge1xyXG4gICAgICBpZCA9ICcgaWQ9XCInICsgaGVhZGVyLnJlcGxhY2UoLyAvZywgJ18nKS50b0xvd2VyQ2FzZSgpICsgJ1wiJztcclxuICAgIH1cclxuICAgIGhlYWRlciA9IHNob3dkb3duLnN1YlBhcnNlcignc3BhbkdhbXV0JykoaGVhZGVyLCBvcHRpb25zLCBnbG9iYWxzKTtcclxuXHJcbiAgICByZXR1cm4gJzx0aCcgKyBpZCArIHN0eWxlICsgJz4nICsgaGVhZGVyICsgJzwvdGg+XFxuJztcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHBhcnNlQ2VsbHMoY2VsbCwgc3R5bGUpIHtcclxuICAgIHZhciBzdWJUZXh0ID0gc2hvd2Rvd24uc3ViUGFyc2VyKCdzcGFuR2FtdXQnKShjZWxsLCBvcHRpb25zLCBnbG9iYWxzKTtcclxuICAgIHJldHVybiAnPHRkJyArIHN0eWxlICsgJz4nICsgc3ViVGV4dCArICc8L3RkPlxcbic7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBidWlsZFRhYmxlKGhlYWRlcnMsIGNlbGxzKSB7XHJcbiAgICB2YXIgdGIgPSAnPHRhYmxlPlxcbjx0aGVhZD5cXG48dHI+XFxuJyxcclxuICAgICAgICB0YmxMZ24gPSBoZWFkZXJzLmxlbmd0aDtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRibExnbjsgKytpKSB7XHJcbiAgICAgIHRiICs9IGhlYWRlcnNbaV07XHJcbiAgICB9XHJcbiAgICB0YiArPSAnPC90cj5cXG48L3RoZWFkPlxcbjx0Ym9keT5cXG4nO1xyXG5cclxuICAgIGZvciAoaSA9IDA7IGkgPCBjZWxscy5sZW5ndGg7ICsraSkge1xyXG4gICAgICB0YiArPSAnPHRyPlxcbic7XHJcbiAgICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCB0YmxMZ247ICsraWkpIHtcclxuICAgICAgICB0YiArPSBjZWxsc1tpXVtpaV07XHJcbiAgICAgIH1cclxuICAgICAgdGIgKz0gJzwvdHI+XFxuJztcclxuICAgIH1cclxuICAgIHRiICs9ICc8L3Rib2R5PlxcbjwvdGFibGU+XFxuJztcclxuICAgIHJldHVybiB0YjtcclxuICB9XHJcblxyXG4gIHRleHQgPSBnbG9iYWxzLmNvbnZlcnRlci5fZGlzcGF0Y2goJ3RhYmxlcy5iZWZvcmUnLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcclxuXHJcbiAgdGV4dCA9IHRleHQucmVwbGFjZSh0YWJsZVJneCwgZnVuY3Rpb24gKHJhd1RhYmxlKSB7XHJcblxyXG4gICAgdmFyIGksIHRhYmxlTGluZXMgPSByYXdUYWJsZS5zcGxpdCgnXFxuJyk7XHJcblxyXG4gICAgLy8gc3RyaXAgd3JvbmcgZmlyc3QgYW5kIGxhc3QgY29sdW1uIGlmIHdyYXBwZWQgdGFibGVzIGFyZSB1c2VkXHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgdGFibGVMaW5lcy5sZW5ndGg7ICsraSkge1xyXG4gICAgICBpZiAoL15bIFxcdF17MCwzfVxcfC8udGVzdCh0YWJsZUxpbmVzW2ldKSkge1xyXG4gICAgICAgIHRhYmxlTGluZXNbaV0gPSB0YWJsZUxpbmVzW2ldLnJlcGxhY2UoL15bIFxcdF17MCwzfVxcfC8sICcnKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoL1xcfFsgXFx0XSokLy50ZXN0KHRhYmxlTGluZXNbaV0pKSB7XHJcbiAgICAgICAgdGFibGVMaW5lc1tpXSA9IHRhYmxlTGluZXNbaV0ucmVwbGFjZSgvXFx8WyBcXHRdKiQvLCAnJyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgcmF3SGVhZGVycyA9IHRhYmxlTGluZXNbMF0uc3BsaXQoJ3wnKS5tYXAoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMudHJpbSgpO30pLFxyXG4gICAgICAgIHJhd1N0eWxlcyA9IHRhYmxlTGluZXNbMV0uc3BsaXQoJ3wnKS5tYXAoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMudHJpbSgpO30pLFxyXG4gICAgICAgIHJhd0NlbGxzID0gW10sXHJcbiAgICAgICAgaGVhZGVycyA9IFtdLFxyXG4gICAgICAgIHN0eWxlcyA9IFtdLFxyXG4gICAgICAgIGNlbGxzID0gW107XHJcblxyXG4gICAgdGFibGVMaW5lcy5zaGlmdCgpO1xyXG4gICAgdGFibGVMaW5lcy5zaGlmdCgpO1xyXG5cclxuICAgIGZvciAoaSA9IDA7IGkgPCB0YWJsZUxpbmVzLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgIGlmICh0YWJsZUxpbmVzW2ldLnRyaW0oKSA9PT0gJycpIHtcclxuICAgICAgICBjb250aW51ZTtcclxuICAgICAgfVxyXG4gICAgICByYXdDZWxscy5wdXNoKFxyXG4gICAgICAgIHRhYmxlTGluZXNbaV1cclxuICAgICAgICAgIC5zcGxpdCgnfCcpXHJcbiAgICAgICAgICAubWFwKGZ1bmN0aW9uIChzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzLnRyaW0oKTtcclxuICAgICAgICAgIH0pXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJhd0hlYWRlcnMubGVuZ3RoIDwgcmF3U3R5bGVzLmxlbmd0aCkge1xyXG4gICAgICByZXR1cm4gcmF3VGFibGU7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yIChpID0gMDsgaSA8IHJhd1N0eWxlcy5sZW5ndGg7ICsraSkge1xyXG4gICAgICBzdHlsZXMucHVzaChwYXJzZVN0eWxlcyhyYXdTdHlsZXNbaV0pKTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgcmF3SGVhZGVycy5sZW5ndGg7ICsraSkge1xyXG4gICAgICBpZiAoc2hvd2Rvd24uaGVscGVyLmlzVW5kZWZpbmVkKHN0eWxlc1tpXSkpIHtcclxuICAgICAgICBzdHlsZXNbaV0gPSAnJztcclxuICAgICAgfVxyXG4gICAgICBoZWFkZXJzLnB1c2gocGFyc2VIZWFkZXJzKHJhd0hlYWRlcnNbaV0sIHN0eWxlc1tpXSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAoaSA9IDA7IGkgPCByYXdDZWxscy5sZW5ndGg7ICsraSkge1xyXG4gICAgICB2YXIgcm93ID0gW107XHJcbiAgICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCBoZWFkZXJzLmxlbmd0aDsgKytpaSkge1xyXG4gICAgICAgIGlmIChzaG93ZG93bi5oZWxwZXIuaXNVbmRlZmluZWQocmF3Q2VsbHNbaV1baWldKSkge1xyXG5cclxuICAgICAgICB9XHJcbiAgICAgICAgcm93LnB1c2gocGFyc2VDZWxscyhyYXdDZWxsc1tpXVtpaV0sIHN0eWxlc1tpaV0pKTtcclxuICAgICAgfVxyXG4gICAgICBjZWxscy5wdXNoKHJvdyk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGJ1aWxkVGFibGUoaGVhZGVycywgY2VsbHMpO1xyXG4gIH0pO1xyXG5cclxuICB0ZXh0ID0gZ2xvYmFscy5jb252ZXJ0ZXIuX2Rpc3BhdGNoKCd0YWJsZXMuYWZ0ZXInLCB0ZXh0LCBvcHRpb25zLCBnbG9iYWxzKTtcclxuXHJcbiAgcmV0dXJuIHRleHQ7XHJcbn0pO1xyXG5cclxuLyoqXHJcbiAqIFN3YXAgYmFjayBpbiBhbGwgdGhlIHNwZWNpYWwgY2hhcmFjdGVycyB3ZSd2ZSBoaWRkZW4uXHJcbiAqL1xyXG5zaG93ZG93bi5zdWJQYXJzZXIoJ3VuZXNjYXBlU3BlY2lhbENoYXJzJywgZnVuY3Rpb24gKHRleHQpIHtcclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIHRleHQgPSB0ZXh0LnJlcGxhY2UoL35FKFxcZCspRS9nLCBmdW5jdGlvbiAod2hvbGVNYXRjaCwgbTEpIHtcclxuICAgIHZhciBjaGFyQ29kZVRvUmVwbGFjZSA9IHBhcnNlSW50KG0xKTtcclxuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKGNoYXJDb2RlVG9SZXBsYWNlKTtcclxuICB9KTtcclxuICByZXR1cm4gdGV4dDtcclxufSk7XHJcbm1vZHVsZS5leHBvcnRzID0gc2hvd2Rvd247XHJcbiJdfQ==