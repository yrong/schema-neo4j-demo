UNWIND {it_service} as service_id
MATCH (n:ConfigurationItem {uuid:{uuid}})
MATCH (s:ITService{uuid:service_id})
CREATE (n)-[r:SUPPORT]->(s)
RETURN r
