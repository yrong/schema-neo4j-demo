MATCH (n:ConfigurationItem) DETACH
DELETE n

MATCH (n) RETURN n


Match ()-[r]-() Where ID(r)=6 Delete r



MATCH (s:ITService{uuid:"7d837ec0-bdec-11e6-a497-8387b4d4669d"})
MATCH (sg:ITServiceGroup {uuid:"0c524ce0-c06c-11e6-92a5-7339b082b94a"})
MERGE (s)-[:BelongsTo]->(sg)

MATCH (s1:ITService{uuid:"7d837ec0-bdec-11e6-a497-8387b4d4669d"})
MATCH (s2:ITService{uuid:"f8462860-c021-11e6-b5f5-c9da228ff0c6"})
MERGE (s1)-[r:ParentOf]->(s2)

MATCH (s1:ITService{uuid:"7d837ec0-bdec-11e6-a497-8387b4d4669d"})
MATCH (s6:ITService{uuid:"0b060f10-c072-11e6-92a5-7339b082b94a"})
MERGE (s1)-[r:ParentOf]->(s6)

MATCH (s1:ITService{uuid:"7d837ec0-bdec-11e6-a497-8387b4d4669d"})
MATCH (s3:ITService{uuid:"d0ca4730-c021-11e6-b5f5-c9da228ff0c6"})
MERGE (s1)-[r:DependsOn]->(s3)

MATCH (s1:ITService{uuid:"7d837ec0-bdec-11e6-a497-8387b4d4669d"})
MATCH (s7:ITService{uuid:"cf1eb640-c072-11e6-92a5-7339b082b94a"})
MERGE (s1)-[r:DependsOn]->(s7)

MATCH (s1:ITService{uuid:"7d837ec0-bdec-11e6-a497-8387b4d4669d"})
MATCH (s4:ITService{uuid:"13de6c00-be00-11e6-944f-0b438a9b9487"})
MERGE (s1)<-[r:ParentOf]-(s4)

MATCH (s1:ITService{uuid:"7d837ec0-bdec-11e6-a497-8387b4d4669d"})
MATCH (s5:ITService{uuid:"d529c060-be16-11e6-868d-9dad76fe6a03"})
MERGE (s1)<-[r:DependsOn]-(s5)

MATCH (s1:ITService{uuid:"7d837ec0-bdec-11e6-a497-8387b4d4669d"})
MATCH (s8:ITService{uuid:"fdb34d90-c072-11e6-92a5-7339b082b94a"})
MERGE (s1)<-[r:DependsOn]-(s8)

