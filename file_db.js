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
      var file = req.files.file
      if(req.files.file) {          
        var gridStore = new mongodb.GridStore(db, 
            new mongodb.ObjectID(),
            file.name, 'w', {
              content_type:file.type,
              metadata: {'entry_id':req.body.entry}
            }
        );    
        gridStore.open(function(err, gridStore) {          
          if(err) {
            pool.release(db);
            res.send(JSON.stringify({'success':false,'message':err})); 
          } else {
            gridStore.writeFile(file.path, function(err, doc) { 
              if(err) { 
                pool.release(db);
                res.send(JSON.stringify({'success':false,'message':err})); 
              } else {
                gridStore.close(function(err, result) {
                  if(err) {  
                    pool.release(db);
                    res.send(JSON.stringify({'success':false}));    
                  } else {
                    pool.release(db);
                    res.send(JSON.stringify({success:true, doc:result}));  
                  }              
                });
              }
            });
          }
        });    
      }
    });     
  };
  
  this.getFile = function(req, res) {
    pool.acquire(function(err,db) {
      if(err) {
        console.log('Error :'+err);
      } else {
        if (req.params.id.length == 24) {
          try {
          fileid = new mongodb.ObjectID.createFromHexString(req.params.id);
          var gridStore = new mongodb.GridStore(db, fileid, 'r');
          gridStore.open(function(err, gs) {            
            gs.collection(function(err, collection) {
              collection.find({_id:fileid}).toArray(function(err,docs) {                        pool.release(db);
                var doc = docs[0];                
                var stream = gs.stream(true);
                res.set('Content-type',doc.contentType);                                
                res.set('Content-Disposition', 'attachment;filename='+doc.filename);                
                stream.on("data", function(chunk) {
                  res.write(chunk);
                });
                stream.on("end", function() {
                  res.end();
                });
              });
            });
          });
        } catch (err) {
          pool.release(db);
         }
       }    
     }
    });
  };
  
  
  this.deleteFile = function(req, res) {
    pool.acquire(function(err,db) {
      if(err) {
        console.log('Error :'+err);
      } else {
        if(req.params.id.length == 24) {
         try {
           fileid  = new mongodb.ObjectID.createFromHexString(req.params.id);
           mongodb.GridStore.exist(db, fileid , function(err, exist) {   
             if(exist) {
               var gridStore = new mongodb.GridStore(db, fileid , 'w');
               gridStore.open(function(err, gs) {            
                 gs.unlink(function(err, result) { 
                   if(!err) {                              
                     pool.release(db);
                     res.send(JSON.stringify({'message':req.params.id}));
                   } else {
                     pool.release(db);
                     res.send(JSON.stringify({'message':'Error'}));
                   }
                 });                        
               });
             } else {
               pool.release(db);
               console.log(fileid  +' does not exists');
               res.send(JSON.stringify({'message':'Error'}));
             }
           });
          } catch (err) {
             pool.release(db);
             res.send(JSON.stringify({'message':'Error'}));
          }
        }
      }
    });
  };    
};

exports.filemanagerdb = FileManagerDb;
