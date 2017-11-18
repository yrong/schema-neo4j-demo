var path = require('path');
var fs = require("fs");

const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const WebpackShellPlugin = require('webpack-shell-plugin');
const GitRevisionPlugin = require('git-revision-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')

var mods = {};
fs.readdirSync("node_modules")
    .filter(x => [".bin"].indexOf(x) === -1)
    .forEach(mod => {
        mods[mod] = "commonjs " + mod;
    });

var devtool = 'source-map'

var entry = {server:'./server.js'}
var packages = [
    {from:'cypher',to:'cypher',ignore:['*.js']},
    {from:'node_modules',to:'node_modules'},
]
if(process.env.EDITION === 'essential'){
    packages = [...packages,{from:'script',to:'script'},{from:'search',to:'search',ignore:['*.js']},
        {from:'schema',to:'schema',ignore:['*.js']},{from:'test/*.json'}]
    entry = Object.assign(entry,{init:'./init.js',exportJSON:'./export/json/index.js',importJSON:'./import/json/index.js'})
}

var releaseDir = process.env.ReleaseDir||path.join(__dirname, 'release')
var edition = process.env.EDITION || 'essential'

var plugins = [
    new UglifyJSPlugin({
        sourceMap: devtool && (devtool.indexOf("sourcemap") >= 0 || devtool.indexOf("source-map") >= 0)
    }),
    new CopyWebpackPlugin(packages, {ignore: ['*.gitignore']}),
    new CleanWebpackPlugin(['build']),
    new GitRevisionPlugin(),
    new WebpackShellPlugin({onBuildStart:['echo "Build Start"'], onBuildEnd:[`/bin/bash ./postbuild.sh --dir=${releaseDir} --edition=${edition}`]})
];

var config = {
    target: 'node',
    entry: entry,
    devtool: devtool,
    output: {
        path: path.join(__dirname, 'build'),
        filename: '[name].js'
    },
    node: {
        __filename: true,
        __dirname: true
    },
    externals: mods,
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader'
                }
            }
        ]
    },
    plugins: plugins
};

module.exports = config;
