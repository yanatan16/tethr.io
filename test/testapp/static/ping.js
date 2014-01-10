// ping.js
// Be the simplest ping/pong tethr.io peer

var tethr = require('../../../index.js') // normally: require('tethr.io')


tethr.connect('tethr-test', {
  ice: null, /* will only work without any NATs in the way */
  host: 'localhost:18101'
})
log('Connecting')

tethr.on('connect', function () {
  log('Connected!')
})

tethr.on('join', function (peer) {
  log('got peer!')

  peer.on('message', function (msg) {
    if (msg.msg === 'ping') {
      msg.msg = 'pong'
    } else {
      msg.msg = 'unpong'
    }

    peer.send(msg)
  })

  peer.send({iam: 'ping'})
})

function log(msg) {
  console.log(msg)
  document.getElementById('ping').innerHTML += '<br>' + msg
}