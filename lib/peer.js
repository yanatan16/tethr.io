// peerconn.js
// Provide a PeerConnection interface for tethr.io

// vendor
var events = require('events')
  , inherits = require('inherits')

// local
var client = require('./client')
  , configs = require('./configs')


exports.connect = function (rtc, id) {
  return new Peer(rtc, id)
}

function Peer(rtc, id) {
  var pc = this.pc = new client.PeerConnection(rtc.ice, configs.peer_connection_config)
  this.rtc = rtc
  this.id = id

  this.listen()
}

inherits(Peer, events.EventEmitter)

Peer.prototype.listen = function () {
  var pc = this.pc
    , peer = this

  pc.onicecandidate = function (event) {
    if (event.candidate) {
      var candidate = event.candidate

      rtc.socket.send('send_ice_candidate', {
        label: candidate.sdpMLineIndex,
        candidate: candidate.candidate,
        socketId: id
      })
    }
  }

  pc.onopen = function () {
    peer.emit('open')
    peer.create_data_channel()
  }

  pc.onerror = function (err) {
    rtc.emit('error', err)
  }

  pc.onclose = function () {
    peer.emit('close')
  }
}

Peer.prototype.send = function (msg) {
  if (!this.channel) {
    throw new Error('PeerConnection has no data channel!')
  }
  this.channel.send(msg)
}

Peer.prototype.add_ice_candidate = function (data) {
  var candidate = new client.RTCIceCandidate(data)
  this.pc.addIceCandidate(candidate)
}

Peer.prototype.create_data_channel = function () {
  var peer = this
    , pc = peer.pc
    , channel = peer.channel = pc.createDataChannel('tethr.io', configs.data_channel_options)

  channel.onopen = function () {
    peer.emit('data open', channel)
  }

  channel.onerror = function (err) {
    peer.rtc.emit('error', err)
  }

  channel.onclose = function () {
    peer.emit('data close')
  }

  channel.onmessage = function (msg) {
    peer.emit('data message', msg)
  }
}