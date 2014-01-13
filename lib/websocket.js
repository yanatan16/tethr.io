// websocket.js
// Provide websocket interface for tethr.io

exports.connect = function (emitter, server) {
  var socket = new WebSocket(server)

  socket.onopen = function () {
    emitter.emit('socket open', socket)
  }

  socket.onerror = function (err) {
    emitter.emit('error', err)
  }

  socket.onclose = function () {
    emitter.emit('socket close', socket)
  }

  socket.onmessage = function (msg) {
    emitter.emit('socket message', msg)
  }

  return socket
}