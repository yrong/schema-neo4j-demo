const _ = require('lodash')
const jp = require('jsonpath')
const config = require('config')
const uuid = require('uuid')
const schema = require('redis-json-schema')
const common = require('scirichon-common')
const ScirichonError = common.ScirichonError
const logger = require('log4js_wrapper').getLogger()
const ref_converter = require('../helper/converter')
const cypherBuilder = require('../cypher/cypherBuilder')
const scirichon_cache = require('scirichon-cache')

const getCategoryFromUrl = function (ctx) {
    let category,val,routeSchemas = schema.getApiRouteSchemas()
    for (val of routeSchemas){
        if(ctx.url.includes(val.route)){
            category = val.id
            break
        }
    }
    if(ctx.url.includes('/api/items')&&ctx.method==='DELETE')
        ctx.deleteAll = true
    if(!ctx.deleteAll&&!category)
        throw new ScirichonError('can not find category from url:'+url)
    return category;
}

const paginationParamsGenerator = function (params) {
    var params_pagination = {"skip":0,"limit":config.get('perPageSize')},skip;
    if(params.page){
        params.pagination = true
        params.per_page = params.per_page || config.get('perPageSize')
        skip = (String)((parseInt(params.page)-1) * parseInt(params.per_page));
        params_pagination = {"skip":skip,"limit":params.per_page}
    }
    return _.assign(params,params_pagination);
}

const queryParamsCypherGenerator = function (params) {
    if(params.uuid){
        params.cypher = cypherBuilder.generateQueryNodeCypher(params);
    }
    else{
        params.cypher = cypherBuilder.generateQueryNodesCypher(params);
    }
    let member = schema.getMemberType(params.category)
    if(member){
        params.cypher = cypherBuilder.generateQueryItemWithMembersCypher(params.category,member.member,member.attr,params)
    }else if(params.subcategory){
        params.subcategory = params.subcategory.split(",");
        params.cypher = cypherBuilder.generateQueryItemByCategoryCypher(params);
    }
    return params;
}

const cudItem_params_stringify = async (params) => {
    let objectFields=schema.getSchemaObjectProperties(params.category)
    for (let key of objectFields) {
        if (_.isObject(params.fields[key])) {
            params.fields[key] = JSON.stringify(params.fields[key])
        }
    }
    params = _.assign(params, params.fields)
    for(let key of objectFields){
        if(_.isString(params[key])){
            try{
                params[key] = JSON.parse(params[key])
            }catch(error){
                //same field with different type in different categories(e.g:'status in 'ConfigurationItem' and 'ProcessFlow'),ignore error and just for protection here
            }
        }
    }
}


const cudItem_referenced_params_convert = async (params)=>{
    var convert = async (ref,val)=>{
        val = await ref_converter(ref.schema||ref.items.schema,val)
        jp.value(params, `$.${ref.attr}`,val)
        jp.value(params, `$.fields.${ref.attr}`,val)
    }
    var refs = schema.getSchemaRefProperties(params.category)
    if(refs){
        for(let ref of refs){
            let val = jp.query(params, `$.${ref.attr}`)[0]
            if(val){
                await convert(ref,val)
            }
        }
    }
    return params
}

const logCypher = (params)=>{
    logger.debug(`cypher to executed:${JSON.stringify({cypher:params.cyphers||params.cypher,params:_.omit(params,['cypher','cyphers','data','fields_old','method','url','token'])},null,'\t')}`)
}

const checkReferenced = (uuid,items)=>{
    let referenced = false
    for(let item of items){
        if(!referenced){
            let objectFields=schema.getSchemaObjectProperties(item.category)
            for(let key of objectFields){
                if(_.isString(item[key])){
                    try{
                        item[key] = JSON.parse(item[key])
                    }catch(error){
                        //same field with different type in different categories(e.g:'status in 'ConfigurationItem' and 'ProcessFlow'),ignore error and just for protection here
                    }
                }
            }
            let refProperties = schema.getSchemaRefProperties(item.category)
            for(let refProperty of refProperties){
                let key = refProperty.attr
                let val = jp.query(item, `$.${key}`)[0]
                if(uuid==val||(_.isArray(val)&&_.includes(val,uuid))){
                    referenced = true
                    break
                }
            }
        }
    }
    return referenced
}

const internalUsedFields = ['fields', 'cyphers', 'cypher', 'data', 'token', 'fields_old', 'change', '_id', '_index', '_type','user','id']

