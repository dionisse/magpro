export type UserRole = 'admin' | 'cashier' | 'employee' | 'customer';

export type AdminModule =
  | 'admin-dashboard'
  | 'admin-products'
  | 'admin-categories'
  | 'admin-orders'
  | 'admin-payments'
  | 'admin-reports'
  | 'admin-pos'
  | 'admin-stock'
  | 'admin-purchases'
  | 'admin-sections';

export interface Section {
  id: string;
  name: string;
  description: string;
  color: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  section_permissions?: { module: string }[];
}

export interface SectionPermission {
  id: string;
  section_id: string;
  module: AdminModule;
}
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type OrderSource = 'online' | 'pos';
export type PaymentMethod =
  | 'cash'
  | 'mobile_money_mtn'
  | 'mobile_money_moov'
  | 'mobile_money_celtis'
  | 'bank_transfer'
  | 'cash_on_delivery'
  | 'chariow_online';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partial';

export interface Payment {
  id: string;
  order_id: string | null;
  order_number: string;
  method: PaymentMethod;
  operator: string;
  amount: number;
  status: PaymentStatus;
  transaction_id: string;
  chariow_checkout_url: string;
  payer_name: string;
  payer_phone: string;
  notes: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string;
  section_id: string | null;
  employee_number: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  description: string;
  price: number;
  bulk_quantity: number;
  bulk_price: number;
  stock: number;
  low_stock_threshold: number;
  image_url: string;
  sku: string;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  total: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  source: OrderSource;
  delivery_address: string;
  delivery_assignee: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Expense {
  id: string;
  label: string;
  category: string;
  amount: number;
  date: string;
  notes: string;
  created_by: string | null;
  created_at: string;
}

export type PurchaseStatus = 'draft' | 'validated' | 'cancelled';

export interface Purchase {
  id: string;
  reference: string;
  label: string;
  invoice_reference: string;
  supplier_name: string;
  date: string;
  status: PurchaseStatus;
  invoice_url: string;
  notes: string;
  total_amount: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}
