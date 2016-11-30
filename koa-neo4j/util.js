(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("regenerator-runtime"), require("http"));
	else if(typeof define === 'function' && define.amd)
		define("./util", ["regenerator-runtime", "http"], factory);
	else if(typeof exports === 'object')
		exports["./util"] = factory(require("regenerator-runtime"), require("http"));
	else
		root["./util"] = factory(root["regenerator-runtime"], root["http"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_78__, __WEBPACK_EXTERNAL_MODULE_97__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(96);


/***/ },
/* 1 */,
/* 2 */,
/* 3 */,
/* 4 */,
/* 5 */,
/* 6 */,
/* 7 */,
/* 8 */,
/* 9 */,
/* 10 */,
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	// to indexed object, toObject with fallback for non-array-like ES3 strings
	var IObject = __webpack_require__(12)
	  , defined = __webpack_require__(14);
	module.exports = function(it){
	  return IObject(defined(it));
	};

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	// fallback for non-array-like ES3 and non-enumerable old V8 strings
	var cof = __webpack_require__(13);
	module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it){
	  return cof(it) == 'String' ? it.split('') : Object(it);
	};

/***/ },
/* 13 */
/***/ function(module, exports) {

	var toString = {}.toString;
	
	module.exports = function(it){
	  return toString.call(it).slice(8, -1);
	};

/***/ },
/* 14 */
/***/ function(module, exports) {

	// 7.2.1 RequireObjectCoercible(argument)
	module.exports = function(it){
	  if(it == undefined)throw TypeError("Can't call method on  " + it);
	  return it;
	};

/***/ },
/* 15 */,
/* 16 */,
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	var global    = __webpack_require__(18)
	  , core      = __webpack_require__(19)
	  , ctx       = __webpack_require__(20)
	  , hide      = __webpack_require__(22)
	  , PROTOTYPE = 'prototype';
	
	var $export = function(type, name, source){
	  var IS_FORCED = type & $export.F
	    , IS_GLOBAL = type & $export.G
	    , IS_STATIC = type & $export.S
	    , IS_PROTO  = type & $export.P
	    , IS_BIND   = type & $export.B
	    , IS_WRAP   = type & $export.W
	    , exports   = IS_GLOBAL ? core : core[name] || (core[name] = {})
	    , expProto  = exports[PROTOTYPE]
	    , target    = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE]
	    , key, own, out;
	  if(IS_GLOBAL)source = name;
	  for(key in source){
	    // contains in native
	    own = !IS_FORCED && target && target[key] !== undefined;
	    if(own && key in exports)continue;
	    // export native or passed
	    out = own ? target[key] : source[key];
	    // prevent global pollution for namespaces
	    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
	    // bind timers to global for call from export context
	    : IS_BIND && own ? ctx(out, global)
	    // wrap global constructors for prevent change them in library
	    : IS_WRAP && target[key] == out ? (function(C){
	      var F = function(a, b, c){
	        if(this instanceof C){
	          switch(arguments.length){
	            case 0: return new C;
	            case 1: return new C(a);
	            case 2: return new C(a, b);
	          } return new C(a, b, c);
	        } return C.apply(this, arguments);
	      };
	      F[PROTOTYPE] = C[PROTOTYPE];
	      return F;
	    // make static versions for prototype methods
	    })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
	    // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%
	    if(IS_PROTO){
	      (exports.virtual || (exports.virtual = {}))[key] = out;
	      // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%
	      if(type & $export.R && expProto && !expProto[key])hide(expProto, key, out);
	    }
	  }
	};
	// type bitmap
	$export.F = 1;   // forced
	$export.G = 2;   // global
	$export.S = 4;   // static
	$export.P = 8;   // proto
	$export.B = 16;  // bind
	$export.W = 32;  // wrap
	$export.U = 64;  // safe
	$export.R = 128; // real proto method for `library` 
	module.exports = $export;

