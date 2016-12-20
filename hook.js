var fs = require('file-system');

var _ = require('lodash');

var uuid = require('node-uuid');

var schema = require('./schema')

var MAXNUM = 1000;

var cmdb_delRelsExistInCmdb_cypher = fs.readFileSync('./cypher/delRelsExistInCmdb.cyp', 'utf8');
var cmdb_addITServiceSupportRel_cypher = fs.readFileSync('./cypher/addITServiceSupportRel.cyp', 'utf8');
var cmdb_addUserRel_cypher = fs.readFileSync('./cypher/addUserRel.cyp', 'utf8');
var cmdb_addCabinetRel_cypher = fs.readFileSync('./cypher/addCabinetRel.cyp', 'utf8');
var cmdb_addLocationRel_cypher = fs.readFileSync('./cypher/addLocationRel.cyp', 'utf8');

var cmdb_addITService_cypher = fs.readFileSync('./cypher/addITService.cyp', 'utf8');
var cmdb_delResExistInITService_cypher = fs.readFileSync('./cypher/delRelsExistInITService.cyp', 'utf8');
var cmdb_addITServiceBelongsToGroupRel_cypher = fs.readFileSync('./cypher/addITServiceBelongsToGroupRel.cyp', 'utf8');
var cmdb_addITServiceParentRel_cypher = fs.readFileSync('./cypher/addITServiceParentRel.cyp', 'utf8');
var cmdb_addITServiceChildrenRel_cypher = fs.readFileSync('./cypher/addITServiceChildrenRel.cyp', 'utf8');
var cmdb_addITServiceDependenciesRel_cypher = fs.readFileSync('./cypher/addITServiceDependenciesRel.cyp', 'utf8');
var cmdb_addITServiceDependendentsRel_cypher = fs.readFileSync('./cypher/addITServiceDependendentsRel.cyp', 'utf8');


var paginationQueryItems_preProcess = function (params) {
    var params_pagination = {"skip":0,"limit":MAXNUM};
    if(params.page&&params.per_page){
        var skip = (String)((parseInt(params.page)-1) * parseInt(params.per_page));
        params_pagination = {"skip":skip,"limit":params.per_page}
    }
    return _.assign(params,params_pagination);
};

var removeIdProperty = function(val) {
    if(_.isArray(val)){
        val = _.map(val, function(val) {
            return _.omit(val,'id');
        });
    }else{
        val = _.omit(val,'id')
    }
    return val;
}

var paginationQueryItems_postProcess = function (result) {
    var result_new =
        {
            "status":"ok", //ok, info, warning, error,
            "message":{
                "content":"no record found",
                "displayAs":"toast" //toast, modal, console, alert
            },
            "data":{
                "count":0,
                "results": []
            }
        };
    if(result&&result[0]&&result[0].nodes&&result[0].cnt){
        result_new.message.content = "query success";
        result_new.data.count = result[0].cnt;
        result_new.data.results = removeIdProperty(result[0].nodes)
    }
    return result_new;
};

var generateCmdbCyphersTodo = function (params) {
    var cyphers_todo = [fs.readFileSync('./cypher/add' + params.category + '.cyp', 'utf8'),cmdb_delRelsExistInCmdb_cypher];
    if(params.it_service){
        cyphers_todo.push(cmdb_addITServiceSupportRel_cypher);
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

var generateITServiceCyphersTodo = function (params) {
    var cyphers_todo = [cmdb_addITService_cypher,cmdb_delResExistInITService_cypher];
    if(params.group){
        cyphers_todo.push(cmdb_addITServiceBelongsToGroupRel_cypher);
    }
    if(params.parent){
        cyphers_todo.push(cmdb_addITServiceParentRel_cypher);
    }
    if(params.children){
        cyphers_todo.push(cmdb_addITServiceChildrenRel_cypher);
    }
    if(params.dependencies){
        cyphers_todo.push(cmdb_addITServiceDependenciesRel_cypher);
    }
    if(params.dependendents){
        cyphers_todo.push(cmdb_addITServiceDependendentsRel_cypher);
    }
    return cyphers_todo;
}


var addItem_preProcess = function (params) {
    var params_new = {"fields":params.data.fields};
    params_new = _.assign(params_new,params.data.fields);
    params_new.method = params.method;
    params_new.category = params.data.category;
    params_new.uuid = params.uuid?params.uuid:uuid.v1();
    if(_.indexOf(schema.cmdbTypes,params_new.category)>-1){
        params_new.fields.asset_location = JSON.stringify(params_new.fields.asset_location);
        params_new.fields.updated_by = 1//user.userid
        params_new.cyphers = generateCmdbCyphersTodo(params_new);
    }else if(params_new.category === "ITService"){
        params.data.fields.children = JSON.stringify(params.data.fields.children);
        params.data.fields.dependencies = JSON.stringify(params.data.fields.dependencies);
        params.data.fields.dependendents = JSON.stringify(params.data.fields.dependendents);
        params_new.cyphers = generateITServiceCyphersTodo(params_new);
    }else if(params_new.category === "ProcessFlow"){
        params_new.fields = _.omit(params_new.fields,'desc');
    }
    return params_new;
};

var cudItem_postProcess = function (result,params,ctx) {
    var result_new = {
        "status":"info",
        "content": 'Operation Success!',
        "displayAs":"toast"
    }
    if(params.method == 'DEL' && params.uuid && result.length != 1){
        result_new = {
            "status":"warn",
            "content": 'no record found!',
            "displayAs":"toast"
        }
    }
    if(params.uuid)
        result_new.uuid = params.uuid;
    return　result_new;
};

var getTypeFromUrl = function (url) {
    var type = _.find(schema.cmdbAuxiliaryTypes,function(type){
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

var keyWordQueryItems_preProcess = function (params,ctx) {
    if(params.keyword){
        params.keyword = '(?i).*' +params.keyword + '.*';
        params.cypher = fs.readFileSync('./cypher/query' + getTypeFromUrl(ctx.matched[0].path)
            + 'ByKeyword.cyp', 'utf8');
    }else{
        params.cypher = fs.readFileSync('./cypher/query' +　getTypeFromUrl(ctx.matched[0].path)
            + '.cyp', 'utf8');
    }
    return params;
}

var keyWordPaginationQueryItems_preProcess = function (params,ctx) {
    params = paginationQueryItems_preProcess(params);
    params = keyWordQueryItems_preProcess(params,ctx);
    return params;
}

var queryItems_postProcess = function (result) {
    var result_new =
        {
            "status":"ok", //ok, info, warning, error,
            "message":{
                "content":"no record found",
                "displayAs":"toast" //toast, modal, console, alert
            },
            "data": []
        };
    if(result&&result[0]){
        result_new.message.content = "query success";
        result_new.data = result[0]
    }
    return result_new;
};

module.exports = {
    'paginationQueryItems_preProcess':paginationQueryItems_preProcess,
    'paginationQueryItems_postProcess':paginationQueryItems_postProcess,
    'addItem_preProcess':addItem_preProcess,
    'cudItem_postProcess':cudItem_postProcess,
    'keyWordQueryItems_preProcess':keyWordQueryItems_preProcess,
    'keyWordPaginationQueryItems_preProcess':keyWordPaginationQueryItems_preProcess,
    'queryItems_postProcess':queryItems_postProcess
}

