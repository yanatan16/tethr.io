// test.js
// This is a grunt task that wraps the harness for running the tethr.io tests

var server = require('./server')

module.exports = function (grunt) {
  grunt.registerTask('tethr', function () {
    var done = this.async()

    server({}, done)
  })

  grunt.registerTask('tethr:server', function () {
    this.async()
    server({})
  })
}