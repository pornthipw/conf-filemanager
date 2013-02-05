module.exports = {
  mongo_connect: {
    host: 'localhost',    
    port: 27017,
    db: 'test',
  },
  upload: {
    mongodb:{
     host: 'localhost',
     port: 27017,
     db: 'conf_file',
     autoReconnect: true,
     poolSize: 4
    }
  },
  authorization: {
    mongodb:{
     host: 'localhost',    
     port: 27017,
     db: 'test',
     collection_name: 'nook_ac_1',
     autoReconnect: true,
     poolSize: 4
    }
  },
   upload: {
    mongodb:{
     host: 'localhost',
     port: 27017,
     db: 'conf_file',
     //collection_name: 'nook_ac_1',
     autoReconnect: true,
     poolSize: 4
    }
  },
  site: {
    baseUrl: 'http://localhost:9011/',
    port: 9011,
    cookieSecret: 'cookiesecret',
    sessionSecret: 'sessionsecret'
  }
};
