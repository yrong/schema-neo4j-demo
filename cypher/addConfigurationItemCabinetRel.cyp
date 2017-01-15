MATCH (cabinet:Cabinet {uuid:{asset_location}.cabinet})
MATCH (n:Asset {uuid:{uuid}})
CREATE (n)-[r:LOCATED{asset_location}]->(cabinet)
RETURN r