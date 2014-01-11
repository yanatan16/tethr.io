// tethr.js
// Simplify communication

var events = require('events')
  , inherits = require('inherits')

var webrtc = require('./webrtc')
  , TetherPeer = require('./tether-peer')

function Tether() {
  this.peers = {}
}

inherits(Tether, events.EventEmitter)

Tether.prototype.connect = function (opts) {
  this.rtc = webrtc.connect(opts)

  this.listen()
}

Tether.prototype.listen = function() {
  var tether = this

  tether.rtc.on('socket open', function () {
    tether.emit('connect')
  })

  tether.rtc.on('peer new', function (peer) {
    var peer = tether._peers[peer.id] = new TetherPeer(peer)
    tether.emit('join', peer)
  })
}

Tether.prototype.id = function () {
  return this.rtc.id
}

Tether.prototype.peer = function (id) {
  return this._peers[id]
}

Tether.prototype.eachPeer = function (fn) {
  var tether = this
  Object.keys(tether._peers).forEach(function (id) {
    fn(tether._peers[id], id)
  })
}

Tether.prototype.broadcast = function (type, data) {
  var tether = this
  tether.eachPeer(function (peer) {
    peer.send(type, data)
  })
}

module.exports = new Tether()