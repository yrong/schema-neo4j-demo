OPTIONAL MATCH (n)-[:SUPPORT_SERVICE]->(s:ITService)
  WHERE (n:PhysicalServer or n:VirtualServer) and s.name IN {name}
WITH collect(distinct n) as by_service_name
OPTIONAL MATCH (n)-[:SUPPORT_SERVICE]->(:ITService)-[:BelongsTo]->(sg:ITServiceGroup)
  WHERE (n:PhysicalServer or n:VirtualServer) and sg.name IN {name}
return by_service_name+collect(distinct n)