exports.viewDatabase = function(req, res) {
  var colls = null;
  for (var obj in req.collections) {
    if (req.collections[obj].db_name == req.dbName) {
      colls = req.collections[obj];
      break;
    }
  }
  req.db.stats(function(err, stats) {
    if(!err) {
      colls['stats']=stats;
    }
    res.json(colls);
  });
}

exports.dropDatabase = function(req, res) {
  req.db.dropDatabase(function(err, result) {
    if(!err) {
      req.db.admin(function(err, admin) {
        req.updateDatabases(admin);
        res.json(result);
      });
    } else {
      res.json(err);
    }
  });
}
