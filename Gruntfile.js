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
          reporter: 'spec',
        },
        src: ['tests/**/*.js'],
      },
    },
    exec: {
      // Tasks to run `jsfmt`
      jsfmtLib: './bin/jsfmt -w ./lib/**/*.js',
      jsfmtTests: './bin/jsfmt -w ./tests/**/*.js',
      jsfmtGrunt: './bin/jsfmt -w ./Gruntfile.js',
      jsfmtExamples: './bin/jsfmt -w ./examples/**/*.js',

      // Task to verify there is no git diff
      // DEV: This is best to run after `grunt fmt` to help ensure nothing changed
      // DEV: Use `bash -c ""` to force running in `bash` on travis
      verifyNoChanges: 'bash -c "git --no-pager diff && test \"\$(git diff)\" == \"\""',
    },
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.registerTask('default', ['jshint', 'mochaTest']);
  grunt.registerTask('fmt', ['exec:jsfmtLib', 'exec:jsfmtTests', 'exec:jsfmtGrunt', 'exec:jsfmtExamples']);
  grunt.registerTask('verify', ['exec:verifyNoChanges']);
};
