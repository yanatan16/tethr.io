// tethr.js
// Simplify communication

var rtc = require('../node_modules/webrtc.io-client/lib/webrtc.io.js')
var events = require('events')
  , inherits = require('inherits')

function Tether() {
  this._peers = {}
}

inherits(Tether, events.EventEmitter)

Tether.prototype.connect = function (room, opts) {
  opts = opts || {}
  var host = opts.host || window.document.location.host
  var ice = opts.ice || {iceServers: [{url: 'stun:stun.l.google.com:19302'}]}
  var protocol = opts.secure ? 'wss' : 'ws'

  this._listen()
  rtc.SERVER = function () {return ice}
  rtc.connect(protocol + '://' + host, room)
}

Tether.prototype._listen = function() {
  var tether = this

  rtc.on('connect', function () {
    tether.emit('connect')
  })

  rtc.on('connections', function () {
    rtc.fire('ready')
  })

  rtc.on('data stream open', function (chan) {
    var peer = tether._peers[chan._id] = new Peer(tether, chan)
    tether.emit('join', peer)
  })
}

Tether.prototype.id = function () {
  return rtc._me
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

Tether.prototype.broadcast = function (msg) {
  var tether = this
  tether.eachPeer(function (peer) {
    peer.send(msg)
  })
}

function Peer(tether, chan) {
  this._tether = tether
  this._chan = chan
  this.id = chan._id
  this._listen()
}

inherits(Peer, events.EventEmitter)

Peer.prototype._listen = function () {
  var peer = this
    , tether = this._tether

  peer._chan.onclose = function () {
    peer.emit('leave')
    tether.emit('leave', peer)
    rtc.fire('remove_peer_connected', {socketId: peer.id})
  }

  peer._chan.onerror = function (err) {
    tether.emit('error', err)
  }

  peer._chan.onmessage = function (msg) {
    var json
    try {
      json = JSON.parse(msg.data)
    } catch (e) {
      tether.emit('error', new Error('JSON could not parse: ' + msg.data))
      return
    }

    var from = json.from,
      tmsg = json.msg

    peer.emit('message', tmsg, tether.peer(from))
  }
}

Peer.prototype.send = function (msg) {
  var peer = this
  var obj = {
    from: peer._tether.id(),
    msg: msg
  }
  peer._chan.send(JSON.stringify(obj))
}

module.exports = new Tether()