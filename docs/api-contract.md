# Cosmetic IMS — REST API Contract (v1)

Base URL: same origin, all paths prefixed with `/api`.
Content type: `application/json`.
Auth header: `Authorization: Bearer <accessToken>`.

## Error shape (all non-2xx)
```json
{ "statusCode": 400, "message": "Insufficient stock for Nivea. Available: 3.", "error": "Bad Request" }
```
- Validation failures: `message` is an array of strings (class-validator, whitelist on → unknown fields rejected).
- `401` missing/invalid/expired token, or `{"message":"Invalid username or password."}` on bad login.
- `403` `{ "message": "Access denied. You do not have permission." }` when role is wrong.
- `409` delete of a category/supplier that is still referenced.

## Roles
`Admin` (shop owner) and `Attendant`. Marked **[Admin]** = Admin only, **[Auth]** = any logged-in user.

---

## Auth
### POST /api/auth/login  (public)
```json
{ "username": "admin", "password": "ChangeMe123!" }
```
200:
```json
{ "accessToken": "eyJ...", "name": "Shop Owner", "role": "Admin" }
```
401 on wrong credentials or inactive account (same generic message).

### GET /api/auth/me  [Auth]
```json
{ "_id": "...", "fullName": "Shop Owner", "username": "admin", "role": "Admin" }
```

## Users  [Admin]
- `GET /api/users` → `[{ _id, fullName, username, role, isActive, createdAt }]`
- `POST /api/users` `{ fullName, username, password, role }` → user object (never contains passwordHash); 409 if username exists.
- `PUT /api/users/:id` `{ fullName?, role?, isActive?, password? }` → updated user.

## Categories  (read: [Auth]; write: [Admin])
- `GET /api/categories` → `[{ _id, categoryName }]` (sorted by name)
- `POST /api/categories` `{ categoryName }` → category; 409 duplicate name.
- `PUT /api/categories/:id` `{ categoryName }` → category.
- `DELETE /api/categories/:id` → `204`; 409 if products reference it.

## Suppliers  (read: [Auth]; write: [Admin])
- `GET /api/suppliers` → `[{ _id, supplierName, phone, email, location }]`
- `POST /api/suppliers` `{ supplierName, phone?, email?, location? }`
- `PUT /api/suppliers/:id` same fields.
- `DELETE /api/suppliers/:id` → 204; 409 if purchases reference it.

## Products  (read: [Auth]; write: [Admin])
Product object:
```json
{ "_id": "...", "productName": "Nivea Soft Moisturiser", "brand": "Nivea",
  "category": { "_id": "...", "categoryName": "Skincare" },
  "unitPrice": 650, "costPrice": 480, "quantityInStock": 24,
  "reorderLevel": 5, "expiryDate": "2027-04-30T00:00:00.000Z" | null,
  "isActive": true, "createdAt": "..." }
```
- `GET /api/products?search=nivea` → array sorted by productName. `search` matches productName, brand, category name (case-insensitive). Returns **all** products (active and inactive); frontend filters/shows badges.
- `GET /api/products/:id` → product.
- `POST /api/products` [Admin]
  `{ productName, brand?, category, unitPrice, costPrice, quantityInStock, reorderLevel, expiryDate? }` (category = ObjectId string). 404 if category unknown.
- `PUT /api/products/:id` [Admin] — all fields optional, same validation; may include `"isActive": false` to deactivate.

## Purchases  [Admin]
Purchase object:
```json
{ "_id": "...", "purchaseNumber": 3, "supplier": { "_id": "...", "supplierName": "Kibwezi Distributors" },
  "purchaseDate": "2026-09-20T00:00:00.000Z",
  "items": [ { "product": { "_id": "...", "productName": "..." }, "quantity": 20, "unitCost": 480 } ],
  "totalCost": 9600, "recordedBy": { "_id": "...", "fullName": "Shop Owner" } }
```
- `GET /api/purchases?from=YYYY-MM-DD&to=YYYY-MM-DD&supplierId=` → newest first (populate supplier, product, recordedBy).
- `POST /api/purchases` `{ supplierId, purchaseDate, items: [{ productId, quantity, unitCost }] }`
  → increases `quantityInStock` by quantity and sets `costPrice = unitCost` for each item, in one transaction. 404 for unknown supplier/product.

## Sales
Sale object (used by the receipt screen):
```json
{ "_id": "...", "saleNumber": 17, "saleDate": "2026-09-28T10:15:00.000Z",
  "items": [ { "product": { "_id": "...", "productName": "...", "brand": "..." }, "quantity": 2, "unitPrice": 650 } ],
  "totalAmount": 1300, "servedBy": { "_id": "...", "fullName": "Jane Kilonzo" } }
```
- `GET /api/sales?from=YYYY-MM-DD&to=YYYY-MM-DD` → newest first.
- `GET /api/sales/:id` → one sale (for `/receipt/:id`).
- `POST /api/sales` `{ items: [{ productId, quantity }] }` [Auth: Admin or Attendant]
  → atomically decrements stock only when enough is available; otherwise `400` with
  `Insufficient stock for <productName>. Available: <n>.` and **nothing** is saved.
  `400` also for empty items: `Select at least one product.`
  Increments a `saleNumber` counter.

## Reports  (dashboard: [Auth]; others: [Admin])
Query dates are `YYYY-MM-DD`, inclusive (server converts to start/end of day).

- `GET /api/reports/dashboard`
```json
{ "totalProducts": 42, "lowStockCount": 5, "expiringCount": 2,
  "todaySalesCount": 7, "todaySalesAmount": 8450,
  "lowStock": [ { "_id":"...", "productName":"...", "brand":"...", "quantityInStock":2, "reorderLevel":5, "categoryName":"Makeup" } ] }
```
- `GET /api/reports/inventory`
```json
[ { "_id", "productName", "brand", "categoryName", "quantityInStock", "unitPrice", "costPrice",
    "reorderLevel", "expiryDate", "isActive", "stockValue": 11520 } ]
```
- `GET /api/reports/sales?from&to` → `[ { "date": "2026-09-28", "salesCount": 4, "itemsSold": 9, "totalSales": 5350 } ]` ascending by date.
- `GET /api/reports/purchases?from&to` → `[ { "date": "2026-09-20", "purchasesCount": 1, "itemsBought": 20, "totalCost": 9600 } ]`
- `GET /api/reports/low-stock` → inventory rows where `quantityInStock <= reorderLevel` (active only), lowest stock first.
- `GET /api/reports/expiring?days=90` → inventory rows with `expiryDate` within `days` from today (active only), soonest first.

Empty report ranges return `[]` (frontend shows "No records found for the selected period.").

---

## Conventions for the frontend
- All dates sent as `YYYY-MM-DD`; all responses JSON.
- Money fields are numbers (Ksh, no decimals needed in UI: `Ksh {{ value | number }}` style formatting, plain template formatting acceptable).
- Unknown/forbidden routes: `401` → redirect to `/login`; `403` → show `Access denied. You do not have permission to view this page.`
