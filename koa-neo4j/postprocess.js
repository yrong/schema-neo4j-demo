(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("./postprocess", [], factory);
	else if(typeof exports === 'object')
		exports["./postprocess"] = factory();
	else
		root["./postprocess"] = factory();
})(this, function() {
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
/******/ ({

/***/ 0:
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(64);


/***/ },

/***/ 64:
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

/***/ }

/******/ })
});
;
//# sourceMappingURL=postprocess.js.map