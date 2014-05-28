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
    }
  });

  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.registerTask('default', ['mochaTest']);
};