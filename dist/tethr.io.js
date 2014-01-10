(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('./lib/tethr')
},{"./lib/tethr":2}],2:[function(require,module,exports){
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
},{"../node_modules/webrtc.io-client/lib/webrtc.io.js":5,"events":3,"inherits":4}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
//CLIENT

// Fallbacks for vendor-specific variables until the spec is finalized.

var PeerConnection = (window.PeerConnection || window.webkitPeerConnection00 || window.webkitRTCPeerConnection || window.mozRTCPeerConnection);
var URL = (window.URL || window.webkitURL || window.msURL || window.oURL);
var getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
var nativeRTCIceCandidate = (window.mozRTCIceCandidate || window.RTCIceCandidate);
var nativeRTCSessionDescription = (window.mozRTCSessionDescription || window.RTCSessionDescription); // order is very important: "RTCSessionDescription" defined in Nighly but useless

var sdpConstraints = {
  'mandatory': {
    'OfferToReceiveAudio': true,
    'OfferToReceiveVideo': true
  }
};

if (navigator.webkitGetUserMedia) {
  if (!webkitMediaStream.prototype.getVideoTracks) {
    webkitMediaStream.prototype.getVideoTracks = function() {
      return this.videoTracks;
    };
    webkitMediaStream.prototype.getAudioTracks = function() {
      return this.audioTracks;
    };
  }

  // New syntax of getXXXStreams method in M26.
  if (!webkitRTCPeerConnection.prototype.getLocalStreams) {
    webkitRTCPeerConnection.prototype.getLocalStreams = function() {
      return this.localStreams;
    };
    webkitRTCPeerConnection.prototype.getRemoteStreams = function() {
      return this.remoteStreams;
    };
  }
}

(function() {

  var rtc;
  if ('undefined' === typeof module) {
    rtc = this.rtc = {};
  } else {
    rtc = module.exports = {};
  }

  // Toggle debug mode (console.log)
  rtc.debug = false;

  // Holds a connection to the server.
  rtc._socket = null;

  // Holds identity for the client.
  rtc._me = null;

  // Holds callbacks for certain events.
  rtc._events = {};

  rtc.on = function(eventName, callback) {
    rtc._events[eventName] = rtc._events[eventName] || [];
    rtc._events[eventName].push(callback);
  };

  rtc.fire = function(eventName, _) {
    var events = rtc._events[eventName];
    var args = Array.prototype.slice.call(arguments, 1);

    if (!events) {
      return;
    }

    for (var i = 0, len = events.length; i < len; i++) {
      events[i].apply(null, args);
    }
  };

  // Holds the STUN/ICE server to use for PeerConnections.
  rtc.SERVER = function() {
    if (navigator.mozGetUserMedia) {
      return {
        "iceServers": [{
          "url": "stun:23.21.150.121"
        }]
      };
    }
    return {
      "iceServers": [{
        "url": "stun:stun.l.google.com:19302"
      }]
    };
  };


  // Reference to the lone PeerConnection instance.
  rtc.peerConnections = {};

  // Array of known peer socket ids
  rtc.connections = [];
  // Stream-related variables.
  rtc.streams = [];
  rtc.numStreams = 0;
  rtc.initializedStreams = 0;


  // Reference to the data channels
  rtc.dataChannels = {};

  // PeerConnection datachannel configuration
  rtc.dataChannelConfig = {
    "optional": [{
      "RtpDataChannels": true
    }, {
      "DtlsSrtpKeyAgreement": true
    }]
  };

  rtc.pc_constraints = {
    "optional": [{
      "DtlsSrtpKeyAgreement": true
    }]
  };


  // check whether data channel is supported.
  rtc.checkDataChannelSupport = function() {
    try {
      // raises exception if createDataChannel is not supported
      var pc = new PeerConnection(rtc.SERVER(), rtc.dataChannelConfig);
      var channel = pc.createDataChannel('supportCheck', {
        reliable: false
      });
      channel.close();
      return true;
    } catch (e) {
      return false;
    }
  };

  rtc.dataChannelSupport = rtc.checkDataChannelSupport();


  /**
   * Connects to the websocket server.
   */
  rtc.connect = function(server, room) {
    room = room || ""; // by default, join a room called the blank string
    rtc._socket = new WebSocket(server);

    rtc._socket.onopen = function() {

      rtc._socket.send(JSON.stringify({
        "eventName": "join_room",
        "data": {
          "room": room
        }
      }));

      rtc._socket.onmessage = function(msg) {
        var json = JSON.parse(msg.data);
        rtc.fire(json.eventName, json.data);
      };

      rtc._socket.onerror = function(err) {
        console.error('onerror');
        console.error(err);
      };

      rtc._socket.onclose = function(data) {
        var id = rtc._socket.id;
        rtc.fire('disconnect stream', id);
        if (typeof(rtc.peerConnections[id]) !== 'undefined')
            rtc.peerConnections[id].close();
        delete rtc.peerConnections[id];
        delete rtc.dataChannels[id];
        delete rtc.connections[id];
      };

      rtc.on('get_peers', function(data) {
        rtc.connections = data.connections;
        rtc._me = data.you;
        if (rtc.offerSent) { // 'ready' was fired before 'get_peers'
          rtc.createPeerConnections();
          rtc.addStreams();
          rtc.addDataChannels();
          rtc.sendOffers();
        }
        // fire connections event and pass peers
        rtc.fire('connections', rtc.connections);
      });

      rtc.on('receive_ice_candidate', function(data) {
        var candidate = new nativeRTCIceCandidate(data);
        rtc.peerConnections[data.socketId].addIceCandidate(candidate);
        rtc.fire('receive ice candidate', candidate);
      });

      rtc.on('new_peer_connected', function(data) {
        var id = data.socketId;
        rtc.connections.push(id);
        delete rtc.offerSent;

        var pc = rtc.createPeerConnection(id);
        for (var i = 0; i < rtc.streams.length; i++) {
          var stream = rtc.streams[i];
          pc.addStream(stream);
        }
      });

      rtc.on('remove_peer_connected', function(data) {
        var id = data.socketId;
        rtc.fire('disconnect stream', id);
        if (typeof(rtc.peerConnections[id]) !== 'undefined')
            rtc.peerConnections[id].close();
        delete rtc.peerConnections[id];
        delete rtc.dataChannels[id];
        delete rtc.connections[id];
      });

      rtc.on('receive_offer', function(data) {
        rtc.receiveOffer(data.socketId, data.sdp);
        rtc.fire('receive offer', data);
      });

      rtc.on('receive_answer', function(data) {
        rtc.receiveAnswer(data.socketId, data.sdp);
        rtc.fire('receive answer', data);
      });

      rtc.fire('connect');
    };
  };


  rtc.sendOffers = function() {
    for (var i = 0, len = rtc.connections.length; i < len; i++) {
      var socketId = rtc.connections[i];
      rtc.sendOffer(socketId);
    }
  };

  rtc.onClose = function(data) {
    rtc.on('close_stream', function() {
      rtc.fire('close_stream', data);
    });
  };

  rtc.createPeerConnections = function() {
    for (var i = 0; i < rtc.connections.length; i++) {
      rtc.createPeerConnection(rtc.connections[i]);
    }
  };

  rtc.createPeerConnection = function(id) {

    var config = rtc.pc_constraints;
    if (rtc.dataChannelSupport) config = rtc.dataChannelConfig;

    var pc = rtc.peerConnections[id] = new PeerConnection(rtc.SERVER(), config);
    pc.onicecandidate = function(event) {
      if (event.candidate) {
        rtc._socket.send(JSON.stringify({
          "eventName": "send_ice_candidate",
          "data": {
            "label": event.candidate.sdpMLineIndex,
            "candidate": event.candidate.candidate,
            "socketId": id
          }
        }));
      }
      rtc.fire('ice candidate', event.candidate);
    };

    pc.onopen = function() {
      // TODO: Finalize this API
      rtc.fire('peer connection opened');
    };

    pc.onaddstream = function(event) {
      // TODO: Finalize this API
      rtc.fire('add remote stream', event.stream, id);
    };

    if (rtc.dataChannelSupport) {
      pc.ondatachannel = function(evt) {
        if (rtc.debug) console.log('data channel connecting ' + id);
        rtc.addDataChannel(id, evt.channel);
      };
    }

    return pc;
  };

  rtc.sendOffer = function(socketId) {
    var pc = rtc.peerConnections[socketId];

    var constraints = {
      "optional": [],
      "mandatory": {
        "MozDontOfferDataChannel": true
      }
    };
    // temporary measure to remove Moz* constraints in Chrome
    if (navigator.webkitGetUserMedia) {
      for (var prop in constraints.mandatory) {
        if (prop.indexOf("Moz") != -1) {
          delete constraints.mandatory[prop];
        }
      }
    }
    constraints = mergeConstraints(constraints, sdpConstraints);

    pc.createOffer(function(session_description) {
      session_description.sdp = preferOpus(session_description.sdp);
      pc.setLocalDescription(session_description);
      rtc._socket.send(JSON.stringify({
        "eventName": "send_offer",
        "data": {
          "socketId": socketId,
          "sdp": session_description
        }
      }));
    }, null, sdpConstraints);
  };

  rtc.receiveOffer = function(socketId, sdp) {
    var pc = rtc.peerConnections[socketId];
    rtc.sendAnswer(socketId, sdp);
  };

  rtc.sendAnswer = function(socketId, sdp) {
    var pc = rtc.peerConnections[socketId];
    pc.setRemoteDescription(new nativeRTCSessionDescription(sdp));
    pc.createAnswer(function(session_description) {
      pc.setLocalDescription(session_description);
      rtc._socket.send(JSON.stringify({
        "eventName": "send_answer",
        "data": {
          "socketId": socketId,
          "sdp": session_description
        }
      }));
      //TODO Unused variable!?
      var offer = pc.remoteDescription;
    }, null, sdpConstraints);
  };


  rtc.receiveAnswer = function(socketId, sdp) {
    var pc = rtc.peerConnections[socketId];
    pc.setRemoteDescription(new nativeRTCSessionDescription(sdp));
  };


  rtc.createStream = function(opt, onSuccess, onFail) {
    var options;
    onSuccess = onSuccess || function() {};
    onFail = onFail || function() {};

    options = {
      video: !! opt.video,
      audio: !! opt.audio
    };

    if (getUserMedia) {
      rtc.numStreams++;
      getUserMedia.call(navigator, options, function(stream) {
        rtc.streams.push(stream);
        rtc.initializedStreams++;
        onSuccess(stream);
        if (rtc.initializedStreams === rtc.numStreams) {
          rtc.fire('ready');
        }
      }, function(error) {
        alert("Could not connect stream.");
        onFail(error);
      });
    } else {
      alert('webRTC is not yet supported in this browser.');
    }
  };

  rtc.addStreams = function() {
    for (var i = 0; i < rtc.streams.length; i++) {
      var stream = rtc.streams[i];
      for (var connection in rtc.peerConnections) {
        rtc.peerConnections[connection].addStream(stream);
      }
    }
  };

  rtc.attachStream = function(stream, element) {
    if (typeof(element) === "string")
      element = document.getElementById(element);
    if (navigator.mozGetUserMedia) {
      if (rtc.debug) console.log("Attaching media stream");
      element.mozSrcObject = stream;
      element.play();
    } else {
      element.src = webkitURL.createObjectURL(stream);
    }
  };


  rtc.createDataChannel = function(pcOrId, label) {
    if (!rtc.dataChannelSupport) {
      //TODO this should be an exception
      alert('webRTC data channel is not yet supported in this browser,' +
        ' or you must turn on experimental flags');
      return;
    }

    var id, pc;
    if (typeof(pcOrId) === 'string') {
      id = pcOrId;
      pc = rtc.peerConnections[pcOrId];
    } else {
      pc = pcOrId;
      id = undefined;
      for (var key in rtc.peerConnections) {
        if (rtc.peerConnections[key] === pc) id = key;
      }
    }

    if (!id) throw new Error('attempt to createDataChannel with unknown id');

    if (!pc || !(pc instanceof PeerConnection)) throw new Error('attempt to createDataChannel without peerConnection');

    // need a label
    label = label || 'fileTransfer' || String(id);

    // chrome only supports reliable false atm.
    var options = {
      reliable: false
    };

    var channel;
    try {
      if (rtc.debug) console.log('createDataChannel ' + id);
      channel = pc.createDataChannel(label, options);
    } catch (error) {
      if (rtc.debug) console.log('seems that DataChannel is NOT actually supported!');
      throw error;
    }

    return rtc.addDataChannel(id, channel);
  };

  rtc.addDataChannel = function(id, channel) {
    channel._id = id;

    channel.onopen = function() {
      if (rtc.debug) console.log('data stream open ' + id);
      rtc.fire('data stream open', channel);
    };

    channel.onclose = function(event) {
      delete rtc.dataChannels[id];
      delete rtc.peerConnections[id];
      delete rtc.connections[id];
      if (rtc.debug) console.log('data stream close ' + id);
      rtc.fire('data stream close', channel);
    };

    channel.onmessage = function(message) {
      if (rtc.debug) console.log('data stream message ' + id);
      rtc.fire('data stream data', channel, message.data);
    };

    channel.onerror = function(err) {
      if (rtc.debug) console.log('data stream error ' + id + ': ' + err);
      rtc.fire('data stream error', channel, err);
    };

    // track dataChannel
    rtc.dataChannels[id] = channel;
    return channel;
  };

  rtc.addDataChannels = function() {
    if (!rtc.dataChannelSupport) return;

    for (var connection in rtc.peerConnections)
    rtc.createDataChannel(connection);
  };


  rtc.on('ready', function() {
    rtc.createPeerConnections();
    rtc.addStreams();
    rtc.addDataChannels();
    rtc.sendOffers();
    rtc.offerSent = true;
  });

}).call(this);

function preferOpus(sdp) {
  var sdpLines = sdp.split('\r\n');
  var mLineIndex = null;
  // Search for m line.
  for (var i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].search('m=audio') !== -1) {
      mLineIndex = i;
      break;
    }
  }
  if (mLineIndex === null) return sdp;

  // If Opus is available, set it as the default in m line.
  for (var j = 0; j < sdpLines.length; j++) {
    if (sdpLines[j].search('opus/48000') !== -1) {
      var opusPayload = extractSdp(sdpLines[j], /:(\d+) opus\/48000/i);
      if (opusPayload) sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex], opusPayload);
      break;
    }
  }

  // Remove CN in m line and sdp.
  sdpLines = removeCN(sdpLines, mLineIndex);

  sdp = sdpLines.join('\r\n');
  return sdp;
}

