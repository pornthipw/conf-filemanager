var app = angular.module('mongo_service', ['ngResource']);

var prefix = '/apps/confile';
//var prefix = '';

app.factory('Entry', function($resource) {
  var Entry = $resource(prefix + '/db/entry/:id', {    
    id: '@id'
  },
  {update: { method:'PUT' }});
  return Entry;
});

app.factory('FileDB', function($resource) {
  var FileDB = $resource(prefix + '/db/fs.files/:id', {    
    id: '@id'
  },
  {update: { method:'PUT' }});
  return FileDB;
});

app.factory('User', function($resource) {
    var User  = $resource('user',{}, {});   
    return User;   
});

app.factory('Logout', function($resource) {
    var Logout  = $resource('logout',{}, {});   
    return Logout ;   
});

app.factory('Admin', function($resource) {
  var Admin = $resource(prefix + '/admin/users/:id', {
  },
  {update: { method:'PUT' }});
  return Admin;
});

app.factory('Gridstore', function($resource) {
  var Gridstore = $resource(prefix + '/file/upload', {
  },
  {update: { method:'PUT' }});
  return Gridstore;
});







