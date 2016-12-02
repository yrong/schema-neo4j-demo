MERGE (router:Hardware:Asset:ConfigurationItem {uuid: {fields}.uuid})
ON CREATE SET router = {fields}
ON MATCH SET router = {fields}

FOREACH ( i in (CASE WHEN {fields}.responsibility IS NOT NULL THEN [1] ELSE [] END) |
    MERGE (owner:User {responsibility:{fields}.responsibility})
    MERGE (owner)-[:RESPONSIBLE_FOR]->(router)
)
RETURN router
