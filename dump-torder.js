const { MongoClient, BSON } = require('mongodb');
const fs = require('fs');
const path = require('path');

const OUT_DIR = 'C:\\Users\\campe\\Desktop\\torder-dump';

async function main() {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  const db = client.db('torder');
  const collections = await db.listCollections().toArray();

  let totalDocs = 0;
  for (const col of collections) {
    const name = col.name;
    const docs = await db.collection(name).find({}).toArray();
    const outPath = path.join(OUT_DIR, name + '.json');
    fs.writeFileSync(outPath, JSON.stringify(docs, null, 0), 'utf8');
    console.log('  dumped: ' + name + ' | ' + docs.length + ' docs → ' + outPath);
    totalDocs += docs.length;
  }

  console.log('\nНийт: ' + collections.length + ' collection, ' + totalDocs + ' бичлэг');
  await client.close();
}

main().catch(e => { console.error(e); process.exit(1); });
