var _ = require('lodash')
var schema = require('./../schema')


const cmdb_addNode_Cypher_template = (labels) => `MERGE (n:${labels} {uuid: {uuid}})
                                    ON CREATE SET n = {fields}
                                    ON MATCH SET n = {fields}`
/**
 * Cabinet
 */
const cmdb_delRelsExistInCabinet_cypher = `MATCH (n:Cabinet{uuid: {uuid}})-[r:LocatedAt]-()
DELETE r`
const cmdb_addCabinetServerRoomRel_cypher = `MATCH (n:Cabinet{uuid:{uuid}})
MATCH (sr:ServerRoom {uuid:{server_room_id}})
CREATE (n)-[r:LocatedAt]->(sr)`

/**
 * ServerRoom
 */
const cmdb_queryServerRoom_cypher = `
MATCH
    (s:ServerRoom)
OPTIONAL MATCH
    (c:Cabinet)
WHERE c.server_room_id=s.uuid
WITH { server_room: s, cabinets:collect(c) } as server_room_with_cabinets
RETURN collect(server_room_with_cabinets)`

/**
 * Shelf
 */
const cmdb_delRelsExistInShelf_cypher = `MATCH (n:Shelf{uuid: {uuid}})-[r:LocatedAt]-()
DELETE r`
const cmdb_addShelfWareHouseRel_cypher = `MATCH (n:Shelf{uuid:{uuid}})
MATCH (wh:WareHouse {uuid:{warehouse_id}})
CREATE (n)-[r:LocatedAt]->(wh)`

/**
 * WareHouse
 */
const cmdb_queryWareHouse_cypher = `
MATCH
    (w:WareHouse)
OPTIONAL MATCH
    (s:Shelf)
WHERE s.warehouse_id=w.uuid
WITH { warehouse: w, shelves:collect(s) } as warehouse_with_shelves
RETURN collect(warehouse_with_shelves)`


/**
 * ConfigurationItem
 */
const cmdb_delRelsExistInConfigurationItem_cypher = `MATCH (n:ConfigurationItem{uuid: {uuid}})-[r:RESPONSIBLE_FOR|LOCATED|SUPPORT_SERVICE]-()
DELETE r`

const cmdb_addConfigurationItemITServiceRel_cypher = `UNWIND {it_service} as service_id
MATCH (n:ConfigurationItem {uuid:{uuid}})
MATCH (s:ITService{uuid:service_id})
CREATE (n)-[r:SUPPORT_SERVICE]->(s)`

const cmdb_addConfigurationItemUserRel_cypher = `MATCH (n:ConfigurationItem{uuid:{uuid}})
MATCH (u:User{userid:{responsibility}})
CREATE (n)<-[r:RESPONSIBLE_FOR]-(u)`

const cmdb_addConfigurationItemCabinetRel_cypher = `MATCH (cabinet:Cabinet {uuid:{asset_location}.cabinet})
MATCH (n:Asset {uuid:{uuid}})
CREATE (n)-[r:LOCATED{asset_location}]->(cabinet)`

const cmdb_addConfigurationItemShelfRel_cypher = `MATCH (shelf:Shelf {uuid:{asset_location}.shelf})
MATCH (n:Asset {uuid:{uuid}})
CREATE (n)-[r:LOCATED{asset_location}]->(shelf)`

const cmdb_addConfigurationItemPositionRel_cypher = `MATCH (p:Position {uuid:{asset_location}.position})
MATCH (n:Asset {uuid:{uuid}})
CREATE (n)-[r:LOCATED{asset_location}]->(p)`

/**
 * ITService
 */
const cmdb_delRelsExistInITService_cypher = `MATCH (n:ITService{uuid: {uuid}})-[r:ParentOf|DependsOn|BelongsTo]-()
DELETE r`

const cmdb_addITServiceBelongsToGroupRel_cypher = `MATCH (s:ITService{uuid:{uuid}})
MATCH (sg:ITServiceGroup {uuid:{group}})
CREATE (s)-[r:BelongsTo]->(sg)`

