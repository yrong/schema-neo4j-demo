MATCH
    (n:User)
WHERE n.alias =~ {alias}
WITH
    count(n) AS cnt
MATCH
    (n:User)
WHERE n.alias =~ {alias}
WITH
    {userid:n.userid,alias:n.alias,lang:n.lang,name:n.name,surname:n.surname} as n, cnt
SKIP {skip} LIMIT {limit}
RETURN
    { cnt: cnt, nodes:collect(n) }
