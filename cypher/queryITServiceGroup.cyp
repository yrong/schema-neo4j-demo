MATCH
    (n:ITServiceGroup)
WITH
    count(n) AS cnt
MATCH
    (n:ITServiceGroup)
WITH
    n, cnt
SKIP {skip} LIMIT {limit}
RETURN
    { cnt: cnt, nodes:collect(n) }