const cmdb_addITServiceParentRel_cypher = `MATCH (s:ITService{uuid:{uuid}})
MATCH (s1:ITService {uuid:{parent}})
CREATE (s)<-[r:ParentOf]-(s1)`

const cmdb_addITServiceChildrenRel_cypher = `MATCH (s:ITService{uuid:{uuid}})
UNWIND {children} AS child
MATCH (s1:ITService{uuid:child})
CREATE (s)-[r:ParentOf]->(s1)`

const cmdb_addITServiceDependenciesRel_cypher = `MATCH (s:ITService{uuid:{uuid}})
UNWIND {dependencies} AS dependency
MATCH (s1:ITService{uuid:dependency})
CREATE (s)-[r:DependsOn]->(s1)`

const cmdb_addITServiceDependendentsRel_cypher = `MATCH (s:ITService{uuid:{uuid}})
UNWIND {dependendents} AS dependendent
MATCH (s1:ITService{uuid:dependendent})
MERGE (s)<-[r:DependsOn]-(s1)`

const cmdb_queryITServiceGroup_cypher = `MATCH
    (n:ITServiceGroup)
WITH
    count(n) AS cnt
MATCH
    (n:ITServiceGroup)
OPTIONAL MATCH
    (s:ITService)
WHERE s.group=n.uuid
WITH { group: n, services:collect(s) } as group_with_services,cnt
SKIP {skip} LIMIT {limit}
RETURN { count: cnt, results:collect(group_with_services) }`

const cmdb_queryITServiceGroupByKeyword_cypher = `MATCH
    (n:ITServiceGroup)
WHERE n.name = {keyword}
WITH
    count(n) AS cnt
MATCH
    (n:ITServiceGroup)
WHERE n.name = {keyword}
OPTIONAL MATCH
    (s:ITService)
WHERE s.group=n.uuid
WITH
    { group: n, services:collect(s) } as group_with_services,cnt
SKIP {skip} LIMIT {limit}
RETURN { count: cnt, results:collect(group_with_services) }`


/**
 * ProcessFlow
 */
const cmdb_delRelsExistInProcessFlow_cypher = `MATCH (n:ProcessFlow{uuid:{uuid}})-[r:REFERENCED_PROCESSFLOW|REFERENCED_SERVICE|COMMITTED_BY|EXECUTED_BY]-()
DELETE r`

const cmdb_addProcessFlowITServiceRel_cypher = `UNWIND {it_service} as service_id
MATCH (n:ProcessFlow{uuid:{uuid}})
MATCH (s:ITService{uuid:service_id})
CREATE (n)-[r:REFERENCED_SERVICE]->(s)`

const cmdb_addProcessFlowCommitedByUserRel_cypher = `MATCH (n:ProcessFlow{uuid:{uuid}})
MATCH (u:User{userid:{committer}})
CREATE (n)-[:COMMITTED_BY]->(u)`

const cmdb_addProcessFlowExecutedByUserRel_cypher = `MATCH (n:ProcessFlow{uuid:{uuid}})
MATCH (u:User{userid:{executor}})
CREATE (n)-[:EXECUTED_BY]->(u)`

const cmdb_addProcessFlowSelfReferencedRel_cypher = `UNWIND {reference_process_flow} as reference_id
MATCH (n:ProcessFlow{uuid:{uuid}})
MATCH (rn:ProcessFlow{uuid:reference_id})
CREATE (n)-[:REFERENCED_PROCESSFLOW]->(rn)`


/**
 * Queries
 */

const generateQueryITServiceByUuidsCypher = (params)=>`MATCH (s1:ITService)
WHERE s1.uuid IN {uuids}
OPTIONAL MATCH (s1)-[:BelongsTo]->(sg)
OPTIONAL MATCH (s1)-[:ParentOf]->(s2)
OPTIONAL MATCH (s1)<-[:ParentOf]-(s3)
OPTIONAL MATCH (s1)-[:DependsOn]->(s4)
OPTIONAL MATCH (s1)<-[:DependsOn]-(s5)
WITH {service:s1,group:sg,children:(collect(distinct(s2))),parent:s3,dependencies:(collect(distinct(s4))),dependendents:(collect(distinct(s5)))} as service
RETURN COLLECT(service)`


