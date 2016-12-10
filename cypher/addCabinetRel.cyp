MATCH (cabinet:Cabinet {uuid:{asset_location}.cabinet})
MATCH (n:Asset {uuid:{uuid}})
CREATE (n)-[:LOCATED{asset_location}]->(cabinet)