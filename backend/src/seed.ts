import * as bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { prepareDatabase, stopDatabase } from './mongo/database';
import { CounterSchema } from './counters/counter.schema';
import { CategorySchema } from './categories/schemas/category.schema';
import { ProductSchema } from './products/schemas/product.schema';
import { PurchaseSchema } from './purchases/schemas/purchase.schema';
import { SaleSchema } from './sales/schemas/sale.schema';
import { SupplierSchema } from './suppliers/schemas/supplier.schema';
import { UserSchema } from './users/schemas/user.schema';

const dateOffset = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const categories = [
  'Skincare',
  'Makeup',
  'Fragrances',
  'Hair care',
  'Accessories',
];

const suppliers = [
  {
    supplierName: 'Kibwezi Beauty Distributors',
    phone: '0712 345 678',
    location: 'Kibwezi Town',
  },
  {
    supplierName: 'Nairobi Cosmetics Wholesale',
    phone: '0722 118 904',
    email: 'sales@nairobicosmetics.co.ke',
    location: 'Nairobi',
  },
  {
    supplierName: 'Coast Fragrance Imports',
    phone: '0733 556 210',
    location: 'Mombasa',
  },
];

const products: [
  string,
  string,
  string,
  number,
  number,
  number,
  number,
  number,
][] = [
  ['Nivea Soft Moisturiser 200ml', 'Nivea', 'Skincare', 650, 480, 24, 6, -270],
  ['Garnier SkinActive Micellar Water', 'Garnier', 'Skincare', 890, 650, 12, 5, -500],
  ['Dove Beauty Cream Bar', 'Dove', 'Skincare', 320, 220, 40, 10, -430],
  ['Neutrogena Deep Clean Cleanser', 'Neutrogena', 'Skincare', 1450, 1100, 4, 5, -100],
  ['Nivea Lip Balm Cherry Shine', 'Nivea', 'Skincare', 380, 260, 3, 5, -78],
  ['Maybelline Fit Me Foundation', 'Maybelline', 'Makeup', 1250, 900, 18, 5, -500],
  ['L.A. Girl Pro Conceal', 'L.A. Girl', 'Makeup', 750, 520, 30, 8, -360],
  ['Essence Lash Princess Mascara', 'Essence', 'Makeup', 690, 470, 2, 5, -430],
  ['Revlon Super Lustrous Lipstick', 'Revlon', 'Makeup', 890, 640, 15, 5, -530],
  ['Rimmel Stay Matte Powder', 'Rimmel', 'Makeup', 980, 700, 9, 4, -240],
  ['Jordana Easyliner Lip Liner', 'Jordana', 'Makeup', 350, 230, 45, 10, -460],
  ['Jovan Musk Cologne 88ml', 'Jovan', 'Fragrances', 1650, 1200, 7, 3, -900],
  ['Elizabeth Arden Green Tea EDT', 'Elizabeth Arden', 'Fragrances', 2400, 1800, 3, 3, -670],
  ['Cuba Gold Perfume for Men', 'Cuba', 'Fragrances', 950, 680, 11, 4, -620],
  ['ORS Olive Oil Hair Mayonnaise', 'ORS', 'Hair care', 780, 560, 16, 5, -560],
  ['Cantu Shea Butter Leave-In Conditioner', 'Cantu', 'Hair care', 1350, 980, 8, 4, -400],
  ['Dark and Lovely Hair Colour Natural Black', 'Dark and Lovely', 'Hair care', 620, 430, 22, 6, -33],
  ['ORS Olive Oil Replenishing Conditioner', 'ORS', 'Hair care', 690, 490, 5, 5, -300],
  ['Beauty Blender Makeup Sponge', '', 'Accessories', 450, 300, 25, 10, 0],
  ['Vaseline Cocoa Radiant Lotion 400ml', 'Vaseline', 'Skincare', 820, 600, 14, 5, -190],
];