/***/ },
/* 18 */
/***/ function(module, exports) {

	// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
	var global = module.exports = typeof window != 'undefined' && window.Math == Math
	  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
	if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef

/***/ },
/* 19 */
/***/ function(module, exports) {

	var core = module.exports = {version: '2.4.0'};
	if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	// optional / simple context binding
	var aFunction = __webpack_require__(21);
	module.exports = function(fn, that, length){
	  aFunction(fn);
	  if(that === undefined)return fn;
	  switch(length){
	    case 1: return function(a){
	      return fn.call(that, a);
	    };
	    case 2: return function(a, b){
	      return fn.call(that, a, b);
	    };
	    case 3: return function(a, b, c){
	      return fn.call(that, a, b, c);
	    };
	  }
	  return function(/* ...args */){
	    return fn.apply(that, arguments);
	  };
	};

/***/ },
/* 21 */
/***/ function(module, exports) {

	module.exports = function(it){
	  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
	  return it;
	};

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	var dP         = __webpack_require__(23)
	  , createDesc = __webpack_require__(31);
	module.exports = __webpack_require__(27) ? function(object, key, value){
	  return dP.f(object, key, createDesc(1, value));
	} : function(object, key, value){
	  object[key] = value;
	  return object;
	};

/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	var anObject       = __webpack_require__(24)
	  , IE8_DOM_DEFINE = __webpack_require__(26)
	  , toPrimitive    = __webpack_require__(30)
	  , dP             = Object.defineProperty;
	
	exports.f = __webpack_require__(27) ? Object.defineProperty : function defineProperty(O, P, Attributes){
	  anObject(O);
	  P = toPrimitive(P, true);
	  anObject(Attributes);
	  if(IE8_DOM_DEFINE)try {
	    return dP(O, P, Attributes);
	  } catch(e){ /* empty */ }
	  if('get' in Attributes || 'set' in Attributes)throw TypeError('Accessors not supported!');
	  if('value' in Attributes)O[P] = Attributes.value;
	  return O;
	};

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(25);
	module.exports = function(it){
	  if(!isObject(it))throw TypeError(it + ' is not an object!');
	  return it;
	};

/***/ },
/* 25 */
/***/ function(module, exports) {

	module.exports = function(it){
	  return typeof it === 'object' ? it !== null : typeof it === 'function';
	};

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = !__webpack_require__(27) && !__webpack_require__(28)(function(){
	  return Object.defineProperty(__webpack_require__(29)('div'), 'a', {get: function(){ return 7; }}).a != 7;
	});

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	// Thank's IE8 for his funny defineProperty
	module.exports = !__webpack_require__(28)(function(){
	  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
	});

/***/ },
/* 28 */
/***/ function(module, exports) {

	module.exports = function(exec){
	  try {
	    return !!exec();
	  } catch(e){
	    return true;
	  }
	};

/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(25)
	  , document = __webpack_require__(18).document
	  // in old IE typeof document.createElement is 'object'
	  , is = isObject(document) && isObject(document.createElement);
	module.exports = function(it){
	  return is ? document.createElement(it) : {};
	};

/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	// 7.1.1 ToPrimitive(input [, PreferredType])
	var isObject = __webpack_require__(25);
	// instead of the ES6 spec version, we didn't implement @@toPrimitive case
	// and the second argument - flag - preferred type is a string
	module.exports = function(it, S){
	  if(!isObject(it))return it;
	  var fn, val;
	  if(S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
	  if(typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it)))return val;
	  if(!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
	  throw TypeError("Can't convert object to primitive value");
	};

/***/ },
/* 31 */
/***/ function(module, exports) {

	module.exports = function(bitmap, value){
	  return {
	    enumerable  : !(bitmap & 1),
	    configurable: !(bitmap & 2),
	    writable    : !(bitmap & 4),
	    value       : value
	  };
	};

/***/ },
/* 32 */,
/* 33 */
/***/ function(module, exports) {

	var hasOwnProperty = {}.hasOwnProperty;
	module.exports = function(it, key){
	  return hasOwnProperty.call(it, key);
	};

/***/ },
/* 34 */,
/* 35 */,
/* 36 */,
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.14 / 15.2.3.14 Object.keys(O)
	var $keys       = __webpack_require__(38)
	  , enumBugKeys = __webpack_require__(46);
	
	module.exports = Object.keys || function keys(O){
	  return $keys(O, enumBugKeys);
	};

