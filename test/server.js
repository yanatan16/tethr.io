// test.js
// This is a harness for running the tethr.io tests
// tethr.io tests rely on a backend signaling server (webrtc.io) as well as more than one other peer in the same room.
// Thus we cannot simply use a packaged test harness, but wrap our own with phantomjs


var async = require('async')
var launcher = require('browser-launcher')

var testapp = require('./testapp')

module.exports = function (opts, cb) {
  opts = opts || {}
  opts.port = opts.port || 18101
  async.series([
    function (cb) {
      app = testapp.listen(opts.port)
      setTimeout(cb, 50)
    },
    function (cb) {
      launchChrome('http://localhost:' + opts.port  + '/ping.html', cb)
    },
    function (cb) {
      setTimeout(cb, 1000)
    },
  ], function () {
    if (opts.killtime)
      setTimeout(function () { process.exit(0) }, opts.killtime)
    else if (cb)
      cb()
  })
}

function launchChrome(addr, cb) {
  launcher(function (err, launch) {
    if (err) return console.error(err)

    var opts = {
      headless: true,
      browser: 'chrome',
    };
    console.log('Launching chrome to ' + addr)
    launch(addr, opts, function (err, ps) {
      if (err) return console.error(err);

      cb()
    });
  });
}