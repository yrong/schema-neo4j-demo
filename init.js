const schema = require('redis-json-schema')
const fs = require('fs')
const config = require('config')
const neo4j = require('neo4j-driver').v1
const neo4jConfig = config.get('neo4j')
const neo4jDriver = neo4j.driver("bolt://"+(process.env['NEO4J_HOST']||neo4jConfig.host)+":"+neo4jConfig.port, neo4j.auth.basic(process.env['NEO4J_USER']||neo4jConfig.user, process.env['NEO4J_PASSWD']||neo4jConfig.password))
const {parse} = require('parse-neo4j-fork')
const _ = require('lodash')
const elasticsearch = require('elasticsearch')
const esConfig = config.get('elasticsearch')
const es_client = new elasticsearch.Client({
    host: (process.env['ES_HOST']||esConfig.host) + ":" + esConfig.port,
    requestTimeout: esConfig.requestTimeout
})

const executeCypher = (cql,params)=>{
    return new Promise((resolve, reject) => {
        const session = neo4jDriver.session()
        session.run(cql, params)
            .then(result => {
                session.close()
                resolve(parse(result))
            })
            .catch(error => {
                session.close()
                error = error.fields ? JSON.stringify(error.fields[0]) : String(error)
                reject(`error while executing Cypher: ${error}`)
            });
    })
}

const initElasticSearchSchema = async ()=>{
    const categories = ['cmdb','processflow']
    let schema_promise = (category)=>{
        return new Promise((resolve,reject)=>{
            es_client.indices.delete({index:[category]},(err)=>{
                es_client.indices.create({index:category,body:JSON.parse(fs.readFileSync(`./search/${category}.json`, 'utf8'))},(err)=>{
                    resolve()
                })
            })
        })
    }
    for(let category of categories){
        await schema_promise(category)
    }
}

const initNeo4jConstraints = async ()=>{
    const routes = schema.getApiRoutesAll()
    for(let category of _.keys(routes)){
        let uniqueKeys = routes[category].uniqueKeys
        if(uniqueKeys){
            for(let field of uniqueKeys){
                await executeCypher(`CREATE CONSTRAINT ON (n:${category}) ASSERT n.${field} IS UNIQUE`)
            }
        }
    }

}

const initJsonSchema = async ()=>{
    let files = fs.readdirSync("./schema"),schma_obj,
        redisOption = {host:`${process.env['REDIS_HOST']||config.get('redis.host')}`,port:config.get('redis.port'),dbname:'VEHICLE_SCHEMA'}
    schema.initialize({redisOption})
    await schema.clearSchemas()
    for(let file of files){
        if(file!='index.js') {
            schma_obj = JSON.parse(fs.readFileSync('./schema/' + file, 'utf8'))
            schema.checkSchema(schma_obj)
            await schema.persitSchema(schma_obj)
        }
    }
    await schema.loadSchemas({redisOption})
}

const initialize = async ()=>{
    await initJsonSchema()
    // await initNeo4jConstraints()
    // await initElasticSearchSchema()
}

initialize().then((schemas)=>{
    console.log('intialize schema success!')
    process.exit(0)
})

