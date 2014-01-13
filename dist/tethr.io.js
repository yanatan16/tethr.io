(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('./lib/tethr')
},{"./lib/tethr":6}],2:[function(require,module,exports){
// client.js
// client disambiguation for tethr.js

exports.PeerConnection = window.PeerConnection ||
  window.webkitPeerConnection00 ||
  window.webkitRTCPeerConnection ||
  window.mozRTCPeerConnection

exports.RTCIceCandidate = window.mozRTCIceCandidate ||
  window.RTCIceCandidate


},{}],3:[function(require,module,exports){
// configs.js
// configs for WebRTC for tethr.js

exports.peer_connection_config = {
  optional: [
    { RtpDataChannels: true },
    { DtlsSrtpKeyAgreement: true }
  ]
}

exports.data_channel_options = {
  reliable: false
}
},{}],4:[function(require,module,exports){
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
  this.pc = new client.PeerConnection(rtc.ice, configs.peer_connection_config)
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

      peer.rtc.socket.send('send_ice_candidate', {
        label: candidate.sdpMLineIndex,
        candidate: candidate.candidate,
        socketId: peer.id
      })
    }
  }

  pc.onopen = function () {
    peer.emit('open')
    peer.create_data_channel()
  }

  pc.onerror = function (err) {
    peer.rtc.emit('error', err)
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
},{"./client":2,"./configs":3,"events":9,"inherits":10}],5:[function(require,module,exports){
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
  if (/^leave$/.test(type)) {
    throw new Error('Can\'t send a message type ' + type)
  }

  var msg = {
    type: type,
    data: data
  }

  this.channel.send(JSON.stringify(msg))
}
},{"events":9,"inherits":10}],6:[function(require,module,exports){
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
    var tpeer = tether._peers[peer.id] = new TetherPeer(peer)
    tether.emit('join', tpeer)
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
},{"./tether-peer":5,"./webrtc":7,"events":9,"inherits":10}],7:[function(require,module,exports){
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

  rtc.on('socket close', function () {
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
    rtc.add_peer(data.socketId)
  })

  rtc.on('remove_peer_connected', function (data) {
    rtc.remove_peer(data.socketId) //TODO
  })
}

// -- Management of peers

RTC.prototype.add_peer = function (id) {
  var rtc = this
    , peer = rtc.peers[id] = peerconn.connect(rtc, id)

  rtc.emit('peer new', peer)
}
},{"./peer":4,"./websocket":8,"events":9,"inherits":10}],8:[function(require,module,exports){
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
},{}],9:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        throw TypeError('Uncaught, unspecified "error" event.');
      }
      return false;
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      console.trace();
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],10:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}]},{},[1])