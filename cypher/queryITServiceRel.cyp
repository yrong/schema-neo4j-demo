MATCH (s1:ITService{uuid:"7d837ec0-bdec-11e6-a497-8387b4d4669d"})
MATCH (s1)-[:BelongsTo]->(sg),(s1)-[:ParentOf]->(s2),(s1)<-[:ParentOf]-(s3),(s1)-[:DependsOn]->(s4),(s1)<-[:DependsOn]-(s5)
RETURN {service:s1,group:sg,childs:(collect(distinct(s2))),parent:s3,dependencies:(collect(distinct(s4))),dependendents:(collect(distinct(s5)))}