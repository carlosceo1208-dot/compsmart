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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      benefit_eligibility: {
        Row: {
          benefit_id: string | null
          created_at: string | null
          custom_value: number | null
          grade: string
          id: string
        }
        Insert: {
          benefit_id?: string | null
          created_at?: string | null
          custom_value?: number | null
          grade: string
          id?: string
        }
        Update: {
          benefit_id?: string | null
          created_at?: string | null
          custom_value?: number | null
          grade?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "benefit_eligibility_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          },
        ]
      }
      benefits: {
        Row: {
          benefit_type: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          value_per_employee: number | null
        }
        Insert: {
          benefit_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          value_per_employee?: number | null
        }
        Update: {
          benefit_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          value_per_employee?: number | null
        }
        Relationships: []
      }
      budget: {
        Row: {
          budgeted_headcount: number
          budgeted_salary: number
          created_at: string | null
          fiscal_year: number
          id: string
          month: number
          updated_at: string | null
        }
        Insert: {
          budgeted_headcount: number
          budgeted_salary: number
          created_at?: string | null
          fiscal_year: number
          id?: string
          month: number
          updated_at?: string | null
        }
        Update: {
          budgeted_headcount?: number
          budgeted_salary?: number
          created_at?: string | null
          fiscal_year?: number
          id?: string
          month?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      competencies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_benefits: {
        Row: {
          benefit_id: string
          company_contribution_value: number
          created_at: string | null
          employee_contribution_value: number | null
          employee_id: string
          end_date: string | null
          id: string
          is_active: boolean | null
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          benefit_id: string
          company_contribution_value: number
          created_at?: string | null
          employee_contribution_value?: number | null
          employee_id: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          benefit_id?: string
          company_contribution_value?: number
          created_at?: string | null
          employee_contribution_value?: number | null
          employee_id?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_benefits_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_benefits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      incentive_eligibility: {
        Row: {
          created_at: string | null
          custom_percentage: number | null
          grade: string
          id: string
          program_id: string | null
        }
        Insert: {
          created_at?: string | null
          custom_percentage?: number | null
          grade: string
          id?: string
          program_id?: string | null
        }
        Update: {
          created_at?: string | null
          custom_percentage?: number | null
          grade?: string
          id?: string
          program_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incentive_eligibility_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "incentive_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      incentive_programs: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          payment_frequency: string | null
          program_type: string
          target_percentage: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          payment_frequency?: string | null
          program_type: string
          target_percentage?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          payment_frequency?: string | null
          program_type?: string
          target_percentage?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      job_families: {
        Row: {
          color_class: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          color_class?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          color_class?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      job_title_competencies: {
        Row: {
          competency_id: string
          created_at: string
          id: string
          is_required: boolean
          job_title_id: string
          required_level: Database["public"]["Enums"]["proficiency_level"]
          updated_at: string
        }
        Insert: {
          competency_id: string
          created_at?: string
          id?: string
          is_required?: boolean
          job_title_id: string
          required_level?: Database["public"]["Enums"]["proficiency_level"]
          updated_at?: string
        }
        Update: {
          competency_id?: string
          created_at?: string
          id?: string
          is_required?: boolean
          job_title_id?: string
          required_level?: Database["public"]["Enums"]["proficiency_level"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_title_competencies_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_title_competencies_job_title_id_fkey"
            columns: ["job_title_id"]
            isOneToOne: false
            referencedRelation: "job_titles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_titles: {
        Row: {
          cbo: string
          code: string
          created_at: string
          grade: string
          hard_skills: string | null
          id: string
          is_active: boolean
          job_family: string
          job_impact: string | null
          key_factors: string | null
          main_responsibilities: string | null
          median_points: number
          required_education: string | null
          required_experience: string | null
          salary_range_id: string | null
          soft_skills: string | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cbo: string
          code: string
          created_at?: string
          grade: string
          hard_skills?: string | null
          id?: string
          is_active?: boolean
          job_family: string
          job_impact?: string | null
          key_factors?: string | null
          main_responsibilities?: string | null
          median_points: number
          required_education?: string | null
          required_experience?: string | null
          salary_range_id?: string | null
          soft_skills?: string | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cbo?: string
          code?: string
          created_at?: string
          grade?: string
          hard_skills?: string | null
          id?: string
          is_active?: boolean
          job_family?: string
          job_impact?: string | null
          key_factors?: string | null
          main_responsibilities?: string | null
          median_points?: number
          required_education?: string | null
          required_experience?: string | null
          salary_range_id?: string | null
          soft_skills?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_titles_salary_range_id_fkey"
            columns: ["salary_range_id"]
            isOneToOne: false
            referencedRelation: "salary_ranges"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_assistant_conversations: {
        Row: {
          answer: string
          created_at: string
          id: string
          legal_references: Json | null
          question: string
          response_time_ms: number | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          legal_references?: Json | null
          question: string
          response_time_ms?: number | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          legal_references?: Json | null
          question?: string
          response_time_ms?: number | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      organizational_structure: {
        Row: {
          address: string | null
          base_date: string | null
          cnpj: string | null
          code: string | null
          created_at: string
          description: string | null
          fantasy_name: string | null
          id: string
          name: string
          parent_id: string | null
          root_company_id: string | null
          type: string
          union_name: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          base_date?: string | null
          cnpj?: string | null
          code?: string | null
          created_at?: string
          description?: string | null
          fantasy_name?: string | null
          id?: string
          name: string
          parent_id?: string | null
          root_company_id?: string | null
          type: string
          union_name?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          base_date?: string | null
          cnpj?: string | null
          code?: string | null
          created_at?: string
          description?: string | null
          fantasy_name?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          root_company_id?: string | null
          type?: string
          union_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizational_structure_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizational_structure_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          benefits_value: number | null
          birth_date: string | null
          cpf: string | null
          created_at: string
          email: string
          employee_number: string | null
          full_name: string
          grade: string | null
          has_system_access: boolean | null
          id: string
          job_title: string | null
          job_title_id: string | null
          long_term_incentive: number | null
          manager_id: string | null
          performance_rating: number | null
          phone: string | null
          salary: number | null
          salary_range_percentage: number | null
          short_term_incentive: number | null
          status: Database["public"]["Enums"]["user_status"]
          unit_id: string | null
          updated_at: string
          variable_salary: number | null
        }
        Insert: {
          benefits_value?: number | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          employee_number?: string | null
          full_name: string
          grade?: string | null
          has_system_access?: boolean | null
          id: string
          job_title?: string | null
          job_title_id?: string | null
          long_term_incentive?: number | null
          manager_id?: string | null
          performance_rating?: number | null
          phone?: string | null
          salary?: number | null
          salary_range_percentage?: number | null
          short_term_incentive?: number | null
          status?: Database["public"]["Enums"]["user_status"]
          unit_id?: string | null
          updated_at?: string
          variable_salary?: number | null
        }
        Update: {
          benefits_value?: number | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          employee_number?: string | null
          full_name?: string
          grade?: string | null
          has_system_access?: boolean | null
          id?: string
          job_title?: string | null
          job_title_id?: string | null
          long_term_incentive?: number | null
          manager_id?: string | null
          performance_rating?: number | null
          phone?: string | null
          salary?: number | null
          salary_range_percentage?: number | null
          short_term_incentive?: number | null
          status?: Database["public"]["Enums"]["user_status"]
          unit_id?: string | null
          updated_at?: string
          variable_salary?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_job_title_id_fkey"
            columns: ["job_title_id"]
            isOneToOne: false
            referencedRelation: "job_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_position_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_ranges: {
        Row: {
          calculation_mode: Database["public"]["Enums"]["calculation_mode"]
          created_at: string
          grade: string
          id: string
          input_amplitude: number | null
          input_median: number | null
          max_value: number
          median_value: number
          min_value: number
          q1_value: number
          q3_value: number
          salary_table_id: string | null
          updated_at: string
        }
        Insert: {
          calculation_mode?: Database["public"]["Enums"]["calculation_mode"]
          created_at?: string
          grade: string
          id?: string
          input_amplitude?: number | null
          input_median?: number | null
          max_value: number
          median_value: number
          min_value: number
          q1_value: number
          q3_value: number
          salary_table_id?: string | null
          updated_at?: string
        }
        Update: {
          calculation_mode?: Database["public"]["Enums"]["calculation_mode"]
          created_at?: string
          grade?: string
          id?: string
          input_amplitude?: number | null
          input_median?: number | null
          max_value?: number
          median_value?: number
          min_value?: number
          q1_value?: number
          q3_value?: number
          salary_table_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_ranges_salary_table_id_fkey"
            columns: ["salary_table_id"]
            isOneToOne: false
            referencedRelation: "salary_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_tables: {
        Row: {
          created_at: string
          effective_month: number
          effective_year: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_month: number
          effective_year: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_month?: number
          effective_year?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      survey_data: {
        Row: {
          calculation_mode: Database["public"]["Enums"]["calculation_mode"]
          created_at: string
          grade: string
          id: string
          input_amplitude: number | null
          input_median: number | null
          job_code: string | null
          job_title: string
          max_value: number
          median_value: number
          min_value: number
          q1_value: number
          q3_value: number
          survey_table_id: string
          updated_at: string
        }
        Insert: {
          calculation_mode?: Database["public"]["Enums"]["calculation_mode"]
          created_at?: string
          grade: string
          id?: string
          input_amplitude?: number | null
          input_median?: number | null
          job_code?: string | null
          job_title: string
          max_value: number
          median_value: number
          min_value: number
          q1_value: number
          q3_value: number
          survey_table_id: string
          updated_at?: string
        }
        Update: {
          calculation_mode?: Database["public"]["Enums"]["calculation_mode"]
          created_at?: string
          grade?: string
          id?: string
          input_amplitude?: number | null
          input_median?: number | null
          job_code?: string | null
          job_title?: string
          max_value?: number
          median_value?: number
          min_value?: number
          q1_value?: number
          q3_value?: number
          survey_table_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_data_survey_table_id_fkey"
            columns: ["survey_table_id"]
            isOneToOne: false
            referencedRelation: "survey_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_tables: {
        Row: {
          created_at: string
          default_amplitude: number | null
          effective_month: number
          effective_year: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_amplitude?: number | null
          effective_month: number
          effective_year: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_amplitude?: number | null
          effective_month?: number
          effective_year?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_labels: {
        Row: {
          created_at: string
          custom_label: string | null
          default_label: string
          description: string | null
          id: string
          key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_label?: string | null
          default_label: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_label?: string | null
          default_label?: string
          description?: string | null
          id?: string
          key?: string
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
      user_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_employee_benefits: {
        Args: { p_employee_id: string }
        Returns: number
      }
      calculate_salary_range: {
        Args: { p_amplitude: number; p_median: number }
        Returns: {
          max_value: number
          median_value: number
          min_value: number
          q1_value: number
          q3_value: number
        }[]
      }
      calculate_salary_range_fixed: {
        Args: { p_median: number }
        Returns: {
          max_value: number
          median_value: number
          min_value: number
          q1_value: number
          q3_value: number
        }[]
      }
      get_org_breadcrumb: { Args: { entity_id: string }; Returns: string }
      get_org_breadcrumb_friendly: {
        Args: { entity_id: string }
        Returns: string
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      manage_user_roles: {
        Args: {
          p_roles: Database["public"]["Enums"]["app_role"][]
          p_user_id: string
        }
        Returns: undefined
      }
      recalculate_salary_range_percentages: {
        Args: never
        Returns: {
          employee_grade: string
          employee_id: string
          employee_name: string
          new_percentage: number
          old_percentage: number
          range_info: string
          salary: number
          status: string
        }[]
      }
      suggest_next_employee_number: { Args: never; Returns: string }
      validate_cpf_format: { Args: { cpf_value: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "hr_manager" | "manager" | "employee"
      calculation_mode: "manual" | "automatic"
      proficiency_level: "basic" | "intermediate" | "advanced" | "expert"
      user_status: "active" | "inactive"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "hr_manager", "manager", "employee"],
      calculation_mode: ["manual", "automatic"],
      proficiency_level: ["basic", "intermediate", "advanced", "expert"],
      user_status: ["active", "inactive"],
    },
  },
} as const
