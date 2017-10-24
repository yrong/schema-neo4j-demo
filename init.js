const schema = require('redis-json-schema')
const fs = require('fs')
const scirichon_cache = require('scirichon-cache')
const config = require('config')

const syncSchemas = async ()=>{
    let files = fs.readdirSync("./schema"),schemas = [],schma_instance
    await schema.clearSchemas()
    for(let file of files){
        if(file!='index.js') {
            schma_instance = JSON.parse(fs.readFileSync('./schema/' + file, 'utf8'))
            schema.checkSchema(schma_instance)
            await schema.persitSchema(schma_instance)
            schemas.push(schma_instance)
        }
    }
    return schemas
}

syncSchemas().then((schemas)=>{
    if(process.env['INIT_CACHE']){
        scirichon_cache.loadAll(`http://localhost:${config.get('port')}/api`).then(()=>{
            console.log('scirichon cache reload')
            process.exit(0)
        })
    }else{
        console.log('schemas are:\n' + JSON.stringify(schemas,null,'\t'))
        process.exit(0)
    }
})

