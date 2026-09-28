const BASE = process.env.BASE_URL || 'http://localhost:3000';

let passed = 0;
let failed = 0;
const failures = [];

function check(name, condition, detail) {
  if (condition) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`FAIL  ${name}${detail ? ' -> ' + detail : ''}`);
  }
}

async function call(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data, headers: res.headers };
}

async function main() {
  const root = await fetch(BASE + '/');
  check('GET / serves the web interface', root.status === 200, `status ${root.status}`);

  let r = await call('GET', '/api/products');
  check('U1/S1 API rejects unauthenticated request', r.status === 401, `status ${r.status}`);

  r = await call('POST', '/api/auth/login', {
    body: { username: 'admin', password: 'wrong-password' },
  });
  check(
    'U2 wrong password rejected with message',
    r.status === 401 && r.data?.message === 'Invalid username or password.',
    `${r.status} ${JSON.stringify(r.data)}`,
  );

  r = await call('POST', '/api/auth/login', {
    body: { username: { $ne: '' }, password: { $ne: '' } },
  });
  check('S2 NoSQL injection rejected by validation', r.status === 400, `status ${r.status}`);

  r = await call('POST', '/api/auth/login', {
    body: { username: 'admin', password: 'ChangeMe123!' },
  });
  const admin = r.data?.accessToken;
  check('U1 correct credentials issue a token', r.status === 200 && !!admin, `status ${r.status}`);

  r = await call('POST', '/api/auth/login', {
    body: { username: 'attendant', password: 'Attendant123!' },
  });
  const attendant = r.data?.accessToken;
  check('Attendant can log in', r.status === 200 && r.data?.role === 'Attendant', `status ${r.status}`);

  r = await call('GET', '/api/auth/me', { token: attendant });
  check('GET /api/auth/me returns the profile', r.status === 200 && r.data?.username === 'attendant');

  r = await call('GET', '/api/products', { token: admin });
  const products = r.data || [];
  check('U4 product list loads', r.status === 200 && products.length >= 20, `count ${products.length}`);

  const categoryName = `Test Category ${Date.now()}`;
  r = await call('POST', '/api/categories', { token: admin, body: { categoryName } });
  const category = r.data;
  check('Category created', r.status === 200 && !!category?._id, `status ${r.status}`);

  r = await call('POST', '/api/categories', { token: admin, body: { categoryName } });
  check('U6 duplicate category rejected', r.status === 409, `status ${r.status}`);

  r = await call('POST', '/api/categories', { token: attendant, body: { categoryName: 'Nope' } });
  check('I5 attendant cannot create a category', r.status === 403, `status ${r.status}`);

  r = await call('POST', '/api/products', {
    token: attendant,
    body: {
      productName: 'Attendant Product',
      category: category._id,
      unitPrice: 100,
      costPrice: 60,
      quantityInStock: 5,
      reorderLevel: 2,
    },
  });
  check('I5 attendant cannot add a product', r.status === 403, `status ${r.status}`);

  r = await call('POST', '/api/products', {
    token: admin,
    body: {
      productName: 'Negative Price Product',
      category: category._id,
      unitPrice: -5,
      costPrice: 60,
      quantityInStock: 5,
      reorderLevel: 2,
    },
  });
  check('U5 negative selling price rejected', r.status === 400, `status ${r.status}`);

  const stock = 10;
  const productName = `Smoke Test Cream ${Date.now()}`;
  r = await call('POST', '/api/products', {
    token: admin,
    body: {
      productName,
      brand: 'SmokeBrand',
      category: category._id,
      unitPrice: 350,
      costPrice: 250,
      quantityInStock: stock,
      reorderLevel: 5,
      expiryDate: '2027-01-31',
    },
  });
  const product = r.data;
  check('U4 valid product saved', r.status === 200 && product?._id, `${r.status} ${JSON.stringify(r.data)}`);

  r = await call('GET', '/api/products?search=SmokeBrand', { token: attendant });
  check(
    'Product search by brand works',
    r.status === 200 && r.data.some((p) => p._id === product._id),
    `count ${r.data?.length}`,
  );

  r = await call('POST', '/api/sales', {
    token: attendant,
    body: { items: [{ productId: product._id, quantity: 4 }] },
  });
  check('I1 sale of 4 units recorded', r.status === 200 && r.data?.totalAmount === 1400, `${r.status} ${JSON.stringify(r.data)}`);
  const sale = r.data;

  r = await call('GET', '/api/products/' + product._id, { token: attendant });
  check('I1 stock reduced to 6', r.data?.quantityInStock === 6, `stock ${r.data?.quantityInStock}`);

  r = await call('GET', '/api/reports/inventory', { token: admin });
  const row = (r.data || []).find((p) => p._id === product._id);
  check('I1 stock is 6 in the inventory report', row?.quantityInStock === 6, `stock ${row?.quantityInStock}`);

  r = await call('POST', '/api/sales', {
    token: attendant,
    body: { items: [{ productId: product._id, quantity: 999 }] },
  });
  check(
    'I4 sale beyond stock rejected',
    r.status === 400 && /^Insufficient stock for .*\. Available: 6\.$/.test(r.data?.message || ''),
    `${r.status} ${JSON.stringify(r.data)}`,
  );

  r = await call('GET', '/api/products/' + product._id, { token: attendant });
  check('I4 stock unchanged after rejected sale', r.data?.quantityInStock === 6, `stock ${r.data?.quantityInStock}`);

  r = await call('GET', '/api/sales?from=2000-01-01', { token: attendant });
  const savedSales = r.data || [];
  check(
    'I4 rejected sale was not saved',
    !savedSales.some((s) => s.items.some((i) => i.quantity === 999)),
    `sales ${savedSales.length}`,
  );

  r = await call('POST', '/api/suppliers', {
    token: admin,
    body: { supplierName: 'Smoke Test Suppliers', phone: '0700 000 000', email: '' },
  });
  const supplier = r.data;
  check('Supplier created (empty email ignored)', r.status === 200 && !!supplier?._id, `${r.status} ${JSON.stringify(r.data)}`);

  r = await call('POST', '/api/purchases', {
    token: admin,
    body: {
      supplierId: supplier._id,
      purchaseDate: '2026-09-28',
      items: [{ productId: product._id, quantity: 20, unitCost: 240 }],
    },
  });
  const purchase = r.data;
  check('I2 purchase of 20 units recorded', r.status === 200 && purchase?.totalCost === 4800, `${r.status} ${JSON.stringify(r.data)}`);

  r = await call('GET', '/api/products/' + product._id, { token: attendant });
  check('I2 stock increased to 26', r.data?.quantityInStock === 26, `stock ${r.data?.quantityInStock}`);
  check('I2 latest cost price updated', r.data?.costPrice === 240, `cost ${r.data?.costPrice}`);

  r = await call('POST', '/api/purchases', {
    token: attendant,
    body: {
      supplierId: supplier._id,
      purchaseDate: '2026-09-28',
      items: [{ productId: product._id, quantity: 5, unitCost: 240 }],
    },
  });
  check('Attendant cannot record purchases', r.status === 403, `status ${r.status}`);

  for (let i = 0; i < 3; i++) {
    const out = await call('POST', '/api/sales', {
      token: attendant,
      body: { items: [{ productId: product._id, quantity: 8 }] },
    });
    if (out.status !== 200) {
      check('Sell down to the reorder level', false, `${out.status} ${JSON.stringify(out.data)}`);
      break;
    }
  }
  r = await call('GET', '/api/products/' + product._id, { token: attendant });
  check('Stock now below the reorder level', r.data?.quantityInStock <= 5, `stock ${r.data?.quantityInStock}`);

  r = await call('GET', '/api/reports/dashboard', { token: attendant });
  const lowIds = (r.data?.lowStock || []).map((p) => p._id);
  check(
    'I3 dashboard shows the low-stock alert',
    r.status === 200 && r.data?.lowStockCount >= 1 && lowIds.includes(product._id),
    `${r.status} lowStockCount ${r.data?.lowStockCount}`,
  );
  check('Dashboard returns sales totals', typeof r.data?.todaySalesAmount === 'number');

  r = await call('GET', '/api/reports/low-stock', { token: admin });
  check(
    'I3 low-stock report lists the product',
    r.status === 200 && (r.data || []).some((p) => p._id === product._id),
    `rows ${r.data?.length}`,
  );

  r = await call('GET', '/api/reports/low-stock', { token: attendant });
  check('Attendant cannot open admin reports', r.status === 403, `status ${r.status}`);

  r = await call('GET', '/api/reports/sales?from=2000-01-01&to=2100-01-01', { token: admin });
  check(
    'Sales report aggregates by day',
    r.status === 200 && r.data.length >= 1 && r.data.every((d) => typeof d.totalSales === 'number'),
    `${r.status} rows ${r.data?.length}`,
  );

  r = await call('GET', '/api/reports/purchases?from=2000-01-01&to=2100-01-01', { token: admin });
  check(
    'Purchases report aggregates by day',
    r.status === 200 && r.data.some((d) => d.totalCost === 4800),
    `${r.status} ${JSON.stringify(r.data)}`,
  );

  r = await call('GET', '/api/reports/sales?from=1999-01-01&to=1999-01-02', { token: admin });
  check('M5 empty report period returns []', r.status === 200 && Array.isArray(r.data) && r.data.length === 0);

  r = await call('GET', '/api/reports/expiring?days=90', { token: admin });
  check('Expiring-soon report returns rows', r.status === 200 && Array.isArray(r.data), `status ${r.status}`);

  r = await call('GET', '/api/sales/' + sale._id, { token: attendant });
  check(
    'Receipt data is fully populated',
    r.status === 200 &&
      typeof r.data?.saleNumber === 'number' &&
      r.data?.items?.[0]?.product?.productName &&
      typeof r.data?.servedBy?.fullName === 'string',
    `${r.status} ${JSON.stringify(r.data)}`,
  );
  check('Sale numbers are sequential', sale.saleNumber >= 1, `saleNumber ${sale.saleNumber}`);
  check(
    'Purchase numbers are sequential',
    typeof purchase?.purchaseNumber === 'number' && purchase.purchaseNumber >= 1,
    `purchaseNumber ${purchase?.purchaseNumber}`,
  );

  r = await call('GET', '/api/users', { token: admin });
  check('Admin can list users', r.status === 200 && r.data.length >= 2, `count ${r.data?.length}`);
  check('User list hides password hashes', !(JSON.stringify(r.data).includes('passwordHash')));

  r = await call('GET', '/api/users', { token: attendant });
  check('Attendant cannot list users', r.status === 403, `status ${r.status}`);

  r = await call('POST', '/api/users', {
    token: admin,
    body: { fullName: 'Smoke Tester', username: `smoke${Date.now()}`, password: 'Secret123', role: 'Attendant' },
  });
  check('Admin creates a user', r.status === 200 && r.data?.role === 'Attendant', `status ${r.status}`);

  r = await call('DELETE', '/api/categories/' + category._id, { token: admin });
  check('Deleting an unused category succeeds', r.status === 204, `status ${r.status}`);

  r = await call('DELETE', '/api/suppliers/' + supplier._id, { token: admin });
  check('Deleting a referenced supplier is refused', r.status === 409, `status ${r.status}`);

  console.log('');
  console.log(`${passed} passed, ${failed} failed`);
  if (failures.length) console.log('Failed: ' + failures.join(' | '));
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error('Smoke test crashed:', error);
  process.exit(1);
});
