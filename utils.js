exports.parseCollectionName = function parseCollectionName(full_name) {
  var coll_parts = full_name.split('.');

  if (coll_parts.length <= 1) {
    console.error('Cannot parse collection name!');
  }

  var database = coll_parts.splice(0,1);
  return { name: coll_parts.join('.'), database: database.toString() };
};


exports.cp874_to_utf8 = function cp874_to_utf8(buf,callback) {
  var utftext = new Buffer(buf.length*3);
  var idx = 0;
  for(var n=0;n<buf.length;n++) {
    var c = buf.readUInt8(n);
    if(c < 0x7f) {
      utftext.writeUInt8(c,idx++);
    } else {
      switch(c) { 
       case 0x80:
        utftext.writeUInt8(0xe2,idx++);
        utftext.writeUInt8(0x82,idx++);
        utftext.writeUInt8(0xac,idx++);
        break;
       case 0x85:
        utftext.writeUInt8(0xe2,idx++);
        utftext.writeUInt8(0x80,idx++);
        utftext.writeUInt8(0xa6,idx++);
        break;
       case 0x91:
        utftext.writeUInt8(0xe2,idx++);
        utftext.writeUInt8(0x80,idx++);
        utftext.writeUInt8(0x98,idx++);
        break;
       case 0x92:
        utftext.writeUInt8(0xe2,idx++);
        utftext.writeUInt8(0x80,idx++);
        utftext.writeUInt8(0x99,idx++);
        break;
       case 0x93:
        utftext.writeUInt8(0xe2,idx++);
        utftext.writeUInt8(0x80,idx++);
        utftext.writeUInt8(0x9c,idx++);
        break;
       case 0x94:
        utftext.writeUInt8(0xe2,idx++);
        utftext.writeUInt8(0x80,idx++);
        utftext.writeUInt8(0x9d,idx++);
        break;
       case 0x95:
        utftext.writeUInt8(0xe2,idx++);
        utftext.writeUInt8(0x80,idx++);
        utftext.writeUInt8(0xa2,idx++);
        break;
       case 0x96:
        utftext.writeUInt8(0xe2,idx++);
        utftext.writeUInt8(0x80,idx++);
        utftext.writeUInt8(0x93,idx++);
        break;
       case 0x97:
        utftext.writeUInt8(0xe2,idx++);
        utftext.writeUInt8(0x80,idx++);
        utftext.writeUInt8(0x94,idx++);
        break;
       case 0xa0:
        utftext.writeUInt8(0xc2,idx++);
        utftext.writeUInt8(0xa0,idx++);
        break;
       default:
        var tmp = (0x0e<<8)+(c - 0xa0);
        utftext.writeUInt8((tmp >> 12) | 224,idx++);
        utftext.writeUInt8((tmp >> 6) & 63 | 128,idx++);
        utftext.writeUInt8((tmp & 63) | 128,idx++);
      }
    }
  }
  utftext = utftext.slice(0,idx);
  callback(utftext.toString());
};
