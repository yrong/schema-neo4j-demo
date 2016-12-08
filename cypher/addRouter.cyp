MERGE (n:Router:Hardware:Asset:ConfigurationItem {uuid: {uuid}})
ON CREATE SET n = {fields},n.created = timestamp()
ON MATCH SET n = {fields},n.lastUpated = timestamp()

//WITH n as n
//MATCH (n)<-[r1:RESPONSIBLE_FOR]-(),(n)-[r2:LOCATED]->()
//DELETE r1,r2

WITH n as n
MATCH (owner:User {userid:{userid}})
CREATE (owner)-[:RESPONSIBLE_FOR]->(n)

FOREACH ( i in (CASE WHEN {asset_location} IS NOT NULL and {asset_location}.status = 'mounted' THEN [1] ELSE [] END) |
    MERGE (cabinet:Cabinet {uuid:{asset_location}.cabinet})
    MERGE (n)-[:LOCATED{status:"mounted",u:{asset_location}.u,date_mounted:{asset_location}.date_mounted}]->(cabinet)
)

