MATCH (cabinet:Cabinet {uuid:{asset_location}.cabinet})
MATCH (n:Asset {uuid:{uuid}})
CREATE (n)-[:LOCATED{status:"mounted",u:{asset_location}.u,date_mounted:{asset_location}.date_mounted}]->(cabinet)