OPTIONAL MATCH (s1:ITService)
  WHERE s1.uuid IN {search} or s1.group IN {search}
WITH COLLECT(distinct(s1.uuid)) as services_byIds
UNWIND {search} as keyword
OPTIONAL MATCH (s1:ITService)-[:MemberOf]->(sg:ITServiceGroup)
  WHERE s1.name = keyword or sg.name = keyword
WITH services_byIds+collect(distinct(s1.uuid)) as services
UNWIND services AS service
RETURN COLLECT(distinct service)