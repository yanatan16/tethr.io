var express = require('express')
  , http = require('http')
  , path = require('path')

var port = process.env.PORT || 8000

var app = express();

app.use(express.logger('dev'))
  .use(require('enchilada')({
    src: path.join(__dirname, 'static'),
    routes: {
      '/tethr.io.js': 'tethr.io'
    }
  }))
  .use(express.static(path.join(__dirname, 'static')))


var server = http.createServer(app).listen(port)

console.log('Started express web server on ' + port)

var rtc = require('webrtc.io').listen(server)
console.log('Started rtc/websocket server on same server')
