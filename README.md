# tethr.io

tethr.io provides a super-easy socket.io-like framework for managing peer-to-peer WebRTC data connections. This enables extremely fast and scalable applications and games built around small groups of clients communicating directly with each other!

tethr.io builds off the great work of [WebRTC.io](https://github.com/webRTC/WebRTC.io) by wrapping their client library and simplifying the API until its dead simple for data streams.

This library focuses on _data_ streams, and (currently) provides no mechanisms for video or audio streams (pull requests are encouraged!).

A great use for tethr.io is multiplayer games! I'm setting up an example game right now using tethr.io.

#### [Examples](https://github.com/yanatan16/tethr.io/tree/master/examples)

## Install

The easiest way to install is to use browserify or component.

```javascript
var tethr = require('tethr.io')
```

Or, if you must use a standalone build, one has been provided for you as `tethr.io.js`

```html
<script src="path/to/tethr.io/tethr.io.js"></script>
```

## Usage

The best way to describe it is by example!

```javascript
var tethr = require('tethr.io')

// Setup a connection to the backend to tell us of peers
tethr.connect('my-room', {
  host: 'myserver:8001',
  ice: null, // ICE options. See WebRTC docs. Leave blank if you don't know
  secure: false // forces wss://
})

// tethr is an EventEmitter, so we'll use events to communicate
tethr.on('connect', function () {
  console.log('connect successful!')
})

// tethr can have errors, its good to bubble them up
tethr.on('error', function (err) {
  console.error('tethr error', err)
})

// tethr can broadcast to all connected peers in the room
tethr.broadcast({some: 'message', of: 'importance'})

// Here's the magic. This event fires when a peer joins the room
tethr.on('join', function (peer) {
  // peer has one field you might nice
  // peer.id is a unique identifier of every peer ever. A reconnecting peer _should_ have the same ID
  // peer is also an EventEmitter, so we use events to work with it too!

  // We can receive messages from this peer
  peer.on('message', function (msg) {
    // do something
  })

  // We are notified when a peer leaves (this might be due to a dropped connection)
  peer.on('leave', function () {
    // sad... do something
  })

  // Finally, we can send messages to the peer whenever we like
  peer.send({some: 'message', just: 4, you: null})
})
```

## Backend

On the backend, you'll still need a webrtc.io signaling server, which [webrtc.io](https://github.com/webRTC/webrtc.io) provides. Just do the following:

```javascript
var rtc = require('webrtc.io')
rtc.listen(port || httpServer)
```

## License

MIT License in `LICENSE` file.