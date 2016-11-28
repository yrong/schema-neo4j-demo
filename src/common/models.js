'use strict';

var glob = require('glob');
var _ = require('lodash');

var mongoose = require('mongoose');
var pagination = require('mongoose-paginate');

var FileSchema = new mongoose.Schema({}, { strict: false, collection: 'fs.files' });

var defines = glob.sync('*/model.js', {
  root: 'modules',
  cwd: 'modules/'
});
defines = _.union(defines, glob.sync('*/models/*.js', {
  root: 'modules',
  cwd: 'modules/'
}));
defines.forEach(function (define) {
  var [name, schema] = require('../modules/' + define)(mongoose.Schema);
  schema.plugin(pagination);
  schema.set('toJSON', {
    versionKey: false,
    transform: function (doc, ret, options) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  });
  mongoose.model(name, schema);
});
mongoose.model('File', FileSchema);
