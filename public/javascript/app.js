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

  $routeProvider.when('/report', {
    controller:ReportController, 
    templateUrl:'static/report.html'
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

function ReportController($scope, Entry) {
  $scope.type = [];
  $scope.entry_list = Entry.query(function(response) {
    var dict_type = [];
    angular.forEach(response, function(entry) {
      if(dict_type.indexOf(entry.type) == -1) {
        $scope.type.push({'name':entry.type,'total':0,'sectors':[]});
        dict_type.push(entry.type);
      }
      
      angular.forEach($scope.type, function(e_t) {
        if(e_t.name == entry.type) {
          e_t.total+=1;
          var sector_exists = false;
          var sector_obj = null;
          angular.forEach(e_t.sectors, function(sector) {
            if(sector.name == entry.sector) { 
              sector_obj = sector;
              sector_exists = true;
              sector.count +=1;
            }
          });
          if(!sector_exists) {
            sector_obj = {'name':entry.sector,'count':1,'majors':[]};
            e_t.sectors.push(sector_obj);
          }
          var major_exists = false;
          angular.forEach(sector_obj.majors, function(major) {
            if(major.name == entry.major) { 
              major_exists = true;
              major.count +=1;
              major.entry_list.push(entry);
            }
          });
          if(!major_exists) {
            var major_obj = {'name':entry.major,'count':1};
            major_obj['entry_list'] = [];
            major_obj.entry_list.push(entry);
            sector_obj.majors.push(major_obj);
          }
        }
      });
    });
  });
}

function EntryListController($scope, Entry,$location) {
  $scope.entry_list = Entry.query(function(response) {
    angular.forEach(response, function(entry) {
      entry['paper_id'] = parseInt(entry.paper_id);
    });
  });
  $scope.currentPage = 0;
  $scope.page = 0;
  $scope.pageSize = 2;    
    
  $scope.numberOfPages=function() {
    if($scope.entry_list ) {        
      var totalPage = Math.ceil($scope.file_list.length/$scope.pageSize);               
      return totalPage;          
    }
  };     

  $scope.show_entry = function(id) {
    $location.path('/entry/info/'+id);
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
  
  $scope.rooms = [
    {name:'QS 4401 ชั้น  4', description:'', id:1, session:'การศึกษา'},
    {name:'QS 4201 ชั้น  2', description:'',id:2, session:'สุขภาพ 1'},
    {name:'QS 4202 ชั้น  2', description:'',id:3 , session:'สุขภาพ 2'},
    {name:'QS 4203 ชั้น  2', description:'', id:4, session:'สุข 4'},      
  ];
  
  /*
  Entry.query(function(response) {
      angular.forEach(response, function(entry) {        
      });
  });
  */
  /*
  $scope.group_date = [
    {name:'28 กุมภาพันธ์ 2556'},
    {name:'1 มีนาคม 2556'},
  ];
  
  $scope.group_time = [
    {name:'28 กุมภาพันธ์ 2556'},
    {name:'1 มีนาคม 2556'},
  ];
  */
  
  $scope.user = User.get(function(response) {
  var self = this;
  self.current_entry = null;  
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
            } else {
              if(result.error == 401) {
                $scope.message = 'You are not authorized to update content';
              }
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