const generateAdvancedSearchITServiceCypher = (params)=>`OPTIONAL MATCH (s1:ITService)
WHERE s1.uuid IN {search} or s1.group IN {search}
WITH COLLECT(distinct(s1.uuid)) as services_byIds
UNWIND {search} as keyword
OPTIONAL MATCH (s1:ITService)-[:BelongsTo]->(sg:ITServiceGroup)
WHERE s1.name = keyword or sg.name = keyword
WITH services_byIds+collect(distinct(s1.uuid)) as services
UNWIND services AS service
RETURN COLLECT( distinct service)`

const generateQueryNodeChangeTimelineCypher = (params)=> {
    let label = _.isArray(params.category)?_.last(params.category):params.category
    return `match p=(current:${label} {uuid:{uuid}})-[:PREV*]->()
            WITH COLLECT(p) AS paths, MAX(length(p)) AS maxLength
            RETURN FILTER(path IN paths WHERE length(path)= maxLength) AS longestPaths`
}


const generateAddPrevNodeRelCypher = (params) => {
    let label = schema.cmdbTypeLabels[params.category]?_.last(schema.cmdbTypeLabels[params.category]):params.category
    return `match (current:${label} {uuid:{uuid}})
                                    optional match (current)-[prev_rel:PREV]->(prev_prev)                                                    
                                    create (prev:${label}Prev {fields_old})
                                    create (current)-[:PREV {change}]->(prev)
                                    FOREACH (o IN CASE WHEN prev_prev IS NOT NULL THEN [prev_prev] ELSE [] END |
                                      create (prev)-[prev_rel_new:PREV]->(prev_prev)
                                      set prev_rel_new = properties(prev_rel)
                                      DELETE prev_rel)`
}


const generateDelNodeCypher = (params)=>`MATCH (n)
                            WHERE n.uuid = {uuid}
                            DETACH
                            DELETE n
                            return n`;

const generateQueryNodeCypher = (params) => {
    let label = _.isArray(params.category)?_.last(params.category):params.category
    return `MATCH (n:${label})
                            WHERE n.uuid = {uuid}
                            RETURN n`;
}

const cmdb_findNodes_Cypher_template = (label) => `MATCH
            (n:${label})
            WITH
            count(n) AS cnt
            MATCH
            (n:${label})
            WITH
            n as n, cnt
            SKIP {skip} LIMIT {limit}
            RETURN { count: cnt, results:collect(n) }`;

const cmdb_findNodesByKeyword_Cypher_template = (label,condition) => `MATCH
            (n:${label})
            ${condition}
            WITH
            count(n) AS cnt
            MATCH
            (n:${label})
            ${condition}
            WITH
            n as n, cnt
            SKIP {skip} LIMIT {limit}
            RETURN { count: cnt, results:collect(n) }`

const generateAddNodeCypher=(params)=>{
    let labels = schema.cmdbTypeLabels[params.category];
    labels = _.isArray(labels)?labels.join(":"):params.category;
    return cmdb_addNode_Cypher_template(labels);
}

const generateSequence=(name)=>
    `MERGE (s:Sequence {name:'${name}'})
    ON CREATE set s.current = 1
    ON MATCH set s.current=s.current+1
    WITH s.current as seq return seq`


