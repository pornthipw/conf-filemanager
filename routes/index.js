var mongodb = require('mongodb');
var BSON = require('mongodb').pure().BSON;
var generic_pool = require('generic-pool');

//var mongo_con = require('mongo-connect');
//var config = require('../config');
//var mongo = mongo_con.Mongo(config.mongo_connect);

exports.uploadFile = function(req, res, next) {      
  var db = req.db;
  console.log("-->"+db);
  if(req.files.file) {          
    var gridStore = new mongo.GridStore(db, new mongo.ObjectID(),req.files.file.name, 'w', {content_type:req.files.file.type,metadata: {'title':req.body.title}});    
    gridStore.open(function(err, gridStore) {
      gridStore.writeFile(req.files.file.path, function(err, doc) {                
        if(err) {          
          res.send(JSON.stringify({'success':false}));            
        }

        gridStore.close(function(err, result) {
          if(err) {            
            res.send(JSON.stringify({'success':false}));             
          }
          console.log(JSON.stringify(result));
          //res.send(JSON.stringify({success:true, doc:result}));  
          res.send(JSON.stringify({'success':true,'csv':result}));                        
        });
      });
    });    
  }
};

