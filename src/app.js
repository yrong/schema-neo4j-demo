'use strict';

var _ = require('lodash');
var Koa = require('koa');
var app = new Koa();
var responseTime = require('koa-response-time');
var logger = require('koa-logger');
var convert = require('koa-convert');
// 开发的时候可能需要跨域
var cors = require('koa-cors');
var session = require('koa-session');
var passport;
var Router = require('koa-router');
var bodyParser = require('koa-better-body');

var Promise = require('bluebird');
var dotenv = require('dotenv').config();
var config = require('config');

var prefix = {
  prefix: '/api'
};
// var publicRouter = new Router(prefix);
var secureRouter = new Router(prefix);
var routes = require('./modules/routes');

var initial = require('./common/initial');
require('./common/mongo');
require('./common/models');

// require('./modules/auth/'); // implement login and logout method
// passport = require('koa-passport');

app.use(responseTime());
app.use(logger());
app.use(convert(cors({
  origin: true,
  credentials: true,
  headers: ['Content-Type', 'accept'],
  expose: ['Total', 'X-Response-Time', 'Content-Disposition']
})));
app.use(async (ctx, next) => {
  try {
    await next();
    if (ctx.status === 404) ctx.throw(404);
  } catch (err) {
    console.error(err);
    ctx.status = err.status || 500;
    ctx.body = { message: err.message, success: false };
  }
});

app.keys = [config.app.session.keys];
app.use(convert(session(app)));
app.use(convert(bodyParser({
  multipart: true,
  textLimit: '100mb',
  jsonLimit: '100mb'
})));
// app.use(passport.initialize());
// app.use(passport.session());

// app.use(async (ctx, next) => {
  // if (ctx.isAuthenticated()) {
    // ctx.customer= ctx.passport.user;
    // await next();
  // } else {
    // ctx.status = 401;
    // ctx.body = { success: false, message: '需要登录' };
  // }
// });
routes.register(secureRouter);
app.use(secureRouter.routes());

app.listen(config.app.port, async function () {
  await initial();
  console.log('Server started on', config.app.port);
});
