MERGE (router:Hardware:Asset:ConfigurationItem {uuid: {fields}.uuid})
ON CREATE SET router = {fields}
ON MATCH SET router = {fields}

FOREACH ( i in (CASE WHEN {fields}.userid IS NOT NULL THEN [1] ELSE [] END) |
    MERGE (owner:User {userid:{fields}.userid})
    MERGE (owner)-[:RESPONSIBLE_FOR]->(router)
)

FOREACH ( i in (CASE WHEN {loc} IS NOT NULL and {loc}.status = 'mounted' THEN [1] ELSE [] END) |
    MERGE (cabinet:Cabinet {name:{loc}.cabinet.name}) ON CREATE SET cabinet = {loc}.cabinet ON MATCH SET cabinet = {loc}.cabinet
    MERGE (router)-[:LOCATED{status:"mounted",u:{loc}.u,date_mounted:{loc}.date_mounted}]->(cabinet)
)

RETURN router
