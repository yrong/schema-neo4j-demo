[CMDB-API]
===============================
A [CMDB](https://en.wikipedia.org/wiki/Configuration_management_database) backend implementation built with [Neo4j](http://vertx.io/vertx2/), [ElasticSearch](https://www.elastic.co/guide/en/elasticsearch/reference/master/getting-started.html). 

## Relationship in Neo4j 

![](/image/cmdb.png)


## Build and Start

### Prepare Users in mysql

Since user data is synchronized from mysql,so make mysql ready first and add some mock data here. 

```

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `userid` bigint(20) unsigned NOT NULL,
  `alias` varchar(100) NOT NULL DEFAULT '',
  `name` varchar(100) NOT NULL DEFAULT '',
  `surname` varchar(100) NOT NULL DEFAULT '',
  `passwd` char(32) NOT NULL DEFAULT '',
  `url` varchar(255) NOT NULL DEFAULT '',
  `autologin` int(11) NOT NULL DEFAULT '0',
  `autologout` int(11) NOT NULL DEFAULT '900',
  `lang` varchar(5) NOT NULL DEFAULT 'en_GB',
  `refresh` int(11) NOT NULL DEFAULT '30',
  `type` int(11) NOT NULL DEFAULT '1',
  `theme` varchar(128) NOT NULL DEFAULT 'default',
  `attempt_failed` int(11) NOT NULL DEFAULT '0',
  `attempt_ip` varchar(39) NOT NULL DEFAULT '',
  `attempt_clock` int(11) NOT NULL DEFAULT '0',
  `rows_per_page` int(11) NOT NULL DEFAULT '50',
  PRIMARY KEY (`userid`),
  KEY `users_1` (`alias`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'nerds','test','werq','4e4ba04946basdfdfaedfa0d44507445','',1,0,'en_GB',30,3,'default',0,'10.50.13.69',1456854292,50),(2,'guest','','','d41d8cd98f00basdf9800998ecf8427e','',0,900,'en_GB',30,1,'default',0,'',0,50),(3,'demo','','','fe01ce2a7fbac8fafaed7c982a04e229','',1,0,'zh_CN',30,1,'default',0,'10.50.13.69',1460361004,50),(4,'wangmo','','','24d94c9e0ced6cb913daf7f67e8bbba6','',1,0,'en_GB',30,3,'default',0,'10.50.13.69',1462949818,50),(5,'duhaibo','','','4d3d82e202dfa673d3077f03b3be185d','',1,0,'en_GB',30,1,'default',0,'10.161.154.180',1461669672,50),(6,'shilei','','','4d3d82e202dfa673d3077f03b3be185d','',1,0,'en_GB',30,1,'default',0,'10.50.13.69',1460089101,50),(7,'demo1','','','fe01ce2a7fbac8fafaed7c982a04e229','',1,0,'en_GB',30,1,'default',0,'',0,50),(8,'lk.j','','','4d3d82e202dfa673d3077f03b3be185d','',1,0,'en_GB',30,1,'default',0,'10.161.154.21',1461040892,50);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
```

### Start Server

>	[neo4j installation](http://neo4j.com/docs/operations-manual/current/installation/)

>	[elasticsearch installation](https://www.elastic.co/guide/en/elasticsearch/reference/master/_installation.html)

>	install npm dependencies and start nbi 

<code>
npm install && npm run webpack && npm start
</code>

>	run test cases　with [mocha](https://mochajs.org/)

<code>
npm test
</code>

