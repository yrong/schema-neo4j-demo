(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("chalk"), require("neo4j-driver"), require("parse-neo4j"), require("file-system"));
	else if(typeof define === 'function' && define.amd)
		define("./check", ["chalk", "neo4j-driver", "parse-neo4j", "file-system"], factory);
	else if(typeof exports === 'object')
		exports["./check"] = factory(require("chalk"), require("neo4j-driver"), require("parse-neo4j"), require("file-system"));
	else
		root["./check"] = factory(root["chalk"], root["neo4j-driver"], root["parse-neo4j"], root["file-system"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__, __WEBPACK_EXTERNAL_MODULE_63__, __WEBPACK_EXTERNAL_MODULE_74__, __WEBPACK_EXTERNAL_MODULE_76__) {
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

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [exports, __webpack_require__(3), __webpack_require__(60), __webpack_require__(64), __webpack_require__(65)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else if (typeof exports !== "undefined") {
	        factory(exports, require('babel-runtime/helpers/slicedToArray'), require('./preprocess'), require('./postprocess'), require('./data'));
	    } else {
	        var mod = {
	            exports: {}
	        };
	        factory(mod.exports, global.slicedToArray, global.preprocess, global.postprocess, global.data);
	        global.check = mod.exports;
	    }
	})(this, function (exports, _slicedToArray2, _preprocess, _postprocess, _data) {
	    'use strict';
	
	    Object.defineProperty(exports, "__esModule", {
	        value: true
	    });
	    exports.userIsAdmin = exports.userHasAnyOfRoles = exports.checkOwner = exports.checkWith = undefined;
	
	    var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);
	
	    function _interopRequireDefault(obj) {
	        return obj && obj.__esModule ? obj : {
	            default: obj
	        };
	    }
	
	    const checkWith = function () {
	        var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
	            _ref$name = _ref.name;
	
	        let name = _ref$name === undefined ? 'checkWith' : _ref$name;
	        var _ref$condition = _ref.condition;
	        let condition = _ref$condition === undefined ? function (params, ctx) {
	            return true;
	        } : _ref$condition;
	        var _ref$except = _ref.except;
	        let except = _ref$except === undefined ? function (params, ctx) {
	            return false;
	        } : _ref$except;
	        return new _data.Procedure({
	            name: name,
	            preProcess: [function (params, ctx) {
	                return [params, except.apply(null, [params, ctx])];
	            }, function (_ref2, ctx) {
	                var _ref3 = (0, _slicedToArray3.default)(_ref2, 2);
	
	                let params = _ref3[0],
	                    exception = _ref3[1];
	
	                if (exception) params.result = exception;else params.result = condition.apply(null, [params, ctx]);
	                return params;
	            }]
	        });
	    };
	
	    // check Hook
	    // checkOwner
	    // params before: {resourceIdParamName} <number> | <string> | <Neo4jInt>
	    // params after: {resourceIdParamName} <Neo4jInt>
	    /**
	     * Created by keyvan on 11/26/16.
	     */
	
	    const checkOwner = function () {
	        var _ref4 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
	            _ref4$resourceIdParam = _ref4.resourceIdParamName;
	
	        let resourceIdParamName = _ref4$resourceIdParam === undefined ? 'id' : _ref4$resourceIdParam;
	        var _ref4$pattern = _ref4.pattern;
	        let pattern = _ref4$pattern === undefined ? '(user)-[:HAS]->(resource)' : _ref4$pattern,
	            matchClause = _ref4.matchClause,
	            query = _ref4.query;
	        var _ref4$except = _ref4.except;
	        let except = _ref4$except === undefined ? function (params, ctx) {
	            return false;
	        } : _ref4$except;
	        return new _data.Procedure({
	            name: 'checkOwner',
	            preProcess: [(0, _preprocess.parseIds)(resourceIdParamName), function (params, ctx) {
	                return [params, except.apply(null, [params, ctx])];
	            }, function (_ref5, ctx) {
	                var _ref6 = (0, _slicedToArray3.default)(_ref5, 2);
	
	                let params = _ref6[0],
	                    exception = _ref6[1];
	
	                if (exception) params.result = exception;else params.cypher = query || matchClause ? `${ matchClause } WHERE id(user) = ${ ctx.user.id } ` + `AND id(resource) = {${ resourceIdParamName }} ` + 'RETURN count(resource)' : `MATCH ${ pattern } WHERE id(user) = ${ ctx.user.id } ` + `AND id(resource) = {${ resourceIdParamName }} ` + 'RETURN count(resource)';
	                return params;
	            }],
	            postProcess: _postprocess.fetchOne
	        });
	    };
	
	    // Use allowedRoles for this functionality
	    // Made to be used as 'except', e.g.
	    // checkOwner({ except: userHasAnyOfRoles(['admin', 'reviewer']) })
	    const userHasAnyOfRoles = function (roles) {
	        return function (params, ctx) {
	            if (!ctx.user) throw new Error('user not logged in');
	            var _iteratorNormalCompletion = true;
	            var _didIteratorError = false;
	            var _iteratorError = undefined;
	
	            try {
	                for (var _iterator = roles[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	                    const role = _step.value;
	
	                    if (ctx.user.roles.indexOf(role) > 0) return true;
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
	
	            return false;
	        };
	    };
	
	    const userIsAdmin = userHasAnyOfRoles(['admin']);
	
	    exports.checkWith = checkWith;
	    exports.checkOwner = checkOwner;
	    exports.userHasAnyOfRoles = userHasAnyOfRoles;
	    exports.userIsAdmin = userIsAdmin;
	});

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = require("chalk");

/***/ },
/* 2 */,
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	exports.__esModule = true;
	
	var _isIterable2 = __webpack_require__(4);
	
	var _isIterable3 = _interopRequireDefault(_isIterable2);
	
	var _getIterator2 = __webpack_require__(56);
	
	var _getIterator3 = _interopRequireDefault(_getIterator2);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	exports.default = function () {
	  function sliceIterator(arr, i) {
	    var _arr = [];
	    var _n = true;
	    var _d = false;
	    var _e = undefined;
	
	    try {
	      for (var _i = (0, _getIterator3.default)(arr), _s; !(_n = (_s = _i.next()).done); _n = true) {
	        _arr.push(_s.value);
	
	        if (i && _arr.length === i) break;
	      }
	    } catch (err) {
	      _d = true;
	      _e = err;
	    } finally {
	      try {
	        if (!_n && _i["return"]) _i["return"]();
	      } finally {
	        if (_d) throw _e;
	      }
	    }
	
	    return _arr;
	  }
	
	  return function (arr, i) {
	    if (Array.isArray(arr)) {
	      return arr;
	    } else if ((0, _isIterable3.default)(Object(arr))) {
	      return sliceIterator(arr, i);
	    } else {
	      throw new TypeError("Invalid attempt to destructure non-iterable instance");
	    }
	  };
	}();

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(5), __esModule: true };

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(6);
	__webpack_require__(52);
	module.exports = __webpack_require__(54);

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(7);
	var global        = __webpack_require__(18)
	  , hide          = __webpack_require__(22)
	  , Iterators     = __webpack_require__(10)
	  , TO_STRING_TAG = __webpack_require__(49)('toStringTag');
	
	for(var collections = ['NodeList', 'DOMTokenList', 'MediaList', 'StyleSheetList', 'CSSRuleList'], i = 0; i < 5; i++){
	  var NAME       = collections[i]
	    , Collection = global[NAME]
	    , proto      = Collection && Collection.prototype;
	  if(proto && !proto[TO_STRING_TAG])hide(proto, TO_STRING_TAG, NAME);
	  Iterators[NAME] = Iterators.Array;
	}

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var addToUnscopables = __webpack_require__(8)
	  , step             = __webpack_require__(9)
	  , Iterators        = __webpack_require__(10)
	  , toIObject        = __webpack_require__(11);
	
	// 22.1.3.4 Array.prototype.entries()
	// 22.1.3.13 Array.prototype.keys()
	// 22.1.3.29 Array.prototype.values()
	// 22.1.3.30 Array.prototype[@@iterator]()
	module.exports = __webpack_require__(15)(Array, 'Array', function(iterated, kind){
	  this._t = toIObject(iterated); // target
	  this._i = 0;                   // next index
	  this._k = kind;                // kind
	// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
	}, function(){
	  var O     = this._t
	    , kind  = this._k
	    , index = this._i++;
	  if(!O || index >= O.length){
	    this._t = undefined;
	    return step(1);
	  }
	  if(kind == 'keys'  )return step(0, index);
	  if(kind == 'values')return step(0, O[index]);
	  return step(0, [index, O[index]]);
	}, 'values');
	
	// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
	Iterators.Arguments = Iterators.Array;
	
	addToUnscopables('keys');
	addToUnscopables('values');
	addToUnscopables('entries');

/***/ },
/* 8 */
/***/ function(module, exports) {

	module.exports = function(){ /* empty */ };

/***/ },
/* 9 */
/***/ function(module, exports) {

	module.exports = function(done, value){
	  return {value: value, done: !!done};
	};

/***/ },
/* 10 */
/***/ function(module, exports) {

	module.exports = {};

/***/ },
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
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var LIBRARY        = __webpack_require__(16)
	  , $export        = __webpack_require__(17)
	  , redefine       = __webpack_require__(32)
	  , hide           = __webpack_require__(22)
	  , has            = __webpack_require__(33)
	  , Iterators      = __webpack_require__(10)
	  , $iterCreate    = __webpack_require__(34)
	  , setToStringTag = __webpack_require__(48)
	  , getPrototypeOf = __webpack_require__(50)
	  , ITERATOR       = __webpack_require__(49)('iterator')
	  , BUGGY          = !([].keys && 'next' in [].keys()) // Safari has buggy iterators w/o `next`
	  , FF_ITERATOR    = '@@iterator'
	  , KEYS           = 'keys'
	  , VALUES         = 'values';
	
	var returnThis = function(){ return this; };
	
	module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED){
	  $iterCreate(Constructor, NAME, next);
	  var getMethod = function(kind){
	    if(!BUGGY && kind in proto)return proto[kind];
	    switch(kind){
	      case KEYS: return function keys(){ return new Constructor(this, kind); };
	      case VALUES: return function values(){ return new Constructor(this, kind); };
	    } return function entries(){ return new Constructor(this, kind); };
	  };
	  var TAG        = NAME + ' Iterator'
	    , DEF_VALUES = DEFAULT == VALUES
	    , VALUES_BUG = false
	    , proto      = Base.prototype
	    , $native    = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT]
	    , $default   = $native || getMethod(DEFAULT)
	    , $entries   = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined
	    , $anyNative = NAME == 'Array' ? proto.entries || $native : $native
	    , methods, key, IteratorPrototype;
	  // Fix native
	  if($anyNative){
	    IteratorPrototype = getPrototypeOf($anyNative.call(new Base));
	    if(IteratorPrototype !== Object.prototype){
	      // Set @@toStringTag to native iterators
	      setToStringTag(IteratorPrototype, TAG, true);
	      // fix for some old engines
	      if(!LIBRARY && !has(IteratorPrototype, ITERATOR))hide(IteratorPrototype, ITERATOR, returnThis);
	    }
	  }
	  // fix Array#{values, @@iterator}.name in V8 / FF
	  if(DEF_VALUES && $native && $native.name !== VALUES){
	    VALUES_BUG = true;
	    $default = function values(){ return $native.call(this); };
	  }
	  // Define iterator
	  if((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])){
	    hide(proto, ITERATOR, $default);
	  }
	  // Plug for library
	  Iterators[NAME] = $default;
	  Iterators[TAG]  = returnThis;
	  if(DEFAULT){
	    methods = {
	      values:  DEF_VALUES ? $default : getMethod(VALUES),
	      keys:    IS_SET     ? $default : getMethod(KEYS),
	      entries: $entries
	    };
	    if(FORCED)for(key in methods){
	      if(!(key in proto))redefine(proto, key, methods[key]);
	    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
	  }
	  return methods;
	};

