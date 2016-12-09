MATCH
    (n:Location)
WITH
    count(n) AS cnt
MATCH
    (n:Location)
WITH
    n, cnt
SKIP {skip} LIMIT {limit}
RETURN
    { cnt: cnt, nodes:collect(n) }
