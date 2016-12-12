var fs = require('file-system');

var _ = require('lodash');

var uuid = require('node-uuid');

var schema = require('./schema')

var MAXNUM = 1000;

var cmdb_delRelsExist_cypher = fs.readFileSync('./cypher/delRelsExist.cyp', 'utf8');
var cmdb_addITServiceRel_cypher = fs.readFileSync('./cypher/addITServiceRel.cyp', 'utf8');
var cmdb_addUserRel_cypher = fs.readFileSync('./cypher/addUserRel.cyp', 'utf8');
var cmdb_addCabinetRel_cypher = fs.readFileSync('./cypher/addCabinetRel.cyp', 'utf8');
var cmdb_addLocationRel_cypher = fs.readFileSync('./cypher/addLocationRel.cyp', 'utf8');

var cypher = {};

_.forEach(schema.cmdbTypes,function(type){
    cypher[type] = fs.readFileSync('./cypher/add' + type + '.cyp', 'utf8');
});

var paginationQueryItems_preProcess = function (params) {
    var params_pagination = {"skip":0,"limit":MAXNUM};
    if(params.page&&params.per_page){
        var skip = (String)((parseInt(params.page)-1) * parseInt(params.per_page));
        params_pagination = {"skip":skip,"limit":params.per_page}
    }
    return _.assign(params,params_pagination);
};

var paginationQueryItems_postProcess = function (result) {
    var result_new =
        {
            "status":"ok", //ok, info, warning, error,
            "message":{
                "content":"query success",
                "displayAs":"toast" //toast, modal, console, alert
            },
            "data":{
                "count":0,
                "results": []
            }
        };
    if(result[0]){
        var results = result[0].nodes
        results = _.map(results, function(value) {
            return _.omit(value,'id');
        });
        result_new.data.count = result[0].cnt;
        result_new.data.results = results;
    }
    return result_new;
};

var generateCyphersTodo = function (params) {
    var cyphers_todo = [cypher[params.category],cmdb_delRelsExist_cypher];
    if(params.it_service){
        cyphers_todo.push(cmdb_addITServiceRel_cypher);
    }
    if(params.userid){
        cyphers_todo.push(cmdb_addUserRel_cypher);
    }
    if(params.asset_location&&params.asset_location.cabinet){
        cyphers_todo.push(cmdb_addCabinetRel_cypher);
    }
    if(params.asset_location&&params.asset_location.location){
        cyphers_todo.push(cmdb_addLocationRel_cypher);
    }
    return cyphers_todo;
}

var addItem_preProcess = function (params) {
    var params_new = {"fields":params.data.fields};
    params_new.uuid = params.uuid?params.uuid:uuid.v1();
    params_new.asset_location = params.data.fields.asset_location?params.data.fields.asset_location:null;
    params_new.it_service = params.data.fields.it_service?params.data.fields.it_service:null;
    params_new.userid = params.data.fields.userid?params.data.fields.userid:null;
    // params_new.fields = _.omit(params.data.fields,'asset_location');
    params_new.fields.asset_location = JSON.stringify(params_new.fields.asset_location);
    params_new.category = params.data.category;
    params_new.fields.updated_by = 1//user.userid
    params_new.cyphers = generateCyphersTodo(params_new);
    return params_new;
};

var crudItem_postProcess = function (result,params,ctx) {
    return  {
        "status":"info",
        "content": 'Operation for '　+ params.uuid + " Success!",
        "displayAs":"toast"
    }
};

var getTypeFromUrl = function (url) {
    var type = _.find(schema.cmdbTypesAll,function(type){
        return url.includes(type.toLowerCase());
    })
    if(url.includes('it_services/service')){
        type = 'ITService';
    }
    if(url.includes('it_services/group')){
        type = 'ITServiceGroup';
    }
    return type;
}

var keyWordPaginationQueryItems_preProcess = function (params,ctx) {
    params = paginationQueryItems_preProcess(params);
    if(params.keyword){
        params.keyword = '(?i).*' +params.keyword + '.*';
        params.cypher = fs.readFileSync('./cypher/query' + getTypeFromUrl(ctx.matched[0].path)
            + 'ByAlias.cyp', 'utf8');
    }else{
        params.cypher = fs.readFileSync('./cypher/query' +　getTypeFromUrl(ctx.matched[0].path)
            + '.cyp', 'utf8');
    }
    return params;
}

module.exports = {
    'paginationQueryItems_preProcess':paginationQueryItems_preProcess,
    'paginationQueryItems_postProcess':paginationQueryItems_postProcess,
    'addItem_preProcess':addItem_preProcess,
    'crudItem_postProcess':crudItem_postProcess,
    'keyWordPaginationQueryItems_preProcess':keyWordPaginationQueryItems_preProcess
}

