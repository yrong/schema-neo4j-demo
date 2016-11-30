(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("chalk"), require("jasmine-given"));
	else if(typeof define === 'function' && define.amd)
		define("./bdd", ["chalk", "jasmine-given"], factory);
	else if(typeof exports === 'object')
		exports["./bdd"] = factory(require("chalk"), require("jasmine-given"));
	else
		root["./bdd"] = factory(root["chalk"], root["jasmine-given"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__, __WEBPACK_EXTERNAL_MODULE_2__) {
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
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [module, exports, __webpack_require__(1), __webpack_require__(2)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else if (typeof exports !== "undefined") {
	        factory(module, exports, require('chalk'), require('jasmine-given'));
	    } else {
	        var mod = {
	            exports: {}
	        };
	        factory(mod, mod.exports, global.chalk, global.jasmineGiven);
	        global.bdd = mod.exports;
	    }
	})(this, function (module, exports, _chalk) {
	    'use strict';
	
	    Object.defineProperty(exports, "__esModule", {
	        value: true
	    });
	
	    var _chalk2 = _interopRequireDefault(_chalk);
	
	    function _interopRequireDefault(obj) {
	        return obj && obj.__esModule ? obj : {
	            default: obj
	        };
	    }
	
	    /**
	     * Created by keyvan on 8/31/16.
	     */
	
	    const context = {};
	
	    const alreadyExecuted = new Set();
	
	    const getExecutor = function (func, before, description, executeEachTime) {
	        executeEachTime = typeof executeEachTime === 'undefined' ? false : executeEachTime;
	        return func.length > 0 ? function (done) {
	            before();
	            if (executeEachTime || !alreadyExecuted.has(description)) {
	                func.apply(context, [done]);
	                alreadyExecuted.add(description);
	            } else done();
	        } : function () {
	            before();
	            if (executeEachTime || !alreadyExecuted.has(description)) {
	                func.apply(context, []);
	                alreadyExecuted.add(description);
	            }
	        };
	    };
	
	    const given = function (description, onGiven, executeEachTime) {
	        Given(getExecutor(onGiven, function () {
	            return console.log(_chalk2.default.blue(`\ngiven ${ description }`));
	        }, description, executeEachTime));
	    };
	
	    const when = function (description, onWhen, executeEachTime) {
	        When(getExecutor(onWhen, function () {
	            return console.log(_chalk2.default.magenta(`\nwhen ${ description }`));
	        }, description, executeEachTime));
	    };
	
	    const then = function (description, onThen) {
	        return Then(description, getExecutor(onThen, function () {}, description, true));
	    };
	
	    const invariant = function (description, onInvariant) {
	        return Invariant(description, getExecutor(onInvariant, function () {}, description, true));
	    };
	
	    const bdd = {
	        given: function (description, onGiven) {
	            return given(description, onGiven, true);
	        },
	        givenOnce: given,
	        when: function (description, onWhen) {
	            return when(description, onWhen, true);
	        },
	        whenOnce: when,
	        then: then,
	        invariant: invariant,
	        context: context
	    };
	
	    exports.default = bdd;
	    module.exports = exports['default'];
	});

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = require("chalk");

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = require("jasmine-given");

/***/ }
/******/ ])
});
;
//# sourceMappingURL=bdd.js.map