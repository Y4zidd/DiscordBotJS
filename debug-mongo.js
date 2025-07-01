// debug-mongo.js
// Debug koneksi MongoDB Atlas tanpa Prisma, langsung pakai driver mongodb

const { MongoClient } = require('mongodb');
require('dotenv').config();

const url = process.env.DATABASE_URL;

async function main() {
  try {
    console.log('Mencoba koneksi ke MongoDB Atlas...');
    const client = new MongoClient(url, { serverSelectionTimeoutMS: 10000 });
    await client.connect();
    console.log('✅ Berhasil terhubung ke MongoDB Atlas!');
    const dbs = await client.db().admin().listDatabases();
    console.log('Database yang tersedia:', dbs.databases.map(db => db.name));
    await client.close();
  } catch (err) {
    console.error('❌ Gagal konek ke MongoDB Atlas!');
    console.error(err);
  }
}

main();
