MATCH (s:ITService{uuid:{uuid}})
MATCH (s1:ITService {uuid:{parent}})
CREATE (s)<-[r:ParentOf]-(s1)
RETURN r