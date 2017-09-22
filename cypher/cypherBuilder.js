const _ = require('lodash')
const schema = require('./../schema')
const uuid_validator = require('uuid-validate')
const config = require('config')
const ldap_uuid_type = config.get('ldap_uuid_type')
const jp = require('jsonpath')


/*********************************************crud cyphers**************************************************************/

/**
 * common template
 */
const cmdb_addNode_Cypher_template = (labels) => `MERGE (n:${labels} {uuid: {uuid}})
                                    ON CREATE SET n = {fields}
                                    ON MATCH SET n = {fields}`

const generateAddNodeCypher=(params)=>{
    let labels = schema.getParentCategories(params.category)
    if(params.category === schema.cmdbTypeName.Software)
        labels.push(params.fields.subtype)
    labels = _.isArray(labels)?labels.join(":"):params.category;
    return cmdb_addNode_Cypher_template(labels);
}

const ID_TYPE_UUID = 'uuid',ID_TYPE_NAME = 'name'

const generateDelNodeCypher = (params)=>{
    let id_type = uuid_validator(params.uuid)?ID_TYPE_UUID:ID_TYPE_NAME
    return `MATCH (n)
            WHERE n.${id_type} = {uuid}
            DETACH
            DELETE n
            return n`
}

const generateDelAllCypher = (params)=>`MATCH (n)
WHERE NOT n:User and NOT n:Role
DETACH
DELETE n`

const generateQueryNodeCypher = (params) => {
    let id_type = uuid_validator(params.uuid)?ID_TYPE_UUID:ID_TYPE_NAME
    let label = _.isArray(params.category)?_.last(params.category):params.category
    return `MATCH (n:${label})
            WHERE n.${id_type} = {uuid}
            RETURN n`;
}

const cmdb_findNodes_Cypher_template = (label,condition) => {
    return `MATCH (n:${label}) 
    ${condition}
    RETURN collect(n)`
};

