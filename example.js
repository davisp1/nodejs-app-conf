'use strict';

//====================================================================

var appconf = require('./');

//====================================================================

appconf.save('my-application', { a: "example1", b: "example2"}, { merge: false, type: "local"})
      .then(function(value){
        return appconf.load('my-application');
      })
      .then(function(value){
        console.log(value);
        return appconf.save('my-application', { a: "changed" }, { merge: true, type: "local"});
      })
      .then(function(value){
        return appconf.load('my-application');
      })
      .then(function(value){
        console.log(value);
        return appconf.save('my-application', { a: "replace" }, { merge: false, type: "local"});
      })
      .then(function(value){
        return appconf.load('my-application');
      })
      .then(function(value){
        console.log(value);
      })