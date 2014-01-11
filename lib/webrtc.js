// webrtc.js
// provide webrtc bindings for tethr.io

// vendor
var events = require('events')
  , inherits = require('inherits')

// local
var websocket = require('./websocket')
  , peerconn = require('./peer')

exports.connect = function (opts) {
  return new RTC(opts)
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

RTC.prototype.attach_socket_listeners = function () {
  var rtc = this

  rtc.on('socket open', function (socket) {
    socket.send('join_room', { room: rtc.room })

    rtc.attach_comm_listeners()
  })

  rtc.on('socket close', function (socket) {
    rtc.emit('error', new Error('socket closed unexpectedly, trying to reconnect'))
    rtc.reconnect()
  })
}

RTC.prototype.attach_comm_listeners = function () {
  var rtc = this

  // -- These calls come from the backend
  rtc.on('get_peers', function (data) {
    rtc._id = data.you

    data.connections.forEach(rtc.add_peer.bind(rtc))
  })

  rtc.on('receive_ice_candidate', function (data) {
    rtc.peers[data.socketId]._add_ice_candidate(data)
  })

  rtc.on('new_peer_connected', function (data) {
    rtc.add_peer(id)
  })

  rtc.on('remove_peer_connected', function (data) {
    rtc.remove_peer(data.socketId) //TODO
  })
}

// -- Management of peers

RTC.prototype.add_peer = function (id) {
  var rtc = this
    , peer = rtc.peers[i] = peerconn.connect(rtc, id)

  rtc.emit('peer new', peer)
}