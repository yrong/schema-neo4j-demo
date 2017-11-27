const _ = require('lodash')
const schema = require('redis-json-schema')
const config = require('config')
const jp = require('jsonpath')


/*********************************************crud cyphers**************************************************************/

/**
 * common template
 */
const cmdb_addNode_Cypher_template = (labels) => `MERGE (n:${labels} {uuid: {uuid}})
                                    ON CREATE SET n = {fields}
                                    ON MATCH SET n = {fields}`

const generateAddNodeCypher=(params)=>{
    let labels = schema.getParentSchemas(params.category)
    if(params.fields.subtype)
        labels.push(params.fields.subtype)
    if(params.fields.tags)
        labels = [...labels,params.fields.tags]
    labels = _.isArray(labels)?labels.join(":"):params.category;
    return cmdb_addNode_Cypher_template(labels);
}

const generateDelNodeCypher = (params)=> `
    MATCH (n)
    WHERE n.uuid = {uuid}
    DETACH
    DELETE n
    return n`


const generateDelAllCypher = (params)=>
    `MATCH (n)
    WHERE NOT n:User and NOT n:Role
    DETACH
    DELETE n`

const generateQueryNodeCypher = (params) =>
    `MATCH (n:${params.category})
    WHERE n.uuid = {uuid}
    RETURN n`


const cmdb_findNodes_Cypher_template = (label,condition) =>
    `MATCH (n:${label}) 
    ${condition}
    RETURN collect(n)`


const cmdb_findNodesPaginated_Cypher_template = (label,condition) =>
    `MATCH (n:${label})
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
    return `MATCH
        (n:${label})
    OPTIONAL MATCH
        (m:${member_label})
    WHERE m.${reference_field}=n.uuid
    WITH { self: n, members:collect(m) } as item_with_members
    RETURN collect(item_with_members)`
}

/**
 * query node and relations
 */
const generateQueryNodeWithRelationCypher = (params)=> {
    return `MATCH (n{uuid: {uuid}})
    OPTIONAL MATCH (n)-[]-(c)
    WITH n as self,collect(c) as items
    RETURN self,items`
}

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
            rel_part = `[r:${ref.relationship.name}]`
            if(ref.relationship.reverse)
                cypher = cypher + `MERGE (node)<-${rel_part}-(ref_node)`
            else
                cypher = cypher + `MERGE (node)-${rel_part}->(ref_node)`
            if(ref.relationship.parentObjectAsRelProperty){
                cypher = cypher + ` ON MATCH SET r={${ref.attr.split('.')[0]}}`
            }
            rel_cyphers.push(cypher)
        }
    }
    if(params.subtype)
        rel_cyphers.push(cmdb_addSubTypeRel_cypher)
    return rel_cyphers
}


module.exports = {
    generateAddOrUpdateCyphers: (params)=>{
        let cyphers_todo = [generateAddNodeCypher(params),...generateRelationCypher(params)]
        return cyphers_todo
    },
    generateQueryNodesCypher:(params)=>{
        let condition = '',cypher,label=params.category
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
    generateQueryNodeWithRelationCypher,
    generateQueryItemByCategoryCypher,
    generateQuerySubTypeCypher,
    generateQueryItemWithMembersCypher
}
