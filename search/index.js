var config = require('config');

var _ = require('lodash');

var esConfig = config.get('config.elasticsearch');

var hook = require('../hooks');

var elasticsearch = require('elasticsearch');

var es_client = new elasticsearch.Client({
    host: esConfig.host + ":" + esConfig.port
});

var indexName = esConfig.index

var hidden_fields = ['fields','cyphers','method','data','token','fields_old','change','url','id']

var schema = require('../schema')

var logger = require('../logger')

var validate = require('uuid-validate');

const upload_options = config.get('config.upload')

let store = require(`../koa-file-upload/${upload_options.provider}`)(upload_options)

var pre_process = function(params) {
    if(params.attachment&&validate(params.attachment, 1)){
        params.attachment = store.get(params.attachment)
    }
    return params
}

var addItem = function(result, params, ctx) {
    params = pre_process(params)
    let index_obj = {
        index: indexName,
        type: _.last(schema.cmdbTypeLabels[params.category]),
        id:params.uuid,
        body: _.omit(params,hidden_fields),
        refresh:true
    }
    logger.debug(`add index in es:${JSON.stringify(index_obj,null,'\t')}`)
    return es_client.index(index_obj).then(function (response) {
        return hook.cudItem_postProcess(response, params, ctx);
    }, function (error) {
        throw error;
    });
}

var patchItem = function(result, params, ctx) {
    params = pre_process(params)
    let index_obj = {
        index: indexName,
        type: _.last(schema.cmdbTypeLabels[params.category]),
        id:params.uuid,
        body: {doc:_.omit(params,hidden_fields)},
        refresh:true
    }
    logger.debug(`patch index in es:${JSON.stringify(index_obj,null,'\t')}`)
    return es_client.update(index_obj).then(function (response) {
        return hook.cudItem_postProcess(response, params, ctx);
    }, function (error) {
        throw error;
    });
}

var delItem = function(result, params, ctx) {
    var queryObj = params.uuid?{term:{uuid:params.uuid}}:{match_all:{}}
    var delObj = {
        index: indexName,
        type: hook.getCategoryFromUrl(ctx.url),
        body: {
            query: queryObj
        }
    }
    logger.debug(`delete index in es:${JSON.stringify(delObj,null,'\t')}`)
    return es_client.deleteByQuery(delObj).then(function (response) {
        return hook.cudItem_postProcess(response, params, ctx);
    }, function (error) {
        throw error;
    });
}


var responseWrapper = function(response){
    return {count:response.hits.total,results:_.map(response.hits.hits,(result)=>_.omit(result._source,hidden_fields))}
}

var searchItem = function(params, ctx) {
    var query = params.uuid?`uuid:${params.uuid}`:(params.keyword?params.keyword:'*');
    var _source = params._source?params._source.split(','):true;
    var params_pagination = {"from":0,"size":config.get('config.perPageSize')},from;
    if(params.page&&params.per_page){
        from = (String)((parseInt(params.page)-1) * parseInt(params.per_page));
        params_pagination = {"from":from,"size":params.per_page}
    }
    var queryObj = params.body?{body:params.body}:{q:query}
    var searchObj = _.assign({
        index: indexName,
        type: hook.getCategoryFromUrl(ctx.url),
        _source:_source
    },queryObj,params_pagination)
    logger.debug(`search in es:${JSON.stringify(searchObj,null,'\t')}`)
    return es_client.search(searchObj).then(function (response) {
        return hook.queryItems_postProcess(responseWrapper(response), params, ctx);
    });
}

var checkStatus = ()=> {
    return es_client.ping({
        requestTimeout: Infinity
    })
}

module.exports = {searchItem,delItem,patchItem,addItem,checkStatus}