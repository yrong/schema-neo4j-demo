MATCH (o:User{userid:{userid}})
MATCH (n {uuid:{uuid}})
CREATE (o)-[:RESPONSIBLE_FOR]->(n)