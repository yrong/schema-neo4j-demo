MERGE (n:VirtualServer:AbstractServer:ConfigurationItem {uuid: {uuid}})
ON CREATE SET n = {fields},n.created = timestamp()
ON MATCH SET n = {fields},n.lastUpated = timestamp()

FOREACH ( i in (CASE WHEN {fields}.userid IS NOT NULL THEN [1] ELSE [] END) |
    MERGE (owner:User {userid:{fields}.userid})
    MERGE (owner)-[:RESPONSIBLE_FOR]->(n)
)
