MATCH
    (n:ITServiceGroup)
OPTIONAL MATCH
    (s:ITService)
WHERE s.group=n.uuid
WITH
    { group: n, services:collect(s) } as group_services
return collect(group_services)