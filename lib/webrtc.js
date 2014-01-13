// webrtc.js
// provide webrtc bindings for tethr.io

// vendor
var events = require('events')
  , inherits = require('inherits')

// local
var websocket = require('./websocket')
  , peerconn = require('./peer')

exports.connect = function (opts) {
  var rtc = new RTC(opts)
  rtc.connect()
  return rtc
}

function RTC(opts) {
  var rtc = this

  rtc.server = opts.server || window.document.location.host
  rtc.room = opts.room || ''
  rtc.ice = opts.ice || null
  rtc.secure = opts.secure || false
  rtc.reconnect_limit = opts.reconnect_limit || 1

  rtc.peers = {}
}

// -- External API

inherits(RTC, events.EventEmitter)

RTC.prototype.connect = function () {
  var rtc = this
  var addr = (rtc.secure ? 'wss' : 'ws') + '://' + rtc.server
  rtc.socket = websocket.connect(rtc, addr)
  rtc.attach_socket_listeners()
}

RTC.prototype.reconnect = function () {
  var rtc = this
  rtc._reconnected = (rtc._reconnected || 0) + 1
  if (rtc._reconnected > rtc.reconnect_limit) {
    return rtc.emit('error', new Error('too many socket reconnections!'))
  }

  rtc.connect()
}

RTC.prototype.socket_send = function (name, data) {
  var msg = {
    eventName: name,
    data: data
  }
  return this.socket.send(JSON.stringify(msg))
}

RTC.prototype.attach_socket_listeners = function () {
  var rtc = this

  rtc.on('socket open', function (socket) {
    rtc.socket_send('join_room', { room: rtc.room })

    rtc.attach_comm_listeners()
  })

  rtc.on('socket close', function () {
    console.log ('socket closing!?', new Error().stack)
    rtc.emit('error', new Error('socket closed unexpectedly, trying to reconnect'))
    rtc.reconnect()
  })

  rtc.on('socket message', function (msg) {
    var json
    try {
      json = JSON.parse(msg.data)
    } catch (e) {
      emitter.emit('error', new Error('Error parsing socket message: ' + msg.data))
      return
    }
    // console.log('rtc','socket','message', json.eventName, json.data)
    rtc.emit(json.eventName, json.data)
  })
}

RTC.prototype.attach_comm_listeners = function () {
  var rtc = this

  // -- These calls come from the backend
  rtc.on('get_peers', function (data) {
    rtc.id = data.you

    data.connections.forEach(rtc.add_peer.bind(rtc))
  })

  rtc.on('receive_ice_candidate', function (data) {
    rtc.peers[data.socketId].add_ice_candidate(data)
  })

  rtc.on('new_peer_connected', function (data) {
    rtc.add_peer(data.socketId)
  })

  rtc.on('remove_peer_connected', function (data) {
    rtc.remove_peer(data.socketId)
  })

  rtc.on('receive_offer', function (data) {
    rtc.peers[data.socketId].send_answer(data.sdp)
  })

  rtc.on('receive_answer', function (data) {
    rtc.peers[data.socketId].receive_answer(data.sdp)
  })
}

// -- Management of peers

RTC.prototype.add_peer = function (id) {
  var rtc = this
    , peer = rtc.peers[id] = peerconn.connect(rtc, id)

  peer.on('open', rtc.emit.bind(rtc, 'peer connect', peer))
  peer.on('close', rtc.remove_peer.bind(rtc, id))
}

RTC.prototype.remove_peer = function (id) {
  var rtc = this

  if (rtc.peers[id]) {
    rtc.peers[id].close()
    delete rtc.peers[id]
  }
}