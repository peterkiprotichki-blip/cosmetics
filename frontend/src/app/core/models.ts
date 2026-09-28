export interface LoginResponse {
  accessToken: string;
  name: string;
  role: string;
}

export interface Category {
  _id: string;
  categoryName: string;
}

export interface Supplier {
  _id: string;
  supplierName: string;
  phone?: string;
  email?: string;
  location?: string;
}

export interface Product {
  _id: string;
  productName: string;
  brand: string;
  category: Category;
  unitPrice: number;
  costPrice: number;
  quantityInStock: number;
  reorderLevel: number;
  expiryDate: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ProductPayload {
  productName: string;
  brand?: string;
  category: string;
  unitPrice: number;
  costPrice: number;
  quantityInStock: number;
  reorderLevel: number;
  expiryDate?: string;
  isActive?: boolean;
}

export interface SaleLine {
  product: { _id: string; productName: string; brand?: string };
  quantity: number;
  unitPrice: number;
}

export interface Sale {
  _id: string;
  saleNumber: number;
  saleDate: string;
  items: SaleLine[];
  totalAmount: number;
  servedBy: { _id: string; fullName: string };
}

export interface PurchaseLine {
  product: { _id: string; productName: string };
  quantity: number;
  unitCost: number;
}

export interface Purchase {
  _id: string;
  purchaseNumber: number;
  supplier: { _id: string; supplierName: string };
  purchaseDate: string;
  items: PurchaseLine[];
  totalCost: number;
  recordedBy: { _id: string; fullName: string };
}

export interface AppUser {
  _id: string;
  fullName: string;
  username: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface LowStockItem {
  _id: string;
  productName: string;
  brand: string;
  quantityInStock: number;
  reorderLevel: number;
  categoryName: string;
}

export interface DashboardData {
  totalProducts: number;
  lowStockCount: number;
  expiringCount: number;
  todaySalesCount: number;
  todaySalesAmount: number;
  lowStock: LowStockItem[];
}

export interface InventoryRow {
  _id: string;
  productName: string;
  brand: string;
  categoryName: string;
  quantityInStock: number;
  unitPrice: number;
  costPrice: number;
  reorderLevel: number;
  expiryDate: string | null;
  isActive: boolean;
  stockValue: number;
}

export interface SalesReportRow {
  date: string;
  salesCount: number;
  itemsSold: number;
  totalSales: number;
}

export interface PurchasesReportRow {
  date: string;
  purchasesCount: number;
  itemsBought: number;
  totalCost: number;
}
