// tethr.js
// Simplify communication

var events = require('events')
  , inherits = require('inherits')

var webrtc = require('./webrtc')
  , TethrPeer = require('./tethr-peer')

function Tethr() {
  this.peers = {}
}

inherits(Tethr, events.EventEmitter)

Tethr.prototype.connect = function (opts) {
  this.rtc = webrtc.connect(opts)

  this.listen()
}

Tethr.prototype.listen = function() {
  var tethr = this

  tethr.rtc.on('socket open', function () {
    tethr.emit('connect')
  })

  tethr.rtc.on('peer connect', function (peer) {
    var tpeer = tethr.peers[peer.id] = new TethrPeer(peer)
    tethr.emit('join', tpeer)
  })
}

Tethr.prototype.id = function () {
  return this.rtc.id
}

Tethr.prototype.peer = function (id) {
  return this.peers[id]
}

Tethr.prototype.eachPeer = function (fn) {
  var tethr = this
  Object.keys(tethr.peers).map(tethr.peer.bind(tethr)).forEach(fn)
}

Tethr.prototype.broadcast = function (type, data) {
  var tethr = this
  tethr.eachPeer(function (peer) {
    peer.send(type, data)
  })
}

this.tethr = module.exports = new Tethr()