async function seed(): Promise<void> {
  await prepareDatabase();
  const connection = await mongoose
    .createConnection(process.env.MONGO_URI as string)
    .asPromise();

  const User = connection.model('User', UserSchema);
  const Category = connection.model('Category', CategorySchema);
  const Supplier = connection.model('Supplier', SupplierSchema);
  const Product = connection.model('Product', ProductSchema);
  const Sale = connection.model('Sale', SaleSchema);
  const Purchase = connection.model('Purchase', PurchaseSchema);
  const Counter = connection.model('Counter', CounterSchema);

  const adminExists = await User.findOne({ role: 'Admin' });
  if (adminExists) {
    console.log('Database already contains data. Nothing to seed.');
    await connection.close();
    await stopDatabase();
    return;
  }

  await User.create([
    {
      fullName: 'Shop Owner',
      username: 'admin',
      passwordHash: await bcrypt.hash('ChangeMe123!', 10),
      role: 'Admin',
    },
    {
      fullName: 'Jane Kilonzo',
      username: 'attendant',
      passwordHash: await bcrypt.hash('Attendant123!', 10),
      role: 'Attendant',
    },
  ]);

  const categoryDocs = await Category.insertMany(
    categories.map((categoryName) => ({ categoryName })),
  );
  const categoryByName = new Map(
    categoryDocs.map((doc: any) => [doc.categoryName, doc._id]),
  );

  const supplierDocs = await Supplier.insertMany(suppliers);
  const productDocs = await Product.insertMany(
    products.map(
      ([name, brand, category, unitPrice, costPrice, stock, reorder, expiryDays]) => ({
        productName: name,
        brand,
        category: categoryByName.get(category),
        unitPrice,
        costPrice,
        quantityInStock: stock,
        reorderLevel: reorder,
        expiryDate: expiryDays === 0 ? undefined : dateOffset(expiryDays),
      }),
    ),
  );
  const productByName = new Map(
    productDocs.map((doc: any) => [doc.productName, doc]),
  );

  const pick = (name: string, quantity: number) => {
    const product = productByName.get(name) as any;
    return {
      product: product._id,
      quantity,
      unitPrice: product.unitPrice,
    };
  };

  const owner = await User.findOne({ username: 'admin' });
  const attendant = await User.findOne({ username: 'attendant' });

  await Purchase.insertMany([
    {
      purchaseNumber: 1,
      supplier: supplierDocs[0]._id,
      purchaseDate: dateOffset(-14),
      items: [
        {
          product: productByName.get('Nivea Soft Moisturiser 200ml')._id,
          quantity: 24,
          unitCost: 480,
        },
        {
          product: productByName.get('Maybelline Fit Me Foundation')._id,
          quantity: 18,
          unitCost: 900,
        },
      ],
      totalCost: 24 * 480 + 18 * 900,
      recordedBy: owner._id,
    },
    {
      purchaseNumber: 2,
      supplier: supplierDocs[1]._id,
      purchaseDate: dateOffset(-5),
      items: [
        {
          product: productByName.get('L.A. Girl Pro Conceal')._id,
          quantity: 30,
          unitCost: 520,
        },
        {
          product: productByName.get('Jordana Easyliner Lip Liner')._id,
          quantity: 45,
          unitCost: 230,
        },
      ],
      totalCost: 30 * 520 + 45 * 230,
      recordedBy: owner._id,
    },
  ]);

  const todaySales = [
    [pick('Nivea Soft Moisturiser 200ml', 2), pick('Dove Beauty Cream Bar', 1)],
    [pick('Maybelline Fit Me Foundation', 1)],
    [pick('Essence Lash Princess Mascara', 1), pick('Revlon Super Lustrous Lipstick', 1)],
    [pick('ORS Olive Oil Hair Mayonnaise', 1), pick('Jordana Easyliner Lip Liner', 3)],
  ];

  const saleDocs = [];
  for (let i = 0; i < todaySales.length; i++) {
    const items = todaySales[i];
    saleDocs.push({
      saleNumber: i + 1,
      saleDate: new Date(),
      items,
      totalAmount: items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
      servedBy: i % 2 === 0 ? attendant._id : owner._id,
    });
  }
  saleDocs.push({
    saleNumber: 5,
    saleDate: dateOffset(-1),
    items: [
      pick('Garnier SkinActive Micellar Water', 1),
      pick('Vaseline Cocoa Radiant Lotion 400ml', 2),
    ],
    totalAmount: 890 + 2 * 820,
    servedBy: attendant._id,
  });
  saleDocs.push({
    saleNumber: 6,
    saleDate: dateOffset(-1),
    items: [pick('Cuba Gold Perfume for Men', 1)],
    totalAmount: 950,
    servedBy: attendant._id,
  });
  await Sale.insertMany(saleDocs);

  await Counter.bulkWrite([
    { updateOne: { filter: { _id: 'sale' }, update: { $set: { seq: 6 } }, upsert: true } },
    { updateOne: { filter: { _id: 'purchase' }, update: { $set: { seq: 2 } }, upsert: true } },
  ]);

  console.log('Seed complete.');
  console.log('  Admin    -> username: admin       password: ChangeMe123!');
  console.log('  Attendant-> username: attendant   password: Attendant123!');
  console.log(`  ${productDocs.length} products, ${saleDocs.length} sales, 2 purchases created.`);

  await connection.close();
  await stopDatabase();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
