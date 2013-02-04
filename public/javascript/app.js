var app = angular.module('conf_file', [
  'mongo_service']);

app.filter('skip', function() {
  return function(input, start) {
    start=+start;
    if(input) {
      return input.slice(parseInt(start));
    }
  }
});

app.filter('hide', function() {
  return function(input, key) {
    if(input) {
      var result = [];
      angular.forEach(input, function(v) {
        if(!v.hide) {
          result.push(v);
        }
      });
      return result;
    }
  }
});

app.config(function($routeProvider) {
  
  $routeProvider.when('/upload',{
    controller:UploadController, 
    templateUrl:'static/file_manager.html'
  });
  
  $routeProvider.when('/entry/create', {
    controller:EntryCreateController, 
    templateUrl:'static/entry/entry_form.html'
  });
  
  $routeProvider.when('/entry/edit/:id', {
    controller:EntryController, 
    templateUrl:'static/entry/entry_form.html'
  });
  
  $routeProvider.when('/', {
    controller:EntryListController, 
    templateUrl:'static/index.html'
  });
});

function UserCtrl($scope, User, Logout) {
  $scope.user = User.get();
  
  $scope.logout = function(){
    Logout.get(function(response){
      if(response.success){
        $scope.user = null;
        $scope.$broadcast('logout');
      }
    });
  };
}

function EntryListController($scope, Entry) {
  $scope.entry_list = Entry.query();
  
  
}

function EntryCreateController($scope, Entry) {
  $scope.entry = {};
  $scope.save = function() {
    Entry.save({}, $scope.entry, function(result) {
      console.log(result);
    });
  }; 
}

function EntryController($scope, Entry, $location, $routeParams,User, Logout) {
    Entry.get({id:$routeParams.id},function (response) {
      $scope.entry = response;
      $scope.current_id = $scope.entry._id;
      console.log($scope.entry._id);
      if (response) {
        console.log("OK");
        //Entry.query({project_id:$scope.entry._id}, function (result) {
          //$scope.message_list = result;
        //});
      }
    });
    
    $scope.save = function () { 
      Entry.save({_id:undefined},angular.extend({}, 
        $scope.entry,
        {_id:undefined}),function(result) { 
          console.log(result);
          if(result.success) {
            $location.path('/');
          }
        });
      } 
      
    $scope.del = function() {
      Entry.delete({
          id:$routeParams.id
        },function(result) {
          console.log(result);            
          if(result.success) {        
              $location.path('/');
            }
          });
  		}; 
    
}

function UploadController($scope,Entry) {  
  $scope.limit = 50;

  //$scope.function_list = Entry.query({
  //  query:'{"type":"function_entry"}'
  //});
  
  //$scope.schemas = Entry.query({query:'{"type":"tb_schema"}'});

  
  self.message = function(message) {
    $scope.message = message;
    setTimeout(function() {      
      $scope.$apply(function() {
        $scope.message = null;
      });
    }, 3000);
  };
  
/*
  Entry.query(function(result) {
    var schema_list = result;
    var fields = {};
    $scope.field_list = [];
    angular.forEach(schema_list,function(schema,idx) {
      angular.forEach(schema.fields, function(field, i) { 
        if(!(field.name in fields)) {
          fields[field.name]=[];
        }
        if(fields[field.name].indexOf(field.title) == -1) {
          fields[field.name].push(field.title);
          $scope.field_list.push(field);
        }
      });
    });
  });
  */
  $('iframe#upload_target').load(function() {
    var contents = $('iframe#upload_target').contents();
    var data = $.parseJSON(contents.find("body")[0].innerHTML);
  
  if(data.success) {
    $scope.$apply(function(){
      $scope.success = true;
    });
  } else {
    $scope.$apply(function() {
      $scope.success = false;
      //$scope.message = data.message;
    });
  }
});

  $scope.setFile = function(element) {
    $scope.$apply(function() {
      $scope.success = true;
      $scope.theFile = element.files[0];
    });
  };

};

Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};
