var app = angular.module('conf_file', [
  'mongo_service','$strap.directives']);

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

  $routeProvider.when('/file', {
    controller:FileListController, 
    templateUrl:'static/file_list.html'
  });
  
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
  
  $routeProvider.when('/room', {
    controller:RoomController, 
    templateUrl:'static/room/room.html'
  });

  $routeProvider.when('/report', {
    controller:ReportController, 
    templateUrl:'static/report.html'
  });
  
  $routeProvider.when('/schedule', {
    controller:ScheduleController, 
    templateUrl:'static/schedule.html'
  });
  
  $routeProvider.when('/author', {
    controller:AuthorController, 
    templateUrl:'static/author/author.html'
  });
  
  $routeProvider.when('/', {
    controller:EntryListController, 
    templateUrl:'static/index.html'
  });
});

function FileListController($scope,FileDB,Entry) {
  $scope.limit = 10;
  $scope.file_list = FileDB.query(function(res){ 
    $scope.totalPage = Math.ceil(res.length/$scope.limit);
    angular.forEach(res,function(file) {
      if(file.metadata.entry_id) {
        Entry.get({id:file.metadata.entry_id},function(entry) {
          file.entry = entry;
          angular.forEach(entry.files, function(e_file) {
            if(e_file._id == file._id) {
              file.presentation = e_file.presentation;
            }
          });
        });
      }
    });
  });
};

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

function AuthorController($scope, Entry, User, Logout) {
   $scope.author_list = Entry.query(function(response) {
    angular.forEach(response, function(entry) {
      entry['paper_id'] = parseInt(entry.paper_id);
    });
  });
}

function ScheduleController($scope, Room, Entry,User, Logout) {
  var date_tmp = [];
  
 $scope.export_data = function() {
    var result = '';
    angular.forEach($scope.room_list, function(room) {
      angular.forEach(room.paper_list, function(paper) {
        var p_id = parseInt(paper.paper_id);
        var p_str = ''+p_id;
        if(p_id < 10) {
          p_str = '00'+p_id;
        } else {
          if(p_id < 100) {
            p_str = '0'+p_id;
          }
        }
        var author_str = paper.author + '\t' + paper.university;
        if(paper.author_list) {
          author_str = paper.author_list[0].name +'\t'
              + paper.author_list[0].affiliation 
           
        }
        result += room.date + '\t'
              + room.name + '\t'
              + room.description+'\t'
              + paper.start +'\t'
              + paper.end +'\t'
              + paper.type.type+'-'+paper.sector.type+p_str+'\t'
              + paper.title +'\t'
              + author_str
              +'\n';
      });
    });

    var dataUrl = 'data:text/csv;charset=utf-8,'+encodeURI(result);
    var link = document.createElement('a');
    var link_e = angular.element(link);
    link_e.attr('href',dataUrl);
    link_e.attr('download','conf.csv');
    link.click();
  };

 
  $scope.date_list = [];
  $scope.selected_room = null;
  $scope.room_list = Room.query(function(r_list) {
    angular.forEach(r_list, function(room) {            
      if(date_tmp.indexOf(room.date)==-1 && date_tmp.indexOf(room.description)==-1) {        
        if(!room.date) {           
          room.date = room.description;
        } 
        date_tmp.push(room.date);         
        $scope.date_list.push({'date':room.date,'room_list':[]});        
      }
      angular.forEach($scope.date_list, function(obj) {
        if(obj.date == room.date) {
          obj.room_list.push(room);
          obj.room_list.sort(function(a, b) {            
            if(a.name < b.name) {
              return -1;
            }
            if(a.name > b.name) {
              return 1;
            }
            return 0;
          });
          if(!$scope.selected_room) {
            $scope.selected_room = room;
          }
        }
      });
    });        
        
  });  
  
  $scope.select_room = function(r) {
    $scope.selected_room = r;
  }  
};


