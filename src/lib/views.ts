export type View =
  | { kind: 'shop' }
  | { kind: 'product'; id: string }
  | { kind: 'cart' }
  | { kind: 'checkout' }
  | { kind: 'orders' }
  | { kind: 'order'; id: string }
  | { kind: 'auth' }
  | { kind: 'admin-setup' }
  | { kind: 'admin-dashboard' }
  | { kind: 'admin-products' }
  | { kind: 'admin-categories' }
  | { kind: 'admin-orders' }
  | { kind: 'admin-reports' }
  | { kind: 'admin-pos' }
  | { kind: 'admin-stock' }
  | { kind: 'admin-purchases' }
  | { kind: 'admin-payments' }
  | { kind: 'admin-sections' };

// Re-export for convenience
export type { AdminModule } from './database.types';
