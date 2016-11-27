#CMDB-API

# 格式
## 查
返回所有配置项：
```
GET /API/cfgItems?page={page}&per_page={per_page}
```
若不带page和per_page参数，则返回所有结果，以下同
response: //所有分页的返回结果均为此格式
```
{
	"status":"ok", //ok, info, warning, error, 
	"message":{
		"content":"message text here",
		"displayAs":"toast" //toast, modal, console, alert
	},
	"data":{
		"count":9,//所有结果总数
		"results":[ //当前页的所有成员
			{},
			{}
		]
	}
}
```

返回指定配置项的详细信息：
```
GET /API/cfgItems/{id}
```
## 搜
```
POST /API/cfgItems/search?page={page}&per_page={per_page}
```
request:
```
{
	"token": "xxxxxxxxxxxxxxxxxx",
	"conditions":{
		"tags":{
			"content": ["tag1","tag2"],
			"logic": "and"//and, or, not
		},
		"IT Services":{
			"content": ["service1","service2"],
			"logic": "and"//and, or, not
		},
		"keywords":{
			"content": ["keyword1","keyword2"],
			"logic": "and"//and, or, not
		},
		"logic": "and"//and, or, not
	}
}
```
## 增
```
POST /API/cfgItems/
```
## 删
```
DELETE /API/cfgItems/{id}
```
## 改
```
PUT /API/cfgItems/{id} //必须包含所有字段
PATCH /API/cfgItems/{id} //部分或单个字段
```
# 身份认证：
读取MySQL中的tokens表，有记录即可通过；后期需增加根据用户id做权限判断
mysql_auth.sql位于项目文件中，包含users和tokens两张表，暂时只需用到tokens

# 建模

第一层父类，继承关系如下：

```
ConfigurationItem
	Asset
		Hardware
		Software
	AbstractServer//服务器
	Application//暂时忽略
```

字段定义：

```
ConfigurationItem字段
	IT Service//IT_Service
	Monitored//bool
	Responsibility//User
	Technical Support Info//string
	Date Added//date
	Last Updated//date
	Updated By//User
Asset字段
	Asset ID
	SN//string
	GEO Location//string
	Asset location//位置信息，上架或未上架
		上架：
			Cabinet//string
			U//int
			Date Mounted//date
		未上架：
			Position//string
	Model//string
	Product Date //date
	Warranty Expiration Date //date
	Date of Retirement //date
AbstractServer字段：
	IP Address //array: valid IPv4 addresses
	Virtual Machine //bool
	Operating System //string
	Hardware Info //string
	Storage Info //string
```


第二层
```
	物理机：继承ConfigurationItem.AbstractServer, ConfigurationItem.Asset.Hardware
	虚拟机：继承ConfigurationItem.AbstractServer
	存储：继承ConfigurationItem.Asset.Hardware
	网络设备：继承ConfigurationItem.Asset.Hardware
	– 交换机 
	– 路由器 
	– 防火墙
	摄像头：继承ConfigurationItem.Asset.Hardware
```
字段定义：
```
PhysicalServer //物理机：
	Management IP //array: valid IPv4 addresses
VirtualServer //虚拟机：
	Host Server //PhysicalServer
```

# 测试集用postman保存；

# 项目阶段：
- 配置项目增删改查、搜索、身份认证
-- 配置项签入、签出
- IT_Services增删改查、与配置项关联
- 变更记录的保存和查询、搜索
- 权限管理


