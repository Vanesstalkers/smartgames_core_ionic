async (collection, filter = {}) => {
  const mongoDb = db.mongo.db(config.mongodb.database);
  const coll = mongoDb.collection(collection);
  return await coll.findOne(filter);
};