/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	var has          = __webpack_require__(33)
	  , toIObject    = __webpack_require__(11)
	  , arrayIndexOf = __webpack_require__(39)(false)
	  , IE_PROTO     = __webpack_require__(43)('IE_PROTO');
	
	module.exports = function(object, names){
	  var O      = toIObject(object)
	    , i      = 0
	    , result = []
	    , key;
	  for(key in O)if(key != IE_PROTO)has(O, key) && result.push(key);
	  // Don't enum bug & hidden keys
	  while(names.length > i)if(has(O, key = names[i++])){
	    ~arrayIndexOf(result, key) || result.push(key);
	  }
	  return result;
	};

/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	// false -> Array#indexOf
	// true  -> Array#includes
	var toIObject = __webpack_require__(11)
	  , toLength  = __webpack_require__(40)
	  , toIndex   = __webpack_require__(42);
	module.exports = function(IS_INCLUDES){
	  return function($this, el, fromIndex){
	    var O      = toIObject($this)
	      , length = toLength(O.length)
	      , index  = toIndex(fromIndex, length)
	      , value;
	    // Array#includes uses SameValueZero equality algorithm
	    if(IS_INCLUDES && el != el)while(length > index){
	      value = O[index++];
	      if(value != value)return true;
	    // Array#toIndex ignores holes, Array#includes - not
	    } else for(;length > index; index++)if(IS_INCLUDES || index in O){
	      if(O[index] === el)return IS_INCLUDES || index || 0;
	    } return !IS_INCLUDES && -1;
	  };
	};

/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	// 7.1.15 ToLength
	var toInteger = __webpack_require__(41)
	  , min       = Math.min;
	module.exports = function(it){
	  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
	};

/***/ },
/* 41 */
/***/ function(module, exports) {

	// 7.1.4 ToInteger
	var ceil  = Math.ceil
	  , floor = Math.floor;
	module.exports = function(it){
	  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
	};

/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	var toInteger = __webpack_require__(41)
	  , max       = Math.max
	  , min       = Math.min;
	module.exports = function(index, length){
	  index = toInteger(index);
	  return index < 0 ? max(index + length, 0) : min(index, length);
	};

/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	var shared = __webpack_require__(44)('keys')
	  , uid    = __webpack_require__(45);
	module.exports = function(key){
	  return shared[key] || (shared[key] = uid(key));
	};

/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	var global = __webpack_require__(18)
	  , SHARED = '__core-js_shared__'
	  , store  = global[SHARED] || (global[SHARED] = {});
	module.exports = function(key){
	  return store[key] || (store[key] = {});
	};

/***/ },
/* 45 */
/***/ function(module, exports) {

	var id = 0
	  , px = Math.random();
	module.exports = function(key){
	  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
	};

/***/ },
/* 46 */
/***/ function(module, exports) {

	// IE 8- don't enum bug keys
	module.exports = (
	  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
	).split(',');

/***/ },
/* 47 */,
/* 48 */,
/* 49 */,
/* 50 */,
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	// 7.1.13 ToObject(argument)
	var defined = __webpack_require__(14);
	module.exports = function(it){
	  return Object(defined(it));
	};

