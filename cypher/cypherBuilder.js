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
    if(params.fields.subtype)
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
const generateQueryItemWithMembersCypher = (label, member_label, reference_field, params) => {
    let condition = params.keyword?`WHERE n.name = {keyword}`:''
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
const generateQueryNodeWithRelationToAdvancedTypes_cypher = (params, advancedTypes)=> {
    let id_type = uuid_validator(params.uuid)?ID_TYPE_UUID:ID_TYPE_NAME
    let where = _.map(advancedTypes,(type)=>`c:${type}`).join(' or ')
    return `MATCH (n{${id_type}: {uuid}})
    OPTIONAL MATCH (n)-[]-(c)
    WHERE ${where}
    WITH n as self,collect(c) as items
    RETURN self,items`
}

/**
 * dummy operation
 */
const generateDummyOperation_cypher = (params) => `WITH 1 as result return result`

const generateQueryItemByCategoryCypher = (params) => {
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
            ,condition = ''
            ,cypher,label;
        if(params.keyword){
            condition = keyword_condition
        }
        label = _.isArray(params.category)?_.last(params.category):params.category
        if(params.pagination){
            cypher = cmdb_findNodesPaginated_Cypher_template(label,condition)
        }else{
            cypher = cmdb_findNodes_Cypher_template(label,condition);
        }
        return cypher;
    },
    generateQueryNodeCypher,
    generateDelNodeCypher,
    generateSequence,
    generateDelAllCypher,
    generateQueryNodeWithRelationToAdvancedTypes_cypher,
    generateDummyOperation_cypher,
    generateQueryItemByCategoryCypher,
    generateQuerySubTypeCypher,
    generateQueryItemWithMembersCypher
}
