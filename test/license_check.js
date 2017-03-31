// process.env.encryption_algorithm = 'aes'
var path = require("path");
var fs = require("fs");
var licenseCheck = require('../wheels/license_check')
var moment = require('moment')

licenseCheck.load(path.resolve('./CMDB-API.lic'))
console.log(licenseCheck.getLicense())
setInterval(()=>{
        console.log("public:"+licenseCheck.now().unix()),
        console.log("local:"+ moment().unix())
}, 1000)