function extractSdp(sdpLine, pattern) {
  var result = sdpLine.match(pattern);
  return (result && result.length == 2) ? result[1] : null;
}

function setDefaultCodec(mLine, payload) {
  var elements = mLine.split(' ');
  var newLine = [];
  var index = 0;
  for (var i = 0; i < elements.length; i++) {
    if (index === 3) // Format of media starts from the fourth.
    newLine[index++] = payload; // Put target payload to the first.
    if (elements[i] !== payload) newLine[index++] = elements[i];
  }
  return newLine.join(' ');
}

function removeCN(sdpLines, mLineIndex) {
  var mLineElements = sdpLines[mLineIndex].split(' ');
  // Scan from end for the convenience of removing an item.
  for (var i = sdpLines.length - 1; i >= 0; i--) {
    var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
    if (payload) {
      var cnPos = mLineElements.indexOf(payload);
      if (cnPos !== -1) {
        // Remove CN payload from m line.
        mLineElements.splice(cnPos, 1);
      }
      // Remove CN line in sdp
      sdpLines.splice(i, 1);
    }
  }

  sdpLines[mLineIndex] = mLineElements.join(' ');
  return sdpLines;
}

function mergeConstraints(cons1, cons2) {
  var merged = cons1;
  for (var name in cons2.mandatory) {
    merged.mandatory[name] = cons2.mandatory[name];
  }
  merged.optional.concat(cons2.optional);
  return merged;
}

},{}]},{},[1])