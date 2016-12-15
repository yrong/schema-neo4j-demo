MATCH (o:User{userid:{userid}})
MATCH (n {uuid:{uuid}})
CREATE (o)-[r:RESPONSIBLE_FOR]->(n)
RETURN r