const internalUsedFieldsChecker = (params)=>{
    if(params.data&&params.data.fields){
        for (let prop in params.data.fields) {
            if(_.includes(internalUsedFields,prop)){
                throw new ScirichonError(`${prop} not allowed`)
            }
        }
    }
}

const handleCudRequest = async (params, ctx)=>{
    let item_uuid,result,dynamic_field,root_schema,key,keyNames
    params = common.pruneEmpty(params)
    params.category = params.data?params.data.category:getCategoryFromUrl(ctx)
    if (ctx.method === 'POST') {
        item_uuid = params.data.fields.uuid || params.data.uuid || params.uuid || uuid.v1()
        params.data.fields.uuid = item_uuid
        params.fields = _.assign({}, params.data.fields)
        params.fields.category = params.data.category
        params.fields.created = Date.now()
        dynamic_field = schema.getDynamicSeqField(params.category)
        if(dynamic_field){
            result =  await ctx.app.executeCypher.bind(ctx.app.neo4jConnection)(cypherBuilder.generateSequence(params.category), params, true)
            params.fields[dynamic_field] = String(result[0])
        }
        root_schema = schema.getAncestorSchema(params.category)
        if(root_schema.uniqueKeys){
            params.fields['unique_name']=params.fields[root_schema.uniqueKeys[0]]
        }
        if(root_schema.compoundKeys){
            for(key of root_schema.compoundKeys){
                if(key!=='name'){
                    result = await scirichon_cache.getItemByCategoryAndID(_.capitalize(key),params.fields[key])
                    key = key + "_name"
                    params[key] = params.fields[key] = result.name
                }
            }
            keyNames = _.map(root_schema.compoundKeys,(key)=>{
                if(key!=='name')
                    key = key + "_name"
                return key
            })
            params.unique_name = params.fields.unique_name = common.buildCompoundKey(keyNames,params.fields)
        }
    }
    else if (ctx.method === 'PUT' || ctx.method === 'PATCH') {
        if(params.uuid){
            result =  await ctx.app.executeCypher.bind(ctx.app.neo4jConnection)(cypherBuilder.generateQueryNodeCypher(params), params, true)
            if (result && result[0]) {
                params.fields_old = _.omit(result[0],'id')
                params.fields = _.assign({}, params.fields_old,params.data.fields)
                params.fields.lastUpdated = Date.now()
                params.change = params.data.fields
            }else {
                throw new ScirichonError("no record found")
            }
        }
        else {
            throw new ScirichonError("missing uuid")
        }
    } else if (ctx.method === 'DELETE') {
        if(params.uuid){
            result = await ctx.app.executeCypher.bind(ctx.app.neo4jConnection)(cypherBuilder.generateQueryNodeWithRelationCypher(params), params, true)
            if(result&&result[0]&&result[0].self&&result[0].self.category){
                params.category = result[0].self.category
                params.name = result[0].self.name
                params.fields_old = _.omit(result[0].self,'id')
                if(result[0].items&&result[0].items.length){
                    if(checkReferenced(params.uuid,result[0].items)){
                        throw new ScirichonError("node already used")
                    }
                }
            }else{
                throw new ScirichonError("no record found")
            }
        }else if(!ctx.deleteAll){
            throw new ScirichonError("missing uuid")
        }
    }
    if(ctx.method === 'POST'||ctx.method === 'PUT' || ctx.method === 'PATCH'){
        params = _.assign(params, params.fields)
        if(!params.batchImport)
            await cudItem_referenced_params_convert(params)
        await cudItem_params_stringify(params)
        params.cypher = cypherBuilder.generateAddOrUpdateCyphers(params);
    }else if(ctx.method === 'DELETE'){
        params.cypher = cypherBuilder.generateDelNodeCypher(params)
        if(ctx.deleteAll){
            params.cypher = cypherBuilder.generateDelAllCypher()
        }
    }
    logCypher(params)
    return params
}

const handleQueryRequest = (params,ctx)=>{
    params.category = getCategoryFromUrl(ctx)
    params = paginationParamsGenerator(params)
    params = queryParamsCypherGenerator(params)
    logCypher(params)
    return params;
}

module.exports = {getCategoryFromUrl,handleQueryRequest,handleCudRequest,internalUsedFields,internalUsedFieldsChecker,logCypher}