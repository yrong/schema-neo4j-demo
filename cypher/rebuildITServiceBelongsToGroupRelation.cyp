MATCH (s:ITService)-[r:BelongsTo]->(ITServiceGroup)
DELETE r;
MATCH (s:ITService) where EXISTS(s.group)
MATCH (sg:ITServiceGroup {uuid:s.group})
MERGE (s)-[:BelongsTo]->(sg);