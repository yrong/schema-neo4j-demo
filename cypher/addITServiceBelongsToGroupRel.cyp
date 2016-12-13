MATCH (s:ITService{uuid:{uuid}})
MATCH (sg:ITServiceGroup {uuid:{group}})
CREATE (s)-[:BelongsTo]->(sg)