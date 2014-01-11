// tether-peer.js
// wrap a WebRTC peer with a TetherPeer

var events = require('events')
  , inherits = require('inherits')

module.exports = TetherPeer

function TetherPeer(peer) {
  this._peer = peer
  this.id = peer.id
  this._listen()
}

inherits(TetherPeer, events.EventEmitter)

TetherPeer.prototype._listen = function () {
  var peer = this

  peer.on('close', peer.emit.bind(peer, 'leave'))
  peer.on('data close', peer.emit.bind(peer, 'leave'))

  peer.on('data message', function (msg) {
    var json
    try {
      json = JSON.parse(msg.data)
    } catch (e) {
      peer.emit('error', new Error('Couldnt parse message: ' + msg.data))
      return
    }

    peer.emit(json.type, json.data)
  })
}

TetherPeer.prototype.send = function (type, data) {
  if (/^leave$/.test(type))
    throw new Error('Can\'t send a message type ' + type)
  }

  var msg = {
    type: type,
    data: data
  }

  this.channel.send(JSON.stringify(msg))
}