/***/ },
/* 16 */
/***/ function(module, exports) {

	module.exports = true;

/***/ },
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
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(22);

/***/ },
/* 33 */
/***/ function(module, exports) {

	var hasOwnProperty = {}.hasOwnProperty;
	module.exports = function(it, key){
	  return hasOwnProperty.call(it, key);
	};

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var create         = __webpack_require__(35)
	  , descriptor     = __webpack_require__(31)
	  , setToStringTag = __webpack_require__(48)
	  , IteratorPrototype = {};
	
	// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
	__webpack_require__(22)(IteratorPrototype, __webpack_require__(49)('iterator'), function(){ return this; });
	
	module.exports = function(Constructor, NAME, next){
	  Constructor.prototype = create(IteratorPrototype, {next: descriptor(1, next)});
	  setToStringTag(Constructor, NAME + ' Iterator');
	};

/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
	var anObject    = __webpack_require__(24)
	  , dPs         = __webpack_require__(36)
	  , enumBugKeys = __webpack_require__(46)
	  , IE_PROTO    = __webpack_require__(43)('IE_PROTO')
	  , Empty       = function(){ /* empty */ }
	  , PROTOTYPE   = 'prototype';
	
	// Create object with fake `null` prototype: use iframe Object with cleared prototype
	var createDict = function(){
	  // Thrash, waste and sodomy: IE GC bug
	  var iframe = __webpack_require__(29)('iframe')
	    , i      = enumBugKeys.length
	    , lt     = '<'
	    , gt     = '>'
	    , iframeDocument;
	  iframe.style.display = 'none';
	  __webpack_require__(47).appendChild(iframe);
	  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
	  // createDict = iframe.contentWindow.Object;
	  // html.removeChild(iframe);
	  iframeDocument = iframe.contentWindow.document;
	  iframeDocument.open();
	  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
	  iframeDocument.close();
	  createDict = iframeDocument.F;
	  while(i--)delete createDict[PROTOTYPE][enumBugKeys[i]];
	  return createDict();
	};
	
	module.exports = Object.create || function create(O, Properties){
	  var result;
	  if(O !== null){
	    Empty[PROTOTYPE] = anObject(O);
	    result = new Empty;
	    Empty[PROTOTYPE] = null;
	    // add "__proto__" for Object.getPrototypeOf polyfill
	    result[IE_PROTO] = O;
	  } else result = createDict();
	  return Properties === undefined ? result : dPs(result, Properties);
	};


/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	var dP       = __webpack_require__(23)
	  , anObject = __webpack_require__(24)
	  , getKeys  = __webpack_require__(37);
	
	module.exports = __webpack_require__(27) ? Object.defineProperties : function defineProperties(O, Properties){
	  anObject(O);
	  var keys   = getKeys(Properties)
	    , length = keys.length
	    , i = 0
	    , P;
	  while(length > i)dP.f(O, P = keys[i++], Properties[P]);
	  return O;
	};

/***/ },
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
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(18).document && document.documentElement;

/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	var def = __webpack_require__(23).f
	  , has = __webpack_require__(33)
	  , TAG = __webpack_require__(49)('toStringTag');
	
	module.exports = function(it, tag, stat){
	  if(it && !has(it = stat ? it : it.prototype, TAG))def(it, TAG, {configurable: true, value: tag});
	};

/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	var store      = __webpack_require__(44)('wks')
	  , uid        = __webpack_require__(45)
	  , Symbol     = __webpack_require__(18).Symbol
	  , USE_SYMBOL = typeof Symbol == 'function';
	
	var $exports = module.exports = function(name){
	  return store[name] || (store[name] =
	    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
	};
	
	$exports.store = store;

/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
	var has         = __webpack_require__(33)
	  , toObject    = __webpack_require__(51)
	  , IE_PROTO    = __webpack_require__(43)('IE_PROTO')
	  , ObjectProto = Object.prototype;
	
	module.exports = Object.getPrototypeOf || function(O){
	  O = toObject(O);
	  if(has(O, IE_PROTO))return O[IE_PROTO];
	  if(typeof O.constructor == 'function' && O instanceof O.constructor){
	    return O.constructor.prototype;
	  } return O instanceof Object ? ObjectProto : null;
	};

/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	// 7.1.13 ToObject(argument)
	var defined = __webpack_require__(14);
	module.exports = function(it){
	  return Object(defined(it));
	};

/***/ },
/* 52 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $at  = __webpack_require__(53)(true);
	
	// 21.1.3.27 String.prototype[@@iterator]()
	__webpack_require__(15)(String, 'String', function(iterated){
	  this._t = String(iterated); // target
	  this._i = 0;                // next index
	// 21.1.5.2.1 %StringIteratorPrototype%.next()
	}, function(){
	  var O     = this._t
	    , index = this._i
	    , point;
	  if(index >= O.length)return {value: undefined, done: true};
	  point = $at(O, index);
	  this._i += point.length;
	  return {value: point, done: false};
	});

/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	var toInteger = __webpack_require__(41)
	  , defined   = __webpack_require__(14);
	// true  -> String#at
	// false -> String#codePointAt
	module.exports = function(TO_STRING){
	  return function(that, pos){
	    var s = String(defined(that))
	      , i = toInteger(pos)
	      , l = s.length
	      , a, b;
	    if(i < 0 || i >= l)return TO_STRING ? '' : undefined;
	    a = s.charCodeAt(i);
	    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
	      ? TO_STRING ? s.charAt(i) : a
	      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
	  };
	};

/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	var classof   = __webpack_require__(55)
	  , ITERATOR  = __webpack_require__(49)('iterator')
	  , Iterators = __webpack_require__(10);
	module.exports = __webpack_require__(19).isIterable = function(it){
	  var O = Object(it);
	  return O[ITERATOR] !== undefined
	    || '@@iterator' in O
	    || Iterators.hasOwnProperty(classof(O));
	};

/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	// getting tag from 19.1.3.6 Object.prototype.toString()
	var cof = __webpack_require__(13)
	  , TAG = __webpack_require__(49)('toStringTag')
	  // ES3 wrong here
	  , ARG = cof(function(){ return arguments; }()) == 'Arguments';
	
	// fallback for IE11 Script Access Denied error
	var tryGet = function(it, key){
	  try {
	    return it[key];
	  } catch(e){ /* empty */ }
	};
	
	module.exports = function(it){
	  var O, T, B;
	  return it === undefined ? 'Undefined' : it === null ? 'Null'
	    // @@toStringTag case
	    : typeof (T = tryGet(O = Object(it), TAG)) == 'string' ? T
	    // builtinTag case
	    : ARG ? cof(O)
	    // ES3 arguments fallback
	    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
	};

