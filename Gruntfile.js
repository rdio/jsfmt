module.exports = function(grunt) {
  grunt.initConfig({
    jshint: {
      lib: {
        src: ['lib/**/*.js'],
      },
      tests: {
        src: ['tests/**/*.js'],
      },
    },
    mochaTest: {
      tests: {
        options: {
          reporter: 'spec'
        },
        src: ['tests/**/*.js'],
      },
    },
    exec: {
      jsfmtLib: './bin/jsfmt -w ./lib/**/*.js',
      jsfmtTests: './bin/jsfmt -w ./tests/**/*.js',
      jsfmtGrunt: './bin/jsfmt -w ./Gruntfile.js',
      jsfmtStyleGuide: './bin/jsfmt -w ./examples/styleGuide.js',
    },
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.registerTask('default', ['jshint', 'mochaTest']);
  grunt.registerTask('fmt', ['exec']);
};
