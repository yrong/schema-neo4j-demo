var webpack = require('webpack');
var path = require('path');
var fs = require("file-system");

var mods = {};
fs.readdirSync("node_modules")
    .filter(x => [".bin"].indexOf(x) === -1)
    .forEach(mod => {
        mods[mod] = "commonjs " + mod;
    });

var plugins = [];

var config = {
    target: 'node',
    entry: {
        './koa-neo4j/index': './koa-neo4j/src/index',
        './koa-neo4j/preprocess': ['./koa-neo4j/src/preprocess'],
        './koa-neo4j/postprocess': ['./koa-neo4j/src/postprocess'],
        './koa-neo4j/check': './koa-neo4j/src/check',
        './koa-neo4j/procedure': ['./koa-neo4j/src/procedure'],
        './koa-neo4j/util': ['./koa-neo4j/src/util'],
        './koa-neo4j/bdd': './koa-neo4j/src/bdd'
    },
    devtool: 'source-map',
    output: {
        path: './',
        filename: '[name].js',
        library: '[name]',
        libraryTarget: 'umd',
        umdNamedDefine: true
    },
    externals: mods,
    module: {
        loaders: [
            // Support for ES6 modules and the latest ES syntax.
            {
                test: /\.jsx?$/,
                exclude: /(node_modules)/,
                loader: "babel"
            }
        ]
    },
    resolveLoader: {
        root: path.join(__dirname, 'node_modules')
    },
    resolve: {
        root: path.resolve('./src'),
        extensions: ['', '.js']
    },
    plugins: plugins
};

module.exports = config;
