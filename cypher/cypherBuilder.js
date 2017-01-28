var _ = require('lodash')
var schema = require('./../schema/index')

/*ConfigurationItem*/
const cmdb_delRelsExistInConfigurationItem_cypher = `MATCH ()<-[r2:LOCATED|SUPPORT_SERVICE]-(n:ConfigurationItem{uuid: {uuid}})<-[r1:RESPONSIBLE_FOR]-()
DELETE r1,r2`

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

const cmdb_addConfigurationItemPositionRel_cypher = `MATCH (l:Position {uuid:{asset_location}.position})
MATCH (n:Asset {uuid:{uuid}})
CREATE (n)-[r:LOCATED{asset_location}]->(l)`

/*ITService*/
const cmdb_delRelsExistInITService_cypher = `MATCH ()<-[r1:BelongsTo|ParentOf|DependsOn]-(n:ITService{uuid: {uuid}})<-[r2:ParentOf|DependsOn]-()
DELETE r1,r2`

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
UNWIND {dependencies} AS child
MATCH (s1:ITService{uuid:child})
CREATE (s)-[r:DependsOn]->(s1)`

const cmdb_addITServiceDependendentsRel_cypher = `MATCH (s:ITService{uuid:{uuid}})
UNWIND {dependendents} AS child
MATCH (s1:ITService{uuid:child})
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
WHERE n.name =~ {keyword} OR n.desc =~ {keyword}
WITH
    count(n) AS cnt
MATCH
    (n:ITServiceGroup)
WHERE n.name =~ {keyword} OR n.desc =~ {keyword}
OPTIONAL MATCH
    (s:ITService)
WHERE s.group=n.uuid
WITH
    { group: n, services:collect(s) } as group_with_services,cnt
SKIP {skip} LIMIT {limit}
RETURN { count: cnt, results:collect(group_with_services) }
`

const cmdb_queryITServiceByUuids_cypher = `MATCH (s1:ITService)
WHERE s1.uuid IN {uuids}
OPTIONAL MATCH (s1)-[:BelongsTo]->(sg)
OPTIONAL MATCH (s1)-[:ParentOf]->(s2)
OPTIONAL MATCH (s1)<-[:ParentOf]-(s3)
OPTIONAL MATCH (s1)-[:DependsOn]->(s4)
OPTIONAL MATCH (s1)<-[:DependsOn]-(s5)
WITH {service:s1,group:sg,children:(collect(distinct(s2))),parent:s3,dependencies:(collect(distinct(s4))),dependendents:(collect(distinct(s5)))} as service
RETURN collect(service)`


const cmdb_advancedSearchITService_cypher = `OPTIONAL MATCH (s1:ITService)
WHERE s1.uuid IN {search} or s1.group IN {search}
with collect(distinct(s1.uuid)) as services_byIds

UNWIND {search} as keyword
OPTIONAL MATCH (s1:ITService)
WHERE s1.name =~ ('(?i).*'+keyword+'.*') or s1.desc =~ ('(?i).*'+keyword+'.*')
WITH services_byIds+collect(distinct(s1.uuid)) as services

UNWIND services AS service
return COLLECT( distinct service)`

/*ProcessFlow*/
const cmdb_delRelsExistInProcessFlow_cypher = `MATCH (n:ProcessFlow{uuid:{uuid}})-[r:REFERENCED_PROCESSFLOW|REFERENCED_SERVICE|COMMITTED_BY|EXECUTED_BY]->()
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

const cmdb_queryProcessFlowTimeline_cypher = `match p=(current:ProcessFlow {uuid:{uuid}})-[:PREV*]->()
WITH COLLECT(p) AS paths, MAX(length(p)) AS maxLength
RETURN FILTER(path IN paths WHERE length(path)= maxLength) AS longestPaths`

const node_alias = 'n'

const cmdb_addNode_Cypher_template = (labels, created='',last_updated='') => `MERGE (${node_alias}:${labels} {uuid: {uuid}})
                                    ON CREATE SET ${node_alias} = {fields}${created}
                                    ON MATCH SET ${node_alias} = {fields}${last_updated}`

const cmdb_addPrevNodeRel_Cypher_template = (label) => `match (current:${label} {uuid:{uuid}})
                                    optional match (current)-[rel:PREV]->(prev_prev)                                
                                    delete rel
                                    create (prev:${label}Prev {fields_old})
                                    create (current)-[:PREV]->(prev)
                                    FOREACH (o IN CASE WHEN prev_prev IS NOT NULL THEN [prev_prev] ELSE [] END |
                                      create (prev)-[:PREV]->(prev_prev)
                                    )`;


const cmdb_delNode_cypher = `MATCH (n)
                            WHERE n.uuid = {uuid}
                            DETACH
                            DELETE n
                            return n`;

const cmdb_findNode_cypher_template = (label) => `MATCH (n:${label})
                            WHERE n.uuid = {uuid}
                            RETURN n`;

