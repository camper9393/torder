// EJSON dump — preserves ObjectId / Date types so VPS restore keeps correct types
const { MongoClient } = require("mongodb");
const { EJSON } = require("bson");
const fs = require("fs");
const path = require("path");

const OUT_DIR = "C:\\Users\\campe\\Desktop\\torder-ejson";

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const client = new MongoClient("mongodb://127.0.0.1:27017");
  await client.connect();
  const db = client.db("torder");
  const cols = await db.listCollections().toArray();

  let total = 0;
  for (const c of cols) {
    const docs = await db.collection(c.name).find({}).toArray();
    // EJSON.stringify keeps {$oid:...},{$date:...} so types survive the round-trip
    fs.writeFileSync(
      path.join(OUT_DIR, c.name + ".ejson"),
      EJSON.stringify(docs),
      "utf8"
    );
    console.log("  dumped:", c.name, "|", docs.length, "docs");
    total += docs.length;
  }
  console.log("\nНийт:", cols.length, "collection,", total, "бичлэг");
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
