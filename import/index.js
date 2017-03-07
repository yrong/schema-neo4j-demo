require("babel-core/register");
require("babel-polyfill");
const import_type = process.env.IMPORT_TYPE
let cmdbImporter = require('./excel')
if(import_type === 'json')
    cmdbImporter = require('./json')
console.time(`${import_type} import`)
new cmdbImporter().importer().then((result)=>{
    console.timeEnd(`${import_type} import`)
    console.log(JSON.stringify(result,null,'\t'))
    process.exit()
})