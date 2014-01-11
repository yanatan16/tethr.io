// an example karma.conf.js
module.exports = function(config) {
  config.set({
    basePath: '..',
    frameworks: ['mocha', 'browserify', 'chai'],
    browsers: [
      'Chrome',
    ],
    files: [
      'index.js',
      { pattern: 'lib/**/*.js', served: false, included: false },
      { pattern: 'test/tests/setup.js', served: false, included: false },
      'test/tests/test.*.js'
    ],
    plugins: ['karma-*'],
    preprocessors: {
      'index.js': ['browserify'],
      'test/**/*.js': ['browserify'],
    },
    browserify: {}
  });
};