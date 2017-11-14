const _ = require('lodash')
const config = require('config')
const esConfig = config.get('elasticsearch')
const elasticsearch = require('elasticsearch')
const es_client = new elasticsearch.Client({
    host: esConfig.host + ":" + esConfig.port,
    requestTimeout: esConfig.requestTimeout
})
const schema = require('redis-json-schema')
const logger = require('log4js_wrapper').getLogger()
const requestHandler = require('../hooks/requestHandler')
const responseHandler = require('../hooks/responseHandler')
const hidden_fields = requestHandler.internalUsedFields

const addOrUpdateItem = function(params, ctx) {
    let routes = schema.getApiRoutesAll(),typeName = schema.getAncestorSchemas(params.category),indexName,index_obj,promise = Promise.resolve(params)
    if(routes[typeName]&&routes[typeName].searchable){
        indexName = routes[typeName].searchable.index
        index_obj = {
            index: indexName,
            type: typeName,
            id: params.uuid,
            refresh:true
        }
        if(!ctx||ctx.method === 'POST'){
            index_obj.body = _.omit(params,hidden_fields)
            promise = es_client.index(index_obj)
        }else if(ctx.method === 'PUT'||ctx.method === 'PATCH') {
            index_obj.body = {doc: _.omit(params, hidden_fields)}
            promise = es_client.update(index_obj)
        }
        promise.then(()=>{
            logger.debug(`add index in es:${JSON.stringify(index_obj,null,'\t')}`)
        })
    }
    return promise
}

const deleteItem = function(params, ctx) {
    var queryObj = params.uuid?{term:{uuid:params.uuid}}:{match_all:{}}
    let routes = schema.getApiRoutesAll(),typeName = requestHandler.getCategoryFromUrl(ctx),indexName,promise = Promise.resolve(params)
    if(routes[typeName]&&routes[typeName].searchable){
        if(ctx.deleteAll)
            indexName = '*'
        else
            indexName = routes[typeName].searchable.index
        var delObj = {
            index: indexName,
            body: {
                query: queryObj
            },
            refresh:true
        }
        promise = es_client.deleteByQuery(delObj).then(function () {
            logger.debug(`delete index in es:${JSON.stringify(delObj,null,'\t')}`)
        })
    }
    return promise
}

const esResponseWrapper = function(response){
    return {count:response.hits.total,results:_.map(response.hits.hits,(result)=>_.omit(result._source,hidden_fields))}
}

const searchItem = (params, ctx)=> {
    var query = params.uuid?`uuid:${params.uuid}`:(params.keyword?params.keyword:'*');
    var _source = params._source?params._source.split(','):true;
    var params_pagination = {"from":0,"size":config.get('perPageSize')},from;
    if(params.page&&params.per_page){
        from = (String)((parseInt(params.page)-1) * parseInt(params.per_page));
        params_pagination = {"from":from,"size":params.per_page}
    }
    var queryObj = params.body?{body:params.body}:{q:query}
    let routes = schema.getApiRoutesAll()
    let typeName = params.category = params.category || requestHandler.getCategoryFromUrl(ctx)
    let indexName = routes[typeName].searchable.index
    params.search = true
    var searchObj = _.assign({
        index: indexName,
        type: params.category,
        _source:_source
    },queryObj,params_pagination)
    logger.debug(`search in es:${JSON.stringify(searchObj,null,'\t')}`)
    return es_client.search(searchObj).then(async function (response) {
        response = esResponseWrapper(response)
        if(response.count>0&&_.isArray(response.results)){
            response.results = await responseHandler.resultMapper(response.results, params, ctx);
        }
        return response
    });
}

var checkStatus = ()=> {
    return es_client.ping({
        requestTimeout: Infinity
    })
}

module.exports = {searchItem,deleteItem,addOrUpdateItem,checkStatus}