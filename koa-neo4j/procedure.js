(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("./procedure", [], factory);
	else if(typeof exports === 'object')
		exports["./procedure"] = factory();
	else
		root["./procedure"] = factory();
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

	module.exports = __webpack_require__(75);


/***/ },

/***/ 75:
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

/***/ }

/******/ })
});
;
//# sourceMappingURL=procedure.js.map