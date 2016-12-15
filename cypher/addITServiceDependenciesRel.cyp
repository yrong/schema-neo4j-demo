MATCH (s:ITService{uuid:{uuid}})
UNWIND {dependencies} AS child
MATCH (s1:ITService{uuid:child})
CREATE (s)-[r:DependsOn]->(s1)
RETURN r