const cmdb_findNodesPaginated_Cypher_template = (label,condition) => `MATCH
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

/**
 * sequence id generator
 */
const generateSequence=(name)=>
    `MERGE (s:Sequence {name:'${name}'})
    ON CREATE set s.current = 1
    ON MATCH set s.current=s.current+1
    WITH s.current as seq return seq`

/**
 * query item with members
 */
const cmdb_queryItemWithMembers_cypher = (label, member_label, reference_field, condition) => {
    return `MATCH
        (n:${label})
        ${condition}
    OPTIONAL MATCH
        (m:${member_label})
    WHERE m.${reference_field}=n.uuid
    WITH { self: n, members:collect(m) } as item_with_members
    RETURN collect(item_with_members)`
}

/**
 * query node and relations
 */
const generateQueryNodeWithRelationToConfigurationItem_cypher = (params)=> {
    let id_type = uuid_validator(params.uuid)?ID_TYPE_UUID:ID_TYPE_NAME
    return `MATCH (n{${id_type}: {uuid}})
    OPTIONAL MATCH (n)-[]-(c)
    WHERE c:ConfigurationItem or c:ProcessFlow
    WITH n as self,collect(c) as items
    RETURN self,items`
}

/**
 * dummy operation
 */
const generateDummyOperation_cypher = (params) => `WITH 1 as result return result`

const generateQueryConfigurationItemBySubCategoryCypher = (params) => {
    let condition = _.map(params.subcategory, (subcategory) => {
        return `n:${subcategory}`
    }).join(' OR ')
    return `MATCH (n) WHERE (${condition})
    return collect(distinct n)
    `
}

const generateQuerySubTypeCypher = `MATCH (sw:ConfigurationItemLabel{category:{category}})
MATCH (subtype)-[:INHERIT]->(sw)
RETURN subtype`

const cmdb_addSubTypeRel_cypher = `MERGE (sw:ConfigurationItemLabel{category:{category}})
MERGE (subtype:ConfigurationItemLabel{category:{subtype}})
MERGE (subtype)-[:INHERIT]->(sw)`

/**
 * Customized Query
 */
const generateQueryITServiceByUuidsCypher = (params)=>`MATCH (s1:ITService)
WHERE s1.uuid IN {uuids}
OPTIONAL MATCH (s1)-[:BelongsTo]->(sg)
OPTIONAL MATCH (s1)-[:ParentOf]->(s2)
OPTIONAL MATCH (s1)<-[:ParentOf]-(s3)
OPTIONAL MATCH (s1)-[:DependsOn]->(s4)
OPTIONAL MATCH (s1)<-[:DependsOn]-(s5)
WITH {service:s1,group:sg,children:(collect(distinct(s2))),parent:s3,dependencies:(collect(distinct(s4))),dependendents:(collect(distinct(s5)))} as service
RETURN COLLECT(distinct service)`

const generateAdvancedSearchITServiceCypher = (params)=>`OPTIONAL MATCH (s1:ITService)
WHERE s1.uuid IN {search} or s1.group IN {search}
WITH COLLECT(distinct(s1.uuid)) as services_byIds
UNWIND {search} as keyword
OPTIONAL MATCH (s1:ITService)-[:BelongsTo]->(sg:ITServiceGroup)
WHERE s1.name = keyword or sg.name = keyword
WITH services_byIds+collect(distinct(s1.uuid)) as services
UNWIND services AS service
RETURN COLLECT(distinct service)`

const generateMountedConfigurationItemRelsCypher = (params)=> `MATCH (:ConfigurationItem)-[r:LOCATED]->(:Cabinet)
return COLLECT(distinct r)
`

const generateCfgHostsByITServiceGroupCypher = (params)=> `MATCH (n)-[:SUPPORT_SERVICE]->(:ITService)-[:BelongsTo]->(sg:ITServiceGroup)
WHERE (n:PhysicalServer or n:VirtualServer) and sg.name IN {group_names}
return collect(distinct n)
`

const generateCfgHostsByITServiceCypher = (params)=> `MATCH (n)-[:SUPPORT_SERVICE]->(s:ITService)
WHERE (n:PhysicalServer or n:VirtualServer) and s.name IN {service_names}
return collect(distinct n)
`

const generateRelationCypher = (params)=>{
    let refProperties = schema.getSchemaRefProperties(params.category),val,cypher,rel_part,rel_cyphers = []
    for(let ref of refProperties){
        val = jp.query(params, `$.${ref.attr}`)[0]
        if(val){
            if(ref.relationship.parentObjectAsRelProperty){
                cypher = `MATCH (node:${params.category}{uuid:{uuid}})
                MATCH (ref_node:${ref.schema}{uuid:{${ref.attr.split('.')[0]}}.${ref.attr.split('.')[1]}})
                `
            }else if(ref.type === 'array'&&val.length){
                cypher = `UNWIND {${ref.attr}} as ref_id
                MATCH (node:${params.category} {uuid:{uuid}})
                MATCH (ref_node:${ref.schema}{uuid:ref_id})
                `
            }else{
                cypher = `MATCH (node:${params.category}{uuid:{uuid}})
                MATCH (ref_node:${ref.schema}{uuid:{${ref.attr}}})
                `
            }
            if(ref.relationship.parentObjectAsRelProperty){
                rel_part =  `[:${ref.relationship.name}{${ref.attr.split('.')[0]}}]`
            }else{
                rel_part = `[:${ref.relationship.name}]`
            }
            if(ref.relationship.reverse)
                cypher = cypher + `CREATE (node)<-${rel_part}-(ref_node)`
            else
                cypher = cypher + `CREATE (node)-${rel_part}->(ref_node)`
            rel_cyphers.push(cypher)
        }
    }
    if(params.subtype)
        rel_cyphers.push(cmdb_addSubTypeRel_cypher)
    return rel_cyphers
}


module.exports = {
    generateAddOrUpdateCyphers: (params)=>{
        let cyphers_todo = [generateDelNodeCypher(params),generateAddNodeCypher(params),...generateRelationCypher(params)]
        return cyphers_todo
    },
    generateQueryNodesCypher:(params)=>{
        let keyword_condition = `WHERE n.name = {keyword}`
            ,user_keyword_condition = `WHERE n.alias = {keyword}`
            ,condition = ''
            ,cypher,label;
        if(params.keyword){
            condition = params.category === schema.cmdbTypeName.User?user_keyword_condition:keyword_condition
        }
        label = _.isArray(params.category)?_.last(params.category):params.category
        if(params.pagination){
            cypher = cmdb_findNodesPaginated_Cypher_template(label,condition)
        }else{
            cypher = cmdb_findNodes_Cypher_template(label,condition);
        }
        return cypher;
    },
    generateQueryITServiceByUuidsCypher,
    generateAdvancedSearchITServiceCypher,
    generateQueryNodeCypher,
    generateDelNodeCypher,
    generateSequence,
    generateDelAllCypher,
    generateQueryNodeWithRelationToConfigurationItem_cypher,
    generateDummyOperation_cypher,
    generateMountedConfigurationItemRelsCypher,
    generateCfgHostsByITServiceGroupCypher,
    generateQueryConfigurationItemBySubCategoryCypher,
    generateCfgHostsByITServiceCypher,
    generateQuerySubTypeCypher,
    cmdb_queryItemWithMembers_cypher
}
