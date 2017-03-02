require("babel-core/register");
require("babel-polyfill");

const export_type = process.env.EXPORT_TYPE
let exporter = require('./json')
console.time('JsonExport')
exporter().then((result)=>{
    console.timeEnd('JsonExport')
    console.log(JSON.stringify(result,null,'\t'))
    process.exit()
})