/***/ },
/* 56 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(57), __esModule: true };

/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(6);
	__webpack_require__(52);
	module.exports = __webpack_require__(58);

/***/ },
/* 58 */
/***/ function(module, exports, __webpack_require__) {

	var anObject = __webpack_require__(24)
	  , get      = __webpack_require__(59);
	module.exports = __webpack_require__(19).getIterator = function(it){
	  var iterFn = get(it);
	  if(typeof iterFn != 'function')throw TypeError(it + ' is not iterable!');
	  return anObject(iterFn.call(it));
	};

/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

	var classof   = __webpack_require__(55)
	  , ITERATOR  = __webpack_require__(49)('iterator')
	  , Iterators = __webpack_require__(10);
	module.exports = __webpack_require__(19).getIteratorMethod = function(it){
	  if(it != undefined)return it[ITERATOR]
	    || it['@@iterator']
	    || Iterators[classof(it)];
	};

/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [exports, __webpack_require__(61), __webpack_require__(63)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else if (typeof exports !== "undefined") {
	        factory(exports, require('neo4j-driver/lib/v1/integer'), require('neo4j-driver'));
	    } else {
	        var mod = {
	            exports: {}
	        };
	        factory(mod.exports, global.integer, global.neo4jDriver);
	        global.preprocess = mod.exports;
	    }
	})(this, function (exports, _integer, _neo4jDriver) {
	    'use strict';
	
	    Object.defineProperty(exports, "__esModule", {
	        value: true
	    });
	    exports.parseUnixTimes = exports.parseDates = exports.parseFloats = exports.parseInts = exports.parseIds = exports.parseNeo4jInts = exports.parseWith = exports.logParams = exports.neo4jInt = exports.Integer = undefined;
	    Object.defineProperty(exports, 'Integer', {
	        enumerable: true,
	        get: function () {
	            return _integer.Integer;
	        }
	    });
	
	
	    const neo4jInt = _neo4jDriver.v1.int; /**
	                                           * Created by keyvan on 8/29/16.
	                                           */
	
	    const logParams = function (params) {
	        console.log(JSON.stringify(params, null, 2));
	        return params;
	    };
	
	    const deepParse = function (params, key, func) {
	        let keyToFind = key,
	            keyToReplace = key;
	
	        if (typeof key === 'object') {
	            const keys = Object.keys(key);
	            if (keys.length !== 1) throw new Error(`parse error, invalid key ${ JSON.stringify(key) }`);
	            keyToFind = keys[0];
	            keyToReplace = key[keyToFind];
	        }
	        if (params[keyToFind]) params[keyToReplace] = func.apply(params, [params[keyToFind]]);
	        var _iteratorNormalCompletion = true;
	        var _didIteratorError = false;
	        var _iteratorError = undefined;
	
	        try {
	            for (var _iterator = Object.keys(params)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	                const innerKey = _step.value;
	
	                if (params[innerKey] !== null && typeof params[innerKey] === 'object') deepParse(params[innerKey], key, func);
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
	    };
	
	    const parseWith = function (func) {
	        return function () {
	            for (var _len = arguments.length, keys = Array(_len), _key = 0; _key < _len; _key++) {
	                keys[_key] = arguments[_key];
	            }
	
	            return function (params) {
	                var _iteratorNormalCompletion2 = true;
	                var _didIteratorError2 = false;
	                var _iteratorError2 = undefined;
	
	                try {
	                    for (var _iterator2 = keys[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
	                        const key = _step2.value;
	
	                        deepParse(params, key, func);
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
	
	                return params;
	            };
	        };
	    };
	
	    const parseNeo4jInts = parseWith(neo4jInt);
	
	    const parseIds = parseNeo4jInts;
	
	    const parseInts = parseWith(parseInt);
	
	    const parseFloats = parseWith(parseFloat);
	
	    const parseDates = parseWith(function (stringOrUnixTime) {
	        const parsedInt = parseInt(stringOrUnixTime);
	        stringOrUnixTime = parsedInt.toString() !== stringOrUnixTime.toString() || isNaN(parsedInt) ? stringOrUnixTime : parsedInt;
	        return new Date(stringOrUnixTime);
	    });
	
	    const parseUnixTimes = parseWith(function (stringOrUnixTime) {
	        const parsedInt = parseInt(stringOrUnixTime);
	        if (parsedInt.toString() === stringOrUnixTime.toString()) return neo4jInt(parsedInt);
	        return neo4jInt(new Date(stringOrUnixTime).getTime());
	    });
	
	    exports.neo4jInt = neo4jInt;
	    exports.logParams = logParams;
	    exports.parseWith = parseWith;
	    exports.parseNeo4jInts = parseNeo4jInts;
	    exports.parseIds = parseIds;
	    exports.parseInts = parseInts;
	    exports.parseFloats = parseFloats;
	    exports.parseDates = parseDates;
	    exports.parseUnixTimes = parseUnixTimes;
	});

/***/ },
/* 61 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.toString = exports.toNumber = exports.inSafeRange = exports.isInt = exports.int = undefined;
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Copyright (c) 2002-2016 "Neo Technology,"
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Network Engine for Objects in Lund AB [http://neotechnology.com]
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * This file is part of Neo4j.
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Licensed under the Apache License, Version 2.0 (the "License");
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * you may not use this file except in compliance with the License.
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * You may obtain a copy of the License at
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *     http://www.apache.org/licenses/LICENSE-2.0
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Unless required by applicable law or agreed to in writing, software
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * distributed under the License is distributed on an "AS IS" BASIS,
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * See the License for the specific language governing permissions and
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * limitations under the License.
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */
	
	// 64-bit Integer library, originally from Long.js by dcodeIO
	// https://github.com/dcodeIO/Long.js
	// License Apache 2
	
	var _error = __webpack_require__(62);
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	/**
	 * Constructs a 64 bit two's-complement integer, given its low and high 32 bit values as *signed* integers.
	 *  See the from* functions below for more convenient ways of constructing Integers.
	 * @access public
	 * @exports Integer
	 * @class A Integer class for representing a 64 bit two's-complement integer value.
	 * @param {number} low The low (signed) 32 bits of the long
	 * @param {number} high The high (signed) 32 bits of the long
	 * @constructor
	 *
	 * @deprecated This class will be removed or made internal in a future version of the driver.
	 */
	var Integer = function () {
	  function Integer(low, high) {
	    _classCallCheck(this, Integer);
	
	    /**
	     * The low 32 bits as a signed value.
	     * @type {number}
	     * @expose
	     */
	    this.low = low | 0;
	
	    /**
	     * The high 32 bits as a signed value.
	     * @type {number}
	     * @expose
	     */
	    this.high = high | 0;
	  }
	
	  // The internal representation of an Integer is the two given signed, 32-bit values.
	  // We use 32-bit pieces because these are the size of integers on which
	  // Javascript performs bit-operations.  For operations like addition and
	  // multiplication, we split each number into 16 bit pieces, which can easily be
	  // multiplied within Javascript's floating-point representation without overflow
	  // or change in sign.
	  //
	  // In the algorithms below, we frequently reduce the negative case to the
	  // positive case by negating the input(s) and then post-processing the result.
	  // Note that we must ALWAYS check specially whether those values are MIN_VALUE
	  // (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
	  // a positive number, it overflows back into a negative).  Not handling this
	  // case would often result in infinite recursion.
	  //
	  // Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the from*
	  // methods on which they depend.
	
	
	  _createClass(Integer, [{
	    key: 'inSafeRange',
	    value: function inSafeRange() {
	      return this.greaterThanOrEqual(Integer.MIN_SAFE_VALUE) && this.lessThanOrEqual(Integer.MAX_SAFE_VALUE);
	    }
	    /**
	     * Converts the Integer to an exact javascript Number, assuming it is a 32 bit integer.
	     * @returns {number}
	     * @expose
	     */
	
	  }, {
	    key: 'toInt',
	    value: function toInt() {
	      return this.low;
	    }
	  }, {
	    key: 'toNumber',
	
	
	    /**
	     * Converts the Integer to a the nearest floating-point representation of this value (double, 53 bit mantissa).
	     * @returns {number}
	     * @expose
	     */
	    value: function toNumber() {
	      return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
	    }
	
	    /**
	     * Converts the Integer to a string written in the specified radix.
	     * @param {number=} radix Radix (2-36), defaults to 10
	     * @returns {string}
	     * @override
	     * @throws {RangeError} If `radix` is out of range
	     * @expose
	     */
	
	  }, {
	    key: 'toString',
	    value: function toString(radix) {
	      radix = radix || 10;
	      if (radix < 2 || 36 < radix) throw RangeError('radix out of range: ' + radix);
	      if (this.isZero()) return '0';
	      var rem;
	      if (this.isNegative()) {
	        if (this.equals(Integer.MIN_VALUE)) {
	          // We need to change the Integer value before it can be negated, so we remove
	          // the bottom-most digit in this base and then recurse to do the rest.
	          var radixInteger = Integer.fromNumber(radix);
	          var div = this.div(radixInteger);
	          rem = div.multiply(radixInteger).subtract(this);
	          return div.toString(radix) + rem.toInt().toString(radix);
	        } else return '-' + this.negate().toString(radix);
	      }
	
	      // Do several (6) digits each time through the loop, so as to
	      // minimize the calls to the very expensive emulated div.
	      var radixToPower = Integer.fromNumber(Math.pow(radix, 6));
	      rem = this;
	      var result = '';
	      while (true) {
	        var remDiv = rem.div(radixToPower),
	            intval = rem.subtract(remDiv.multiply(radixToPower)).toInt() >>> 0,
	            digits = intval.toString(radix);
	        rem = remDiv;
	        if (rem.isZero()) return digits + result;else {
	          while (digits.length < 6) {
	            digits = '0' + digits;
	          }result = '' + digits + result;
	        }
	      }
	    }
	
	    /**
	     * Gets the high 32 bits as a signed integer.
	     * @returns {number} Signed high bits
	     * @expose
	     */
	
	  }, {
	    key: 'getHighBits',
	    value: function getHighBits() {
	      return this.high;
	    }
	
	    /**
	     * Gets the low 32 bits as a signed integer.
	     * @returns {number} Signed low bits
	     * @expose
	     */
	
	  }, {
	    key: 'getLowBits',
	    value: function getLowBits() {
	      return this.low;
	    }
	
	    /**
	     * Gets the number of bits needed to represent the absolute value of this Integer.
	     * @returns {number}
	     * @expose
	     */
	
	  }, {
	    key: 'getNumBitsAbs',
	    value: function getNumBitsAbs() {
	      if (this.isNegative()) return this.equals(Integer.MIN_VALUE) ? 64 : this.negate().getNumBitsAbs();
	      var val = this.high != 0 ? this.high : this.low;
	      for (var bit = 31; bit > 0; bit--) {
	        if ((val & 1 << bit) != 0) break;
	      }return this.high != 0 ? bit + 33 : bit + 1;
	    }
	
	    /**
	     * Tests if this Integer's value equals zero.
	     * @returns {boolean}
	     * @expose
	     */
	
	  }, {
	    key: 'isZero',
	    value: function isZero() {
	      return this.high === 0 && this.low === 0;
	    }
	
	    /**
	     * Tests if this Integer's value is negative.
	     * @returns {boolean}
	     * @expose
	     */
	
	  }, {
	    key: 'isNegative',
	    value: function isNegative() {
	      return this.high < 0;
	    }
	
	    /**
	     * Tests if this Integer's value is positive.
	     * @returns {boolean}
	     * @expose
	     */
	
	  }, {
	    key: 'isPositive',
	    value: function isPositive() {
	      return this.high >= 0;
	    }
	
	    /**
	     * Tests if this Integer's value is odd.
	     * @returns {boolean}
	     * @expose
	     */
	
	  }, {
	    key: 'isOdd',
	    value: function isOdd() {
	      return (this.low & 1) === 1;
	    }
	
	    /**
	     * Tests if this Integer's value is even.
	     * @returns {boolean}
	     * @expose
	     */
	
	  }, {
	    key: 'isEven',
	    value: function isEven() {
	      return (this.low & 1) === 0;
	    }
	  }, {
	    key: 'equals',
	
	
	    /**
	     * Tests if this Integer's value equals the specified's.
	     * @param {!Integer|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	    value: function equals(other) {
	      if (!Integer.isInteger(other)) other = Integer.fromValue(other);
	      return this.high === other.high && this.low === other.low;
	    }
	
	    /**
	     * Tests if this Integer's value differs from the specified's.
	     * @param {!Integer|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	
	  }, {
	    key: 'notEquals',
	    value: function notEquals(other) {
	      !this.equals( /* validates */other);
	    }
	
	    /**
	     * Tests if this Integer's value is less than the specified's.
	     * @param {!Integer|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	
	  }, {
	    key: 'lessThan',
	    value: function lessThan(other) {
	      return this.compare( /* validates */other) < 0;
	    }
	
	    /**
	     * Tests if this Integer's value is less than or equal the specified's.
	     * @param {!Integer|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	
	  }, {
	    key: 'lessThanOrEqual',
	    value: function lessThanOrEqual(other) {
	      return this.compare( /* validates */other) <= 0;
	    }
	
	    /**
	     * Tests if this Integer's value is greater than the specified's.
	     * @param {!Integer|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	
	  }, {
	    key: 'greaterThan',
	    value: function greaterThan(other) {
	      return this.compare( /* validates */other) > 0;
	    }
	
	    /**
	     * Tests if this Integer's value is greater than or equal the specified's.
	     * @param {!Integer|number|string} other Other value
	     * @returns {boolean}
	     * @expose
	     */
	
	  }, {
	    key: 'greaterThanOrEqual',
	    value: function greaterThanOrEqual(other) {
	      return this.compare( /* validates */other) >= 0;
	    }
	
	    /**
	     * Compares this Integer's value with the specified's.
	     * @param {!Integer|number|string} other Other value
	     * @returns {number} 0 if they are the same, 1 if the this is greater and -1
	     *  if the given one is greater
	     * @expose
	     */
	
	  }, {
	    key: 'compare',
	    value: function compare(other) {
	      if (!Integer.isInteger(other)) other = Integer.fromValue(other);
	      if (this.equals(other)) return 0;
	      var thisNeg = this.isNegative(),
	          otherNeg = other.isNegative();
	      if (thisNeg && !otherNeg) return -1;
	      if (!thisNeg && otherNeg) return 1;
	      // At this point the sign bits are the same
	      return this.subtract(other).isNegative() ? -1 : 1;
	    }
	
	    /**
	     * Negates this Integer's value.
	     * @returns {!Integer} Negated Integer
	     * @expose
	     */
	
	  }, {
	    key: 'negate',
	    value: function negate() {
	      if (this.equals(Integer.MIN_VALUE)) return Integer.MIN_VALUE;
	      return this.not().add(Integer.ONE);
	    }
	
	    /**
	     * Returns the sum of this and the specified Integer.
	     * @param {!Integer|number|string} addend Addend
	     * @returns {!Integer} Sum
	     * @expose
	     */
	
	  }, {
	    key: 'add',
	    value: function add(addend) {
	      if (!Integer.isInteger(addend)) addend = Integer.fromValue(addend);
	
	      // Divide each number into 4 chunks of 16 bits, and then sum the chunks.
	
	      var a48 = this.high >>> 16;
	      var a32 = this.high & 0xFFFF;
	      var a16 = this.low >>> 16;
	      var a00 = this.low & 0xFFFF;
	
	      var b48 = addend.high >>> 16;
	      var b32 = addend.high & 0xFFFF;
	      var b16 = addend.low >>> 16;
	      var b00 = addend.low & 0xFFFF;
	
	      var c48 = 0,
	          c32 = 0,
	          c16 = 0,
	          c00 = 0;
	      c00 += a00 + b00;
	      c16 += c00 >>> 16;
	      c00 &= 0xFFFF;
	      c16 += a16 + b16;
	      c32 += c16 >>> 16;
	      c16 &= 0xFFFF;
	      c32 += a32 + b32;
	      c48 += c32 >>> 16;
	      c32 &= 0xFFFF;
	      c48 += a48 + b48;
	      c48 &= 0xFFFF;
	      return Integer.fromBits(c16 << 16 | c00, c48 << 16 | c32);
	    }
	
	    /**
	     * Returns the difference of this and the specified Integer.
	     * @param {!Integer|number|string} subtrahend Subtrahend
	     * @returns {!Integer} Difference
	     * @expose
	     */
	
	  }, {
	    key: 'subtract',
	    value: function subtract(subtrahend) {
	      if (!Integer.isInteger(subtrahend)) subtrahend = Integer.fromValue(subtrahend);
	      return this.add(subtrahend.negate());
	    }
	
	    /**
	     * Returns the product of this and the specified Integer.
	     * @param {!Integer|number|string} multiplier Multiplier
	     * @returns {!Integer} Product
	     * @expose
	     */
	
	  }, {
	    key: 'multiply',
	    value: function multiply(multiplier) {
	      if (this.isZero()) return Integer.ZERO;
	      if (!Integer.isInteger(multiplier)) multiplier = Integer.fromValue(multiplier);
	      if (multiplier.isZero()) return Integer.ZERO;
	      if (this.equals(Integer.MIN_VALUE)) return multiplier.isOdd() ? Integer.MIN_VALUE : Integer.ZERO;
	      if (multiplier.equals(Integer.MIN_VALUE)) return this.isOdd() ? Integer.MIN_VALUE : Integer.ZERO;
	
	      if (this.isNegative()) {
	        if (multiplier.isNegative()) return this.negate().multiply(multiplier.negate());else return this.negate().multiply(multiplier).negate();
	      } else if (multiplier.isNegative()) return this.multiply(multiplier.negate()).negate();
	
	      // If both longs are small, use float multiplication
	      if (this.lessThan(TWO_PWR_24) && multiplier.lessThan(TWO_PWR_24)) return Integer.fromNumber(this.toNumber() * multiplier.toNumber());
	
	      // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
	      // We can skip products that would overflow.
	
	      var a48 = this.high >>> 16;
	      var a32 = this.high & 0xFFFF;
	      var a16 = this.low >>> 16;
	      var a00 = this.low & 0xFFFF;
	
	      var b48 = multiplier.high >>> 16;
	      var b32 = multiplier.high & 0xFFFF;
	      var b16 = multiplier.low >>> 16;
	      var b00 = multiplier.low & 0xFFFF;
	
	      var c48 = 0,
	          c32 = 0,
	          c16 = 0,
	          c00 = 0;
	      c00 += a00 * b00;
	      c16 += c00 >>> 16;
	      c00 &= 0xFFFF;
	      c16 += a16 * b00;
	      c32 += c16 >>> 16;
	      c16 &= 0xFFFF;
	      c16 += a00 * b16;
	      c32 += c16 >>> 16;
	      c16 &= 0xFFFF;
	      c32 += a32 * b00;
	      c48 += c32 >>> 16;
	      c32 &= 0xFFFF;
	      c32 += a16 * b16;
	      c48 += c32 >>> 16;
	      c32 &= 0xFFFF;
	      c32 += a00 * b32;
	      c48 += c32 >>> 16;
	      c32 &= 0xFFFF;
	      c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
	      c48 &= 0xFFFF;
	      return Integer.fromBits(c16 << 16 | c00, c48 << 16 | c32);
	    }
	  }, {
	    key: 'div',
	
	
	    /**
	     * Returns this Integer divided by the specified.
	     * @param {!Integer|number|string} divisor Divisor
	     * @returns {!Integer} Quotient
	     * @expose
	     */
	    value: function div(divisor) {
	      if (!Integer.isInteger(divisor)) divisor = Integer.fromValue(divisor);
	      if (divisor.isZero()) throw (0, _error.newError)('division by zero');
	      if (this.isZero()) return Integer.ZERO;
	      var approx, rem, res;
	      if (this.equals(Integer.MIN_VALUE)) {
	        if (divisor.equals(Integer.ONE) || divisor.equals(Integer.NEG_ONE)) return Integer.MIN_VALUE; // recall that -MIN_VALUE == MIN_VALUE
	        else if (divisor.equals(Integer.MIN_VALUE)) return Integer.ONE;else {
	            // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
	            var halfThis = this.shiftRight(1);
	            approx = halfThis.div(divisor).shiftLeft(1);
	            if (approx.equals(Integer.ZERO)) {
	              return divisor.isNegative() ? Integer.ONE : Integer.NEG_ONE;
	            } else {
	              rem = this.subtract(divisor.multiply(approx));
	              res = approx.add(rem.div(divisor));
	              return res;
	            }
	          }
	      } else if (divisor.equals(Integer.MIN_VALUE)) return Integer.ZERO;
	      if (this.isNegative()) {
	        if (divisor.isNegative()) return this.negate().div(divisor.negate());
	        return this.negate().div(divisor).negate();
	      } else if (divisor.isNegative()) return this.div(divisor.negate()).negate();
	
	      // Repeat the following until the remainder is less than other:  find a
	      // floating-point that approximates remainder / other *from below*, add this
	      // into the result, and subtract it from the remainder.  It is critical that
	      // the approximate value is less than or equal to the real value so that the
	      // remainder never becomes negative.
	      res = Integer.ZERO;
	      rem = this;
	      while (rem.greaterThanOrEqual(divisor)) {
	        // Approximate the result of division. This may be a little greater or
	        // smaller than the actual value.
	        approx = Math.max(1, Math.floor(rem.toNumber() / divisor.toNumber()));
	
	        // We will tweak the approximate result by changing it in the 48-th digit or
	        // the smallest non-fractional digit, whichever is larger.
	        var log2 = Math.ceil(Math.log(approx) / Math.LN2),
	            delta = log2 <= 48 ? 1 : Math.pow(2, log2 - 48),
	
	
	        // Decrease the approximation until it is smaller than the remainder.  Note
	        // that if it is too large, the product overflows and is negative.
	        approxRes = Integer.fromNumber(approx),
	            approxRem = approxRes.multiply(divisor);
	        while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
	          approx -= delta;
	          approxRes = Integer.fromNumber(approx);
	          approxRem = approxRes.multiply(divisor);
	        }
	
	        // We know the answer can't be zero... and actually, zero would cause
	        // infinite recursion since we would make no progress.
	        if (approxRes.isZero()) approxRes = Integer.ONE;
	
	        res = res.add(approxRes);
	        rem = rem.subtract(approxRem);
	      }
	      return res;
	    }
	
	    /**
	     * Returns this Integer modulo the specified.
	     * @param {!Integer|number|string} divisor Divisor
	     * @returns {!Integer} Remainder
	     * @expose
	     */
	
	  }, {
	    key: 'modulo',
	    value: function modulo(divisor) {
	      if (!Integer.isInteger(divisor)) divisor = Integer.fromValue(divisor);
	      return this.subtract(this.div(divisor).multiply(divisor));
	    }
	
	    /**
	     * Returns the bitwise NOT of this Integer.
	     * @returns {!Integer}
	     * @expose
	     */
	
	  }, {
	    key: 'not',
	    value: function not() {
	      return Integer.fromBits(~this.low, ~this.high);
	    }
	
	    /**
	     * Returns the bitwise AND of this Integer and the specified.
	     * @param {!Integer|number|string} other Other Integer
	     * @returns {!Integer}
	     * @expose
	     */
	
	  }, {
	    key: 'and',
	    value: function and(other) {
	      if (!Integer.isInteger(other)) other = Integer.fromValue(other);
	      return Integer.fromBits(this.low & other.low, this.high & other.high);
	    }
	
	    /**
	     * Returns the bitwise OR of this Integer and the specified.
	     * @param {!Integer|number|string} other Other Integer
	     * @returns {!Integer}
	     * @expose
	     */
	
	  }, {
	    key: 'or',
	    value: function or(other) {
	      if (!Integer.isInteger(other)) other = Integer.fromValue(other);
	      return Integer.fromBits(this.low | other.low, this.high | other.high);
	    }
	
	    /**
	     * Returns the bitwise XOR of this Integer and the given one.
	     * @param {!Integer|number|string} other Other Integer
	     * @returns {!Integer}
	     * @expose
	     */
	
	  }, {
	    key: 'xor',
	    value: function xor(other) {
	      if (!Integer.isInteger(other)) other = Integer.fromValue(other);
	      return Integer.fromBits(this.low ^ other.low, this.high ^ other.high);
	    }
	
	    /**
	     * Returns this Integer with bits shifted to the left by the given amount.
	     * @param {number|!Integer} numBits Number of bits
	     * @returns {!Integer} Shifted Integer
	     * @expose
	     */
	
	  }, {
	    key: 'shiftLeft',
	    value: function shiftLeft(numBits) {
	      if (Integer.isInteger(numBits)) numBits = numBits.toInt();
	      if ((numBits &= 63) === 0) return this;else if (numBits < 32) return Integer.fromBits(this.low << numBits, this.high << numBits | this.low >>> 32 - numBits);else return Integer.fromBits(0, this.low << numBits - 32);
	    }
	
	    /**
	     * Returns this Integer with bits arithmetically shifted to the right by the given amount.
	     * @param {number|!Integer} numBits Number of bits
	     * @returns {!Integer} Shifted Integer
	     * @expose
	     */
	
	  }, {
	    key: 'shiftRight',
	    value: function shiftRight(numBits) {
	      if (Integer.isInteger(numBits)) numBits = numBits.toInt();
	      if ((numBits &= 63) === 0) return this;else if (numBits < 32) return Integer.fromBits(this.low >>> numBits | this.high << 32 - numBits, this.high >> numBits);else return Integer.fromBits(this.high >> numBits - 32, this.high >= 0 ? 0 : -1);
	    }
	  }]);
	
	  return Integer;
	}();
	
	/**
	 * An indicator used to reliably determine if an object is a Integer or not.
	 * @type {boolean}
	 * @const
	 * @expose
	 * @private
	 */
	
	
	Integer.__isInteger__;
	
	Object.defineProperty(Integer.prototype, "__isInteger__", {
	  value: true,
	  enumerable: false,
	  configurable: false
	});
	
	/**
	 * Tests if the specified object is a Integer.
	 * @access private
	 * @param {*} obj Object
	 * @returns {boolean}
	 * @expose
	 */
	Integer.isInteger = function (obj) {
	  return (obj && obj["__isInteger__"]) === true;
	};
	
	/**
	 * A cache of the Integer representations of small integer values.
	 * @type {!Object}
	 * @inner
	 * @private
	 */
	var INT_CACHE = {};
	
	/**
	 * Returns a Integer representing the given 32 bit integer value.
	 * @access private
	 * @param {number} value The 32 bit integer in question
	 * @returns {!Integer} The corresponding Integer value
	 * @expose
	 */
	Integer.fromInt = function (value) {
	  var obj, cachedObj;
	  value = value | 0;
	  if (-128 <= value && value < 128) {
	    cachedObj = INT_CACHE[value];
	    if (cachedObj) return cachedObj;
	  }
	  obj = new Integer(value, value < 0 ? -1 : 0, false);
	  if (-128 <= value && value < 128) INT_CACHE[value] = obj;
	  return obj;
	};
	
	/**
	 * Returns a Integer representing the given value, provided that it is a finite number. Otherwise, zero is returned.
	 * @access private
	 * @param {number} value The number in question
	 * @returns {!Integer} The corresponding Integer value
	 * @expose
	 */
	Integer.fromNumber = function (value) {
	  if (isNaN(value) || !isFinite(value)) return Integer.ZERO;
	  if (value <= -TWO_PWR_63_DBL) return Integer.MIN_VALUE;
	  if (value + 1 >= TWO_PWR_63_DBL) return Integer.MAX_VALUE;
	  if (value < 0) return Integer.fromNumber(-value).negate();
	  return new Integer(value % TWO_PWR_32_DBL | 0, value / TWO_PWR_32_DBL | 0);
	};
	
	/**
	 * Returns a Integer representing the 64 bit integer that comes by concatenating the given low and high bits. Each is
	 *  assumed to use 32 bits.
	 * @access private
	 * @param {number} lowBits The low 32 bits
	 * @param {number} highBits The high 32 bits
	 * @returns {!Integer} The corresponding Integer value
	 * @expose
	 */
	Integer.fromBits = function (lowBits, highBits) {
	  return new Integer(lowBits, highBits);
	};
	
	/**
	 * Returns a Integer representation of the given string, written using the specified radix.
	 * @access private
	 * @param {string} str The textual representation of the Integer
	 * @param {number=} radix The radix in which the text is written (2-36), defaults to 10
	 * @returns {!Integer} The corresponding Integer value
	 * @expose
	 */
	Integer.fromString = function (str, radix) {
	  if (str.length === 0) throw (0, _error.newError)('number format error: empty string');
	  if (str === "NaN" || str === "Infinity" || str === "+Infinity" || str === "-Infinity") return Integer.ZERO;
	  radix = radix || 10;
	  if (radix < 2 || 36 < radix) throw (0, _error.newError)('radix out of range: ' + radix);
	
	  var p;
	  if ((p = str.indexOf('-')) > 0) throw (0, _error.newError)('number format error: interior "-" character: ' + str);else if (p === 0) return Integer.fromString(str.substring(1), radix).negate();
	
	  // Do several (8) digits each time through the loop, so as to
	  // minimize the calls to the very expensive emulated div.
	  var radixToPower = Integer.fromNumber(Math.pow(radix, 8));
	
	  var result = Integer.ZERO;
	  for (var i = 0; i < str.length; i += 8) {
	    var size = Math.min(8, str.length - i);
	    var value = parseInt(str.substring(i, i + size), radix);
	    if (size < 8) {
	      var power = Integer.fromNumber(Math.pow(radix, size));
	      result = result.multiply(power).add(Integer.fromNumber(value));
	    } else {
	      result = result.multiply(radixToPower);
	      result = result.add(Integer.fromNumber(value));
	    }
	  }
	  return result;
	};
	
	/**
	 * Converts the specified value to a Integer.
	 * @access private
	 * @param {!Integer|number|string|!{low: number, high: number}} val Value
	 * @returns {!Integer}
	 * @expose
	 */
	Integer.fromValue = function (val) {
	  if (val /* is compatible */ instanceof Integer) return val;
	  if (typeof val === 'number') return Integer.fromNumber(val);
	  if (typeof val === 'string') return Integer.fromString(val);
	  // Throws for non-objects, converts non-instanceof Integer:
	  return new Integer(val.low, val.high);
	};
	
	/**
	 * Converts the specified value to a number.
	 * @access private
	 * @param {!Integer|number|string|!{low: number, high: number}} val Value
	 * @returns {number}
	 * @expose
	 */
	Integer.toNumber = function (val) {
	  return Integer.fromValue(val).toNumber();
	};
	
	/**
	* Converts the specified value to a string.
	* @access private
	* @param {!Integer|number|string|!{low: number, high: number}} val Value
	* @param {number} radix optional radix for string conversion, defaults to 10
	* @returns {String}
	* @expose
	*/
	Integer.toString = function (val, radix) {
	  return Integer.fromValue(val).toString(radix);
	};
	
	/**
	 * Checks if the given value is in the safe range in order to be converted to a native number
	 * @access private
	 * @param {!Integer|number|string|!{low: number, high: number}} val Value
	 * @param {number} radix optional radix for string conversion, defaults to 10
	 * @returns {boolean}
	 * @expose
	 */
	Integer.inSafeRange = function (val) {
	  return Integer.fromValue(val).inSafeRange();
	};
	
	/**
	 * @type {number}
	 * @const
	 * @inner
	 * @private
	 */
	var TWO_PWR_16_DBL = 1 << 16;
	
	/**
	 * @type {number}
	 * @const
	 * @inner
	 * @private
	 */
	var TWO_PWR_24_DBL = 1 << 24;
	
	/**
	 * @type {number}
	 * @const
	 * @inner
	 * @private
	 */
	var TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;
	
	/**
	 * @type {number}
	 * @const
	 * @inner
	 * @private
	 */
	var TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;
	
	/**
	 * @type {number}
	 * @const
	 * @inner
	 * @private
	 */
	var TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;
	
	/**
	 * @type {!Integer}
	 * @const
	 * @inner
	 * @private
	 */
	var TWO_PWR_24 = Integer.fromInt(TWO_PWR_24_DBL);
	
	/**
	 * Signed zero.
	 * @type {!Integer}
	 * @expose
	 */
	Integer.ZERO = Integer.fromInt(0);
	
	/**
	 * Signed one.
	 * @type {!Integer}
	 * @expose
	 */
	Integer.ONE = Integer.fromInt(1);
	
	/**
	 * Signed negative one.
	 * @type {!Integer}
	 * @expose
	 */
	Integer.NEG_ONE = Integer.fromInt(-1);
	
	/**
	 * Maximum signed value.
	 * @type {!Integer}
	 * @expose
	 */
	Integer.MAX_VALUE = Integer.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0, false);
	
	/**
	 * Minimum signed value.
	 * @type {!Integer}
	 * @expose
	 */
	Integer.MIN_VALUE = Integer.fromBits(0, 0x80000000 | 0, false);
	
	/**
	 * Minimum safe value.
	 * @type {!Integer}
	 * @expose
	 */
	Integer.MIN_SAFE_VALUE = Integer.fromBits(0x1 | 0, 0xFFFFFFFFFFE00000 | 0);
	
	/**
	* Maximum safe value.
	* @type {!Integer}
	* @expose
	*/
	Integer.MAX_SAFE_VALUE = Integer.fromBits(0xFFFFFFFF | 0, 0x1FFFFF | 0);
	
	/**
	 * Cast value to Integer type.
	 * @access public
	 * @param {Mixed} value - The value to use.
	 * @return {Integer} - An object of type Integer.
	 */
	var int = Integer.fromValue;
	
	/**
	 * Check if a variable is of Integer type.
	 * @access public
	 * @param {Mixed} value - The variable to check.
	 * @return {Boolean} - Is it of the Integer type?
	 */
	var isInt = Integer.isInteger;
	
	/**
	 * Check if a variable can be safely converted to a number
	 * @access public
	 * @param {Mixed} value - The variable to check
	 * @return {Boolean} - true if it is safe to call toNumber on variable otherwise false
	 */
	var inSafeRange = Integer.inSafeRange;
	
	/**
	 * Converts a variable to a number
	 * @access public
	 * @param {Mixed} value - The variable to convert
	 * @return {number} - the variable as a number
	 */
	var toNumber = Integer.toNumber;
	
	/**
	 * Converts the integer to a string representation
	 * @access public
	 * @param {Mixed} value - The variable to convert
	 * @param {number} radix - radix to use in string conversion, defaults to 10
	 * @return {String} - returns a string representation of the integer
	 */
	var toString = Integer.toString;
	
	exports.int = int;
	exports.isInt = isInt;
	exports.inSafeRange = inSafeRange;
	exports.toNumber = toNumber;
	exports.toString = toString;
	exports.default = Integer;

