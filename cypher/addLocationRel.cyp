MATCH (l:Location {uuid:{asset_location}.location})
MATCH (n:Asset {uuid:{uuid}})
CREATE (n)-[:LOCATED{asset_location}]->(l)