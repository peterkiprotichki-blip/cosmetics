const mongoose = require('mongoose');

(async () => {
  const conn = await mongoose
    .createConnection(
      'mongodb://127.0.0.1:27017/cosmetic_ims?replicaSet=cosmeticims',
    )
    .asPromise();
  const db = conn.db;
  const cats = await db
    .collection('categories')
    .find({})
    .project({ categoryName: 1 })
    .toArray();
  const products = await db
    .collection('products')
    .find({})
    .project({ productName: 1, category: 1 })
    .toArray();
  const suppliers = await db
    .collection('suppliers')
    .find({})
    .project({ supplierName: 1 })
    .toArray();
  const purchases = await db
    .collection('purchases')
    .find({})
    .project({ supplier: 1 })
    .toArray();

  console.log('categories:', cats.map((c) => `${c._id} ${c.categoryName}`));
  console.log(
    'first product category:',
    typeof products[0]?.category,
    products[0]?.category?.constructor?.name,
    String(products[0]?.category),
  );
  console.log('suppliers:', suppliers.map((s) => `${s._id} ${s.supplierName}`));
  console.log(
    'first purchase supplier:',
    typeof purchases[0]?.supplier,
    purchases[0]?.supplier?.constructor?.name,
    String(purchases[0]?.supplier),
  );

  const target = products.find((p) => p.productName.startsWith('Smoke Test'));
  if (target) {
    const count = await db
      .collection('products')
      .countDocuments({ category: target.category });
    console.log(
      'countDocuments products where category =',
      String(target.category),
      '=>',
      count,
    );
  }
  const targetSupplier = suppliers.find((s) =>
    s.supplierName.startsWith('Smoke Test'),
  );
  if (targetSupplier) {
    const count = await db
      .collection('purchases')
      .countDocuments({ supplier: targetSupplier._id });
    console.log(
      'countDocuments purchases where supplier =',
      String(targetSupplier._id),
      '=>',
      count,
    );
    const raw = await db
      .collection('purchases')
      .find({ supplier: targetSupplier._id })
      .toArray();
    console.log('raw find result length:', raw.length);
  }
  await conn.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
