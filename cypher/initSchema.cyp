begin
CREATE CONSTRAINT ON (n:ITService) ASSERT n.name IS UNIQUE;
CREATE CONSTRAINT ON (n:ITServiceGroup) ASSERT n.name IS UNIQUE;
CREATE CONSTRAINT ON (n:Position) ASSERT n.name IS UNIQUE;
CREATE CONSTRAINT ON (n:Cabinet) ASSERT n.name IS UNIQUE;
CREATE CONSTRAINT ON (n:ConfigurationItem) ASSERT n.name IS UNIQUE;
commit