const schema = require('redis-json-schema')
const fs = require('fs')
const config = require('config')

const syncSchemas = async ()=>{
    let files = fs.readdirSync("./schema"),schemas = [],schma_instance,
        redisOption = {host:`${process.env['REDIS_HOST']||config.get('redis.host')}`,port:config.get('redis.port')},
        additionalPropertyCheck = config.get('additionalPropertyCheck')
    schema.initialize({redisOption,additionalPropertyCheck})
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
    console.log('schemas are:\n' + JSON.stringify(schemas,null,'\t'))
    process.exit(0)
})