var user_attributes = ['uuid','userid','alias','lang','name','surname']
user_attributes=_.map(user_attributes,(attribute)=>`${attribute}:${node_alias}.${attribute}`)
user_attributes=`{${user_attributes.join()}}`
const all_attributes = `${node_alias}`;

const cmdb_findNodes_Cypher_template = (type,attributes) => `MATCH
            (${node_alias}:${type})
            WITH
            count(${node_alias}) AS cnt
            MATCH
            (${node_alias}:${type})
            WITH
            ${attributes} as ${node_alias}, cnt
            SKIP {skip} LIMIT {limit}
            RETURN { count: cnt, results:collect(${node_alias}) }`;


const keyword_condition = `WHERE ${node_alias}.name =~ {keyword} OR ${node_alias}.desc =~ {keyword}`;
const user_keyword_condition = `WHERE ${node_alias}.alias =~ {keyword}`;

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

const generateAddNodeCypher=(params)=>{
    let labels = schema.cmdbTypeLabels[params.category],created='',last_updated='';
    if(Array.isArray(labels)&&(labels.includes(schema.cmdbTypeName.ConfigurationItem)||labels.includes(schema.cmdbTypeName.ProcessFlow))){
        created = `,${node_alias}.created = timestamp()`;
        last_updated = `,${node_alias}.lastUpdated = timestamp()`;
    }
    labels = labels?labels.join(":"):params.category;
    return cmdb_addNode_Cypher_template(labels,created,last_updated);
}

const generateSequence=(name)=>
    `MERGE (s:Sequence {name:'${name}'})
    ON CREATE set s.current = 1
    ON MATCH set s.current=s.current+1
    WITH s.current as seq return seq`


module.exports = {
    generateAddNodeCypher:generateAddNodeCypher,
    generateCmdbCyphers: (params)=>{
        let cyphers_todo = [generateAddNodeCypher(params),cmdb_delRelsExistInConfigurationItem_cypher]
        if(params.it_service){
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
        if(params.children){
            cyphers_todo = [...cyphers_todo,cmdb_addITServiceChildrenRel_cypher]
        }
        if(params.dependencies){
            cyphers_todo = [...cyphers_todo,cmdb_addITServiceDependenciesRel_cypher]
        }
        if(params.dependendents){
            cyphers_todo = [...cyphers_todo,cmdb_addITServiceDependendentsRel_cypher]
        }
        return cyphers_todo;
    },
    generateProcessFlowCypher:(params)=>{
        let cyphers_todo = [generateAddNodeCypher(params),cmdb_delRelsExistInProcessFlow_cypher];
        if(params.it_service)
            cyphers_todo = [...cyphers_todo,cmdb_addProcessFlowITServiceRel_cypher];
        if(params.reference_process_flow)
            cyphers_todo = [...cyphers_todo,cmdb_addProcessFlowSelfReferencedRel_cypher];
        if(params.committer)
            cyphers_todo = [...cyphers_todo,cmdb_addProcessFlowCommitedByUserRel_cypher];
        if(params.executor)
            cyphers_todo = [...cyphers_todo,cmdb_addProcessFlowExecutedByUserRel_cypher];
        if(params.method == 'PUT'||params.method =='PATCH')
            cyphers_todo = [...cyphers_todo,cmdb_addPrevNodeRel_Cypher_template(params.category)];
        return cyphers_todo;
    },
    generateQueryNodesCypher:(params)=>{
        var cypher,attributes=all_attributes;
        if(params.type === schema.cmdbTypeName.ITServiceGroup){
            cypher = cmdb_queryITServiceGroup_cypher;
        }else{
            if(params.type === schema.cmdbTypeName.User){
                attributes= user_attributes;
            }
            cypher = cmdb_findNodes_Cypher_template(params.type,attributes);
        }
        return cypher;
    },
    generateQueryNodesByKeyWordCypher:(params)=>{
        var cypher,attributes=all_attributes,condition=keyword_condition;
        if(params.type === schema.cmdbTypeName.ITServiceGroup){
            cypher = cmdb_queryITServiceGroupByKeyword_cypher;
        }else{
            if(params.type === schema.cmdbTypeName.User){
                attributes= user_attributes;
                condition = user_keyword_condition;
            }
            cypher = cmdb_findNodesByKeyword_Cypher_template(params.type,condition,attributes);
        }
        return cypher;
    },
    generateQueryByUuidsCypher:(params)=> cmdb_queryITServiceByUuids_cypher,
    generateAdvancedSearchCypher:(params) =>cmdb_advancedSearchITService_cypher,
    generateQueryNodeCypher:(params)=> cmdb_findNode_cypher_template(params.type),
    generateDelNodeCypher:(params)=>cmdb_delNode_cypher,
    cmdb_findNode_cypher:cmdb_findNode_cypher_template,
    generateQueryProcessFlowTimelineCypher:()=>cmdb_queryProcessFlowTimeline_cypher,
    generateSequence:generateSequence
}
