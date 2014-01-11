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
    var json
    try {
      json = JSON.parse(msg.data)
    } catch (e) {
      emitter.emit('error', new Error('Error parsing socket message: ' + msg.data))
      return
    }
    emitter.emit(json.eventName, json.data)
  }

  var originalSend = socket.send
  socket.send = function (name, data) {
    var msg = {
      eventName: name,
      data: data
    }
    return originalSend(JSON.stringify(msg))
  }
}