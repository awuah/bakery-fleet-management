export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  image_url?: string;
  created_at?: string;
}

export interface MasterStock {
  id: string;
  product_id: string;
  quantity: number;
  low_stock_threshold: number;
  updated_at: string;
  product?: Product;
}

export interface Vehicle {
  id: string;
  van_code: string;
  driver_name: string;
  driver_phone: string;
  license_plate: string;
  status: 'idle' | 'loading' | 'on_route' | 'returned' | 'maintenance';
  current_lat: number;
  current_lng: number;
  heading: number;
  speed_kmh: number;
  battery_level: number;
  last_location_update: string;
  created_at?: string;
}

export interface VehicleStock {
  id: string;
  vehicle_id: string;
  product_id: string;
  loaded_quantity: number;
  current_quantity: number;
  delivered_quantity: number;
  returned_quantity: number;
  updated_at: string;
  product?: Product;
  vehicle?: Vehicle;
}

export interface Customer {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  address: string;
  lat: number;
  lng: number;
  created_at?: string;
}

export interface Delivery {
  id: string;
  delivery_number: string;
  vehicle_id: string;
  customer_id: string;
  status: 'completed' | 'partial' | 'cancelled';
  delivered_at: string;
  driver_notes?: string;
  recipient_name?: string;
  total_items_delivered: number;
  total_value: number;
  delivery_lat?: number;
  delivery_lng?: number;
  created_at?: string;
  vehicle?: Vehicle;
  customer?: Customer;
  delivery_items?: DeliveryItem[];
}

export interface DeliveryItem {
  id: string;
  delivery_id: string;
  product_id: string;
  quantity_delivered: number;
  unit_price: number;
  subtotal: number;
  product?: Product;
}

export interface StockMovement {
  id: string;
  movement_type: 'PRODUCTION_ADD' | 'VAN_LOAD' | 'VAN_DELIVERY' | 'VAN_RETURN' | 'WASTAGE_ADJUSTMENT';
  product_id: string;
  quantity: number;
  from_location: string;
  to_location: string;
  reference_id?: string;
  notes?: string;
  created_at: string;
  product?: Product;
}
