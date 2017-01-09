UNWIND {it_service} as service_id
MATCH (n:ProcessFlow{uuid:{uuid}})
MATCH (s:ITService{uuid:service_id})
CREATE (n)-[r:REFERENCED_SERVICE]->(s)
RETURN r
