OPTIONAL MATCH (n)-[:SUPPORT_SERVICE]->(s:ITService)
  WHERE (n:PhysicalServer or n:VirtualServer) and (s.uuid IN {uuid} or s.name IN {uuid})
WITH collect(distinct n) as by_service
OPTIONAL MATCH (n)-[:SUPPORT_SERVICE]->(:ITService)-[:MemberOf]->(sg:ITServiceGroup)
  WHERE (n:PhysicalServer or n:VirtualServer) and (sg.uuid IN {uuid} or sg.name IN {uuid})
WITH by_service as by_service,collect(distinct n) as by_service_group
return distinct(by_service+by_service_group)