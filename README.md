An easy to use framework to build rest api service with [koa-neo4j](https://github.com/assister-ai/koa-neo4j-starter-kit),data models are fully declarative by [json-schema](http://json-schema.org/)

## features

* fully declarative koa routes,relationship in neo4j　by json schema

## data modeling based on json schema extension attributes

### basic model

```
{
  "id": "User",
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
    "userid":{
      "type":"integer"
    },
    "passwd":{
      "type":"string"
    }
  },
  "route":"/users"
}
```

* first each data model is a valid json schema,so model 'User' will be validated with [ajv](https://github.com/epoberezkin/ajv) as json object with fields and related data types as above

* data model with attribute `"route":"/users"`  will generate restful api interface with route `/users`

```
POST /users

PUT  /users/:uuid

DELETE /users/:uuid

GET /users/:uuid

GET /users
```

* `"id":"User"` is not only the id of the json schema but also the label of the node stored in neo4j

### model reference others

```
{
  "id": "ConfigurationItem",
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "responsibility":{
        "type": "integer",
        "schema":"User",
        "relationship":{"name":"RESPONSIBLE_FOR","reverse":true}
    },
    ...
  },
  "required": ["name"],
  "route": "/cfgItems",
  "search":{"index":"cmdb"}
}
```

* `schema` means field `responsibility` in model `ConfigurationItem` reference model `User` and will generate relationship in neo4j as following

    (:ConfigurationItem)<-[:RESPONSIBLE_FOR]-(:User)

* `search` means instance of `ConfigurationItem` will also stored in elasticsearch with `cmdb` as index name

## Deploy

1. install db server

 [neo4j](http://neo4j.com/docs/operations-manual/current/installation/)

 [elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/master/_installation.html)

 [redis](https://redis.io/topics/quickstart)

2. install npm dependencies

    npm install

3. configuration

    modify value in config/default.json according to the db configuration

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

