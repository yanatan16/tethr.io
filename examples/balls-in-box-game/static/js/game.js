module.exports = Game;

function Game() {
  var game = this;
  game.$board = $('#board')
  game.players = {};
}

//// --- External API

Game.prototype.join = function (id) {
  this.addPlayer(id)
}

Game.prototype.message = function (msg, id) {
  this.updatePlayer(id, msg)
}

Game.prototype.leave = function (id) {
  this.removePlayer(id)
}

Game.prototype.current = function () {
  return this.players.me.pos
}


//// --- Internal stuff

Game.prototype.start = function () {
  var game = this;
  console.log('starting game!', game._id)

  var pos = [Math.floor(Math.random() * game.$board.height()), Math.floor(Math.random() * game.$board.width())];

  game.addPlayer('me')
  game.updatePlayer('me', pos)
  game.initControls()
  this._interval = setInterval(game.gameLoop.bind(game), 10)
}

Game.prototype.removePlayer = function (id) {
  var game = this;
  game.players[id].$.remove()
  delete game.players[id]
}

Game.prototype.updatePlayer = function (id, pos) {
  var game = this;
  if (!game.players[id]) {
    console.log('Update for player not in system?!')
    return
  }
  game.players[id].pos = pos

  // console.log('after update', id, pos, game.players)
}

Game.prototype.addPlayer = function (id) {
  var game = this;
  var plyr = {
    id: id,
    pos: [-100, -100],
  }
  plyr.$ = $('<div>').addClass('player').addClass(id=='me' ? 'me' : 'them').attr('id', id).css({'background-color': '#' + id.slice(id.length - 6)})

  game.$board.find('#' + id).remove()
  game.$board.append(plyr.$)

  game.players[id] = plyr

  console.log('Added player', id)
}

Game.prototype.initControls = function () {
  var game = this;
  var speed = 3;
  $(document).keydown(function (evt) {
    if (evt.which >= 37 && evt.which <= 40) {
      switch (evt.which) {
        case 37:
          game.players.me.pos[1] -= speed;
          break
        case 38:
          game.players.me.pos[0] -= speed;
          break;
        case 39:
          game.players.me.pos[1] += speed;
          break;
        case 40:
          game.players.me.pos[0] += speed;
          break;
      }
    }
  })

}

Game.prototype.gameLoop = function () {
  var game = this;
  Object.keys(game.players).forEach(function (id) {
    var plyr = game.players[id];
    plyr.$.css({top: plyr.pos[0], left: plyr.pos[1]})
  })
}