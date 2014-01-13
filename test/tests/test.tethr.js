// test.tethr.js
// Test the tethr WebRTC ness by communicating with the ping peer (should be up and running)
// ping.js
// Be the simplest ping/pong tethr.io peer

var testTethr = require('./setup')

testTethr.on('error', function (err) {
  throw err
})

describe('tethr-connect', function () {
  it('should connect to the signaling backend', function (done) {
    done = testTethr.timeout(1000, done)

    testTethr.once('connect', function () {
      done()
    })
  })
})

describe('tethr-peer', function () {
  it('should at least one peer', function (done) {
    done = testTethr.timeout(1000, done)

    testTethr.once('join', function (peer) {
      assert.ok(typeof peer.id === 'string', 'peer.id was of type ' + (typeof peer.id))
      assert.ok(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(peer.id), 'my id didnt match the uuid regex')
      done()
    })
  })
})

describe('tethr-peer-pingpong', function () {
  it('should pong my ping', function (done) {
    done = testTethr.timeout(1000, done)
    testTethr.once('ping-join', function (peer) {
      peer.send('ping', 'msg')
      peer.once('pong', function (msg) {
        assert.equal(msg, 'msg')
        done()
      })
    })
  })
  it('should unpong my unping (broadcast)', function (done) {
    done = testTethr.timeout(1000, done)
    testTethr.once('ping-join', function (peer) {
      testTethr.tethr.broadcast('ping', 'bcast')
      peer.once('pong', function (msg) {
        assert.equal(msg, 'bcast')
        done()
      })
    })
  })
})

describe('tethr-myid', function () {
  it('should have a uuid id', function (done) {
    done = testTethr.timeout(1000, done)

    testTethr.once('join', function (peer) {
      // we must wait to have a peer before our id is known
      var id = testTethr.tethr.id()

      assert.notEqual(id, peer.id)
      assert.ok(typeof id === 'string', 'my id was of type ' + (typeof id))
      assert.ok(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id), 'my id didnt match the uuid regex')
      done()
    })
  })
})