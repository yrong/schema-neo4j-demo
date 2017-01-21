MATCH (l:Position {uuid:{asset_location}.position})
MATCH (n:Asset {uuid:{uuid}})
CREATE (n)-[r:LOCATED{asset_location}]->(l)
RETURN r