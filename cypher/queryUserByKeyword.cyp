MATCH
    (n:User)
WHERE n.alias =~ {keyword}
WITH
    {userid:n.userid,alias:n.alias,lang:n.lang,name:n.name,surname:n.surname} as n
RETURN collect(n)
