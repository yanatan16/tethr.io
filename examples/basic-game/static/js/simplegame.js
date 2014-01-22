// simplegame.js
// Glue code to add in tethr.io as a multiplayer communication layer for web games

// tethr.io is the nice socket.io-like wrapper around WebRTC
var tethr = require('tethr.io')

// Game is our game!
var Game = require('./game')

// A node module for checking deepEqual
var deepEqual = require('deep-equal')

// You can customize what room to join, but this just grabs the first path element
var room = window.document.location.pathname.toString().split('/')[1]

tethr.connect()

// OR

tethr.connect({
  room: room,
  server: window.document.location.host,
  ice: {
    iceServers: [{ url: 'stun:stun.l.google.com:19302' }]
  },
  secure: false,
  reconnect_limit: 0
})

// New Game!
var game = new Game()

// On connect, lets start the game
tethr.on('connect', function () {
  console.log('connect successful!')

  game.start()
  startUpdate()
})

// If theres an error, we'd like to know
tethr.on('error', function (err) {
  console.error('ERROR', err)
})

// This sets up a state update notification
// It checks if the state has changed since last notification
function startUpdate() {
  var updateInterval = 10 //ms
  var state
  setInterval(function () {
    var newState = game.current() // Get current state
    if (!deepEqual(newState, state)) {
      state = newState.map(function (x) { return x })
      tethr.broadcast('update', state)
    }
  }, updateInterval)
}

// Here's the magic, a peer has just joined
tethr.on('join', function (peer) {
  console.log('peer joining:', peer.id)

  // Notify the game
  game.join(peer.id)

  // On any update message from the peer, lets notify the game
  peer.on('update', function (update) {
    game.updatePlayer(peer.id, update)
  })

  // If the peer leaves, notify the game
  peer.on('leave', function () {
    console.log('peer leaving:', peer.id)
    game.leave(peer.id)
  })

  // Send the peer our last updated state on initialization
  peer.send('update', game.current())
})
