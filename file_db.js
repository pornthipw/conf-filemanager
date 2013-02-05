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
              //res.json({'success':false,'message':err});  
              pool.release(db);
              res.send(JSON.stringify({'success':false,'message':err})); 
                       
            }
    
            gridStore.close(function(err, result) {
              if(err) {            
                //res.send(JSON.stringify({'success':false}));    
                //res.json({'success':false,'message':err});
                pool.release(db);
                res.send(JSON.stringify({'success':false,'message':err}));          
              }
              console.log(JSON.stringify(result));
              pool.release(db);
              res.send(JSON.stringify({'success':true, 'data':result}));  
              //res.send(JSON.stringify({'success':true,'csv':result})); 
              //res.json({'success':true, 'message':result});                       
            });
          });
        });    
      }
    });     
  };
  
  this.listFile = function(req, res) {  
    pool.acquire(function(err,db) {
      if(err) {
        console.log('Error :'+err);
      }
      // req.params [year, element, type, item]  
      db.collection('fs.files', function(err, collection) {
        if(err) {            
          console.log("Error :"+err);
          //res.json({success:false,message:err}); 
          //res.json({'success':false,'message':err});
          pool.release(db);
          res.send(JSON.stringify({'success':false,'message':err}));                
        }
        
        collection.find().toArray(function(err, docs) {
            if(err) {
              //res.json({success:false,message:err}); 
              //res.json({'success':false,'message':err});
              pool.release(db);  
              res.send(JSON.stringify({'success':false,'message':err}));              
            }
            pool.release(db);
            res.send(JSON.stringify({'success':true, 'data':docs}));
            //console.log(docs);
            //res.json({'success':true, 'message':docs}); 
            //res.json(docs); 
            //res.json({success:true,doc:docs});           
        });            
      }); 
    });
  };
  
  /*this.getFile = function(req, res) {
    pool.acquire(function(err,db) {
      if(err) {
        console.log('Error :'+err);
      }
      if (req.params.file.length == 24) {
      //Convert id string to mongodb object ID
      try {
        id = new mongodb.ObjectID.createFromHexString(req.params.file);
        var gridStore = new mongodb.GridStore(db, id, 'r');
        gridStore.open(function(err, gs) {
          gs.collection(function(err, collection) {
            collection.find({_id:id}).toArray(function(err,docs) {
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
      console.log('getFile '+req.params.file);
    });
  };*/
  
};

exports.filemanagerdb = FileManagerDb;
