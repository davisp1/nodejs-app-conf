'use strict';

//====================================================================

var Bluebird = require('bluebird');

var fs$readFile = require('fs-promise').readFile;
var fs$writeFile = require('fs-promise').writeFile;

var j = require('path').join;
var resolvePath = require('path').resolve;

var flatten = require('lodash.flatten');
var glob = Bluebird.promisify(require('glob'));
var xdgBasedir = require('xdg-basedir');

//====================================================================

function readFile(path) {
  return fs$readFile(path).then(function (buffer) {
    return {
      path: path,
      content: buffer,
    };
  });
}

function ignoreAccessErrors(error) {
  if (error.cause.code !== 'EACCES') {
    throw error;
  }

  return [];
}

//====================================================================

// Default configuration entries.
module.exports = [

  // Default vendor configuration.
  {
    name: 'vendor',
    read: function () {
      // It is assumed that app-conf is in the `node_modules`
      // directory of the owner package.
      return Bluebird.map(
        glob(j(__dirname, '..', '..', 'config.*')),
        readFile
      );
    },
    write: function(data, opts){
      var extension = opts.extension || "json";
      var filePath = j(__dirname, '..', '..', 'config.' + extension)

      return fs$writeFile(filePath, data);
    }
  },

  // Configuration for the whole system.
  {
    name: 'system',
    read: function (opts) {
      var name = opts.name;

      return Bluebird.map(
        glob(j('/etc', name, 'config.*')),
        readFile
      );
    },
    write: function(data, opts){
      var extension = opts.extension || "json";
      var name = opts.name;
      var filePath = j('/etc', name, 'config.' + extension);

      return fs$writeFile(filePath, data);
    }
  },

  // Configuration for the current user.
  {
    name: 'global',
    read: function (opts) {
      var configDir = xdgBasedir.config;
      if (!configDir) {
        return Bluebird.resolve([]);
      }

      var name = opts.name;

      return Bluebird.map(
        glob(j(configDir, name, 'config.*')),
        readFile
      );
    },
    write: function(data, opts){
      var configDir = xdgBasedir.config;
      var extension = opts.extension || "json";
      var filePath = j(configDir, opts.name, 'config.' + extension)

      return fs$writeFile(filePath, data);
    }
  },

  // Configuration of the current project (local to the file
  // hierarchy).
  {
    name: 'local',
    read: function (opts) {
      var name = opts.name;

      // Compute the list of paths from the current directory to the
      // root directory.
      var paths = [];
      var dir, prev;
      dir = process.cwd();
      while (dir !== prev) {
        paths.push(j(dir, '.' + name + '.*'));
        prev = dir;
        dir = resolvePath(dir, '..');
      }

      return Bluebird.map(paths.reverse(), function (path) {
        return glob(path, {
          silent: true,
        }).catch(ignoreAccessErrors);
      }).then(flatten).map(readFile);
    },
    write: function (data, opts) {
      var dir = opts.dir || process.cwd();
      var name = opts.name;
      var extension = opts.extension || "json";
      var filePath = j(dir, '.' + name + '.' + extension)

      return fs$writeFile(filePath, data);
   }
  },

];
