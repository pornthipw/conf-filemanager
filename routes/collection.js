var config = require('../config');

exports.viewCollection = function(req, res, next) {
  var limit = config.options.documentsPerPage;
  //var skip = parseInt(req, query, skip, 10) || 0;
  var query_option = {
    limit: limit,
    //skip: skip
  };

  req.collection.find({},
  query_option).toArray(function(err, items) {
    req.collection.stats(function(err, stats) {
      var docs = [];

      var ctx = {
        title: req.collectionName,
        docs: docs,
        stats: stats,
        documents: items
      };
      res.json(ctx);
    });
  });
};

exports.addCollection = function(req, res, next) {
  var name = req.params.collection;

  if (name === undefined || name.length == 0) {
    req.session.error = "You forgot to enter a collection name!";
    res.json({
      success: false
    });
  }

  //Collection names must begin with a letter or underscore, and can contain only letters, underscores, numbers or dots
  if (!name.match(/^[a-zA-Z_][a-zA-Z0-9\._]*$/)) {
    req.session.error = "That collection name is invalid.";
    res.json({
      success: false
    });

  }

  req.db.createCollection(name, function(err, collection) {
    if (err) {
      req.session.error = "Something went wrong: " + err;
      console.error(err);
      res.json({
        success: false,
        message: err
      });
    }

    req.updateCollections(req.db, req.dbName, function() {
      res.json({
        success: true
      });
    });
  });
};

exports.deleteCollection = function(req, res, next) {
  var name = req.params.collection;
  req.collection.drop(function(err, result) {
    if (err) {
      //req.session.error = "Something went wrong: " + err;
      console.error(err);
      res.json({
        success: false,
        message: err
      });
    }
    //If delete was successful, result === true
    req.updateCollections(req.db, req.dbName, function(err) {
      if (err) {
        //req.session.error = "Something went wrong: " + err;
        console.error(err);
        res.json({
          success: false,
          message: err
        });
      }
      console.log('dbname ' + req.dbName);
      //req.session.success = "Collection  '" + req.collectionName + "' deleted!";
      console.log("Collection  '" + req.collectionName + "' deleted!");
      console.log(" redirect to (" + "/db/" + req.dbName + ")");
      res.json({
        success: true
      });

    });
  });
};

exports.renameCollection = function(req, res, next) {
  var name = req.body.rename_collection;
  console.log(name);

  if (name == undefined || name.length == 0) {
    res.json({
      success: false
    });
  }

  if (!name.match(/^[a-zA-Z_][a-zA-Z0-9\._]*$/)) {
    res.json({
      success: false
    });
  }

  req.collection.rename(name, function(err, collection) {
    if (err) {
      console.error(err);
      res.json({
        success: false
      });
    }

    req.updateCollections(req.db, req.dbName, function(err) {
      if (err) {
        res.json({
          success: false
        });
      }
      res.json({
        success: true
      });
    });
  });
};
