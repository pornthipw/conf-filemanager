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
  
  $routeProvider.when('/entry/create', {
    controller:EntryCreateController, 
    templateUrl:'static/entry/entry_form.html'
  });
  
  $routeProvider.when('/entry/info/:id', {
    controller:EntryViewController, 
    templateUrl:'static/entry/entry_info.html'
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
  $scope.currentPage = 0;
  $scope.page = 0;
  $scope.pageSize = 2;    
    
  $scope.numberOfPages=function() {
    if($scope.entry_list ) {        
      var totalPage = Math.ceil($scope.file_list.length/$scope.pageSize);               
      return totalPage;          
    }
  };     
  
}

function EntryCreateController($scope, Entry,$location, $routeParams,User, Logout) {
  $scope.user = User.get(function(response) {
    if (response.user ||$scope.user ) {
      $scope.entry = {};
      $scope.save = function() {
        Entry.save({}, $scope.entry, function(result) {
          console.log(result);
          $location.path('/');
        });
      }; 
    }
  });
}

function EntryViewController($scope, Entry, $location, $routeParams,User, Logout,FileDB,GridDB) {
$scope.user = User.get(function(response) {
  if (response.user ||$scope.user ) {
    Entry.get({id:$routeParams.id},function(response) {
      $scope.entry = response;        
      var query_obj = {"metadata":{"entry_id":$scope.entry._id}};  
      $scope.file_list = FileDB.query({query:JSON.stringify(query_obj)},function(res) {
        //console.log(res);
      });
    });
    
  $scope.limit = 50;
  
    self.message = function(message) {
      $scope.message = message;
      setTimeout(function() {      
        $scope.$apply(function() {
          $scope.message = null;
        });
      }, 3000);
    };
    
    $scope.entry_id = $routeParams.id;
    
    $('iframe#upload_target').load(function() {
      var contents = $('iframe#upload_target').contents();
      var data = $.parseJSON(contents.find("body")[0].innerHTML);
      if(data.success) {
        $scope.$apply(function(){
          $scope.success = true;
          var query_obj1 = {"metadata":{"entry_id":$scope.entry._id}};
            $scope.file_list = FileDB.query({query:JSON.stringify(query_obj1)},function(res) {
              if(res){
                $scope.theFile=null;
                }
          });
        });
      } else {
        $scope.$apply(function() {
          $scope.success = false;
          $scope.message = data.message;
        });
      }
       
    });
    
    $scope.setFile = function(element) {
      $scope.$apply(function() {
        $scope.success = true;
        $scope.theFile = element.files[0];
      });
    };
    
      $scope.del = function(id) {	
      GridDB.remove({id:id}, function(docs) {	  	
          var query_obj2 = {"metadata":{"entry_id":$scope.entry._id}};
            $scope.file_list = FileDB.query({query:JSON.stringify(query_obj2)},function(res) {
          });    
      });   
    }; 
    
    $scope.edit_entry = function () {
        $location.path('/entry/edit/'+$scope.entry._id);
      };
    }
  });
}

function EntryController($scope, Entry, $location, $routeParams,User, Logout,FileDB) {
  $scope.user = User.get(function(response) {
  if (response.user ||$scope.user ) {
      Entry.get({id:$routeParams.id},function(response) {
        $scope.entry = response;        
        var query_obj = {"metadata":{"entry_id":response._id}};
        console.log(query_obj);  
        $scope.file_list = FileDB.query({query:JSON.stringify(query_obj)},function(res) {
          console.log(res);
        });
      
      });
      
    
      $scope.save = function () { 
        Entry.update({
          id:$scope.entry._id
        },angular.extend({}, 
          $scope.entry,{_id:undefined}),
          function(result) {      
            if(result.success) {
              $location.path('/entry/info/'+$scope.entry._id);          
            }
          });
        } 
          
        $scope.del = function() {
          Entry.delete({
            id:$scope.entry._id
          },function(result) {
            if(result.success) {        
              $location.path('/');
            }
          });
        }; 
    }
  });
  
  $scope.view_info = function() {
    $location.path('/entry/info/'+$scope.entry._id);
  };
}


Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};
