module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['tests/**/*.js']
      }
    },
    exec: {
      format: './bin/jsfmt -w Gruntfile.js ./lib/**/*.js ./tests/**/*.js'
    },
    jshint: {
      all: ['Gruntfile.js', 'lib/**/*.js', 'tests/**/*.js']
    }
  });

  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-exec');

  grunt.registerTask('test', 'mochaTest');
  grunt.registerTask('hint', 'jshint');
  grunt.registerTask('format', 'exec:format');

  grunt.registerTask('default', ['mochaTest', 'jshint', 'exec:format']);
};