var fs = require('file-system');
var _ = require('lodash');
var schema = require('./schema')

var cmdb_delRelsExistInCmdb_cypher = fs.readFileSync('./cypher/delRelsExistInCmdb.cyp', 'utf8');
var cmdb_addITServiceSupportRel_cypher = fs.readFileSync('./cypher/addITServiceSupportRel.cyp', 'utf8');
var cmdb_addUserRel_cypher = fs.readFileSync('./cypher/addUserRel.cyp', 'utf8');
var cmdb_addCabinetRel_cypher = fs.readFileSync('./cypher/addCabinetRel.cyp', 'utf8');
var cmdb_addLocationRel_cypher = fs.readFileSync('./cypher/addLocationRel.cyp', 'utf8');
var cmdb_delResExistInITService_cypher = fs.readFileSync('./cypher/delRelsExistInITService.cyp', 'utf8');
var cmdb_addITServiceBelongsToGroupRel_cypher = fs.readFileSync('./cypher/addITServiceBelongsToGroupRel.cyp', 'utf8');
var cmdb_addITServiceParentRel_cypher = fs.readFileSync('./cypher/addITServiceParentRel.cyp', 'utf8');
var cmdb_addITServiceChildrenRel_cypher = fs.readFileSync('./cypher/addITServiceChildrenRel.cyp', 'utf8');
var cmdb_addITServiceDependenciesRel_cypher = fs.readFileSync('./cypher/addITServiceDependenciesRel.cyp', 'utf8');
var cmdb_addITServiceDependendentsRel_cypher = fs.readFileSync('./cypher/addITServiceDependendentsRel.cyp', 'utf8');
var cmdb_addProcessFlow_cypher = fs.readFileSync('./cypher/addProcessFlow.cyp', 'utf8');
var cmdb_queryITServiceGroup_cypher = fs.readFileSync('./cypher/queryITServiceGroup.cyp', 'utf8');
var cmdb_queryITServiceGroupByKeyword_cypher = fs.readFileSync('./cypher/queryITServiceGroupByKeyword.cyp', 'utf8');
var cmdb_queryITServiceByUuids_cypher = fs.readFileSync('./cypher/queryITServiceByUuids.cyp', 'utf8');
var cmdb_advancedSearchITService_cypher = fs.readFileSync('./cypher/searchITService.cyp', 'utf8');

const cmdb_addNode_Cypher_template = (labels, created,last_updated) => `MERGE (n:${labels} {uuid: {uuid}})
                                    ON CREATE SET n = {fields}${created}
                                    ON MATCH SET n = {fields}${last_updated}
                                    RETURN n`;

const cmdb_delNode_cypher = `MATCH (s)
                            WHERE s.uuid = {uuid}
                            DETACH
                            DELETE s`;

const cmdb_findNodes_Cypher_template = (type,attributes) => `MATCH
            (n:${type})
            WITH
            count(n) AS cnt
            MATCH
            (n:${type})
            WITH
            ${attributes} as n, cnt
            SKIP {skip} LIMIT {limit}
            RETURN { count: cnt, results:collect(n) }`;

const keyword_condition = `WHERE n.name =~ {keyword} OR n.desc =~ {keyword}`;
const user_keyword_condition = `WHERE n.alias =~ {keyword}`;
const user_attributes = `{userid:n.userid,alias:n.alias,lang:n.lang,name:n.name,surname:n.surname}`;
const all_attributes = `n`;


const cmdb_findNodesByKeyword_Cypher_template = (type,condition,attributes) => `MATCH
            (n:${type})
            ${condition}
            WITH
            count(n) AS cnt
            MATCH
            (n:${type})
            ${condition}
            WITH
            ${attributes} as n, cnt
            SKIP {skip} LIMIT {limit}
            RETURN { count: cnt, results:collect(n) }`

var removeIdProperty = function(val) {
    if(_.isArray(val)){
        val = _.map(val, function(val) {
            return removeIdProperty(val);
        });
    }else{
        for(prop in val) {
            if (prop === 'id')
                delete val[prop];
            else if (typeof val[prop] === 'object')
                removeIdProperty(val[prop]);
        }
    }
    return val;
};

var getTypeFromUrl = function (url) {
    var type;
    if (url.includes('/it_services/service')) {
        type = schema.cmdbTypeName.ITService;
    } else if (url.includes('/it_services/group')) {
        type =  schema.cmdbTypeName.ITServiceGroup;
    } else if (url.includes('/cfgItems')) {
        type =  schema.cmdbTypeName.ConfigurationItem
    } else {
        type = _.find(schema.cmdbAuxiliaryTypes, function (type) {
            return url.includes(type.toLowerCase());
        });
    }
    return type;
};

var generateAddNodeCypher = function(params) {
    labels = schema.cmdbTypeLabels[params.category],created='',last_updated='';
    if(Array.isArray(labels)&&labels.includes(schema.cmdbTypeName.ConfigurationItem)){
        created = `,n.created = timestamp()`;
        last_updated = `,n.lastUpated = timestamp()`;
    }
    labels = labels?labels.join(":"):params.category;
    return cmdb_addNode_Cypher_template(labels,created,last_updated);
};

module.exports = {
    removeIdProperty:removeIdProperty,
    generateAddNodeCypher:generateAddNodeCypher,
    generateCmdbCyphers:function (params) {
        var cyphers_todo = [generateAddNodeCypher(params),cmdb_delRelsExistInCmdb_cypher];
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
    },
    generateITServiceCyphers:function (params) {
        var cyphers_todo = [generateAddNodeCypher(params),cmdb_delResExistInITService_cypher];
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
    },
    generateDelNodeCypher:function(params){
        return cmdb_delNode_cypher;
    },
    generateProcessFlowCypher:function(params){
        return cmdb_addProcessFlow_cypher;
    },
    generateQueryNodesCypher:function(url) {
        var type = getTypeFromUrl(url),cypher,attributes=all_attributes;
        if(type === schema.cmdbTypeName.ITServiceGroup){
            cypher = cmdb_queryITServiceGroup_cypher;
        }else{
            if(type === schema.cmdbTypeName.User){
                attributes= user_attributes;
            }
            cypher = cmdb_findNodes_Cypher_template(type,attributes);
        }
        return cypher;
    },
    generateQueryNodesByKeyWordCypher:function(url) {
        var type = getTypeFromUrl(url),cypher,attributes=all_attributes,condition=keyword_condition;
        if(type === schema.cmdbTypeName.ITServiceGroup){
            cypher = cmdb_queryITServiceGroupByKeyword_cypher;
        }else{
            if(type === schema.cmdbTypeName.User){
                attributes= user_attributes;
                condition = user_keyword_condition;
            }
            cypher = cmdb_findNodesByKeyword_Cypher_template(type,condition,attributes);
        }
        return cypher;
    },
    generateQueryITServiceByUuidsCypher:function(url) {
        var type = getTypeFromUrl(url);
        if(type !== schema.cmdbTypeName.ITService){
            throw new Error('only ITService support query by uuids temporarily')
        }
        return cmdb_queryITServiceByUuids_cypher;
    },
    generateAdvancedSearchITServiceCypher:function(url) {
        var type = getTypeFromUrl(url);
        if(type !== schema.cmdbTypeName.ITService){
            throw new Error('only ITService support query by uuids temporarily')
        }
        return cmdb_advancedSearchITService_cypher;
    }
}



