A [CMDB](https://en.wikipedia.org/wiki/Configuration_management_database) backend implementation built with [Neo4j](http://vertx.io/vertx2/), [ElasticSearch](https://www.elastic.co/guide/en/elasticsearch/reference/master/getting-started.html).

## Data model

* User

```
{
  "id": "/User",
  "type": "object",
  "properties": {
    "alias": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "lang": {
      "type": "string"
    },
    "surname": {
      "type": "string"
    },
    "type":{
      "type": "integer"
    },
    "attempt_ip":{
      "type":"string"
    },
    "userid":{
      "type":"integer"
    },
    "theme":{
      "type":"string"
    },
    "passwd":{
      "type":"string"
    }
  }
}
```
* Cabinet

```
{
  "id": "/Cabinet",
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "description": {
      "type": "string"
    }
  },
  "required": ["name"]
}
```
* Position

```
{
  "id": "/Position",
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "description": {
      "type": "string"
    }
  },
  "required": ["name"]
}
```
* ITServiceGroup

```
{
  "id": "/ITServiceGroup",
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "description": {
      "type": "string"
    }
  },
  "required": ["name"]
}
```
* ITService

```
{
  "id": "/ITService",
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "group":{
      "type": "string",
      "format": "uuid"
    },
    "dependendents": {
      "type": "array",
      "items": {
        "type": "string",
        "format": "uuid"
      }
    },
    "dependencies": {
      "type": "array",
      "items": {
        "type": "string",
        "format": "uuid"
      }
    },
    "children": {
      "type": "array",
      "items": {
        "type": "string",
        "format": "uuid"
      }
    },
    "parent":{
      "type": "string",
      "format": "uuid"
    }
  },
  "required": ["name"]
}
```
* ConfigurationItem

```
{
  "id": "/ConfigurationItem",
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "it_service": {
      "type": "array",
      "items": { "type": "string","format":"uuid" },
      "uniqueItems": true
    },
    "monitored": {
      "type": "boolean",
      "default": false
    },
    "responsibility": {
      "type": "integer"
    },
    "updated_by":{
      "type": "integer"
    },
    "technical_support_info": {
      "type": "string"
    },

    "asset_id": {
      "type": "string"
    },
    "sn": {
      "type": "string"
    },
    "geo_location": {
      "type": "string"
    },
    "asset_location":{
      "type":"object",
      "oneOf":[
        {"properties" :
          {
            "status":{"type":"string"},
            "cabinet":{"type":"string","format":"uuid"},
            "date_mounted" : {
              "type" : "string",
              "format": "date"
            },
            "u" : {
              "type" : "integer"
            }
          },
          "required":["status","u"]
        },
        {"properties" :
          {
            "status":{"type":"string"},
            "position":{"type":"string","format":"uuid"}
          },
          "required":["status","position"]
        }
      ]
    },
    "model":{
      "type": "string"
    },
    "product_date":{
      "type": "string",
      "format": "date"
    },
    "warranty_expiration_date":{
      "type": "string",
      "format": "date"
    },
    "retirement_date":{
      "type": "string",
      "format": "date"
    },
    "ip_address": {
      "type": "array",
      "items": {"type": "string","format":"ipv4"},
      "minItems": 1
    },
    "operating_system": {
      "type": "string"
    },
    "storage_info":{
      "type": "string"
    },
    "hardware_info":{
      "type": "string"
    }
  },
  "required": ["name","monitored","model", "product_date","ip_address", "operating_system"]
}
```
* ProcessFlow

```
{
  "id": "/ProcessFlow",
  "type": "object",
  "properties": {
    "it_service": {
      "type": "array",
      "items": { "type": "string","format":"uuid"},
      "uniqueItems": true
    },
    "reference_process_flow":{
      "type": "array",
      "items": { "type": "string","format":"uuid" },
      "uniqueItems": true
    },
    "committer":{
      "type": "integer"
    },
    "executor":{
      "type": "integer"
    },
    "reference_kb":{
      "type": "array",
      "items": { "type": "string","format":"uuid" },
      "uniqueItems": true
    },
    "status":{
      "type": "string",
      "enum": ["open", "closed","solved","cancelled"]
    },
    "note":{
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "attachment":{
      "type": "string"
    },
    "title":{
      "type":"string"
    },
    "pfid":{
      "type":"string"
    }
  },
  "required": ["it_service","committer"]
}
```

## Relationship of Entities

    (:ITServiceGroup)<-[:BelongsTo]-(:ITService)
    (:ITService)-[:ParentOf]->(:ITService)
    (:ITService)-[:DependsOn]->(:ITService)
    
    (:ConfigurationItem)-[:LOCATED_AT]->(:Cabinet|Location)
    (:ConfigurationItem)-[:SUPPORT_SERVICE]->(:ITService)
    (:ConfigurationItem)<-[:RESPONSIBLE_FOR]-(:User)
    
    (:ProcessFlow)-[:CommitedBy|ExecutedBy]->(:User)
    (:ProcessFlow)-[:REFERENCED_SERVICE]->(:ITService)
    (:ProcessFlow)<-[:REFERENCED_PROCESSFLOW]-(:ProcessFlow)//ProcessFlow can reference another one
    (:ProcessFlow)-[:PREV]->(:ProcessFlowPrev)//to describe the change history of ProcessFlow

## Cypher Related

```
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

const cmdb_addConfigurationItemPositionRel_cypher = `MATCH (p:Position {uuid:{asset_location}.position})
MATCH (n:Asset {uuid:{uuid}})
CREATE (n)-[r:LOCATED{asset_location}]->(p)`

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
RETURN COLLECT(service)`


const cmdb_advancedSearchITService_cypher = `OPTIONAL MATCH (s1:ITService)
WHERE s1.uuid IN {search} or s1.group IN {search}
WITH COLLECT(distinct(s1.uuid)) as services_byIds
UNWIND {search} as keyword
OPTIONAL MATCH (s1:ITService)-[:BelongsTo]->(sg:ITServiceGroup)
WHERE s1.name = keyword or sg.name = keyword
WITH services_byIds+collect(distinct(s1.uuid)) as services
UNWIND services AS service
RETURN COLLECT( distinct service)`

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


const keyword_condition = `WHERE ${node_alias}.name = {keyword}`;
const user_keyword_condition = `WHERE ${node_alias}.alias = {keyword}`;

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
```

## Build and Start

### Start DB Server

>	[neo4j](http://neo4j.com/docs/operations-manual/current/installation/)

>   [elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/master/_installation.html)

### Prepare User

user data is synchronized from mysql,to avoid the dependency,just add some mock data here.

    MERGE (u:User{userid:1}) ON CREATE SET u = {autologin:1,type:3,uuid:1,attempt_ip:"10.50.13.69",userid:1,surname:"werq",name:"test",alias:"nerds",lang:"en_GB"}

### Nbi Server
    
*install npm dependencies and start nbi*

    npm install
    npm start
    

*run integration test cases with [postman](https://www.getpostman.com/docs/)*

    npm test

