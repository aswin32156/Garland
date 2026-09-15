// ─── Order & Payment Enums ───────────────────────────────────────────────────

export type OrderStatus =
  | 'NEW'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'COLLECTED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type UserRole = 'CUSTOMER' | 'OWNER' | 'ADMIN';

export type NotificationType =
  | 'ORDER_CONFIRMED'
  | 'ORDER_ACCEPTED'
  | 'ORDER_PREPARING'
  | 'ORDER_READY'
  | 'ORDER_COLLECTED'
  | 'NEW_ORDER'; // owner notification

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  role: UserRole;
  loyalty_points: number;
  avatar_url?: string | null;
  created_at: string;
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
  display_order: number;
  is_active: boolean;
}

export interface Occasion {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  display_order: number;
  is_active: boolean;
}

export interface Garland {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category_id?: string | null;
  occasion_id?: string | null;
  flower_type?: string | null;
  images: string[];
  video_url?: string | null;
  is_available: boolean;
  is_featured: boolean;
  is_popular: boolean;
  stock_qty?: number | null;
  collection_tag?: string | null;
  created_at: string;
  updated_at: string;
  // joined
  category?: Category | null;
  occasion?: Occasion | null;
}

// ─── Pickup Slots ────────────────────────────────────────────────────────────

export interface PickupSlot {
  id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  max_orders: number;
  booked_count: number;
  is_available: boolean;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string; // local uuid
  garland: Garland;
  quantity: number;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  order_id: string;
  garland_id: string;
  garland_name: string;
  garland_image?: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  total: number;
  pickup_date: string;
  pickup_slot_id?: string | null;
  pickup_start_time: string;
  pickup_end_time: string;
  payment_id?: string | null;
  payment_order_id?: string | null;
  payment_amount?: number | null;
  payment_at?: string | null;
  qr_code_url?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // joined
  items?: OrderItem[];
  customer?: Profile;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  order_id: string;
  garland_id: string;
  customer_id: string;
  rating: number; // 1-5
  review_text?: string | null;
  image_url?: string | null;
  is_verified: boolean;
  created_at: string;
  customer?: Profile;
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export interface WishlistItem {
  id: string;
  wishlist_id: string;
  garland_id: string;
  added_at: string;
  garland?: Garland;
}

// ─── API Response Wrapper ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// ─── Checkout ────────────────────────────────────────────────────────────────

export interface CheckoutData {
  full_name: string;
  phone: string;
  email: string;
  pickup_date: string;
  pickup_slot_id: string;
  pickup_start_time: string;
  pickup_end_time: string;
  notes?: string;
}
