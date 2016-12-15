MATCH (s:ITService{uuid:{it_service}})
MATCH (n:ConfigurationItem {uuid:{uuid}})
CREATE (n)-[r:SUPPORT]->(s)
RETURN r