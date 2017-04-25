module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    eslint: {
      options: {
        config: '.eslintrc',
        reset: true,
      },
      target: ['accessor/*.js', 'react/*.js', 'routes/*.js'],
    },
  });
  grunt.registerTask('default', ['eslint']);
};
