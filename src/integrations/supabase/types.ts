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
      alert_configurations: {
        Row: {
          alert_type: string
          check_frequency: string | null
          created_at: string | null
          created_by: string | null
          enabled: boolean | null
          id: string
          recipients: string[]
          root_company_id: string
          severity: string | null
          threshold_unit: string | null
          threshold_value: number
          updated_at: string | null
        }
        Insert: {
          alert_type: string
          check_frequency?: string | null
          created_at?: string | null
          created_by?: string | null
          enabled?: boolean | null
          id?: string
          recipients: string[]
          root_company_id: string
          severity?: string | null
          threshold_unit?: string | null
          threshold_value: number
          updated_at?: string | null
        }
        Update: {
          alert_type?: string
          check_frequency?: string | null
          created_at?: string | null
          created_by?: string | null
          enabled?: boolean | null
          id?: string
          recipients?: string[]
          root_company_id?: string
          severity?: string | null
          threshold_unit?: string | null
          threshold_value?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_configurations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_configurations_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_history: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          context: Json | null
          created_at: string | null
          description: string
          email_recipients: string[] | null
          email_sent: boolean | null
          email_sent_at: string | null
          id: string
          metric_value: number
          resolved_at: string | null
          root_company_id: string
          severity: string
          status: string | null
          threshold_value: number
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          context?: Json | null
          created_at?: string | null
          description: string
          email_recipients?: string[] | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          metric_value: number
          resolved_at?: string | null
          root_company_id: string
          severity: string
          status?: string | null
          threshold_value: number
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          context?: Json | null
          created_at?: string | null
          description?: string
          email_recipients?: string[] | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          metric_value?: number
          resolved_at?: string | null
          root_company_id?: string
          severity?: string
          status?: string | null
          threshold_value?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_history_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_history_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
        ]
      }
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
          {
            foreignKeyName: "benefit_eligibility_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "v_benefit_eligibility_report"
            referencedColumns: ["benefit_id"]
          },
        ]
      }
      benefit_eligibility_rules: {
        Row: {
          benefit_id: string
          company_contribution_value: number
          created_at: string | null
          description: string | null
          employee_contribution_type: string | null
          employee_contribution_value: number | null
          grade_max: string | null
          grade_min: string | null
          id: string
          is_active: boolean | null
          salary_max: number | null
          salary_min: number | null
          updated_at: string | null
        }
        Insert: {
          benefit_id: string
          company_contribution_value: number
          created_at?: string | null
          description?: string | null
          employee_contribution_type?: string | null
          employee_contribution_value?: number | null
          grade_max?: string | null
          grade_min?: string | null
          id?: string
          is_active?: boolean | null
          salary_max?: number | null
          salary_min?: number | null
          updated_at?: string | null
        }
        Update: {
          benefit_id?: string
          company_contribution_value?: number
          created_at?: string | null
          description?: string | null
          employee_contribution_type?: string | null
          employee_contribution_value?: number | null
          grade_max?: string | null
          grade_min?: string | null
          id?: string
          is_active?: boolean | null
          salary_max?: number | null
          salary_min?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "benefit_eligibility_rules_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benefit_eligibility_rules_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "v_benefit_eligibility_report"
            referencedColumns: ["benefit_id"]
          },
        ]
      }
      benefits: {
        Row: {
          benefit_type: string
          created_at: string | null
          default_employee_contribution_type: string | null
          default_employee_contribution_value: number | null
          description: string | null
          eligibility_type: string | null
          id: string
          is_active: boolean | null
          is_template: boolean | null
          name: string
          root_company_id: string
          template_type: string | null
          updated_at: string | null
          value_per_employee: number | null
        }
        Insert: {
          benefit_type: string
          created_at?: string | null
          default_employee_contribution_type?: string | null
          default_employee_contribution_value?: number | null
          description?: string | null
          eligibility_type?: string | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          name: string
          root_company_id: string
          template_type?: string | null
          updated_at?: string | null
          value_per_employee?: number | null
        }
        Update: {
          benefit_type?: string
          created_at?: string | null
          default_employee_contribution_type?: string | null
          default_employee_contribution_value?: number | null
          description?: string | null
          eligibility_type?: string | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          name?: string
          root_company_id?: string
          template_type?: string | null
          updated_at?: string | null
          value_per_employee?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "benefits_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
        ]
      }
      budget: {
        Row: {
          budgeted_headcount: number
          budgeted_salary: number
          created_at: string | null
          fiscal_year: number
          id: string
          month: number
          submission_id: string | null
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          budgeted_headcount: number
          budgeted_salary: number
          created_at?: string | null
          fiscal_year: number
          id?: string
          month: number
          submission_id?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          budgeted_headcount?: number
          budgeted_salary?: number
          created_at?: string | null
          fiscal_year?: number
          id?: string
          month?: number
          submission_id?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "budget_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_employee_projections: {
        Row: {
          change_type: string | null
          created_at: string
          created_by: string
          employee_id: string | null
          fiscal_year: number
          id: string
          is_active: boolean | null
          is_planned_hire: boolean | null
          justification: string | null
          month: number
          planned_employee_name: string | null
          projected_benefits: number
          projected_fixed_salary: number
          projected_grade: string | null
          projected_job_title_id: string | null
          projected_unit_id: string | null
          projected_variable_salary: number
          updated_at: string
        }
        Insert: {
          change_type?: string | null
          created_at?: string
          created_by: string
          employee_id?: string | null
          fiscal_year: number
          id?: string
          is_active?: boolean | null
          is_planned_hire?: boolean | null
          justification?: string | null
          month: number
          planned_employee_name?: string | null
          projected_benefits?: number
          projected_fixed_salary?: number
          projected_grade?: string | null
          projected_job_title_id?: string | null
          projected_unit_id?: string | null
          projected_variable_salary?: number
          updated_at?: string
        }
        Update: {
          change_type?: string | null
          created_at?: string
          created_by?: string
          employee_id?: string | null
          fiscal_year?: number
          id?: string
          is_active?: boolean | null
          is_planned_hire?: boolean | null
          justification?: string | null
          month?: number
          planned_employee_name?: string | null
          projected_benefits?: number
          projected_fixed_salary?: number
          projected_grade?: string | null
          projected_job_title_id?: string | null
          projected_unit_id?: string | null
          projected_variable_salary?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_employee_projections_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_employee_projections_projected_job_title_id_fkey"
            columns: ["projected_job_title_id"]
            isOneToOne: false
            referencedRelation: "job_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_employee_projections_projected_unit_id_fkey"
            columns: ["projected_unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_submissions: {
        Row: {
          created_at: string
          fiscal_year: number
          id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submission_notes: string | null
          submitted_at: string | null
          submitted_by: string | null
          unit_id: string | null
          unlock_justification: string | null
          unlocked_at: string | null
          unlocked_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          fiscal_year: number
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submission_notes?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          unit_id?: string | null
          unlock_justification?: string | null
          unlocked_at?: string | null
          unlocked_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          fiscal_year?: number
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submission_notes?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          unit_id?: string | null
          unlock_justification?: string | null
          unlocked_at?: string | null
          unlocked_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_submissions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
        ]
      }
      company_subscriptions: {
        Row: {
          annual_price: number
          billing_cycle: string
          canceled_at: string | null
          canceled_by: string | null
          cancellation_reason: string | null
          company_id: string
          created_at: string
          created_by: string | null
          ended_at: string | null
          id: string
          monthly_price: number
          plan_id: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          annual_price: number
          billing_cycle: string
          canceled_at?: string | null
          canceled_by?: string | null
          cancellation_reason?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          monthly_price: number
          plan_id: string
          started_at?: string
          status: string
          updated_at?: string
        }
        Update: {
          annual_price?: number
          billing_cycle?: string
          canceled_at?: string | null
          canceled_by?: string | null
          cancellation_reason?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          monthly_price?: number
          plan_id?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
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
      conversation_sessions: {
        Row: {
          agent_type: string
          created_at: string | null
          id: string
          is_archived: boolean | null
          last_message_at: string | null
          message_count: number | null
          root_company_id: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          agent_type: string
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          last_message_at?: string | null
          message_count?: number | null
          root_company_id?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          agent_type?: string
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          last_message_at?: string | null
          message_count?: number | null
          root_company_id?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_sessions_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_benefits: {
        Row: {
          benefit_id: string
          company_contribution_value: number
          created_at: string | null
          eligibility_rule_id: string | null
          employee_contribution_type: string
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
          eligibility_rule_id?: string | null
          employee_contribution_type?: string
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
          eligibility_rule_id?: string | null
          employee_contribution_type?: string
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
            foreignKeyName: "employee_benefits_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "v_benefit_eligibility_report"
            referencedColumns: ["benefit_id"]
          },
          {
            foreignKeyName: "employee_benefits_eligibility_rule_id_fkey"
            columns: ["eligibility_rule_id"]
            isOneToOne: false
            referencedRelation: "benefit_eligibility_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_benefits_eligibility_rule_id_fkey"
            columns: ["eligibility_rule_id"]
            isOneToOne: false
            referencedRelation: "v_benefit_eligibility_report"
            referencedColumns: ["rule_id"]
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
      employee_incentive_assignments: {
        Row: {
          actual_value: number | null
          created_at: string | null
          employee_id: string
          id: string
          is_active: boolean | null
          notes: string | null
          program_id: string
          target_value: number
          updated_at: string | null
          vesting_start_date: string | null
        }
        Insert: {
          actual_value?: number | null
          created_at?: string | null
          employee_id: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          program_id: string
          target_value?: number
          updated_at?: string | null
          vesting_start_date?: string | null
        }
        Update: {
          actual_value?: number | null
          created_at?: string | null
          employee_id?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          program_id?: string
          target_value?: number
          updated_at?: string | null
          vesting_start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_incentive_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_incentive_assignments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "incentive_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      incentive_assistant_conversations: {
        Row: {
          answer: string
          context_data: Json | null
          created_at: string | null
          document_name: string | null
          document_text: string | null
          id: string
          operation_mode: string | null
          question: string
          response_time_ms: number | null
          session_id: string | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          answer: string
          context_data?: Json | null
          created_at?: string | null
          document_name?: string | null
          document_text?: string | null
          id?: string
          operation_mode?: string | null
          question: string
          response_time_ms?: number | null
          session_id?: string | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          answer?: string
          context_data?: Json | null
          created_at?: string | null
          document_name?: string | null
          document_text?: string | null
          id?: string
          operation_mode?: string | null
          question?: string
          response_time_ms?: number | null
          session_id?: string | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incentive_assistant_conversations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
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
          cliff_months: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          matching_percentage: number | null
          name: string
          payment_frequency: string | null
          program_type: string
          root_company_id: string
          subtype: string | null
          target_percentage: number | null
          updated_at: string | null
          vesting_months: number | null
        }
        Insert: {
          cliff_months?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          matching_percentage?: number | null
          name: string
          payment_frequency?: string | null
          program_type: string
          root_company_id: string
          subtype?: string | null
          target_percentage?: number | null
          updated_at?: string | null
          vesting_months?: number | null
        }
        Update: {
          cliff_months?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          matching_percentage?: number | null
          name?: string
          payment_frequency?: string | null
          program_type?: string
          root_company_id?: string
          subtype?: string | null
          target_percentage?: number | null
          updated_at?: string | null
          vesting_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "incentive_programs_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          item_type: string | null
          period_end: string | null
          period_start: string | null
          plan_id: string | null
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          item_type?: string | null
          period_end?: string | null
          period_start?: string | null
          plan_id?: string | null
          quantity?: number
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          item_type?: string | null
          period_end?: string | null
          period_start?: string | null
          plan_id?: string | null
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          discount: number | null
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          status: string
          subscription_id: string | null
          subtotal: number
          tax: number | null
          total: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          discount?: number | null
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string
          subscription_id?: string | null
          subtotal?: number
          tax?: number | null
          total?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          discount?: number | null
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string
          subscription_id?: string | null
          subtotal?: number
          tax?: number | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "company_subscriptions"
            referencedColumns: ["id"]
          },
        ]
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
      knowledge_base: {
        Row: {
          agent_type: string
          category: string
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          is_global: boolean | null
          keywords: string[] | null
          root_company_id: string | null
          source_document: string | null
          subcategory: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          agent_type: string
          category: string
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean | null
          keywords?: string[] | null
          root_company_id?: string | null
          source_document?: string | null
          subcategory?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          agent_type?: string
          category?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean | null
          keywords?: string[] | null
          root_company_id?: string | null
          source_document?: string | null
          subcategory?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_assistant_conversations: {
        Row: {
          answer: string
          created_at: string
          document_name: string | null
          document_text: string | null
          id: string
          legal_references: Json | null
          operation_mode: string | null
          question: string
          response_time_ms: number | null
          session_id: string | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          document_name?: string | null
          document_text?: string | null
          id?: string
          legal_references?: Json | null
          operation_mode?: string | null
          question: string
          response_time_ms?: number | null
          session_id?: string | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          document_name?: string | null
          document_text?: string | null
          id?: string
          legal_references?: Json | null
          operation_mode?: string | null
          question?: string
          response_time_ms?: number | null
          session_id?: string | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_assistant_conversations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      organizational_structure: {
        Row: {
          address: string | null
          base_date: string | null
          billing_cycle: string | null
          billing_email: string | null
          cnpj: string | null
          code: string | null
          created_at: string
          custom_annual_price: number | null
          custom_monthly_price: number | null
          description: string | null
          fantasy_name: string | null
          id: string
          logo_url: string | null
          name: string
          parent_id: string | null
          payment_method: string | null
          root_company_id: string | null
          subscription_plan_id: string | null
          subscription_started_at: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          type: string
          union_name: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          base_date?: string | null
          billing_cycle?: string | null
          billing_email?: string | null
          cnpj?: string | null
          code?: string | null
          created_at?: string
          custom_annual_price?: number | null
          custom_monthly_price?: number | null
          description?: string | null
          fantasy_name?: string | null
          id?: string
          logo_url?: string | null
          name: string
          parent_id?: string | null
          payment_method?: string | null
          root_company_id?: string | null
          subscription_plan_id?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          type: string
          union_name?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          base_date?: string | null
          billing_cycle?: string | null
          billing_email?: string | null
          cnpj?: string | null
          code?: string | null
          created_at?: string
          custom_annual_price?: number | null
          custom_monthly_price?: number | null
          description?: string | null
          fantasy_name?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          parent_id?: string | null
          payment_method?: string | null
          root_company_id?: string | null
          subscription_plan_id?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
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
          {
            foreignKeyName: "organizational_structure_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
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
          avatar_url: string | null
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
          root_company_id: string
          salary: number | null
          salary_range_percentage: number | null
          short_term_incentive: number | null
          status: Database["public"]["Enums"]["user_status"]
          unit_id: string | null
          updated_at: string
          variable_salary: number | null
        }
        Insert: {
          avatar_url?: string | null
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
          root_company_id: string
          salary?: number | null
          salary_range_percentage?: number | null
          short_term_incentive?: number | null
          status?: Database["public"]["Enums"]["user_status"]
          unit_id?: string | null
          updated_at?: string
          variable_salary?: number | null
        }
        Update: {
          avatar_url?: string | null
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
          root_company_id?: string
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
          {
            foreignKeyName: "profiles_root_company_id_fkey"
            columns: ["root_company_id"]
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
      salary_assistant_conversations: {
        Row: {
          answer: string
          context_data: Json | null
          created_at: string | null
          document_name: string | null
          id: string
          operation_mode: string | null
          question: string
          response_time_ms: number | null
          session_id: string | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          answer: string
          context_data?: Json | null
          created_at?: string | null
          document_name?: string | null
          id?: string
          operation_mode?: string | null
          question: string
          response_time_ms?: number | null
          session_id?: string | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          answer?: string
          context_data?: Json | null
          created_at?: string | null
          document_name?: string | null
          id?: string
          operation_mode?: string | null
          question?: string
          response_time_ms?: number | null
          session_id?: string | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_assistant_conversations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_assistant_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          root_company_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_month: number
          effective_year: number
          id?: string
          is_active?: boolean
          name: string
          root_company_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_month?: number
          effective_year?: number
          id?: string
          is_active?: boolean
          name?: string
          root_company_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_tables_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          annual_price: number
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          max_employees: number | null
          max_users: number | null
          monthly_price: number
          name: string
          plan_type: string
          setup_fee: number | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          annual_price?: number
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          max_employees?: number | null
          max_users?: number | null
          monthly_price?: number
          name: string
          plan_type: string
          setup_fee?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          annual_price?: number
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          max_employees?: number | null
          max_users?: number | null
          monthly_price?: number
          name?: string
          plan_type?: string
          setup_fee?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      support_conversations: {
        Row: {
          answer: string
          created_at: string | null
          feedback_comment: string | null
          helpful: boolean | null
          id: string
          page_context: string | null
          question: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string | null
          feedback_comment?: string | null
          helpful?: boolean | null
          id?: string
          page_context?: string | null
          question: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string | null
          feedback_comment?: string | null
          helpful?: boolean | null
          id?: string
          page_context?: string | null
          question?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      support_quick_actions: {
        Row: {
          clicks_count: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          page_path: string
          priority: number | null
          question_text: string
        }
        Insert: {
          clicks_count?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          page_path: string
          priority?: number | null
          question_text: string
        }
        Update: {
          clicks_count?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          page_path?: string
          priority?: number | null
          question_text?: string
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
      v_agent_conversations: {
        Row: {
          agent_type: string | null
          answer: string | null
          company_name: string | null
          created_at: string | null
          document_name: string | null
          id: string | null
          operation_mode: string | null
          question: string | null
          response_time_ms: number | null
          root_company_id: string | null
          tokens_used: number | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
          user_roles: string | null
        }
        Relationships: []
      }
      v_benefit_eligibility_report: {
        Row: {
          benefit_id: string | null
          benefit_name: string | null
          company_contribution_value: number | null
          description: string | null
          eligibility_type: string | null
          eligible_employees_count: number | null
          employee_contribution_type: string | null
          employee_contribution_value: number | null
          grade_max: string | null
          grade_min: string | null
          rule_id: string | null
          salary_max: number | null
          salary_min: number | null
          total_projected_cost: number | null
        }
        Relationships: []
      }
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
      calculate_transportation_benefit: {
        Args: { p_employee_id: string; p_monthly_cost: number }
        Returns: {
          company_subsidy: number
          employee_discount: number
          total_cost: number
        }[]
      }
      check_employee_eligibility: {
        Args: { p_benefit_id: string; p_employee_id: string }
        Returns: {
          company_value: number
          description: string
          employee_contribution_type: string
          employee_contribution_value: number
          is_eligible: boolean
          rule_id: string
        }[]
      }
      count_agent_audit_logs: {
        Args: {
          p_agent_type?: string
          p_end_date?: string
          p_operation_mode?: string
          p_start_date?: string
          p_user_id?: string
        }
        Returns: number
      }
      detect_after_hours_usage: {
        Args: { p_company_id: string; p_threshold: number }
        Returns: {
          after_hours_count: number
          detected: boolean
          queries_detail: Json
        }[]
      }
      detect_inactive_users: {
        Args: { p_company_id: string; p_days_threshold: number }
        Returns: {
          detected: boolean
          inactive_count: number
          inactive_users: Json
        }[]
      }
      detect_query_spikes: {
        Args: { p_company_id: string; p_threshold: number }
        Returns: {
          avg_last_7_days: number
          current_count: number
          detected: boolean
          percentage_increase: number
        }[]
      }
      detect_recurring_errors: {
        Args: { p_company_id: string; p_threshold: number }
        Returns: {
          affected_users: string[]
          detected: boolean
          error_count: number
          slow_queries: number
        }[]
      }
      detect_token_overconsumption: {
        Args: {
          p_company_id: string
          p_monthly_limit: number
          p_threshold_percentage: number
        }
        Returns: {
          days_elapsed: number
          detected: boolean
          percentage_used: number
          projected_total: number
          tokens_limit: number
          tokens_used: number
        }[]
      }
      detect_user_concentration: {
        Args: { p_company_id: string; p_threshold: number }
        Returns: {
          concentration_percentage: number
          detected: boolean
          top_user_count: number
          top_user_name: string
          total_count: number
        }[]
      }
      get_agent_audit_logs: {
        Args: {
          p_agent_type?: string
          p_end_date?: string
          p_limit?: number
          p_offset?: number
          p_operation_mode?: string
          p_root_company_id?: string
          p_start_date?: string
          p_user_id?: string
        }
        Returns: {
          agent_type: string
          answer: string
          company_name: string
          created_at: string
          document_name: string
          id: string
          operation_mode: string
          question: string
          response_time_ms: number
          root_company_id: string
          tokens_used: number
          user_email: string
          user_id: string
          user_name: string
          user_roles: string
        }[]
      }
      get_agent_usage_kpis: {
        Args: {
          p_agent_type?: string
          p_end_date: string
          p_root_company_id?: string
          p_start_date: string
          p_user_id?: string
        }
        Returns: {
          avg_response_time: number
          incentive_queries: number
          legal_queries: number
          total_queries: number
          total_tokens: number
          unique_users: number
        }[]
      }
      get_org_breadcrumb: { Args: { entity_id: string }; Returns: string }
      get_org_breadcrumb_friendly: {
        Args: { entity_id: string }
        Returns: string
      }
      get_user_company_id: { Args: never; Returns: string }
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
