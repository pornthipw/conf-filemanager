var mongodb = require('mongodb');
var BSON = require('mongodb').pure().BSON;
var generic_pool = require('generic-pool');

var FileManagerDb = function(config) {  
  var pool = generic_pool.Pool({
    name: 'mongodb',
    max: 2,
    create: function(callback) {
      new mongodb.Db(config.db, 
        new mongodb.Server(config.host, config.port),
        {safe:true, auto_reconnect:true
      }).open(function(err,db) {
        if(err) {
          console.log(err);
        }
        callback(err,db);
      });
    },
    destroy: function(db) {
      db.close();
    }
  });

  this.uploadFile = function(req, res) { 
    pool.acquire(function(err,db) {
      if(err) {
        console.log('Error :'+err);
      }
      if(req.files.file) {          
        var gridStore = new mongodb.GridStore(db, new mongodb.ObjectID(),req.files.file.name, 'w', {content_type:req.files.file.type,metadata: {'title':req.body.title}});    
        gridStore.open(function(err, gridStore) {
          gridStore.writeFile(req.files.file.path, function(err, doc) {                
            if(err) {          
              //res.send(JSON.stringify({'success':false})); 
              res.json({'success':false,'message':err});  
                       
            }
    
            gridStore.close(function(err, result) {
              if(err) {            
                //res.send(JSON.stringify({'success':false}));    
                res.json({'success':false,'message':err});         
              }
              console.log(JSON.stringify(result));
              //res.send(JSON.stringify({success:true, doc:result}));  
              //res.send(JSON.stringify({'success':true,'csv':result})); 
              res.json({'success':true, 'message':result});                       
            });
          });
        });    
      }
    });     
  };
};

exports.filemanagerdb = FileManagerDb;
