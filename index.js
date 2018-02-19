const QS = require('emfit-qs')
const config = require('config-yml');

var qs = new QS()

qs.login(config.emfit.username, config.emfit.password).then(function(data) {
  qs.statuses().then(function(data) {
  console.log(data)
})
})