/***/ },
/* 62 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	/**
	 * Copyright (c) 2002-2016 "Neo Technology,"
	 * Network Engine for Objects in Lund AB [http://neotechnology.com]
	 *
	 * This file is part of Neo4j.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */
	
	// A common place for constructing error objects, to keep them
	// uniform across the driver surface.
	
	var SERVICE_UNAVAILABLE = 'ServiceUnavailable';
	var SESSION_EXPIRED = 'SessionExpired';
	function newError(message) {
	  var code = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "N/A";
	
	  // TODO: Idea is that we can check the code here and throw sub-classes
	  // of Neo4jError as appropriate
	  return new Neo4jError(message, code);
	}
	
	var Neo4jError = function (_Error) {
	  _inherits(Neo4jError, _Error);
	
	  function Neo4jError(message) {
	    var code = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "N/A";
	
	    _classCallCheck(this, Neo4jError);
	
	    var _this = _possibleConstructorReturn(this, (Neo4jError.__proto__ || Object.getPrototypeOf(Neo4jError)).call(this, message));
	
	    _this.message = message;
	    _this.code = code;
	    return _this;
	  }
	
	  return Neo4jError;
	}(Error);
	
	exports.newError = newError;
	exports.Neo4jError = Neo4jError;
	exports.SERVICE_UNAVAILABLE = SERVICE_UNAVAILABLE;
	exports.SESSION_EXPIRED = SESSION_EXPIRED;

