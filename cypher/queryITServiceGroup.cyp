MATCH
    (n:ITServiceGroup)
WITH
    count(n) AS cnt
MATCH
    (n:ITServiceGroup)
OPTIONAL MATCH
    (s:ITService)
WHERE s.group=n.uuid
WITH { group: n, services:collect(s) } as group_with_services,cnt
SKIP {skip} LIMIT {limit}
RETURN { count: cnt, results:collect(group_with_services) }