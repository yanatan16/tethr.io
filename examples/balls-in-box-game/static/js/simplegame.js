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

// Startup the tethr. (It takes options, but we're fine for now)
tethr.connect(room /*, options*/)

// New Game!
var game = new Game()

// On connect, lets start the game
tethr.on('connect', function (my_id) {
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
      state = newState
      tethr.broadcast(state)
    }
  }, updateInterval)
}

// Here's the magic, a peer has just joined
tethr.on('join', function (peer) {

  // Notify the game
  game.join(peer.id)

  // On any message from the peer, lets notify the game
  peer.on('message', function (msg) {
    game.message(msg, peer.id)
  })

  // If the peer leaves, notify the game
  peer.on('leave', function () {
    game.leave(peer.id)
  })

  // Send the peer our last updated state on initialization
  peer.send(game.current())
})