module.exports = {
    generateCabinetCyphers: (params)=>{
        let cyphers_todo = [generateAddNodeCypher(params),cmdb_delRelsExistInCabinet_cypher,cmdb_addCabinetServerRoomRel_cypher]
        return cyphers_todo
    },
    generateShelfCyphers: (params)=>{
        let cyphers_todo = [generateAddNodeCypher(params),cmdb_delRelsExistInShelf_cypher,cmdb_addShelfWareHouseRel_cypher]
        return cyphers_todo
    },
    generateCmdbCyphers: (params)=>{
        let cyphers_todo = [generateAddNodeCypher(params),cmdb_delRelsExistInConfigurationItem_cypher]
        if(params.it_service&&params.it_service.length){
            cyphers_todo = [...cyphers_todo,cmdb_addConfigurationItemITServiceRel_cypher]
        }
        if(params.responsibility){
            cyphers_todo = [...cyphers_todo,cmdb_addConfigurationItemUserRel_cypher]
        }
        if(params.asset_location&&params.asset_location.position){
            cyphers_todo = [...cyphers_todo,cmdb_addConfigurationItemPositionRel_cypher]
        }
        if(params.asset_location&&params.asset_location.cabinet){
            cyphers_todo = [...cyphers_todo,cmdb_addConfigurationItemCabinetRel_cypher]
        }
        if(params.asset_location&&params.asset_location.shelf){
            cyphers_todo = [...cyphers_todo,cmdb_addConfigurationItemShelfRel_cypher]
        }
        return cyphers_todo;
    },
    generateITServiceCyphers:(params)=> {
        let cyphers_todo = [generateAddNodeCypher(params),cmdb_delRelsExistInITService_cypher];
        if(params.group){
            cyphers_todo = [...cyphers_todo,cmdb_addITServiceBelongsToGroupRel_cypher]
        }
        if(params.parent){
            cyphers_todo = [...cyphers_todo,cmdb_addITServiceParentRel_cypher]
        }
        if(params.children&&params.children.length){
            cyphers_todo = [...cyphers_todo,cmdb_addITServiceChildrenRel_cypher]
        }
        if(params.dependencies&&params.dependencies.length){
            cyphers_todo = [...cyphers_todo,cmdb_addITServiceDependenciesRel_cypher]
        }
        if(params.dependendents){
            cyphers_todo = [...cyphers_todo,cmdb_addITServiceDependendentsRel_cypher]
        }
        return cyphers_todo;
    },
    generateProcessFlowCypher:(params)=>{
        let cyphers_todo = [generateAddNodeCypher(params),cmdb_delRelsExistInProcessFlow_cypher];
        if(params.it_service&&params.it_service.length)
            cyphers_todo = [...cyphers_todo,cmdb_addProcessFlowITServiceRel_cypher];
        if(params.reference_process_flow&&params.reference_process_flow.length)
            cyphers_todo = [...cyphers_todo,cmdb_addProcessFlowSelfReferencedRel_cypher];
        if(params.committer)
            cyphers_todo = [...cyphers_todo,cmdb_addProcessFlowCommitedByUserRel_cypher];
        if(params.executor)
            cyphers_todo = [...cyphers_todo,cmdb_addProcessFlowExecutedByUserRel_cypher];
        return cyphers_todo;
    },
    generateQueryNodesCypher:(params)=>{
        var cypher,label;
        if(params.category === schema.cmdbTypeName.ITServiceGroup){
            cypher = cmdb_queryITServiceGroup_cypher;
        }else if(params.category === schema.cmdbTypeName.ServerRoom){
            cypher = cmdb_queryServerRoom_cypher;
        }else if(params.category === schema.cmdbTypeName.WareHouse){
            cypher = cmdb_queryWareHouse_cypher;
        }else{
            label = _.isArray(params.category)?_.last(params.category):params.category
            cypher = cmdb_findNodes_Cypher_template(label);
        }
        return cypher;
    },
    generateQueryNodesByKeyWordCypher:(params)=>{
        let keyword_condition = `WHERE n.name = {keyword}`
            ,user_keyword_condition = `WHERE n.alias = {keyword}`
            ,condition=keyword_condition
            ,cypher,label;
        if(params.category === schema.cmdbTypeName.ITServiceGroup){
            cypher = cmdb_queryITServiceGroupByKeyword_cypher;
        }else{
            if(params.category === schema.cmdbTypeName.User){
                condition = user_keyword_condition;
            }
            label = _.isArray(params.category)?_.last(params.category):params.category
            cypher = cmdb_findNodesByKeyword_Cypher_template(label,condition);
        }
        return cypher;
    },
    generateQueryITServiceByUuidsCypher,
    generateAdvancedSearchITServiceCypher,
    generateAddNodeCypher,
    generateQueryNodeCypher,
    generateDelNodeCypher,
    generateQueryNodeChangeTimelineCypher,
    generateSequence,
    generateAddPrevNodeRelCypher
}
