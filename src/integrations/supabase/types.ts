export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bens: {
        Row: {
          categoria_id: string | null
          created_at: string
          data_aquisicao: string | null
          descricao: string
          estado: Database["public"]["Enums"]["estado_conservacao"]
          id: string
          marca: string
          modelo: string
          nota_fiscal: string
          numero_patrimonio: string
          numero_serie: string
          observacoes: string
          responsavel: string
          setor_id: string | null
          situacao: Database["public"]["Enums"]["situacao_bem"]
          updated_at: string
          valor_aquisicao: number
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          data_aquisicao?: string | null
          descricao: string
          estado?: Database["public"]["Enums"]["estado_conservacao"]
          id?: string
          marca?: string
          modelo?: string
          nota_fiscal?: string
          numero_patrimonio: string
          numero_serie?: string
          observacoes?: string
          responsavel?: string
          setor_id?: string | null
          situacao?: Database["public"]["Enums"]["situacao_bem"]
          updated_at?: string
          valor_aquisicao?: number
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          data_aquisicao?: string | null
          descricao?: string
          estado?: Database["public"]["Enums"]["estado_conservacao"]
          id?: string
          marca?: string
          modelo?: string
          nota_fiscal?: string
          numero_patrimonio?: string
          numero_serie?: string
          observacoes?: string
          responsavel?: string
          setor_id?: string | null
          situacao?: Database["public"]["Enums"]["situacao_bem"]
          updated_at?: string
          valor_aquisicao?: number
        }
        Relationships: [
          {
            foreignKeyName: "bens_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bens_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          created_at: string
          descricao: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventario_itens: {
        Row: {
          bem_id: string
          conferido_em: string | null
          conferido_por: string | null
          id: string
          inventario_id: string
          observacao: string
          status: Database["public"]["Enums"]["status_conferencia"]
        }
        Insert: {
          bem_id: string
          conferido_em?: string | null
          conferido_por?: string | null
          id?: string
          inventario_id: string
          observacao?: string
          status?: Database["public"]["Enums"]["status_conferencia"]
        }
        Update: {
          bem_id?: string
          conferido_em?: string | null
          conferido_por?: string | null
          id?: string
          inventario_id?: string
          observacao?: string
          status?: Database["public"]["Enums"]["status_conferencia"]
        }
        Relationships: [
          {
            foreignKeyName: "inventario_itens_bem_id_fkey"
            columns: ["bem_id"]
            isOneToOne: false
            referencedRelation: "bens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventario_itens_inventario_id_fkey"
            columns: ["inventario_id"]
            isOneToOne: false
            referencedRelation: "inventarios"
            referencedColumns: ["id"]
          },
        ]
      }
      inventarios: {
        Row: {
          created_at: string
          data_fim: string | null
          data_inicio: string
          encerrado: boolean
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          encerrado?: boolean
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          encerrado?: boolean
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      movimentacoes: {
        Row: {
          bem_id: string
          created_at: string
          data_movimentacao: string
          id: string
          observacao: string
          registrado_por: string | null
          responsavel_destino: string
          responsavel_origem: string
          setor_destino_id: string | null
          setor_origem_id: string | null
          tipo: Database["public"]["Enums"]["tipo_movimentacao"]
        }
        Insert: {
          bem_id: string
          created_at?: string
          data_movimentacao?: string
          id?: string
          observacao?: string
          registrado_por?: string | null
          responsavel_destino?: string
          responsavel_origem?: string
          setor_destino_id?: string | null
          setor_origem_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_movimentacao"]
        }
        Update: {
          bem_id?: string
          created_at?: string
          data_movimentacao?: string
          id?: string
          observacao?: string
          registrado_por?: string | null
          responsavel_destino?: string
          responsavel_origem?: string
          setor_destino_id?: string | null
          setor_origem_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_movimentacao"]
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_bem_id_fkey"
            columns: ["bem_id"]
            isOneToOne: false
            referencedRelation: "bens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_setor_destino_id_fkey"
            columns: ["setor_destino_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_setor_origem_id_fkey"
            columns: ["setor_origem_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string
          id: string
          nome?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      setores: {
        Row: {
          created_at: string
          id: string
          localizacao: string
          nome: string
          sigla: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          localizacao?: string
          nome: string
          sigla?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          localizacao?: string
          nome?: string
          sigla?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "consulta"
      estado_conservacao: "novo" | "bom" | "regular" | "ruim" | "inservivel"
      situacao_bem: "em_uso" | "em_estoque" | "em_manutencao" | "baixado"
      status_conferencia:
        | "pendente"
        | "conferido"
        | "nao_localizado"
        | "divergente"
      tipo_movimentacao: "transferencia" | "manutencao" | "baixa" | "cadastro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "consulta"],
      estado_conservacao: ["novo", "bom", "regular", "ruim", "inservivel"],
      situacao_bem: ["em_uso", "em_estoque", "em_manutencao", "baixado"],
      status_conferencia: [
        "pendente",
        "conferido",
        "nao_localizado",
        "divergente",
      ],
      tipo_movimentacao: ["transferencia", "manutencao", "baixa", "cadastro"],
    },
  },
} as const
