MATCH (s:ITService{uuid:{uuid}})
MATCH (sg:ITServiceGroup {uuid:{group}})
CREATE (s)-[r:BelongsTo]->(sg)
RETURN r