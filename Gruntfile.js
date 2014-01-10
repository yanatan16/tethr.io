module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-contrib-jshint')
  grunt.loadNpmTasks('grunt-browserify')
  grunt.loadNpmTasks('grunt-contrib-uglify')

  grunt.initConfig({
    cfg: {
      files: 'lib/*.js',
      main: 'index.js',
      dist: 'dist/tethr.io.js',
      distmin: 'dist/tethr.io.min.js'
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
          exports: true
        }
      },
      files: '<%= cfg.files %>'
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
    }
  })

  grunt.registerTask('test', ['jshint'])
  grunt.registerTask('dist', ['browserify:dist','uglify:dist'])
  grunt.registerTask('default', ['test','dist'])
}