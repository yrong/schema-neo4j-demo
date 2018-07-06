An easy to use framework to build rest api service based on [neo4j](https://neo4j.com/docs/developer-manual/current/introduction/),[elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/current/getting-started.html),[redis](https://redis.io/documentation)

## features

fully declarative crud-api provider described with [json-schema](http://json-schema.org/)

## data modeling for demonstration

* `user` data model

    ```
    {
      "id": "User",
      "service":"auth",
      "route":"/api/users",
      "type": "object",
      "properties": {
        "name":{
          "type": "string"
        },
        "phone":{
          "type": "string",
          "pattern":"^[0-9]{11}$"
        },
        "type":{
          "type": "string"
        },
        "ldapId":{
          "type": "string"
        }
      },
      "required": ["name"],
      "uniqueKeys":["name"],
      "cache":{"exclude_fields":["passwd","id"]},
      "search":{"index":"user"},
      "notification":true
    }

    ```

* each data model is a valid json schema,so user object can be validated with [ajv](https://github.com/epoberezkin/ajv)

* with `"route":"/api/users"`  will generate restful api interface

    ```
    POST /api/users

    PUT  /api/users/:uuid

    DELETE /api/users/:uuid

    GET /api/users/:uuid

    GET /api/users
    ```

* `"id":"User"` is the label of the node stored in neo4j

    ```
    MERGE (n:User {uuid: {uuid}})
    ON CREATE SET n = {fields}
    ON MATCH SET n = {fields}
    ```

* `"uniqueKeys":["name"]` means `name` is the unique key of label `User` in neo4j

    ```
    CREATE CONSTRAINT ON (n:User) ASSERT n.name IS UNIQUE
    ```

* `"search":{"index":"user"}` means user object will be stored in elasticsearch with `user` as name of the index and with mapping as following by default(could be overrided)

    ```
    {
        "mappings": {
            "_doc": {
                "dynamic_templates": [
                    {
                        "string_as_keyword": {
                            "match_mapping_type": "string",
                            "mapping": {
                                "type": "keyword"
                            }
                        }
                    },
                    {
                        "string_as_date": {
                            "match_pattern": "regex",
                            "match":   ".*date|.*time|created|lastUpdated",
                            "mapping": {
                                "type": "date"
                            }
                        }
                    }
                ]
            }
        }
    }
    ```

* `demo` model reference `user` model

    ```
    {
      "id": "Demo",
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "lang": {
          "type": "string"
        },
        "responsibility": {
          "type": "string",
          "schema":"User",
          "relationship":{"name":"Customer"}
        }
      },
      "required": ["name"],
      "service":"vehicle",
      "route": "/api/demos",
      "cache":{"ignore":true},
      "search":{"index":"demo"}
    }
    ```

* `schema` means field `responsibility` in model `Demo` will reference model `User` and generate relationship in neo4j as following

    ```
    (:Demo)<-[:RESPONSIBLE_FOR]-(:User)
    ```

* by default demo object will be stored in redis, with `"cache":{"ignore":true}` will not do it

## search api

query interfaces which use cypher and elasticsearch dsl(which I called eql) directly

```cypher
api/searchByCypher
{
	"category":"ITService",
	"search":["email","pop3"],
	"cypher":"OPTIONAL MATCH (s1:ITService) WHERE s1.uuid IN {search} or s1.group IN {search} WITH COLLECT(distinct(s1.uuid)) as services_byIds UNWIND {search} as keyword OPTIONAL MATCH (s1:ITService)-[:BelongsTo]->(sg:ITServiceGroup) WHERE s1.name = keyword or sg.name = keyword WITH services_byIds+collect(distinct(s1.uuid)) as services UNWIND services AS service RETURN COLLECT(distinct service)"
}
```

`category` is id of the model,`cypher` is the raw cypher query, other fields are required parameters in cypher query

```eql
api/searchByEql
{
  "category":"ConfigurationItem",
  "body":
  {
      "query": {
      	"bool":{
      		"must":[
      			{"match": {"category": "Router"}},
      			{"match":{"status.status":"In_Use"}},
      			{"match":{"it_service":"{{service_email_id}}"}}
      		]
      	}

      },
      "sort" : [
          { "product_date" : {"order" : "desc"}}]
  }
}
```

`category` is id of the model,`body` is the raw eql


## Deploy

1. install db server

     [neo4j](http://neo4j.com/docs/operations-manual/current/installation/)

     [elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/master/_installation.html)

     [redis](https://redis.io/topics/quickstart)

2. install npm dependencies

    yarn install

3. configuration

    modify value in config/default.json to match db configuration

    ```
      "neo4j": {
        "host": "localhost",
        "port": 7687,
        "http_port":7474,
        "user": "neo4j",
        "password": "neo4j"
      },
      "elasticsearch":{
        "host": "localhost",
        "port": 9200,
        "requestTimeout":3000,
        "mode": "strict"
      },
      "redis": {
        "host": "localhost",
        "port": 6379
      },
    ```


4. init Schema

    npm run init

5. start

    npm start
    

6. run integration test cases with [postman](https://www.getpostman.com/docs/)

    npm test

