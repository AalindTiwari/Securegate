export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            audit_logs: {
                Row: {
                    action: string
                    bootstrap_id: string | null
                    connection_id: string | null
                    created_at: string | null
                    id: string
                    ip_address: string | null
                    metadata: Json | null
                    provider: string | null
                    user_agent: string | null
                    user_id: string | null
                }
                Insert: {
                    action: string
                    bootstrap_id?: string | null
                    connection_id?: string | null
                    created_at?: string | null
                    id?: string
                    ip_address?: string | null
                    metadata?: Json | null
                    provider?: string | null
                    user_agent?: string | null
                    user_id?: string | null
                }
                Update: {
                    action?: string
                    bootstrap_id?: string | null
                    connection_id?: string | null
                    created_at?: string | null
                    id?: string
                    ip_address?: string | null
                    metadata?: Json | null
                    provider?: string | null
                    user_agent?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "audit_logs_bootstrap_id_fkey"
                        columns: ["bootstrap_id"]
                        isOneToOne: false
                        referencedRelation: "bootstrap_tokens"
                        referencedColumns: ["id"]
                    },
                ]
            }
            bootstrap_tokens: {
                Row: {
                    bound_at: string | null
                    bound_ip: string | null
                    connection_id: string | null
                    created_at: string | null
                    expires_at: string | null
                    id: string
                    label: string | null
                    provider: string
                    status: string | null
                    token_hash: string
                    user_id: string
                }
                Insert: {
                    bound_at?: string | null
                    bound_ip?: string | null
                    connection_id?: string | null
                    created_at?: string | null
                    expires_at?: string | null
                    id?: string
                    label?: string | null
                    provider: string
                    status?: string | null
                    token_hash: string
                    user_id: string
                }
                Update: {
                    bound_at?: string | null
                    bound_ip?: string | null
                    connection_id?: string | null
                    created_at?: string | null
                    expires_at?: string | null
                    id?: string
                    label?: string | null
                    provider?: string
                    status?: string | null
                    token_hash?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "bootstrap_tokens_connection_id_fkey"
                        columns: ["connection_id"]
                        isOneToOne: false
                        referencedRelation: "provider_connections"
                        referencedColumns: ["connection_id"]
                    },
                ]
            }
            provider_connections: {
                Row: {
                    auth_tag: string
                    connection_id: string
                    created_at: string | null
                    encrypted_api_key: string
                    id: string
                    iv: string
                    provider: string
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    auth_tag: string
                    connection_id: string
                    created_at?: string | null
                    encrypted_api_key: string
                    id?: string
                    iv: string
                    provider: string
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    auth_tag?: string
                    connection_id?: string
                    created_at?: string | null
                    encrypted_api_key?: string
                    id?: string
                    iv?: string
                    provider?: string
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: []
            }
            security_restrictions: {
                Row: {
                    allowed_countries: string[] | null
                    allowed_ips: string[] | null
                    connection_id: string
                    created_at: string | null
                    device_fingerprint_hash: string | null
                    device_label: string | null
                    device_lock_enabled: boolean | null
                    geo_lock_enabled: boolean | null
                    id: string
                    ip_lock_enabled: boolean | null
                    updated_at: string | null
                }
                Insert: {
                    allowed_countries?: string[] | null
                    allowed_ips?: string[] | null
                    connection_id: string
                    created_at?: string | null
                    device_fingerprint_hash?: string | null
                    device_label?: string | null
                    device_lock_enabled?: boolean | null
                    geo_lock_enabled?: boolean | null
                    id?: string
                    ip_lock_enabled?: boolean | null
                    updated_at?: string | null
                }
                Update: {
                    allowed_countries?: string[] | null
                    allowed_ips?: string[] | null
                    connection_id?: string
                    created_at?: string | null
                    device_fingerprint_hash?: string | null
                    device_label?: string | null
                    device_lock_enabled?: boolean | null
                    geo_lock_enabled?: boolean | null
                    id?: string
                    ip_lock_enabled?: boolean | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "security_restrictions_connection_id_fkey"
                        columns: ["connection_id"]
                        isOneToOne: true
                        referencedRelation: "provider_connections"
                        referencedColumns: ["connection_id"]
                    },
                ]
            }
            session_keys: {
                Row: {
                    bootstrap_id: string
                    bound_ip: string
                    created_at: string | null
                    expires_at: string | null
                    id: string
                    last_used_at: string | null
                    request_count: number | null
                    session_hash: string
                }
                Insert: {
                    bootstrap_id: string
                    bound_ip: string
                    created_at?: string | null
                    expires_at?: string | null
                    id?: string
                    last_used_at?: string | null
                    request_count?: number | null
                    session_hash: string
                }
                Update: {
                    bootstrap_id?: string
                    bound_ip?: string
                    created_at?: string | null
                    expires_at?: string | null
                    id?: string
                    last_used_at?: string | null
                    request_count?: number | null
                    session_hash?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "session_keys_bootstrap_id_fkey"
                        columns: ["bootstrap_id"]
                        isOneToOne: false
                        referencedRelation: "bootstrap_tokens"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
}
    ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
}
    ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
}
    ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
