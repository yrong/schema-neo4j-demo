'use strict';

var path = require('path');
var glob = require('glob');

var _ = require('lodash');

var defines = glob.sync('modules/*/controller.js');
defines = _.union(defines, glob.sync('modules/*/controllers/*.js'));
function register(router) {
  defines.forEach(function (define) {
    require(path.resolve(define)).register(router); // eslint-disable-line global-require
  });
};

module.exports.register = register;
