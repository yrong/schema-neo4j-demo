MATCH
    (n:ITService)
WHERE n.name =~ {keyword} OR n.desc =~ {keyword}
WITH
    count(n) AS cnt
MATCH
    (n:ITService)
WHERE n.name =~ {keyword} OR n.desc =~ {keyword}
WITH
     n as n, cnt
SKIP {skip} LIMIT {limit}
RETURN
    { cnt: cnt, nodes:collect(n) }
