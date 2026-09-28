const mongoose = require('mongoose');
const { ProductSchema } = require('../dist/products/schemas/product.schema');
const { CategorySchema } = require('../dist/categories/schemas/category.schema');

const URI =
  'mongodb://127.0.0.1:27017/cosmetic_ims?replicaSet=cosmeticims';

(async () => {
  const conn = await mongoose.createConnection(URI).asPromise();
  const Category = conn.model('Category', CategorySchema);
  const Product = conn.model('Product', ProductSchema);

  const category = await Category.create({
    categoryName: 'WrapperTest ' + Date.now(),
  });
  const product = await Product.create({
    productName: 'WrapperTestProduct',
    category: category._id,
    unitPrice: 100,
    costPrice: 50,
    quantityInStock: 1,
    reorderLevel: 0,
  });
  console.log('created product.category =', product.category);

  const viaWrapper = await conn
    .collection('products')
    .countDocuments({ category: category._id });
  console.log('wrapper count =', viaWrapper);

  const viaWrapperString = await conn
    .collection('products')
    .countDocuments({ category: category.id });
  console.log('wrapper count (string id) =', viaWrapperString);

  const viaDb = await conn.db
    .collection('products')
    .countDocuments({ category: category._id });
  console.log('db count =', viaDb);

  const raw = await conn.db
    .collection('products')
    .findOne({ _id: product._id });
  console.log('raw category type =', typeof raw.category, raw.category?.constructor?.name, String(raw.category));

  await Product.deleteOne({ _id: product._id });
  await Category.deleteOne({ _id: category._id });
  await conn.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
