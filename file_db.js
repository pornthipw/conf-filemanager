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
          pool.release(db);
          gridStore.writeFile(file.path, function(err, doc) { 
            if(err) { 

              res.send(JSON.stringify({'success':false,'message':err})); 

            }
            gridStore.close(function(err, result) {
              if(err) {  

                res.send(JSON.stringify({'success':false}));    
              }
              res.send(JSON.stringify({success:true, doc:result}));  

            });
          });
        });    
      }
    });     
  };
  
  this.getFile = function(req, res) {
    pool.acquire(function(err,db) {
      if(err) {
        console.log('Error :'+err);
      }
      if (req.params.id.length == 24) {
      //Convert id string to mongodb object ID
        try {
          fileid = new mongodb.ObjectID.createFromHexString(req.params.id);
          var gridStore = new mongodb.GridStore(db, fileid, 'r');
          gridStore.open(function(err, gs) {
            pool.release(db);
            gs.collection(function(err, collection) {
              collection.find({_id:fileid}).toArray(function(err,docs) {
                var doc = docs[0];
                console.log(doc.filename);
                var stream = gs.stream(true);
                res.setHeader('Content-dispostion', 'attachment;filename='+doc.filename);
                res.setHeader('Content-type',doc.contentType);
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
          }

      }    
      console.log('getFile '+req.params.id);
    });
  };
  
  
  this.deleteFile = function(req, res) {
    pool.acquire(function(err,db) {
      if(err) {
        console.log('Error :'+err);
      }
      console.log('deleteFile '+req.params.id);
      if (req.params.id.length == 24) {
          try {
              fileid  = new mongodb.ObjectID.createFromHexString(req.params.id);
              mongodb.GridStore.exist(db, fileid , function(err, exist) {   
                  if(exist) {
                      var gridStore = new mongodb.GridStore(db, fileid , 'w');
                      gridStore.open(function(err, gs) {  
                          pool.release(db);                      
                          gs.unlink(function(err, result) { 
                              if(!err) {                              
                                  //res.json({'delete':req.params.id}); 
                                  res.send(JSON.stringify({'message':req.params.id}));   
                                  //client.close();                                        
                              } else {
                                  console.log(err);
                              }
                          });                        
                      });//gridStore.open()
                  } else {
                      console.log(fileid  +' does not exists');
                  }
              });
          } catch (err) {
              console.log(err);
          }
      }
    });
  };
  
  
};

exports.filemanagerdb = FileManagerDb;
