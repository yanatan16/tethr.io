var express = require('express')
  , http = require('http')
  , path = require('path')

exports.listen = function (port) {
  var app = express();

  app.use(express.logger('dev'))
    .use(require('enchilada')({
      src: path.join(__dirname, 'static'),
      routes: {
        '/tethr.io.js': './../../../index.js'
      }
    }))
    .use(express.static(path.join(__dirname, 'static')))


  var server = http.createServer(app).listen(port)

  console.log('Started express web server on ' + port)

  var rtc = require('webrtc.io').listen(server)
  console.log('Started rtc/websocket server on same server')
}