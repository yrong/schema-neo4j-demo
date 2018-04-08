const _ = require('lodash')
const jp = require('jsonpath')
const config = require('config')
const uuid = require('uuid')
const schema = require('redis-json-schema')
const common = require('scirichon-common')
const ScirichonError = common.ScirichonError
const logger = require('log4js_wrapper').getLogger()
const referenceChecker = require('../helper/referenceChecker')
const cypherBuilder = require('../cypher/cypherBuilder')
const scirichon_cache = require('scirichon-cache')
const cypherInvoker = require('../helper/cypherInvoker')


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

const queryCypherGenerator = function (params) {
    if(params.uuid){
        params.cypher = cypherBuilder.generateQueryNodeCypher(params)
    }
    else{
        params.cypher = cypherBuilder.generateQueryNodesCypher(params)
        if(params.tags||params.subcategory){
            params.tags = (params.tags||params.subcategory).split(",");
            params.cypher = cypherBuilder.generateQueryItemByCategoryCypher(params);
        }
    }
    logCypher(params)
    return params;
}

const stringifyObjectFields = async (params) => {
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


const checkIfReferencedObjectExist = async (params)=>{
    let check = async (ref,val)=>{
        await referenceChecker(ref.schema||ref.items.schema,val)
    }
    let refs = schema.getSchemaRefProperties(params.category)
    if(refs){
        for(let ref of refs){
            let val = jp.query(params, `$.${ref.attr}`)[0]
            if(val){
                await check(ref,val)
            }
        }
    }
    return params
}

const logCypher = (params)=>{
    logger.debug(`cypher to executed:${JSON.stringify({cypher:params.cyphers||params.cypher,params:_.omit(params,['cypher','cyphers','data','fields_old','method','url','token'])},null,'\t')}`)
}

const checkIfUidReferencedByOthers = (uuid,items)=>{
    let referenced = false,item,index=0
    while(!referenced&&index<items.length){
        item = items[index]
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
        index++
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

const generateUniqueNameField = async (params, ctx) => {
    let schema_obj = schema.getAncestorSchema(params.category),compound_obj={}
    if (schema_obj.uniqueKeys && schema_obj.uniqueKeys.length) {
        params.unique_name = params.fields.unique_name = params.fields[schema_obj.uniqueKeys[0]]
    } else if (schema_obj.compoundKeys && schema_obj.compoundKeys.length) {
        if(!params.fields['name']){
            throw new ScirichonError('compoundKey object missing name field!')
        }
        compound_obj['name'] = params.fields['name']
        for (let key of schema_obj.compoundKeys) {
            if (key !== 'name') {
                let category = _.capitalize(key)
                let result = await scirichon_cache.getItemByCategoryAndID(category, params.fields[key])
                if (!_.isEmpty(result)) {
                    key = key + "_name"
                    compound_obj[key] = result.name
                }
            }
        }
        let keyNames = _.map(schema_obj.compoundKeys, (key) => key !== 'name' ? key + "_name" : key)
        params.unique_name = params.fields.unique_name = common.buildCompoundKey(keyNames, compound_obj)
    }
    if(params.unique_name&&ctx.method==='POST'){
        let obj = await scirichon_cache.getItemByCategoryAndUniqueName(params.category,params.unique_name)
        if(!_.isEmpty(obj)){
            throw new ScirichonError(`${params.category}存在名为"${params.unique_name}"的同名对象`)
        }
    }
}

const generateDynamicSeqField = async (params,ctx)=>{
    let schema_obj = schema.getAncestorSchema(params.category)
    if(schema_obj&&schema_obj.dynamicSeqField){
        let result =  await cypherInvoker.executeCypher(ctx,cypherBuilder.generateSequence(params.category), params)
        if(result&&result.length){
            params.fields[schema_obj.dynamicSeqField] = String(result[0])
        }
    }
}

const assignFields4CreateOrUpdate = async (params,ctx)=>{
    if (ctx.method === 'POST') {
        params.data.fields.uuid = params.data.fields.uuid || params.data.uuid || params.uuid || uuid.v1()
        params.fields = _.assign({}, params.data.fields)
        params.fields.category = params.data.category
        params.fields.created = params.fields.created || Date.now()
        await generateDynamicSeqField(params, ctx)
        await generateUniqueNameField(params, ctx)
    } else if (ctx.method === 'PUT' || ctx.method === 'PATCH') {
        if (params.uuid) {
            let result = await cypherInvoker.executeCypher(ctx, cypherBuilder.generateQueryNodeCypher(params), params)
            if (result && result[0]) {
                params.change = params.data.fields
                params.fields_old = _.omit(result[0], 'id')
                params.fields = _.assign({}, params.fields_old, params.data.fields)
                params.fields.lastUpdated = params.data.fields.lastUpdated || Date.now()
            } else {
                throw new ScirichonError("no record found")
            }
            if(params.change.name){
                await generateUniqueNameField(params, ctx)
            }
        }
        else {
            throw new ScirichonError("missing uuid")
        }
    }
    params = _.assign(params, params.fields)
    await checkIfReferencedObjectExist(params)
    await stringifyObjectFields(params)
}

const assignFields4Delete = async (params,ctx)=>{
    if(params.uuid){
        let result = await cypherInvoker.executeCypher(ctx,cypherBuilder.generateQueryNodeWithRelationCypher(params), params)
        if(result&&result[0]){
            if(result[0].self&&result[0].self.category){
                params.category = result[0].self.category
                params.name = result[0].self.name
                params.fields_old = _.omit(result[0].self,'id')
                if(result[0].items&&result[0].items.length){
                    if(checkIfUidReferencedByOthers(params.uuid,result[0].items)){
                        throw new ScirichonError("node already used")
                    }
                }
            }
        }else{
            throw new ScirichonError("no record found")
        }
    }else if(!ctx.deleteAll){
        throw new ScirichonError("missing uuid")
    }
}

const assignFields = async (params,ctx)=>{
    params.category = params.data?params.data.category:getCategoryFromUrl(ctx)
    if (ctx.method === 'POST'||ctx.method === 'PUT' || ctx.method === 'PATCH') {
        await assignFields4CreateOrUpdate(params,ctx)
    }
    else if (ctx.method === 'DELETE') {
        await assignFields4Delete(params,ctx)
    }
}

const generateCypher = async(params,ctx)=>{
    if(ctx.method === 'POST'||ctx.method === 'PUT' || ctx.method === 'PATCH'){
        params.cypher = cypherBuilder.generateAddOrUpdateCyphers(params);
    }else if(ctx.method === 'DELETE'){
        params.cypher = cypherBuilder.generateDelNodeCypher(params)
        if(ctx.deleteAll){
            params.cypher = cypherBuilder.generateDelAllCypher()
        }
    }
    logCypher(params)
}

const handleCudRequest = async (params, ctx)=>{
    params = common.pruneEmpty(params)
    await assignFields(params,ctx)
    await generateCypher(params,ctx)
    return params
}

const handleQueryRequest = (params,ctx)=>{
    params.category = getCategoryFromUrl(ctx)
    params = paginationParamsGenerator(params)
    params = queryCypherGenerator(params)
    return params;
}

module.exports = {getCategoryFromUrl,handleQueryRequest,handleCudRequest,internalUsedFields,internalUsedFieldsChecker,logCypher}