/***/ },
/* 52 */,
/* 53 */,
/* 54 */,
/* 55 */,
/* 56 */,
/* 57 */,
/* 58 */,
/* 59 */,
/* 60 */,
/* 61 */,
/* 62 */,
/* 63 */,
/* 64 */,
/* 65 */,
/* 66 */,
/* 67 */,
/* 68 */,
/* 69 */,
/* 70 */,
/* 71 */,
/* 72 */,
/* 73 */,
/* 74 */,
/* 75 */,
/* 76 */,
/* 77 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(78);


/***/ },
/* 78 */
/***/ function(module, exports) {

	module.exports = require("regenerator-runtime");

/***/ },
/* 79 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	exports.__esModule = true;
	
	var _assign = __webpack_require__(80);
	
	var _assign2 = _interopRequireDefault(_assign);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	exports.default = _assign2.default || function (target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i];
	
	    for (var key in source) {
	      if (Object.prototype.hasOwnProperty.call(source, key)) {
	        target[key] = source[key];
	      }
	    }
	  }
	
	  return target;
	};

/***/ },
/* 80 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(81), __esModule: true };

/***/ },
/* 81 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(82);
	module.exports = __webpack_require__(19).Object.assign;

/***/ },
/* 82 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.3.1 Object.assign(target, source)
	var $export = __webpack_require__(17);
	
	$export($export.S + $export.F, 'Object', {assign: __webpack_require__(83)});

/***/ },
/* 83 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	// 19.1.2.1 Object.assign(target, source, ...)
	var getKeys  = __webpack_require__(37)
	  , gOPS     = __webpack_require__(84)
	  , pIE      = __webpack_require__(85)
	  , toObject = __webpack_require__(51)
	  , IObject  = __webpack_require__(12)
	  , $assign  = Object.assign;
	
	// should work with symbols and should have deterministic property order (V8 bug)
	module.exports = !$assign || __webpack_require__(28)(function(){
	  var A = {}
	    , B = {}
	    , S = Symbol()
	    , K = 'abcdefghijklmnopqrst';
	  A[S] = 7;
	  K.split('').forEach(function(k){ B[k] = k; });
	  return $assign({}, A)[S] != 7 || Object.keys($assign({}, B)).join('') != K;
	}) ? function assign(target, source){ // eslint-disable-line no-unused-vars
	  var T     = toObject(target)
	    , aLen  = arguments.length
	    , index = 1
	    , getSymbols = gOPS.f
	    , isEnum     = pIE.f;
	  while(aLen > index){
	    var S      = IObject(arguments[index++])
	      , keys   = getSymbols ? getKeys(S).concat(getSymbols(S)) : getKeys(S)
	      , length = keys.length
	      , j      = 0
	      , key;
	    while(length > j)if(isEnum.call(S, key = keys[j++]))T[key] = S[key];
	  } return T;
	} : $assign;

/***/ },
/* 84 */
/***/ function(module, exports) {

	exports.f = Object.getOwnPropertySymbols;

/***/ },
/* 85 */
/***/ function(module, exports) {

	exports.f = {}.propertyIsEnumerable;

/***/ },
/* 86 */,
/* 87 */,
/* 88 */,
/* 89 */,
/* 90 */,
/* 91 */,
/* 92 */,
/* 93 */,
/* 94 */,
/* 95 */,
/* 96 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [exports, __webpack_require__(79), __webpack_require__(77), __webpack_require__(97)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else if (typeof exports !== "undefined") {
	        factory(exports, require('babel-runtime/helpers/extends'), require('babel-runtime/regenerator'), require('http'));
	    } else {
	        var mod = {
	            exports: {}
	        };
	        factory(mod.exports, global._extends, global.regenerator, global.http);
	        global.util = mod.exports;
	    }
	})(this, function (exports, _extends2, _regenerator, _http) {
	    'use strict';
	
	    Object.defineProperty(exports, "__esModule", {
	        value: true
	    });
	    exports.httpCall = exports.httpPost = exports.httpGet = exports.areSameDay = exports.compareFnFromArray = exports.pipe = exports.zip = exports.enumerate = exports.haveIntersection = exports.keyValues = undefined;
	
	    var _extends3 = _interopRequireDefault(_extends2);
	
	    var _regenerator2 = _interopRequireDefault(_regenerator);
	
	    var _http2 = _interopRequireDefault(_http);
	
	    function _interopRequireDefault(obj) {
	        return obj && obj.__esModule ? obj : {
	            default: obj
	        };
	    }
	
	    var _marked = [keyValues, enumerate, zip].map(_regenerator2.default.mark);
	
	    function keyValues(obj) {
	        var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, key;
	
	        return _regenerator2.default.wrap(function keyValues$(_context) {
	            while (1) switch (_context.prev = _context.next) {
	                case 0:
	                    _iteratorNormalCompletion = true;
	                    _didIteratorError = false;
	                    _iteratorError = undefined;
	                    _context.prev = 3;
	                    _iterator = Object.keys(obj)[Symbol.iterator]();
	
	                case 5:
	                    if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
	                        _context.next = 12;
	                        break;
	                    }
	
	                    key = _step.value;
	                    _context.next = 9;
	                    return [key, obj[key]];
	
	                case 9:
	                    _iteratorNormalCompletion = true;
	                    _context.next = 5;
	                    break;
	
	                case 12:
	                    _context.next = 18;
	                    break;
	
	                case 14:
	                    _context.prev = 14;
	                    _context.t0 = _context['catch'](3);
	                    _didIteratorError = true;
	                    _iteratorError = _context.t0;
	
	                case 18:
	                    _context.prev = 18;
	                    _context.prev = 19;
	
	                    if (!_iteratorNormalCompletion && _iterator.return) {
	                        _iterator.return();
	                    }
	
	                case 21:
	                    _context.prev = 21;
	
	                    if (!_didIteratorError) {
	                        _context.next = 24;
	                        break;
	                    }
	
	                    throw _iteratorError;
	
	                case 24:
	                    return _context.finish(21);
	
	                case 25:
	                    return _context.finish(18);
	
	                case 26:
	                case 'end':
	                    return _context.stop();
	            }
	        }, _marked[0], this, [[3, 14, 18, 26], [19,, 21, 25]]);
	    }
	
	    const haveIntersection = function (arrayFirst, arraySecond) {
	        if (!arrayFirst || !arraySecond) return false;
	        const first = new Set(arrayFirst);
	        const second = new Set(arraySecond);
	        var _iteratorNormalCompletion2 = true;
	        var _didIteratorError2 = false;
	        var _iteratorError2 = undefined;
	
	        try {
	            for (var _iterator2 = first[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
	                const element = _step2.value;
	
	                if (second.has(element)) return true;
	            }
	        } catch (err) {
	            _didIteratorError2 = true;
	            _iteratorError2 = err;
	        } finally {
	            try {
	                if (!_iteratorNormalCompletion2 && _iterator2.return) {
	                    _iterator2.return();
	                }
	            } finally {
	                if (_didIteratorError2) {
	                    throw _iteratorError2;
	                }
	            }
	        }
	
	        return false;
	    };
	
	    function enumerate(array) {
	        var index, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, element;
	
	        return _regenerator2.default.wrap(function enumerate$(_context2) {
	            while (1) switch (_context2.prev = _context2.next) {
	                case 0:
	                    index = 0;
	                    _iteratorNormalCompletion3 = true;
	                    _didIteratorError3 = false;
	                    _iteratorError3 = undefined;
	                    _context2.prev = 4;
	                    _iterator3 = array[Symbol.iterator]();
	
	                case 6:
	                    if (_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done) {
	                        _context2.next = 14;
	                        break;
	                    }
	
	                    element = _step3.value;
	                    _context2.next = 10;
	                    return [index, element];
	
	                case 10:
	                    index++;
	
	                case 11:
	                    _iteratorNormalCompletion3 = true;
	                    _context2.next = 6;
	                    break;
	
	                case 14:
	                    _context2.next = 20;
	                    break;
	
	                case 16:
	                    _context2.prev = 16;
	                    _context2.t0 = _context2['catch'](4);
	                    _didIteratorError3 = true;
	                    _iteratorError3 = _context2.t0;
	
	                case 20:
	                    _context2.prev = 20;
	                    _context2.prev = 21;
	
	                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
	                        _iterator3.return();
	                    }
	
	                case 23:
	                    _context2.prev = 23;
	
	                    if (!_didIteratorError3) {
	                        _context2.next = 26;
	                        break;
	                    }
	
	                    throw _iteratorError3;
	
	                case 26:
	                    return _context2.finish(23);
	
	                case 27:
	                    return _context2.finish(20);
	
	                case 28:
	                case 'end':
	                    return _context2.stop();
	            }
	        }, _marked[1], this, [[4, 16, 20, 28], [21,, 23, 27]]);
	    }
	
	    function zip(arrayFirst, arraySecond) {
	        var index, _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, element;
	
	        return _regenerator2.default.wrap(function zip$(_context3) {
	            while (1) switch (_context3.prev = _context3.next) {
	                case 0:
	                    index = 0;
	                    _iteratorNormalCompletion4 = true;
	                    _didIteratorError4 = false;
	                    _iteratorError4 = undefined;
	                    _context3.prev = 4;
	                    _iterator4 = arrayFirst[Symbol.iterator]();
	
	                case 6:
	                    if (_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done) {
	                        _context3.next = 16;
	                        break;
	                    }
	
	                    element = _step4.value;
	
	                    if (arraySecond[index]) {
	                        _context3.next = 10;
	                        break;
	                    }
	
	                    return _context3.abrupt('break', 16);
	
	                case 10:
	                    _context3.next = 12;
	                    return [element, arraySecond[index]];
	
	                case 12:
	                    index++;
	
	                case 13:
	                    _iteratorNormalCompletion4 = true;
	                    _context3.next = 6;
	                    break;
	
	                case 16:
	                    _context3.next = 22;
	                    break;
	
	                case 18:
	                    _context3.prev = 18;
	                    _context3.t0 = _context3['catch'](4);
	                    _didIteratorError4 = true;
	                    _iteratorError4 = _context3.t0;
	
	                case 22:
	                    _context3.prev = 22;
	                    _context3.prev = 23;
	
	                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
	                        _iterator4.return();
	                    }
	
	                case 25:
	                    _context3.prev = 25;
	
	                    if (!_didIteratorError4) {
	                        _context3.next = 28;
	                        break;
	                    }
	
	                    throw _iteratorError4;
	
	                case 28:
	                    return _context3.finish(25);
	
	                case 29:
	                    return _context3.finish(22);
	
	                case 30:
	                case 'end':
	                    return _context3.stop();
	            }
	        }, _marked[2], this, [[4, 18, 22, 30], [23,, 25, 29]]);
	    }
	
	    const pipe = function () {
	        for (var _len = arguments.length, functions = Array(_len), _key = 0; _key < _len; _key++) {
	            functions[_key] = arguments[_key];
	        }
	
	        return function () {
	            for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	                args[_key2] = arguments[_key2];
	            }
	
	            var _iteratorNormalCompletion5 = true;
	            var _didIteratorError5 = false;
	            var _iteratorError5 = undefined;
	
	            try {
	                for (var _iterator5 = functions[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
	                    const func = _step5.value;
	
	                    if (Array.isArray(args)) args = func.apply(undefined, args);else args = func.apply(undefined, [args]);
	                }
	            } catch (err) {
	                _didIteratorError5 = true;
	                _iteratorError5 = err;
	            } finally {
	                try {
	                    if (!_iteratorNormalCompletion5 && _iterator5.return) {
	                        _iterator5.return();
	                    }
	                } finally {
	                    if (_didIteratorError5) {
	                        throw _iteratorError5;
	                    }
	                }
	            }
	
	            return args;
	        };
	    };
	
	    const compareFnFromArray = function (array, fn) {
	        return function (first, second) {
	            if (!fn) fn = function (x) {
	                return x;
	            };
	            first = fn.apply(null, [first]);
	            second = fn.apply(null, [second]);
	            first = array.indexOf(first);
	            second = array.indexOf(second);
	            return first - second;
	        };
	    };
	
	    const areSameDay = function (dateFirst, dateSecond) {
	        return dateFirst.getFullYear() === dateSecond.getFullYear() && dateFirst.getMonth() === dateSecond.getMonth() && dateFirst.getDate() === dateSecond.getDate();
	    };
	
	    const httpCall = function (method, host, route, port, data, headers) {
	        return new Promise(function (resolve, reject) {
	            headers = headers || {};
	            if (typeof data === 'object') {
	                data = JSON.stringify(data);
	                headers = (0, _extends3.default)({}, headers, { 'Content-Type': 'application/json' });
	            }
	            const request = _http2.default.request({
	                hostname: host,
	                port: port,
	                path: route,
	                method: method,
	                headers: headers
	            }, resolve);
	            request.on('error', reject);
	            request.end(data);
	        }).then(function (response) {
	            response.setEncoding('utf8');return response;
	        }).then(function (response) {
	            return new Promise(function (resolve) {
	                return response.on('data', resolve);
	            });
	        }).then(function (chunk) {
	            return chunk.toString('utf8');
	        }).then(function (str) {
	            try {
	                return JSON.parse(str);
	            } catch (error) {
	                return str;
	            }
	        });
	    };
	
	    const httpGet = function (route, port) {
	        return httpCall('GET', 'localhost', route, port);
	    };
	
	    const httpPost = function (route, port, data, headers) {
	        return httpCall('POST', 'localhost', route, port, data, headers);
	    };
	
	    exports.keyValues = keyValues;
	    exports.haveIntersection = haveIntersection;
	    exports.enumerate = enumerate;
	    exports.zip = zip;
	    exports.pipe = pipe;
	    exports.compareFnFromArray = compareFnFromArray;
	    exports.areSameDay = areSameDay;
	    exports.httpGet = httpGet;
	    exports.httpPost = httpPost;
	    exports.httpCall = httpCall;
	});

/***/ },
/* 97 */
/***/ function(module, exports) {

	module.exports = require("http");

/***/ }
/******/ ])
});
;
//# sourceMappingURL=util.js.map