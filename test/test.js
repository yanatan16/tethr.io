// test.js
// This is a executable that wraps the harness for running the tethr.io tests

var server = require('server')

// Test port
var port = 18101
  , browser = process.argv[2] || '/Applications/Google\ Chrome.app'
  , killtime = parseInt(process.argv[1] || '0', 10)

process.argv.slice(1).forEach(function (arg) {
  if (arg === '-h' || arg === '--help') {
    console.log('Usage: node test/test [-h|--help] [--browser=<browser>] [--port=<port>] [--kill=<killafterms>]')
    console.log('Start the tethr.io test server.')
    process.exit(0)
  } else if (/^--browser=/.test(arg)) {
    browser = arg.split('=')[1]
  } else if (/^--port=/.test(arg)) {
    port = parseInt(arg.split('=')[1], 10)
  } else if (/^--kill=/.test(arg)) {
    killtime = parseInt(arg.split('=')[1], 10)
  }
})

server({
  browser: browser,
  port: port,
  killtime: killtime
})
