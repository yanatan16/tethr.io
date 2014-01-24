# tethr.io

tethr.io provides a super-easy socket.io-like framework for managing peer-to-peer WebRTC data connections. This enables extremely fast and scalable applications and games built around small groups of clients communicating directly with each other!

tethr.io builds off the great work of [WebRTC.io](https://github.com/webRTC/WebRTC.io) by wrapping their client library and simplifying the API until its dead simple for data streams.

This library focuses on _data_ streams, and (currently) provides no mechanisms for video or audio streams (pull requests are encouraged!).

A great use for tethr.io is multiplayer games or chat infrastructure! Theres a small ["game" example](https://github.com/yanatan16/tethr.io/tree/master/examples/basic-game) in the examples folder.

#### [Examples](https://github.com/yanatan16/tethr.io/tree/master/examples)

### Compatibility

Currently compatible with stable Chrome 31. Stable Firefox-firefox connections should be viable shortly.

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
tethr.connect({
  server: 'myserver:8001',
  room: 'my-room',
  ice: null, // ICE options. See WebRTC docs. Leave blank if your testing on a LAN
  secure: false, // forces wss
  reconnect_limit: 1, // websocket reconnects
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
tethr.broadcast('broadcast-update', {some: 'message', of: 'importance'})

// Here's the magic. This event fires when a peer joins the room
tethr.on('join', function (peer) {
  // peer has one field you might nice
  // peer.id is a unique identifier of every peer ever. A reconnecting peer _should_ have the same ID
  // peer is also an EventEmitter, so we use events to work with it too!

  // We can receive custom events from this peer
  peer.on('custom-event', function (obj) {
    // do something
  })

  // We are notified when a peer leaves (this might be due to a dropped connection)
  peer.on('leave', function () {
    // sad... do something
  })

  // Finally, we can send custom events and messages to the peer whenever we like
  peer.send('custom-event', {some: 'message', just: 4, you: null})
})
```

## Backend

On the backend, you'll still need a webrtc.io signaling server, which [webrtc.io](https://github.com/webRTC/webrtc.io) provides. Just do the following:

```javascript
var rtc = require('webrtc.io')
rtc.listen(port || httpServer)
```

## Testing

WebRTC introduces clients talking to one another, which is a breaking change to the assumptions of normal browser-based testing. First of all, its a browser-only thing and theres no testing mocks for other environments like node. Secondly, most browser testing frameworks work under the assumption that different browsers windows will never interact and are never needed. But under WebRTC, this is exactly what is required.

So to test, we run a custom setup which launches a web server (running `webrtc.io` as a signaling backend) and a chrome instance which will ping/pong requests to a certain room on that signaling server. Then we launch browser-based testing in [karma](http://karma-runner.github.io).

```
grunt test
```

will run jshint on the code, then startup the server, then run the karma tests in a single-run mode. To do live testing, you can startup the servers yourself.

The backend signaling server:

```
node test/test
```

The karma server:

```
npm install -g karma
karma start test/karma.conf.js
```

Then run karma tests:

```
karma run
```

## License

MIT License in `LICENSE` file.


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/yanatan16/tethr.io/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

