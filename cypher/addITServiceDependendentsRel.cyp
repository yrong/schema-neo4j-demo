MATCH (s:ITService{uuid:{uuid}})
UNWIND {dependendents} AS child
MATCH (s1:ITService{uuid:child})
MERGE (s)<-[:DependsOn]-(s1)