const OpsController = require('../opscontroller')
const script = `for i = 1 to 10
  WScript.echo i
  WScript.sleep 200
  next`
const opsController = new OpsController(null,script,null)
opsController.execute()