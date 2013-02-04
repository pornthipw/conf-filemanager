var app = angular.module('mongo_service', ['ngResource']);

//var prefix = '/apps/demo';
var prefix = '';

app.factory('Entry', function($resource) {
  var Entry = $resource(prefix + '/db/entry/:id', {    
    id: '@id'
  },
  {update: { method:'PUT' }});
  return Entry;
});

app.factory('User', function($resource) {
    var User  = $resource('user',{}, {});   
    return User;   
});

app.factory('Logout', function($resource) {
    var Logout  = $resource('logout',{}, {});   
    return Logout ;   
});







