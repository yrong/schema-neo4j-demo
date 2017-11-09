OPTIONAL MATCH (n)-[:SUPPORT_SERVICE]->(s:ITService)
  WHERE (n:PhysicalServer or n:VirtualServer) and s.uuid IN {uuid}
WITH collect(distinct n) as by_service
OPTIONAL MATCH (n)-[:SUPPORT_SERVICE]->(:ITService)-[:BelongsTo]->(sg:ITServiceGroup)
  WHERE (n:PhysicalServer or n:VirtualServer) and sg.uuid IN {uuid}
WITH by_service as by_service,collect(distinct n) as by_service_group
return by_service+by_service_group