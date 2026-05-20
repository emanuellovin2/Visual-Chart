export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          thumbnail_url: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string
          description?: string | null
          thumbnail_url?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          thumbnail_url?: string | null
          is_public?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'projects_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      nodes: {
        Row: {
          id: string
          project_id: string
          type: string
          position_x: number
          position_y: number
          width: number
          height: number
          data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          type: string
          position_x?: number
          position_y?: number
          width?: number
          height?: number
          data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          type?: string
          position_x?: number
          position_y?: number
          width?: number
          height?: number
          data?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'nodes_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          }
        ]
      }
      edges: {
        Row: {
          id: string
          project_id: string
          source_id: string
          target_id: string
          type: string
          data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          source_id: string
          target_id: string
          type?: string
          data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          type?: string
          data?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'edges_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          }
        ]
      }
      project_collaborators: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: 'viewer' | 'editor' | 'admin'
          invited_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role?: 'viewer' | 'editor' | 'admin'
          invited_by?: string | null
          created_at?: string
        }
        Update: {
          role?: 'viewer' | 'editor' | 'admin'
        }
        Relationships: [
          {
            foreignKeyName: 'project_collaborators_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_collaborators_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      canvas_snapshots: {
        Row: {
          id: string
          project_id: string
          snapshot: Json
          label: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          snapshot: Json
          label?: string | null
          created_at?: string
        }
        Update: {
          snapshot?: Json
          label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'canvas_snapshots_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      save_canvas: {
        Args: {
          p_project_id: string
          p_nodes: Json
          p_edges: Json
        }
        Returns: void
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
