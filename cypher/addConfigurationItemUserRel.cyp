MATCH (n:ConfigurationItem{uuid:{uuid}})
MATCH (u:User{userid:{userid}})
CREATE (n)<-[r:RESPONSIBLE_FOR]-(u)
RETURN r