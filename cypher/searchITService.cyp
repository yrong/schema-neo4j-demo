OPTIONAL MATCH (s1:ITService)
WHERE s1.uuid IN {search} or s1.group IN {search}
with collect(distinct(s1.uuid)) as services_byIds

UNWIND {search} as keyword
OPTIONAL MATCH (s1:ITService)
WHERE s1.name =~ ('(?i).*'+keyword+'.*') or s1.desc =~ ('(?i).*'+keyword+'.*')
WITH services_byIds+collect(distinct(s1.uuid)) as services

UNWIND services AS service
WITH COLLECT( distinct service) AS collected

RETURN {cnt:size(collected),nodes:collected}