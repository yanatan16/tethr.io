// peerconn.js
// Provide a PeerConnection interface for tethr.io

// vendor
var events = require('events')
  , inherits = require('inherits')

// local
var client = require('./client')
  , configs = require('./configs')
  , session = require('./session')


exports.connect = function (rtc, id) {
  return new Peer(rtc, id)
}

function Peer(rtc, id) {
  this.pc = new client.PeerConnection(rtc.ice, configs.peer_connection_config)
  this.rtc = rtc
  this.id = id

  this.listen()
  this.create_data_channel()
  this.create_offer()
}

inherits(Peer, events.EventEmitter)

Peer.prototype.close = function () {
  if (this.closed) {
    return
  }
  this.closed = true

  console.log('closing', this.id)
  this.channel.close()
  this.pc.close()
  this.emit('close')
}

Peer.prototype.listen = function () {
  var pc = this.pc
    , peer = this

  pc.onicecandidate = function (event) {
    if (event.candidate) {
      var candidate = event.candidate

      peer.rtc.socket_send('send_ice_candidate', {
        label: candidate.sdpMLineIndex,
        candidate: candidate.candidate,
        socketId: peer.id
      })
    }
  }

  pc.onerror = function (err) {
    peer.rtc.emit('error', err)
  }

  pc.onclose = function () {
    peer.close()
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
    peer.emit('open', channel)
  }

  channel.onerror = function (err) {
    peer.rtc.emit('error', err)
  }

  channel.onclose = function () {
    peer.close()
  }

  channel.onmessage = function (msg) {
    peer.emit('message', msg)
  }
}

Peer.prototype.create_offer = function (id) {
  var peer = this
    , pc = peer.pc
    , rtc = peer.rtc

  pc.createOffer(on_create_offer, null, configs.constraints)

  function on_create_offer (sess_desc) {
    sess_desc = session.preference(sess_desc)
    pc.setLocalDescription(sess_desc)
    rtc.socket_send('send_offer', {
      socketId: peer.id,
      sdp: sess_desc
    })
  }
}

Peer.prototype.send_answer = function (sdp) {
  var peer = this
    , pc = peer.pc
    , rtc = peer.rtc

  var sess_desc = new client.RTCSessionDescription(sdp)
  pc.setRemoteDescription(sess_desc)
  pc.createAnswer(on_create_answer, null, configs.constraints)

  function on_create_answer(sess_desc) {
    pc.setLocalDescription(sess_desc)
    rtc.socket_send('send_answer', {
      socketId: peer.id,
      sdp: sess_desc
    })
  }
}

Peer.prototype.receive_answer = function (sdp) {
  var sess_desc = new client.RTCSessionDescription(sdp)
  this.pc.setRemoteDescription(sess_desc)
}