function RoomController($scope, Room, Entry,User, Logout) {
  var self = this;
  self.message = function(message) {
      $scope.message = message;
      setTimeout(function() {      
        $scope.$apply(function() {
          $scope.message = null;
        });
      }, 3000);
  };

  self.padStr = function(i) {
    return (i<10)?"0"+i:""+i;
  }

  self.calculate_ts = function(room) {
    room.paper_list.sort(function(a,b) {
      return a.paper_id - b.paper_id;
    });
    if(room.date) {
      var dateParts = room.date.split("/");
      var d = new Date(dateParts[2],(dateParts[1]-1),dateParts[0]);
      if(room.start_time) {
        var c_time = room.start_time;
        angular.forEach(room.paper_list, function(paper) {
          var time = c_time.match(/(\d+)(?::(\d\d))?\s*(p?)/);
          paper['start'] = c_time;
          d.setHours(parseInt(time[1]) + (time[3] ? 12 : 0) );
          d.setMinutes(parseInt(time[2]) || 0 );
          d.setTime(d.getTime()+1000*60*parseInt(room.time_slot));
          c_time = self.padStr(d.getHours())+':'+
                   self.padStr((d.getMinutes()));
          paper['end'] = c_time;
        });
      }
    }
  };
  
  self.update_paper = function() {
   Room.query(function(room_list) {
     $scope.entry_list = Entry.query(function(response) {
       angular.forEach(response, function(entry) {
         entry['paper_id'] = parseInt(entry.paper_id);
         angular.forEach(room_list, function(room) {
           angular.forEach(room.paper_list, function(paper) {
             if(entry._id == paper._id) {
               entry.selected = true;
             }
           });
         });
       });
     });
   });
  };  
    
  $scope.create = function () {
    Room.save({}, {name:'New Room'}, function(result) { 
      $scope.room_list = Room.query(); 
      self.message("You are create to new room");  
      if (!result.succcess) { 
        if(result.error == 401) {
           self.message("You are not authorized to update content");  
        }
      }
    });
  };

  $scope.room_list = Room.query();    
  
  $scope.select_room = function (r){
    $scope.room = r;    
    self.update_paper();
  };
  
  $scope.remove_paper = function(paper) {
    var paper_idx = $scope.room.paper_list.indexOf(paper);
    $scope.room.paper_list.remove(paper_idx);
    angular.forEach($scope.entry_list, function(entry) {
      if(entry._id == paper._id) {
        entry.selected=false;
      }
    });
    self.calculate_ts($scope.room);
    Room.update({id:$scope.room._id},angular.extend({}, 
      $scope.room,{_id:undefined}), function(response) {
    });                  
  };


      
  $scope.add_paper = function(entry) {        
    if(!$scope.room['paper_list']) {
      $scope.room['paper_list'] = [];
    }
    $scope.room['paper_list'].push(entry);
    self.calculate_ts($scope.room);
    Room.update({id:$scope.room._id},angular.extend({}, $scope.room,{_id:undefined}), function(response) {
      if (!response.success) {
        if(response.error == 401) {
          self.message("You are not authorized to update content");
        }
      }
    });                  
  };
  
  $scope.save = function() {
    Room.update({id:$scope.room._id},angular.extend({}, 
      $scope.room,{_id:undefined}),
      function(result) {     
        if(!result.success) {
          self.message("You are not success");   
        }
    }); 
  }; 
  
  $scope.delete = function() {
    Room.delete({
      id:$scope.room._id
    },function(result) {
      if(result.success) {        
        $scope.room = null;
        $scope.room_list = Room.query();    
      } else {
         if(response.error == 401) {
          self.message("You are not authorized to update content");
        }
      }
    });
  }
}

