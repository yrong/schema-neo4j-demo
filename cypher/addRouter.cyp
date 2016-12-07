MERGE (n:Router:Hardware:Asset:ConfigurationItem {uuid: {fields}.uuid})
ON CREATE SET n = {fields},n.created = timestamp()
ON MATCH SET n = {fields},n.lastUpated = timestamp()

FOREACH ( i in (CASE WHEN {fields}.userid IS NOT NULL THEN [1] ELSE [] END) |
    MERGE (owner:User {userid:{fields}.userid})
    MERGE (owner)-[:RESPONSIBLE_FOR]->(n)
)

FOREACH ( i in (CASE WHEN {asset_location} IS NOT NULL and {asset_location}.status = 'mounted' THEN [1] ELSE [] END) |
    MERGE (cabinet:Cabinet {uuid:{asset_location}.cabinet})
    MERGE (n)-[:LOCATED{status:"mounted",u:{asset_location}.u,date_mounted:{asset_location}.date_mounted}]->(cabinet)
)

