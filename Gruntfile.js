module.exports = function(grunt) {
  var expandArray = function(pattern) {
    var files = grunt.file.expand(pattern);
    var output = {};
    files.forEach(function(file) {
      output[file] = file;
    });
    return output;
  };

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
    jsfmt: {
      lib: {
        files: expandArray('lib/**/*.js'),
      },
      tests: {
        files: expandArray('tests/**/*.js'),
      },
      grunt: {
        files: {
          'Gruntfile.js': 'Gruntfile.js',
        },
      },
    },
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jsfmt');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.registerTask('default', ['jshint', 'mochaTest']);
};
