match (n:ConfigurationItem) set n.responsibility=toString(toInt(n.responsibility));
match (n:ConfigurationItem) set n.use_staff=toString(toInt(n.use_staff));
match (n:Software) where exists(n.subtype) set n.tags=[n.subtype];

return "upgrade success" as upgrade_result;