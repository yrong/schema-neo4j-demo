match (u:User)
with collect(distinct(u.userid)) as userids
match (n:ConfigurationItem) where not (n.responsibility in userids)
with {orphan_userid:n.responsibility,orphan_configurationitems:collect(distinct({responsibility:n.responsibility,category:n.category,name:n.name})),exist_userid:userids} as result
return result;