/***/ },
/* 63 */
/***/ function(module, exports) {

	module.exports = require("neo4j-driver");

/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [exports], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else if (typeof exports !== "undefined") {
	        factory(exports);
	    } else {
	        var mod = {
	            exports: {}
	        };
	        factory(mod.exports);
	        global.postprocess = mod.exports;
	    }
	})(this, function (exports) {
	    'use strict';
	
	    Object.defineProperty(exports, "__esModule", {
	        value: true
	    });
	    /**
	     * Created by keyvan on 11/20/16.
	     */
	
	    const logResult = function (result) {
	        console.log(JSON.stringify(result, null, 2));
	        return result;
	    };
	
	    const fetchOne = function (result) {
	        return Array.isArray(result) ? result[0] : result;
	    };
	
	    const errorOnEmptyResult = function (message) {
	        return function (result) {
	            if (typeof result === 'undefined' || result === null || Array.isArray(result) && (result.length === 0 || result.length === 1 && result[0] === null)) throw new Error(message);
	            return result;
	        };
	    };
	
	    const map = function (func) {
	        return function (result) {
	            return Array.isArray(result) ? result.map(func) : func(result);
	        };
	    };
	
	    const convertToPreProcess = function (variableNameToAppendToParams) {
	        return function (result, params) {
	            params[variableNameToAppendToParams] = result;
	            return params;
	        };
	    };
	
	    exports.logResult = logResult;
	    exports.fetchOne = fetchOne;
	    exports.errorOnEmptyResult = errorOnEmptyResult;
	    exports.map = map;
	    exports.convertToPreProcess = convertToPreProcess;
	});

