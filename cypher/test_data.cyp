MATCH (n) DETACH
DELETE n

CREATE (vm1:VirtualServer {
it_service:'service1',
ip:'10.10.35.6',
host:'vm-1',
type: 'VirtualServer',
os_system: 'ubuntu'
})

CREATE (neo4j:Application {
it_service:'service1',
date_added:'2016-11-25',
type: 'Application'
})

CREATE (cmdb:Application {
it_service:'service1',
date_added:'2016-11-28',
type: 'Application',
updated_by: 'ron'
})

CREATE (cmdb)-[:DEPENDS_ON]->(neo4j)

CREATE (neo4j)-[:BELONGS_TO]->(vm1)

CREATE (cmdb)-[:BELONGS_TO]->(vm1)

MATCH (n) RETURN n


