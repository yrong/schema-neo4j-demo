MATCH
    (n:Cabinet)
WITH
    count(n) AS cnt
MATCH
    (n:Cabinet)
WITH
    n, cnt
SKIP {skip} LIMIT {limit}
RETURN
    { cnt: cnt, nodes:collect(n) }
