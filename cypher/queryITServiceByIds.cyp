MATCH (s1:ITService)
  WHERE s1.uuid IN {uuids}
OPTIONAL MATCH (s1)-[:BelongsTo]->(sg)
OPTIONAL MATCH (s1)-[:ParentOf]->(s2)
OPTIONAL MATCH (s1)<-[:ParentOf]-(s3)
OPTIONAL MATCH (s1)-[:DependsOn]->(s4)
OPTIONAL MATCH (s1)<-[:DependsOn]-(s5)
WITH {service:s1,group:sg,children:(collect(distinct(s2))),parent:s3,dependencies:(collect(distinct(s4))),dependendents:(collect(distinct(s5)))} as service
RETURN service