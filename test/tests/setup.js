var tethr = require('../../index')

// setup
tethr.connect('tethr-test', {
  ice: null,
  host: 'localhost:18101'
})

// Just in case these events happen before our tests
var events = {}
function remember(name) {
  events[name] = []
  tethr.on(name, function () {
    events[name].push(Array.prototype.slice.call(arguments))
  })
}
remember('connect')

tethr.on('join', function (peer) {
  isPingPeer(peer, function (pingPeer) {
    tethr.emit('ping-join', pingPeer)
  })
})

remember('join')
remember('ping-join')
function on(name, fn) {
  tethr.on(name, fn)
  if (events[name] && events[name].length) {
    events[name].forEach(function (args) {
      fn.apply(null, args)
    })
  }
}
function once(name, fn) {
  tethr.once(name, fn)
  if (events[name] && events[name].length) {
    fn.apply(null, events[name][0])
  }
}
function timeout(time, done) {
  var tmout = setTimeout(onTimeout, time)

  return function () {
    clearTimeout(tmout)
    done.apply(this, arguments)
  }

  function onTimeout() {
    done(new Error('timeout'))
  }
}

// Other testers might be here, we need to figure out who is the pingpeer
function isPingPeer(peer,cb) {
  peer.once('message', function (msg) {
    if (msg.iam === 'ping') {
      cb(peer)
    }
  })
}

exports.tethr = tethr
exports.on = on
exports.once = once
exports.timeout = timeout