/***/ },
/* 65 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [exports, __webpack_require__(66), __webpack_require__(3), __webpack_require__(63), __webpack_require__(76), __webpack_require__(1), __webpack_require__(74), __webpack_require__(60), __webpack_require__(75)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else if (typeof exports !== "undefined") {
	        factory(exports, require('babel-runtime/helpers/toConsumableArray'), require('babel-runtime/helpers/slicedToArray'), require('neo4j-driver'), require('file-system'), require('chalk'), require('parse-neo4j'), require('./preprocess'), require('./procedure'));
	    } else {
	        var mod = {
	            exports: {}
	        };
	        factory(mod.exports, global.toConsumableArray, global.slicedToArray, global.neo4jDriver, global.fileSystem, global.chalk, global.parseNeo4j, global.preprocess, global.procedure);
	        global.data = mod.exports;
	    }
	})(this, function (exports, _toConsumableArray2, _slicedToArray2, _neo4jDriver, _fileSystem, _chalk, _parseNeo4j, _preprocess, _procedure) {
	    'use strict';
	
	    Object.defineProperty(exports, "__esModule", {
	        value: true
	    });
	    exports.API = exports.createProcedure = exports.Procedure = exports.Neo4jConnection = undefined;
	
	    var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);
	
	    var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);
	
	    var _fileSystem2 = _interopRequireDefault(_fileSystem);
	
	    var _chalk2 = _interopRequireDefault(_chalk);
	
	    var _parseNeo4j2 = _interopRequireDefault(_parseNeo4j);
	
	    function _interopRequireDefault(obj) {
	        return obj && obj.__esModule ? obj : {
	            default: obj
	        };
	    }
	
	    /**
	     * Created by keyvan on 8/16/16.
	     */
	
	    class Neo4jConnection {
	        constructor() {
	            var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	
	            let boltUrl = _ref.boltUrl,
	                user = _ref.user,
	                password = _ref.password;
	
	            this.queries = {};
	
	            this.driver = _neo4jDriver.v1.driver(boltUrl, _neo4jDriver.v1.auth.basic(user, password));
	            const session = this.driver.session();
	            this.initialized = session.run('RETURN "Neo4j instance successfully connected."').then(function (result) {
	                console.log(_chalk2.default.green(_parseNeo4j2.default.parse(result)));
	                session.close();
	            }).catch(function (error) {
	                console.error(_chalk2.default.red('Error connecting to the Neo4j instance, check connection options'));
	                console.log(error);
	                throw error;
	            });
	        }
	
	        addCypherQueryFile(cypherQueryFilePath) {
	            this.queries[cypherQueryFilePath] = _fileSystem2.default.readFileSync(cypherQueryFilePath, 'utf8');
	        }
	
	        executeCypher(cypherQueryFilePath, queryParams) {
	            var _this = this;
	
	            let pathIsQuery = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
	
	            return new Promise(function (resolve, reject) {
	                if (!pathIsQuery && !_this.queries[cypherQueryFilePath]) _this.addCypherQueryFile(cypherQueryFilePath);
	
	                let query = cypherQueryFilePath;
	                if (!pathIsQuery) query = _this.queries[cypherQueryFilePath];
	                const session = _this.driver.session();
	
	                session.run(query, queryParams).then(function (result) {
	                    resolve(result);
	                    session.close();
	                }).catch(function (error) {
	                    error = error.fields ? JSON.stringify(error.fields[0]) : String(error);
	                    reject(`error while executing Cypher: ${ error }`);
	                });
	            }).then(_parseNeo4j2.default.parse);
	        }
	    }
	
	    class Hook {
	        constructor(functions, neo4jConnection, procedureName, hookName) {
	            var _this2 = this;
	
	            let timeout = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 4000;
	
	            this.timeout = timeout;
	            this.name = hookName;
	            this.procedureName = procedureName;
	            if (!Array.isArray(functions))
	                // TODO instanceof not working due to webpack!
	                // if (typeof functions === 'function' || functions instanceof Procedure)
	                if (typeof functions === 'function' || functions.isProcedure) functions = [functions];else throw new Error('hook should be function or array of functions');
	            this.phases = [];
	            this.context = {};
	            var _iteratorNormalCompletion = true;
	            var _didIteratorError = false;
	            var _iteratorError = undefined;
	
	            try {
	                for (var _iterator = functions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	                    let func = _step.value;
	
	                    // TODO instanceof not working due to webpack!
	                    // if (func instanceof Procedure)
	                    if (func.isProcedure) func = createProcedure(neo4jConnection, func);else if (typeof func !== 'function') throw new Error(`element ${ func } passed as ${ this.procedureName } lifecycle ` + "is neither a 'function' nor a 'procedure'");
	                    this.phases.push(this.asyncify(func));
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
	
	            this.execute = function () {
	                var _phases;
	
	                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	                    args[_key] = arguments[_key];
	                }
	
	                let next = Promise.resolve((_phases = _this2.phases)[0].apply(_phases, args));
	                const rest = args.slice(1);
	                for (let i = 1; i < _this2.phases.length; i++) next = Promise.all([_this2.phases[i], next, rest]).then(function (_ref2) {
	                    var _ref3 = (0, _slicedToArray3.default)(_ref2, 3);
	
	                    let phase = _ref3[0],
	                        response = _ref3[1],
	                        rest = _ref3[2];
	                    return phase.apply(undefined, [response].concat((0, _toConsumableArray3.default)(rest)));
	                });
	                return next;
	            };
	        }
	
	        asyncify(func) {
	            var _this3 = this;
	
	            return function () {
	                for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	                    args[_key2] = arguments[_key2];
	                }
	
	                return Promise.race([Promise.resolve(func.apply(_this3.context, args)).then(function (response) {
	                    if (Array.isArray(response)) return Promise.all(response);
	                    if (typeof response !== 'undefined') return response;
	                    if (typeof args[0] === 'object' && !Array.isArray(args[0])) return args[0];
	                    throw new Error('have you forgotten to return in the previous function ' + "in the pipe? Hook's first argument not in correct format");
	                }), new Promise(function (resolve, reject) {
	                    return setTimeout(function () {
	                        return reject('TimeOutError');
	                    }, _this3.timeout);
	                })]).catch(function (error) {
	                    if (error === 'TimeOutError') throw new Error(`${ _this3.name } lifecycle of '${ _this3.procedureName }' timed out, ` + `no response after ${ _this3.timeout / 1000 } seconds`);
	                    if (typeof error === 'string') error += `, in ${ _this3.name } lifecycle of '${ _this3.procedureName }'`;else error.message += `, in ${ _this3.name } lifecycle of '${ _this3.procedureName }'`;
	                    throw error;
	                });
	            };
	        }
	    }
	
	    const createProcedure = function (neo4jConnection, procedure) {
	        const options = new _procedure.Procedure(procedure);
	        const checkHook = new Hook(options.check, neo4jConnection, options.name, 'check');
	        const preProcessHook = new Hook(options.preProcess, neo4jConnection, options.name, 'preProcess');
	        const executionHook = new Hook(function (params, cypherQueryFile) {
	            let result, paramsResult, paramsCypher;
	            if (typeof params.result !== 'undefined') {
	                if (Array.isArray(params.result)) result = Promise.all(params.result);else result = Promise.resolve(params.result);
	                paramsResult = true;
	            } else if (params.cypher || cypherQueryFile) {
	                result = neo4jConnection.executeCypher(params.cypher || cypherQueryFile, params, params.cypher);
	                paramsCypher = true;
	            } else result = Promise.reject(new Error("none of 'params.result', 'params.cypher' and " + "'cypherQueryFile' were present"));
	            return { result, paramsResult, paramsCypher };
	        }, neo4jConnection, options.name, 'execution');
	
	        const postProcessHook = new Hook(options.postProcess, neo4jConnection, options.name, 'postProcess');
	        const postServeHook = new Hook(options.postServe, neo4jConnection, options.name, 'postServe', 10000);
	
	        return function (params, ctx) {
	            const response = checkHook.execute(params, ctx).then(function (checkPassed) {
	                if (!checkPassed) throw new Error(`Check lifecycle hook of ${ options.name } did not pass`);
	                return [params, ctx];
	            }).then(function (_ref4) {
	                var _ref5 = (0, _slicedToArray3.default)(_ref4, 2);
	
	                let params = _ref5[0],
	                    ctx = _ref5[1];
	                return Promise.all([preProcessHook.execute(params, ctx), ctx]);
	            }).then(function (_ref6) {
	                var _ref7 = (0, _slicedToArray3.default)(_ref6, 2);
	
	                let params = _ref7[0],
	                    ctx = _ref7[1];
	                return Promise.all([(0, _preprocess.parseNeo4jInts)('id', 'skip', 'limit')(params), ctx]);
	            }).then(function (_ref8) {
	                var _ref9 = (0, _slicedToArray3.default)(_ref8, 2);
	
	                let params = _ref9[0],
	                    ctx = _ref9[1];
	                return Promise.all([executionHook.execute(params, options.cypherQueryFile), params, ctx]);
	            }).then(function (_ref10) {
	                var _ref11 = (0, _slicedToArray3.default)(_ref10, 3),
	                    _ref11$ = _ref11[0];
	
	                let result = _ref11$.result,
	                    paramsResult = _ref11$.paramsResult,
	                    paramsCypher = _ref11$.paramsCypher,
	                    params = _ref11[1],
	                    ctx = _ref11[2];
	
	                if (paramsResult) delete params.result;
	                if (paramsCypher) delete params.cypher;
	                return Promise.all([result, params, ctx]);
	            }).then(function (_ref12) {
	                var _ref13 = (0, _slicedToArray3.default)(_ref12, 3);
	
	                let result = _ref13[0],
	                    params = _ref13[1],
	                    ctx = _ref13[2];
	                return Promise.all([postProcessHook.execute(result, params, ctx), params, ctx]);
	            });
	
	            response.catch(function (error) {
	                return [];
	            }).then(function (_ref14) {
	                var _ref15 = (0, _slicedToArray3.default)(_ref14, 3);
	
	                let result = _ref15[0],
	                    params = _ref15[1],
	                    ctx = _ref15[2];
	
	                if (result || params || ctx) return postServeHook.execute(result, params, ctx);
	            }).catch(function (error) {
	                console.error(_chalk2.default.red(`Error in postServe of '${ options.name }'`));
	                console.log(error);
	            });
	            return response.then(function (_ref16) {
	                var _ref17 = (0, _slicedToArray3.default)(_ref16, 3);
	
	                let result = _ref17[0],
	                    params = _ref17[1],
	                    ctx = _ref17[2];
	                return result;
	            });
	        };
	    };
	
	    class API {
	        constructor(neo4jConnection) {
	            var _ref18 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
	
	            let method = _ref18.method,
	                route = _ref18.route;
	            var _ref18$allowedRoles = _ref18.allowedRoles;
	            let allowedRoles = _ref18$allowedRoles === undefined ? [] : _ref18$allowedRoles,
	                procedure = _ref18.procedure,
	                cypherQueryFile = _ref18.cypherQueryFile,
	                check = _ref18.check,
	                preProcess = _ref18.preProcess,
	                postProcess = _ref18.postProcess,
	                postServe = _ref18.postServe;
	
	            if (typeof procedure === 'function') this.invoke = procedure;else this.invoke = createProcedure(neo4jConnection, { cypherQueryFile, check, preProcess, postProcess, postServe, name: route });
	
	            this.method = method;
	            this.route = route;
	            this.allowedRoles = allowedRoles;
	            this.requiresJwtAuthentication = allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0;
	        }
	    }
	
	    exports.Neo4jConnection = Neo4jConnection;
	    exports.Procedure = _procedure.Procedure;
	    exports.createProcedure = createProcedure;
	    exports.API = API;
	});

