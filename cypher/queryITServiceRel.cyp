MATCH (s1:ITService{uuid:{uuid}})
MATCH (s1)-[:BelongsTo]->(sg),(s1)-[:ParentOf]->(s2),(s1)<-[:ParentOf]-(s3),(s1)-[:DependsOn]->(s4),(s1)<-[:DependsOn]-(s5)
RETURN {service:s1,group:sg,children:(collect(distinct(s2))),parent:s3,dependencies:(collect(distinct(s4))),dependendents:(collect(distinct(s5)))}