// ping.js
// Be the simplest ping/pong tethr.io peer

var tethr = require('../../../index.js') // normally: require('tethr.io')


tethr.connect({
  ice: null, /* will only work without any NATs in the way */
  server: 'localhost:18101',
  room: 'tethr-test'
})
log('Connecting')

tethr.on('connect', function () {
  log('Connected!')
})

tethr.on('join', function (peer) {
  log('got peer! ' + peer.id)

  peer.on('ping', function (data) {
    log('ping! ' + data + ' from ' + peer.id)
    peer.send('pong', data)
  })

  peer.send('iam', 'ping')
})

function log(msg) {
  console.log(msg)
  document.getElementById('ping').innerHTML += '<br>' + msg
}