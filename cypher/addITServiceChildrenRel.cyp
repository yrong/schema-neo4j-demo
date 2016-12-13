MATCH (s:ITService{uuid:{uuid}})
UNWIND {children} AS child
MATCH (s1:ITService{uuid:child})
CREATE (s)-[:ParentOf]->(s1)