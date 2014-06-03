module.exports = function(grunt){
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
          reporter: 'spec',
        },
        src: ['tests/**/*.js'],
      },
    },
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jsfmt');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.registerTask('default', ['jshint', 'mochaTest']);
};
