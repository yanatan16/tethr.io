module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-contrib-jshint')
  grunt.loadNpmTasks('grunt-browserify')
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-karma')
  require('./test/task')(grunt)

  grunt.initConfig({
    cfg: {
      src: 'lib/*.js',
      tests: ['test/tests/*.js', 'test/testapp/static/*.js'],
      main: 'index.js',
      dist: 'dist/tethr.io.js',
      distmin: 'dist/tethr.io.min.js',
      karmacfg: 'test/karma.conf.js'
    },
    jshint: {
      options: {
        browser: true,

        asi: true,
        esnext: true,
        bitwise: true,
        camelcase: false,
        curly: true,
        eqeqeq: true,
        immed: true,
        newcap: true,
        noarg: true,
        quotmark: 'single',
        regexp: true,
        undef: true,
        unused: true,
        trailing: true,
        smarttabs: true,
        laxcomma: true,

        globals: {
          require: true,
          exports: true,
          module: true
        }
      },
      gruntfile: ['Gruntfile.js' ],
      src: ['<%= cfg.src %>'],
      test: {
        options: {
          globals: {
            require: true,
            exports: true,
            module: true,
            assert: true,
            describe: true,
            it: true,
            console: true
          }
        },
        files: ['<%= cfg.tests %>'],
      }
    },
    browserify: {
      dist: {
        files: {
          '<%= cfg.dist %>': ['<%= cfg.main %>']
        }
      }
    },
    uglify: {
      dist: {
        files: {
          '<%= cfg.distmin %>': ['<%= cfg.dist %>']
        }
      }
    },
    karma: {
      test: {
        configFile: '<%= cfg.karmacfg %>',
        singleRun: true
      }
    }
  })

  grunt.registerTask('test', [
    'jshint',
    'tethr', // custom, see test/task.js
    'karma:test'
  ])
  grunt.registerTask('dist', [
    'browserify:dist',
    'uglify:dist'
  ])
  grunt.registerTask('default', [
    'test',
    'dist'
  ])
}