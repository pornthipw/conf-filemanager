//Add routes from other files

var csv = require('ya-csv');
var util = require('../utils');
var fs = require('fs');

function csv_parser(req, res, filepath) {
  var content = [];
  try {
   var reader = csv.createCsvFileReader(filepath);
   reader.addListener('data', function(data) {
     var list = [];
     for(var col=0;col<data.length;col++) {
      list.push({'value':data[col]});
     }
     content.push(list);
   });
    
   reader.addListener('error', function() {
     res.send(JSON.stringify({'success':false}));
   });

   reader.addListener('end', function() {
     res.send(JSON.stringify({'success':true,'csv':content}));
   });
  } catch(err) {
    res.send(JSON.stringify({'success':false}));
  }
}

exports.uploadFile = function(req, res) {
  if(req.files.file) {
    if(req.body.cp874) {
      fs.readFile(req.files.file.path, function(err, data) {
        util.cp874_to_utf8(data, function(utftext) {
          fs.writeFile(req.files.file.path+'_utf8', utftext, function(err) {
            csv_parser(req, res, req.files.file.path+'_utf8');
          });
        });
      });
    } else {
      csv_parser(req, res, req.files.file.path);
    }
  }
}
