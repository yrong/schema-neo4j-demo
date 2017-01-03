[CMDB-API]
===============================
A [CMDB](https://en.wikipedia.org/wiki/Configuration_management_database) backend implementation built with [Neo4j](http://vertx.io/vertx2/), [ElasticSearch](https://www.elastic.co/guide/en/elasticsearch/reference/master/getting-started.html). 

## Relationship in Neo4j 

![](/image/cmdb.png)


## Build and Start

### Prepare User

Since user data is synchronized from mysql,so add some mock user here. 

```
MERGE (u:User{userid:1}) ON CREATE SET u = {autologin:1,type:3,uuid:1,attempt_ip:"10.50.13.69",userid:1,surname:"werq",name:"test",alias:"nerds",lang:"en_GB"}
```

### DB Server

>	[neo4j](http://neo4j.com/docs/operations-manual/current/installation/)

>	[elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/master/_installation.html)

### Nbi Server
	
>   install npm dependencies and compile codes and start nbi 

<code>
npm install && npm run webpack && npm start
</code>

>	run test cases with [postman](https://www.getpostman.com/docs/)

<code>
npm run postman
</code>

