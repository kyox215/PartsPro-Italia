export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole =
  | "admin"
  | "manager"
  | "staff"
  | "warehouse"
  | "customer"
  | "b2b_customer";

export type CustomerStatus = "pending" | "approved" | "rejected" | "suspended";
export type CustomerType = "retail" | "b2b";
export type InventoryStatus =
  | "available"
  | "reserved"
  | "defective"
  | "quarantine";
export type LocaleCode = "it" | "en" | "zh";
export type OrderPaymentStatus = "unpaid" | "paid" | "refunded";
export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled";
export type PriceGroup = "retail" | "b2b_basic" | "silver" | "gold";
export type ProductStatus = "draft" | "active" | "archived";
export type ProductType =
  | "screen"
  | "battery"
  | "flex"
  | "tool"
  | "back_cover"
  | "camera"
  | "speaker"
  | "charging_port"
  | "adhesive"
  | "accessory";
export type QualityGrade = "A+" | "A" | "B" | "C";

type TableRelationships = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
}[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: AppRole;
          locale: LocaleCode;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: AppRole;
          locale?: LocaleCode;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: AppRole;
          locale?: LocaleCode;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: TableRelationships;
      };
      customers: {
        Row: {
          id: string;
          profile_id: string | null;
          customer_type: CustomerType;
          company_name: string | null;
          vat_number: string | null;
          codice_fiscale: string | null;
          sdi: string | null;
          pec: string | null;
          phone: string | null;
          whatsapp: string | null;
          billing_address: Json;
          shipping_address: Json;
          status: CustomerStatus;
          price_group: PriceGroup;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          customer_type?: CustomerType;
          company_name?: string | null;
          vat_number?: string | null;
          codice_fiscale?: string | null;
          sdi?: string | null;
          pec?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          billing_address?: Json;
          shipping_address?: Json;
          status?: CustomerStatus;
          price_group?: PriceGroup;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string | null;
          customer_type?: CustomerType;
          company_name?: string | null;
          vat_number?: string | null;
          codice_fiscale?: string | null;
          sdi?: string | null;
          pec?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          billing_address?: Json;
          shipping_address?: Json;
          status?: CustomerStatus;
          price_group?: PriceGroup;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: TableRelationships;
      };
      brands: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: TableRelationships;
      };
      categories: {
        Row: {
          id: string;
          parent_id: string | null;
          name_it: string;
          name_en: string;
          name_zh: string;
          slug: string;
          icon: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_id?: string | null;
          name_it: string;
          name_en: string;
          name_zh: string;
          slug: string;
          icon?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string | null;
          name_it?: string;
          name_en?: string;
          name_zh?: string;
          slug?: string;
          icon?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: TableRelationships;
      };
      products: {
        Row: {
          id: string;
          brand_id: string;
          category_id: string;
          name_it: string;
          name_en: string;
          name_zh: string;
          slug: string;
          description_it: string | null;
          description_en: string | null;
          description_zh: string | null;
          product_type: ProductType;
          phone_model: string | null;
          model_codes: string[];
          status: ProductStatus;
          image_urls: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          category_id: string;
          name_it: string;
          name_en: string;
          name_zh: string;
          slug: string;
          description_it?: string | null;
          description_en?: string | null;
          description_zh?: string | null;
          product_type: ProductType;
          phone_model?: string | null;
          model_codes?: string[];
          status?: ProductStatus;
          image_urls?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          category_id?: string;
          name_it?: string;
          name_en?: string;
          name_zh?: string;
          slug?: string;
          description_it?: string | null;
          description_en?: string | null;
          description_zh?: string | null;
          product_type?: ProductType;
          phone_model?: string | null;
          model_codes?: string[];
          status?: ProductStatus;
          image_urls?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: TableRelationships;
      };
      product_skus: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          barcode: string | null;
          quality_grade: QualityGrade;
          color: string | null;
          frame_type: "with_frame" | "without_frame" | null;
          retail_price: number;
          b2b_price: number | null;
          cost_price: number | null;
          vat_rate: number;
          moq: number;
          weight_grams: number | null;
          is_battery: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku: string;
          barcode?: string | null;
          quality_grade?: QualityGrade;
          color?: string | null;
          frame_type?: "with_frame" | "without_frame" | null;
          retail_price: number;
          b2b_price?: number | null;
          cost_price?: number | null;
          vat_rate?: number;
          moq?: number;
          weight_grams?: number | null;
          is_battery?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          sku?: string;
          barcode?: string | null;
          quality_grade?: QualityGrade;
          color?: string | null;
          frame_type?: "with_frame" | "without_frame" | null;
          retail_price?: number;
          b2b_price?: number | null;
          cost_price?: number | null;
          vat_rate?: number;
          moq?: number;
          weight_grams?: number | null;
          is_battery?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: TableRelationships;
      };
      inventory: {
        Row: {
          id: string;
          sku_id: string;
          quantity_available: number;
          quantity_reserved: number;
          quantity_incoming: number;
          warehouse_location: string | null;
          batch_number: string | null;
          status: InventoryStatus;
          low_stock_threshold: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sku_id: string;
          quantity_available?: number;
          quantity_reserved?: number;
          quantity_incoming?: number;
          warehouse_location?: string | null;
          batch_number?: string | null;
          status?: InventoryStatus;
          low_stock_threshold?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sku_id?: string;
          quantity_available?: number;
          quantity_reserved?: number;
          quantity_incoming?: number;
          warehouse_location?: string | null;
          batch_number?: string | null;
          status?: InventoryStatus;
          low_stock_threshold?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: TableRelationships;
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string;
          status: OrderStatus;
          payment_status: OrderPaymentStatus;
          subtotal: number;
          vat_total: number;
          shipping_total: number;
          grand_total: number;
          currency: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          customer_id: string;
          status?: OrderStatus;
          payment_status?: OrderPaymentStatus;
          subtotal?: number;
          vat_total?: number;
          shipping_total?: number;
          grand_total?: number;
          currency?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          customer_id?: string;
          status?: OrderStatus;
          payment_status?: OrderPaymentStatus;
          subtotal?: number;
          vat_total?: number;
          shipping_total?: number;
          grand_total?: number;
          currency?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: TableRelationships;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          sku_id: string;
          sku_snapshot: Json;
          quantity: number;
          unit_price: number;
          vat_rate: number;
          line_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          sku_id: string;
          sku_snapshot?: Json;
          quantity: number;
          unit_price: number;
          vat_rate?: number;
          line_total: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          sku_id?: string;
          sku_snapshot?: Json;
          quantity?: number;
          unit_price?: number;
          vat_rate?: number;
          line_total?: number;
          created_at?: string;
        };
        Relationships: TableRelationships;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type ProductSkuRow = Database["public"]["Tables"]["product_skus"]["Row"];
export type InventoryRow = Database["public"]["Tables"]["inventory"]["Row"];
export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