/***/ },
/* 66 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	exports.__esModule = true;
	
	var _from = __webpack_require__(67);
	
	var _from2 = _interopRequireDefault(_from);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	exports.default = function (arr) {
	  if (Array.isArray(arr)) {
	    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
	      arr2[i] = arr[i];
	    }
	
	    return arr2;
	  } else {
	    return (0, _from2.default)(arr);
	  }
	};

/***/ },
/* 67 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(68), __esModule: true };

/***/ },
/* 68 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(52);
	__webpack_require__(69);
	module.exports = __webpack_require__(19).Array.from;

/***/ },
/* 69 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var ctx            = __webpack_require__(20)
	  , $export        = __webpack_require__(17)
	  , toObject       = __webpack_require__(51)
	  , call           = __webpack_require__(70)
	  , isArrayIter    = __webpack_require__(71)
	  , toLength       = __webpack_require__(40)
	  , createProperty = __webpack_require__(72)
	  , getIterFn      = __webpack_require__(59);
	
	$export($export.S + $export.F * !__webpack_require__(73)(function(iter){ Array.from(iter); }), 'Array', {
	  // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
	  from: function from(arrayLike/*, mapfn = undefined, thisArg = undefined*/){
	    var O       = toObject(arrayLike)
	      , C       = typeof this == 'function' ? this : Array
	      , aLen    = arguments.length
	      , mapfn   = aLen > 1 ? arguments[1] : undefined
	      , mapping = mapfn !== undefined
	      , index   = 0
	      , iterFn  = getIterFn(O)
	      , length, result, step, iterator;
	    if(mapping)mapfn = ctx(mapfn, aLen > 2 ? arguments[2] : undefined, 2);
	    // if object isn't iterable or it's array with default iterator - use simple case
	    if(iterFn != undefined && !(C == Array && isArrayIter(iterFn))){
	      for(iterator = iterFn.call(O), result = new C; !(step = iterator.next()).done; index++){
	        createProperty(result, index, mapping ? call(iterator, mapfn, [step.value, index], true) : step.value);
	      }
	    } else {
	      length = toLength(O.length);
	      for(result = new C(length); length > index; index++){
	        createProperty(result, index, mapping ? mapfn(O[index], index) : O[index]);
	      }
	    }
	    result.length = index;
	    return result;
	  }
	});


