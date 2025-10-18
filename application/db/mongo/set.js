async (collection, document, filter = null) => {
  const mongoDb = db.mongo.db(config.mongodb.database);
  const coll = mongoDb.collection(collection);
  
  if (filter) {
    return await coll.updateOne(filter, { $set: document }, { upsert: true });
  } else {
    return await coll.insertOne(document);
  }
};
