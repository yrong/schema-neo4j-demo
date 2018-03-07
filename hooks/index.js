const _ = require('lodash')
const config = require('config')
const qr = require('qr-image')
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const common = require('scirichon-common')
const schema = require('redis-json-schema')
const scirichon_cache = require('scirichon-cache')
const cypherBuilder = require('../cypher/cypherBuilder')
const ScirichonWarning = common.ScirichonWarning
const search = require('../search')
const requestHandler = require('./requestHandler')
const responseHandler = require('./responseHandler')
const logger = require('log4js_wrapper').getLogger()
const cypherInvoker = require('../helper/cypherInvoker')
const requestPostHandler = require('./requestPostHandler')

module.exports = {
    cudItem_preProcess: async function (params, ctx) {
        params = await requestHandler.handleCudRequest(params,ctx)
        return params
    },
    cudItem_postProcess:async function (result,params,ctx) {
        if(ctx.method==='POST'||ctx.method==='PUT'||ctx.method==='PATCH'){
            await Promise.all([requestPostHandler.updateCache(params,ctx),requestPostHandler.updateSearch(params,ctx),requestPostHandler.addNotification(params,ctx),requestPostHandler.generateQR(params,ctx)]).catch((e)=>{
                logger.error(e.stack || e)
                throw new ScirichonWarning(String(e))
            })
        }
        if(ctx.method==='DELETE'){
            if(!ctx.deleteAll&&(!result||(result.length!=1))){
                throw new ScirichonWarning('no record found')
            }
            await Promise.all([requestPostHandler.updateCache(params,ctx),requestPostHandler.updateSearch(params,ctx),requestPostHandler.addNotification(params,ctx)]).catch((e)=>{
                logger.error(e.stack || e)
                throw new ScirichonWarning(String(e))
            })
        }
        return {uuid:params.uuid}||{}
    },
    queryItems_preProcess:function (params,ctx) {
        return requestHandler.handleQueryRequest(params,ctx);
    },
    queryItems_postProcess:async function (result,params,ctx) {
        result = _.isArray(result)&&result.length>0?result[0]:result
        if(result.count>0&&_.isArray(result.results)){
            result.results = await responseHandler.cypherResponseMapper(result.results,params,ctx);
        }else{
            result = await responseHandler.cypherResponseMapper(result,params,ctx)
        }
        return result
    },
    customizedQueryItems_preProcess:(params,ctx)=>{
        if(params.cypherQueryFile){
            params.cypher = fs.readFileSync(path.resolve(__dirname,'../cypher/'+params.cypherQueryFile + '.cyp'), "utf8")
        }
        requestHandler.logCypher(params)
        return params
    },
    getCategoryInheritanceHierarchy:async function (params,ctx) {
        let schemaInheritanceRelationship = schema.getSchemaHierarchy(params.category),result
        let addSubTypeRelationship = async(relationship)=>{
            result = await cypherInvoker.executeCypher(ctx,cypherBuilder.generateQueryInheritHierarchyCypher,{category:relationship.name})
            if(result&&result.length){
                relationship.children = _.map(result,(subtype)=>{
                    return {name:subtype.category}
                })
            }
            if(relationship.children){
                for(let child of relationship.children){
                    await addSubTypeRelationship(child)
                }
            }
        }
        await addSubTypeRelationship(schemaInheritanceRelationship)
        return schemaInheritanceRelationship
    },
    addCategoryInheritanceHierarchy: async function (params,ctx) {
        let result = await cypherInvoker.executeCypher(ctx,cypherBuilder.generateInheritRelCypher,params)
        return result
    },
    getCategorySchema:async function(params, ctx) {
        let result = await cypherInvoker.executeCypher(ctx,cypherBuilder.generateQueryInheritHierarchyCypher,params)
        return {
            properties:schema.getSchemaProperties(params.category),
            parents:schema.getParentCategories(params.category),
            references:_.uniq(_.map(schema.getSchemaRefProperties(params.category),(attr)=>attr.schema)),
            subtypes:_.map(result,(subtype)=>subtype.category)
        }

    }
}