function ReportController($scope, Entry) {
  $scope.type = [];
  var query_obj = {$or:[{cancel:{$exists:false}},{cancel:false}]};
  $scope.entry_list = Entry.query({query:JSON.stringify(query_obj)},
    function(response) {
    var dict_type = [];
    angular.forEach(response, function(entry) {
      if(entry.type.title) {
        if(dict_type.indexOf(entry.type.title) == -1) {
          $scope.type.push({'name':entry.type.title,'total':0,'sectors':[]});
          dict_type.push(entry.type.title);
        }
      } 
      angular.forEach($scope.type, function(e_t) {
        if(e_t.name == entry.type.title) {
          e_t.total+=1;
          var sector_exists = false;
          var sector_obj = null;
          angular.forEach(e_t.sectors, function(sector) {
            if(sector.name == entry.sector.title) { 
              sector_obj = sector;
              sector_exists = true;
              sector.count +=1;
            }
          });
          if(!sector_exists) {
            sector_obj = {'name':entry.sector.title,'count':1,'majors':[]};
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

function EntryListController($scope, Entry,$location,Room) {
  /*
      Room.query(function(room_list) {
        angular.forEach(room_list, function(room) {
          angular.forEach(room.paper_list, function(paper) {
            Entry.get({id:paper._id}, function(entry) {
              paper['sector']=entry['sector'];
              Room.update({id:room._id},
               angular.extend({},room,{_id:undefined})); 
              });
            });
          });
      });
  */
  $scope.entry_list = Entry.query(function(response) {
    angular.forEach(response, function(entry) {
      /*
      if(entry.type.type == 'P') {
        entry.type = {type:'P',title:'การนำเสนอแบบโปสเตอร์'};
        Entry.update({id:entry._id},angular.extend({}, 
          entry,{_id:undefined}), function(res) {      
        });
      }
      */

      entry['paper_id'] = parseInt(entry.paper_id);
    });
  });


  $scope.test = function() {
    var result = '';
    angular.forEach($scope.entry_list, function(entry) {
      result += entry.paper_id + ','
              + entry.type +','
              + entry.author +','
              + entry.university 
              +'\n';
    });

    var dataUrl = 'data:text/csv;charset=utf-8,'+encodeURI(result);
    var link = document.createElement('a');
    var link_e = angular.element(link);
    link_e.attr('href',dataUrl);
    link_e.attr('download','conf.csv');
    link.click();
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

function EntryViewController($scope, Entry, $location, $routeParams,User, Logout,FileDB,GridDB,Room) {
  
  $scope.update_present = function() {    
    $scope.entry['files'] = [];
    
    angular.forEach($scope.file_list, function(file) {
      $scope.entry['files'].push(file);
    });
    
    Entry.update({id:$scope.entry._id},angular.extend({}, $scope.entry,{_id:undefined,room_rel:undefined,paper_rel:undefined}),
      function(result) {      
        if(result.success) {          
          Room.query(function(room_list) {
            angular.forEach(room_list, function(room) {
              angular.forEach(room.paper_list, function(paper) {
                if(paper._id == $scope.entry._id) {
                  angular.extend(paper,$scope.entry, {room_rel:undefined,paper_rel:undefined});
                  Room.update({id:room._id},
                    angular.extend({},room,{_id:undefined})); 
                }
              });
            });
          });          
        } else {
          if(result.error == 401) {
            self.message("You are not authorized to update content");  
          }
        }    
    });
  };
  
  $scope.user = User.get(function(response) {
    if (response.user ||$scope.user ) {
      Entry.get({id:$routeParams.id},function(response) {
        $scope.entry = response;        
        
        Room.query(function(room_list) {
          angular.forEach(room_list,function(room) {
            if(!$scope.entry.room_rel) {
            angular.forEach(room.paper_list,function(paper) {
              if(paper._id == $scope.entry._id) {
                $scope.entry.room_rel = room;
                $scope.entry.paper_rel = paper;
              }
            });
            }
          });
        });
        
        var query_obj = {"metadata":{"entry_id":$scope.entry._id}};  
        $scope.file_list = FileDB.query({query:JSON.stringify(query_obj)}, function(res) {          
          angular.forEach($scope.entry.files, function(e_file) {
            angular.forEach(res, function(file) {
              if(e_file._id == file._id) {
                file.presentation = e_file.presentation;
              }
            });
          });
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

function EntryController($scope, Entry, $location, $routeParams,User, Logout,FileDB,Room) {
  
  $scope.types = [
    {type:'O',title:'การนำเสนอแบบบรรยาย'},
    {type:'P',title:'การนำเสนอแบบโปสเตอร์'}
  ];
  
  $scope.sectors = [
    {type:'HS',title:'วิทยาศาสตร์สุขภาพ'},
    {type:'ST',title:'วิทยาศาสตร์และเทคโนโลยี'},
    {type:'SS',title:'สังคมศาสตร์'}
  ];
  
  

  var self = this;
  self.message = function(message) {
      $scope.message = message;
      setTimeout(function() {      
        $scope.$apply(function() {
          $scope.message = null;
        });
      }, 3000);
  };

  $scope.init_author = function(entry) {
    if(!entry.author_list) {
      entry.author_list = [];
    }
    entry.author_list.push({});
  }

  $scope.add_author = function(entry) {
    if(!entry.author_list) {
      entry.author_list = [];
    }
    entry.author_list.push({});
  }

  $scope.remove_author = function(entry,index) {
    entry.author_list.remove(index,1);
  }

  $scope.user = User.get(function(response) {
    if (response.user ||$scope.user ) {
      Entry.get({id:$routeParams.id},function(response) {
        $scope.entry = response;        
        var query_obj = {"metadata":{"entry_id":response._id}};
        $scope.file_list = FileDB.query({query:JSON.stringify(query_obj)});
      });
      
      $scope.save = function () { 
        Entry.update({
          id:$scope.entry._id
        },angular.extend({}, 
          $scope.entry,{_id:undefined}),
          function(result) {      
            if(result.success) {
              Room.query(function(room_list) {
                angular.forEach(room_list, function(room) {
                  angular.forEach(room.paper_list, function(paper) {
                    if(paper._id == $scope.entry._id) {
                      angular.extend(paper,$scope.entry);
                      Room.update({id:room._id},
                        angular.extend({},room,{_id:undefined})); 
                    }
                  });
                });
              });
              $location.path('/entry/info/'+$scope.entry._id);          
            } else {
              if(result.error == 401) {
                self.message("You are not authorized to update content");  
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
