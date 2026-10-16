export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OwnerType = "servidor" | "pareja_tios";
export type AccessAction = "entry" | "exit";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          cedula: string | null;
          phone: string;
          photo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name?: string;
          last_name?: string;
          cedula?: string | null;
          phone?: string;
          photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          cedula?: string | null;
          phone?: string;
          photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      owners: {
        Row: {
          id: string;
          type: OwnerType;
          primary_name: string;
          secondary_name: string | null;
          photo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type?: OwnerType;
          primary_name: string;
          secondary_name?: string | null;
          photo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: OwnerType;
          primary_name?: string;
          secondary_name?: string | null;
          photo_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      vehicles: {
        Row: {
          id: string;
          owner_id: string;
          plate: string;
          model_color: string;
          qr_code_hash: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          plate: string;
          model_color?: string;
          qr_code_hash: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          plate?: string;
          model_color?: string;
          qr_code_hash?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vehicles_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "owners";
            referencedColumns: ["id"];
          },
        ];
      };
      access_logs: {
        Row: {
          id: string;
          vehicle_id: string;
          action: AccessAction;
          timestamp: string;
          registered_by: string | null;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          action: AccessAction;
          timestamp?: string;
          registered_by?: string | null;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          action?: AccessAction;
          timestamp?: string;
          registered_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "access_logs_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      vehicle_status: {
        Row: {
          vehicle_id: string;
          plate: string;
          model_color: string;
          qr_code_hash: string;
          owner_id: string;
          owner_type: OwnerType;
          primary_name: string;
          secondary_name: string | null;
          photo_url: string | null;
          last_action: AccessAction | null;
          last_timestamp: string | null;
          is_inside: boolean;
          last_registered_by: string | null;
          last_registered_by_name: string | null;
        };
        Relationships: [];
      };
      staff: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          photo_url: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      cedula_disponible: {
        Args: { p_cedula: string; p_exclude?: string };
        Returns: boolean;
      };
    };
    Enums: {
      owner_type: OwnerType;
      access_action: AccessAction;
    };
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type Views<T extends keyof PublicSchema["Views"]> =
  PublicSchema["Views"][T]["Row"];

export type Profile = Tables<"profiles">;
export type Owner = Tables<"owners">;
export type Vehicle = Tables<"vehicles">;
export type AccessLog = Tables<"access_logs">;
export type VehicleStatus = Views<"vehicle_status">;
export type Staff = Views<"staff">;

export interface VehicleWithOwner extends Vehicle {
  owner: Owner;
}

export interface OwnerWithVehicles extends Owner {
  vehicles: Vehicle[];
}

export interface AccessLogWithVehicle extends AccessLog {
  vehicle: VehicleWithOwner;
  registrar: Staff | null;
}
