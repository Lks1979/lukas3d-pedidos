export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      pedidos: {
        Row: {
          user_id: string;
          id: string;
          pedido: Json;
        };
        Insert: {
          user_id: string;
          id: string;
          pedido: Json;
        };
        Update: {
          user_id?: string;
          id?: string;
          pedido?: Json;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      substituir_pedidos: {
        Args: { p_pedidos: Json };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
