'use strict';

var config = require('config');
var mongoose = require('mongoose');
var Promise = require('bluebird');

mongoose.set('debug', true);

mongoose.Promise = Promise;

// Create the database connection
mongoose.connect(config.mongodb, {
  poolSize: 20,
  reconnectTries: Number.MAX_VALUE
});

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', function () {
  var connection = mongoose.connections[0];
  console.log('Mongoose default connection opened', connection.name);
});

// If the connection throws an error
mongoose.connection.on('error', function (err) {
  console.log('Mongoose default connection error: ', err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {
  console.log('Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function () {
  mongoose.connection.close(function () {
    console.log('Mongoose default connection disconnected through app termination');
    process.exit(0);
  });
});
