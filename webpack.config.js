var webpack = require('webpack');
var path = require('path');
var fs = require("file-system");


const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const WebpackShellPlugin = require('webpack-shell-plugin');

var mods = {};
fs.readdirSync("node_modules")
    .filter(x => [".bin"].indexOf(x) === -1)
    .forEach(mod => {
        mods[mod] = "commonjs " + mod;
    });

var devtool = 'source-map'

var entry = {server:'./server.js'}
var packages = [
    {from:'config',to:'config'},{from:'cypher/initSchema.cyp',to:'cypher/initSchema.cyp'},
    {from:'public',to:'public'},{from:'cypher/QueryMountedCabinet.cyp',to:'cypher/QueryMountedCabinet.cyp'},
    {from:'test/*.json'},{from:'node_modules',to:'node_modules'},
    {from:'search',to:'search',ignore:['*.js']}
]
if(process.env.EDITION === 'advanced'){
    entry = Object.assign(entry,{exportJSON:'./export/json/index.js',importExcel:'./import/excel/index.js',importJSON:'./import/json/index.js'})
    packages = [...packages,{from:'script',to:'script'}]
}else{
    packages = [...packages,{from:'script/init.sh',to:'script/init.sh'},{from:'script/execute_cypher.sh',to:'script/execute_cypher.sh'},{from:'script/jq-linux64',to:'script/jq-linux64'}]
}

var releaseDir = process.env.ReleaseDir||path.join(__dirname, 'release')

var plugins = [
    new webpack.optimize.UglifyJsPlugin({
        sourceMap: devtool && (devtool.indexOf("sourcemap") >= 0 || devtool.indexOf("source-map") >= 0)
    }),
    new CopyWebpackPlugin(packages, {ignore: ['*.gitignore']}),
    new CleanWebpackPlugin(['build']),
    new WebpackShellPlugin({onBuildStart:['echo "Webpack Start"'], onBuildEnd:[`/bin/bash ./postbuild.sh --dir=${releaseDir}`]})
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
