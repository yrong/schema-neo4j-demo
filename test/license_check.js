// process.env.encryption_algorithm = 'aes'
var path = require("path");
var fs = require("fs");
var licenseCheck = require('cmdb-license-checker')

let license = licenseCheck.load(path.resolve('./CMDB-API.lic'))
console.log(license)