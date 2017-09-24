const schema = require('./schema')
const fs = require('fs')

const syncSchemas = async ()=>{
    let files = fs.readdirSync("./schema"),schemas = [],schma_instance
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
    console.log(JSON.stringify(schemas,null,'\t'))
    process.exit(0)
})