/***/ },
/* 70 */
/***/ function(module, exports, __webpack_require__) {

	// call something on iterator step with safe closing on error
	var anObject = __webpack_require__(24);
	module.exports = function(iterator, fn, value, entries){
	  try {
	    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
	  // 7.4.6 IteratorClose(iterator, completion)
	  } catch(e){
	    var ret = iterator['return'];
	    if(ret !== undefined)anObject(ret.call(iterator));
	    throw e;
	  }
	};

/***/ },
/* 71 */
/***/ function(module, exports, __webpack_require__) {

	// check on default Array iterator
	var Iterators  = __webpack_require__(10)
	  , ITERATOR   = __webpack_require__(49)('iterator')
	  , ArrayProto = Array.prototype;
	
	module.exports = function(it){
	  return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
	};

/***/ },
/* 72 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $defineProperty = __webpack_require__(23)
	  , createDesc      = __webpack_require__(31);
	
	module.exports = function(object, index, value){
	  if(index in object)$defineProperty.f(object, index, createDesc(0, value));
	  else object[index] = value;
	};

/***/ },
/* 73 */
/***/ function(module, exports, __webpack_require__) {

	var ITERATOR     = __webpack_require__(49)('iterator')
	  , SAFE_CLOSING = false;
	
	try {
	  var riter = [7][ITERATOR]();
	  riter['return'] = function(){ SAFE_CLOSING = true; };
	  Array.from(riter, function(){ throw 2; });
	} catch(e){ /* empty */ }
	
	module.exports = function(exec, skipClosing){
	  if(!skipClosing && !SAFE_CLOSING)return false;
	  var safe = false;
	  try {
	    var arr  = [7]
	      , iter = arr[ITERATOR]();
	    iter.next = function(){ return {done: safe = true}; };
	    arr[ITERATOR] = function(){ return iter; };
	    exec(arr);
	  } catch(e){ /* empty */ }
	  return safe;
	};

/***/ },
/* 74 */
/***/ function(module, exports) {

	module.exports = require("parse-neo4j");

/***/ },
/* 75 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [exports], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else if (typeof exports !== "undefined") {
	        factory(exports);
	    } else {
	        var mod = {
	            exports: {}
	        };
	        factory(mod.exports);
	        global.procedure = mod.exports;
	    }
	})(this, function (exports) {
	    'use strict';
	
	    Object.defineProperty(exports, "__esModule", {
	        value: true
	    });
	    /**
	     * Created by keyvan on 11/27/16.
	     */
	
	    class Procedure {
	        constructor() {
	            var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	
	            let cypherQueryFile = _ref.cypherQueryFile,
	                cypher = _ref.cypher;
	            var _ref$check = _ref.check;
	            let check = _ref$check === undefined ? function (params, user) {
	                return true;
	            } : _ref$check;
	            var _ref$preProcess = _ref.preProcess;
	            let preProcess = _ref$preProcess === undefined ? function (params) {
	                return params;
	            } : _ref$preProcess;
	            var _ref$postProcess = _ref.postProcess;
	            let postProcess = _ref$postProcess === undefined ? function (result) {
	                return result;
	            } : _ref$postProcess;
	            var _ref$postServe = _ref.postServe;
	            let postServe = _ref$postServe === undefined ? function (result) {
	                return result;
	            } : _ref$postServe;
	            var _ref$name = _ref.name;
	            let name = _ref$name === undefined ? 'procedure' : _ref$name;
	
	            this.cypherQueryFile = cypherQueryFile;
	            this.cypher = cypher;
	            this.check = check;
	            this.preProcess = preProcess;
	            this.postProcess = postProcess;
	            this.postServe = postServe;
	            this.name = name;
	            // TODO instanceof not working due to webpack!
	            this.isProcedure = true;
	        }
	    }
	
	    exports.Procedure = Procedure;
	});

/***/ },
/* 76 */
/***/ function(module, exports) {

	module.exports = require("file-system");

/***/ }
/******/ ])
});
;
//# sourceMappingURL=check.js.map