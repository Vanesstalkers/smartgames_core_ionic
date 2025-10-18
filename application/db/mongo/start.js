async () => {
  if (application.worker.id === 'W1') {
    console.debug('Connect to mongo');
  }
  const { MongoClient } = npm.mongodb;
  const mongoConfig = { ...config.mongodb, console };
  
  const uri = `mongodb://${mongoConfig.host}:${mongoConfig.port}/${mongoConfig.database}`;
  db.mongo = new MongoClient(uri);
  await db.mongo.connect();
  
  console.log('Connected to MongoDB');
};
