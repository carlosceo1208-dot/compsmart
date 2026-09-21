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
      agent_source_citations: {
        Row: {
          agent_type: string
          citation_context: string | null
          conversation_id: string | null
          created_at: string | null
          id: string
          source_category: string | null
          source_reference: string
          source_type: string
          verified: boolean | null
        }
        Insert: {
          agent_type: string
          citation_context?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          source_category?: string | null
          source_reference: string
          source_type: string
          verified?: boolean | null
        }
        Update: {
          agent_type?: string
          citation_context?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          source_category?: string | null
          source_reference?: string
          source_type?: string
          verified?: boolean | null
        }
        Relationships: []
      }
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
            foreignKeyName: "alert_configurations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "alert_configurations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "alert_configurations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "alert_configurations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_configurations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "alert_configurations_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_configurations_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
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
            foreignKeyName: "alert_history_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "alert_history_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "alert_history_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "alert_history_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_history_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "alert_history_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_history_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_assignments: {
        Row: {
          approval_type: string
          approver_id: string
          assigned_at: string
          completed_at: string | null
          created_at: string
          deadline_at: string
          escalated_at: string | null
          escalated_to: string | null
          id: string
          root_company_id: string
          source_id: string
          status: string
        }
        Insert: {
          approval_type: string
          approver_id: string
          assigned_at?: string
          completed_at?: string | null
          created_at?: string
          deadline_at: string
          escalated_at?: string | null
          escalated_to?: string | null
          id?: string
          root_company_id: string
          source_id: string
          status?: string
        }
        Update: {
          approval_type?: string
          approver_id?: string
          assigned_at?: string
          completed_at?: string | null
          created_at?: string
          deadline_at?: string
          escalated_at?: string | null
          escalated_to?: string | null
          id?: string
          root_company_id?: string
          source_id?: string
          status?: string
        }
        Relationships: []
      }
      approval_notifications: {
        Row: {
          assignment_id: string | null
          channel: string
          created_at: string
          error_message: string | null
          id: string
          notification_type: string
          payload: Json
          read_at: string | null
          recipient_id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          assignment_id?: string | null
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type: string
          payload?: Json
          read_at?: string | null
          recipient_id: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          assignment_id?: string | null
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type?: string
          payload?: Json
          read_at?: string | null
          recipient_id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_notifications_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "approval_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_sla_config: {
        Row: {
          approval_type: string
          created_at: string
          escalate_after_days: number
          escalate_to_superior: boolean
          id: string
          notify_email: boolean
          reminder_days_before: number[]
          root_company_id: string
          sla_business_days: number
          updated_at: string
        }
        Insert: {
          approval_type: string
          created_at?: string
          escalate_after_days?: number
          escalate_to_superior?: boolean
          id?: string
          notify_email?: boolean
          reminder_days_before?: number[]
          root_company_id: string
          sla_business_days?: number
          updated_at?: string
        }
        Update: {
          approval_type?: string
          created_at?: string
          escalate_after_days?: number
          escalate_to_superior?: boolean
          id?: string
          notify_email?: boolean
          reminder_days_before?: number[]
          root_company_id?: string
          sla_business_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_sla_config_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_sla_config_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
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
          root_company_id: string | null
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
          root_company_id?: string | null
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
          root_company_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      auth_attempt_logs: {
        Row: {
          attempt_type: string
          company_id: string | null
          created_at: string | null
          email: string
          failure_reason: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          attempt_type: string
          company_id?: string | null
          created_at?: string | null
          email: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          success: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          attempt_type?: string
          company_id?: string | null
          created_at?: string | null
          email?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auth_attempt_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auth_attempt_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "benefits_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
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
          {
            foreignKeyName: "budget_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_approvers: {
        Row: {
          can_self_approve: boolean | null
          created_at: string | null
          id: string
          superior_approver_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_self_approve?: boolean | null
          created_at?: string | null
          id?: string
          superior_approver_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_self_approve?: boolean | null
          created_at?: string | null
          id?: string
          superior_approver_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      budget_deadline_settings: {
        Row: {
          created_at: string | null
          created_by: string | null
          deadline_date: string
          fiscal_year: number
          id: string
          last_reminder_sent_at: string | null
          reminder_days_before: number[] | null
          root_company_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deadline_date: string
          fiscal_year: number
          id?: string
          last_reminder_sent_at?: string | null
          reminder_days_before?: number[] | null
          root_company_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deadline_date?: string
          fiscal_year?: number
          id?: string
          last_reminder_sent_at?: string | null
          reminder_days_before?: number[] | null
          root_company_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_deadline_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_deadline_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "budget_deadline_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "budget_deadline_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "budget_deadline_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_deadline_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "budget_deadline_settings_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_deadline_settings_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
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
            foreignKeyName: "budget_employee_projections_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "budget_employee_projections_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "budget_employee_projections_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "budget_employee_projections_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_employee_projections_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
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
          {
            foreignKeyName: "budget_employee_projections_projected_unit_id_fkey"
            columns: ["projected_unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_submissions: {
        Row: {
          created_at: string
          fiscal_year: number
          id: string
          is_self_approval: boolean | null
          requires_superior_approval: boolean | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          self_approval_justification: string | null
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
          is_self_approval?: boolean | null
          requires_superior_approval?: boolean | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          self_approval_justification?: string | null
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
          is_self_approval?: boolean | null
          requires_superior_approval?: boolean | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          self_approval_justification?: string | null
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
          {
            foreignKeyName: "budget_submissions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_modules: {
        Row: {
          bundle_id: string
          created_at: string
          module_id: string
        }
        Insert: {
          bundle_id: string
          created_at?: string
          module_id: string
        }
        Update: {
          bundle_id?: string
          created_at?: string
          module_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundle_modules_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      bundles: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          is_active: boolean
          nome: string
          percentual_desconto: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          is_active?: boolean
          nome: string
          percentual_desconto?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          is_active?: boolean
          nome?: string
          percentual_desconto?: number
          updated_at?: string
        }
        Relationships: []
      }
      cbo_codes: {
        Row: {
          code: string
          created_at: string | null
          family: string | null
          id: string
          synonyms: string[] | null
          title: string
        }
        Insert: {
          code: string
          created_at?: string | null
          family?: string | null
          id?: string
          synonyms?: string[] | null
          title: string
        }
        Update: {
          code?: string
          created_at?: string | null
          family?: string | null
          id?: string
          synonyms?: string[] | null
          title?: string
        }
        Relationships: []
      }
      checkout_sessions: {
        Row: {
          amount_cents: number
          billing_cycle: string
          boleto_barcode: string | null
          boleto_due_date: string | null
          boleto_url: string | null
          company_id: string | null
          coupon_code: string | null
          created_at: string | null
          discount_cents: number | null
          expires_at: string | null
          id: string
          metadata: Json | null
          pagarme_charge_id: string | null
          pagarme_order_id: string | null
          paid_at: string | null
          payment_method: string
          pix_expiration: string | null
          pix_qr_code: string | null
          pix_qr_code_url: string | null
          plan_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          billing_cycle: string
          boleto_barcode?: string | null
          boleto_due_date?: string | null
          boleto_url?: string | null
          company_id?: string | null
          coupon_code?: string | null
          created_at?: string | null
          discount_cents?: number | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          pagarme_charge_id?: string | null
          pagarme_order_id?: string | null
          paid_at?: string | null
          payment_method: string
          pix_expiration?: string | null
          pix_qr_code?: string | null
          pix_qr_code_url?: string | null
          plan_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          billing_cycle?: string
          boleto_barcode?: string | null
          boleto_due_date?: string | null
          boleto_url?: string | null
          company_id?: string | null
          coupon_code?: string | null
          created_at?: string | null
          discount_cents?: number | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          pagarme_charge_id?: string | null
          pagarme_order_id?: string | null
          paid_at?: string | null
          payment_method?: string
          pix_expiration?: string | null
          pix_qr_code?: string | null
          pix_qr_code_url?: string | null
          plan_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      clima_externo_respostas: {
        Row: {
          comentario_pontos_fortes: string | null
          comentario_pontos_melhoria: string | null
          company_id: string
          created_at: string
          fingerprint: string | null
          id: string
          ip_hash: string | null
          nps: number | null
          pesquisa_id: string
          score_geral: number | null
          scores_dimensao: Json
          setor: string | null
          tempo_relacionamento: string | null
          tipo_stakeholder: string
        }
        Insert: {
          comentario_pontos_fortes?: string | null
          comentario_pontos_melhoria?: string | null
          company_id: string
          created_at?: string
          fingerprint?: string | null
          id?: string
          ip_hash?: string | null
          nps?: number | null
          pesquisa_id: string
          score_geral?: number | null
          scores_dimensao?: Json
          setor?: string | null
          tempo_relacionamento?: string | null
          tipo_stakeholder: string
        }
        Update: {
          comentario_pontos_fortes?: string | null
          comentario_pontos_melhoria?: string | null
          company_id?: string
          created_at?: string
          fingerprint?: string | null
          id?: string
          ip_hash?: string | null
          nps?: number | null
          pesquisa_id?: string
          score_geral?: number | null
          scores_dimensao?: Json
          setor?: string | null
          tempo_relacionamento?: string | null
          tipo_stakeholder?: string
        }
        Relationships: [
          {
            foreignKeyName: "clima_externo_respostas_pesquisa_id_fkey"
            columns: ["pesquisa_id"]
            isOneToOne: false
            referencedRelation: "clima_pesquisas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clima_externo_respostas_pesquisa_id_fkey"
            columns: ["pesquisa_id"]
            isOneToOne: false
            referencedRelation: "vw_nr1_clima_copsoq_correlacao"
            referencedColumns: ["clima_id"]
          },
        ]
      }
      clima_pesquisas: {
        Row: {
          company_id: string
          convites_enviados: number
          created_at: string
          created_by: string | null
          id: string
          last_invite_at: string | null
          modalidade: Database["public"]["Enums"]["clima_modalidade"]
          nome: string
          observacoes: string | null
          periodo_fim: string | null
          periodo_inicio: string
          public_token: string
          score_geral: number | null
          scores_dimensao: Json | null
          status: Database["public"]["Enums"]["clima_pesquisa_status"]
          total_respondentes: number
          updated_at: string
        }
        Insert: {
          company_id: string
          convites_enviados?: number
          created_at?: string
          created_by?: string | null
          id?: string
          last_invite_at?: string | null
          modalidade?: Database["public"]["Enums"]["clima_modalidade"]
          nome: string
          observacoes?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string
          public_token?: string
          score_geral?: number | null
          scores_dimensao?: Json | null
          status?: Database["public"]["Enums"]["clima_pesquisa_status"]
          total_respondentes?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          convites_enviados?: number
          created_at?: string
          created_by?: string | null
          id?: string
          last_invite_at?: string | null
          modalidade?: Database["public"]["Enums"]["clima_modalidade"]
          nome?: string
          observacoes?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string
          public_token?: string
          score_geral?: number | null
          scores_dimensao?: Json | null
          status?: Database["public"]["Enums"]["clima_pesquisa_status"]
          total_respondentes?: number
          updated_at?: string
        }
        Relationships: []
      }
      clima_respostas: {
        Row: {
          company_id: string
          created_at: string
          departamento: string | null
          funcao_nivel: string | null
          id: string
          modalidade_trabalho: string | null
          pesquisa_id: string
          respondent_hash: string
          score_geral: number | null
          scores_dimensao: Json | null
          tempo_empresa: string | null
          tipo_respondente: Database["public"]["Enums"]["clima_tipo_respondente"]
        }
        Insert: {
          company_id: string
          created_at?: string
          departamento?: string | null
          funcao_nivel?: string | null
          id?: string
          modalidade_trabalho?: string | null
          pesquisa_id: string
          respondent_hash: string
          score_geral?: number | null
          scores_dimensao?: Json | null
          tempo_empresa?: string | null
          tipo_respondente?: Database["public"]["Enums"]["clima_tipo_respondente"]
        }
        Update: {
          company_id?: string
          created_at?: string
          departamento?: string | null
          funcao_nivel?: string | null
          id?: string
          modalidade_trabalho?: string | null
          pesquisa_id?: string
          respondent_hash?: string
          score_geral?: number | null
          scores_dimensao?: Json | null
          tempo_empresa?: string | null
          tipo_respondente?: Database["public"]["Enums"]["clima_tipo_respondente"]
        }
        Relationships: [
          {
            foreignKeyName: "clima_respostas_pesquisa_id_fkey"
            columns: ["pesquisa_id"]
            isOneToOne: false
            referencedRelation: "clima_pesquisas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clima_respostas_pesquisa_id_fkey"
            columns: ["pesquisa_id"]
            isOneToOne: false
            referencedRelation: "vw_nr1_clima_copsoq_correlacao"
            referencedColumns: ["clima_id"]
          },
        ]
      }
      clima_respostas_itens: {
        Row: {
          dimensao: string
          id: string
          questao_num: number
          resposta_id: string
          valor: number
        }
        Insert: {
          dimensao: string
          id?: string
          questao_num: number
          resposta_id: string
          valor: number
        }
        Update: {
          dimensao?: string
          id?: string
          questao_num?: number
          resposta_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "clima_respostas_itens_resposta_id_fkey"
            columns: ["resposta_id"]
            isOneToOne: false
            referencedRelation: "clima_respostas"
            referencedColumns: ["id"]
          },
        ]
      }
      collective_salary_adjustments: {
        Row: {
          adjustment_name: string
          adjustment_type: string
          created_at: string | null
          created_by: string
          effective_month: number
          effectuated_at: string | null
          effectuated_by: string | null
          filter_grades: string[] | null
          filter_salary_max: number | null
          filter_salary_min: number | null
          filter_unit_id: string | null
          fiscal_year: number
          fixed_percentage: number | null
          id: string
          root_company_id: string
          scaled_rules: Json | null
          status: string
          total_annual_cost: number | null
          total_employees_affected: number | null
          total_monthly_cost: number | null
          updated_at: string | null
        }
        Insert: {
          adjustment_name: string
          adjustment_type: string
          created_at?: string | null
          created_by: string
          effective_month: number
          effectuated_at?: string | null
          effectuated_by?: string | null
          filter_grades?: string[] | null
          filter_salary_max?: number | null
          filter_salary_min?: number | null
          filter_unit_id?: string | null
          fiscal_year: number
          fixed_percentage?: number | null
          id?: string
          root_company_id: string
          scaled_rules?: Json | null
          status?: string
          total_annual_cost?: number | null
          total_employees_affected?: number | null
          total_monthly_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          adjustment_name?: string
          adjustment_type?: string
          created_at?: string | null
          created_by?: string
          effective_month?: number
          effectuated_at?: string | null
          effectuated_by?: string | null
          filter_grades?: string[] | null
          filter_salary_max?: number | null
          filter_salary_min?: number | null
          filter_unit_id?: string | null
          fiscal_year?: number
          fixed_percentage?: number | null
          id?: string
          root_company_id?: string
          scaled_rules?: Json | null
          status?: string
          total_annual_cost?: number | null
          total_employees_affected?: number | null
          total_monthly_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collective_salary_adjustments_effectuated_by_fkey"
            columns: ["effectuated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collective_salary_adjustments_effectuated_by_fkey"
            columns: ["effectuated_by"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "collective_salary_adjustments_effectuated_by_fkey"
            columns: ["effectuated_by"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "collective_salary_adjustments_effectuated_by_fkey"
            columns: ["effectuated_by"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "collective_salary_adjustments_effectuated_by_fkey"
            columns: ["effectuated_by"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collective_salary_adjustments_effectuated_by_fkey"
            columns: ["effectuated_by"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "collective_salary_adjustments_filter_unit_id_fkey"
            columns: ["filter_unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collective_salary_adjustments_filter_unit_id_fkey"
            columns: ["filter_unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collective_salary_adjustments_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collective_salary_adjustments_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      company_billing: {
        Row: {
          billing_cycle: string | null
          billing_email: string | null
          cnpj: string | null
          company_id: string
          created_at: string
          custom_annual_price: number | null
          custom_monthly_price: number | null
          payment_method: string | null
          subscription_started_at: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: string | null
          billing_email?: string | null
          cnpj?: string | null
          company_id: string
          created_at?: string
          custom_annual_price?: number | null
          custom_monthly_price?: number | null
          payment_method?: string | null
          subscription_started_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string | null
          billing_email?: string | null
          cnpj?: string | null
          company_id?: string
          created_at?: string
          custom_annual_price?: number | null
          custom_monthly_price?: number | null
          payment_method?: string | null
          subscription_started_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_billing_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_billing_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      company_identity: {
        Row: {
          annual_goal_description: string | null
          annual_goal_year: number | null
          created_at: string | null
          id: string
          is_visible: boolean | null
          mission: string | null
          root_company_id: string
          updated_at: string | null
          values: Json | null
          vision: string | null
        }
        Insert: {
          annual_goal_description?: string | null
          annual_goal_year?: number | null
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          mission?: string | null
          root_company_id: string
          updated_at?: string | null
          values?: Json | null
          vision?: string | null
        }
        Update: {
          annual_goal_description?: string | null
          annual_goal_year?: number | null
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          mission?: string | null
          root_company_id?: string
          updated_at?: string | null
          values?: Json | null
          vision?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_identity_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: true
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_identity_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: true
            referencedRelation: "organizational_structure_public"
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
          failed_attempts: number | null
          id: string
          last_payment_date: string | null
          monthly_price: number
          next_billing_date: string | null
          pagarme_customer_id: string | null
          pagarme_subscription_id: string | null
          payment_method_id: string | null
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
          failed_attempts?: number | null
          id?: string
          last_payment_date?: string | null
          monthly_price: number
          next_billing_date?: string | null
          pagarme_customer_id?: string | null
          pagarme_subscription_id?: string | null
          payment_method_id?: string | null
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
          failed_attempts?: number | null
          id?: string
          last_payment_date?: string | null
          monthly_price?: number
          next_billing_date?: string | null
          pagarme_customer_id?: string | null
          pagarme_subscription_id?: string | null
          payment_method_id?: string | null
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
            foreignKeyName: "company_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_subscriptions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
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
          root_company_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          root_company_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          root_company_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competencies_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competencies_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      consultores: {
        Row: {
          ativo: boolean
          bio: string | null
          created_at: string
          email: string
          especialidade: string | null
          id: string
          nome: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          bio?: string | null
          created_at?: string
          email: string
          especialidade?: string | null
          id?: string
          nome: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          bio?: string | null
          created_at?: string
          email?: string
          especialidade?: string | null
          id?: string
          nome?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "conversation_sessions_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      cycle_decision_snapshots: {
        Row: {
          chosen_scenario_id: string | null
          created_at: string
          cycle_name: string
          executive_notes: string | null
          fiscal_year: number
          id: string
          locked_at: string
          locked_by: string | null
          root_company_id: string
          snapshot_data: Json
        }
        Insert: {
          chosen_scenario_id?: string | null
          created_at?: string
          cycle_name: string
          executive_notes?: string | null
          fiscal_year: number
          id?: string
          locked_at?: string
          locked_by?: string | null
          root_company_id: string
          snapshot_data: Json
        }
        Update: {
          chosen_scenario_id?: string | null
          created_at?: string
          cycle_name?: string
          executive_notes?: string | null
          fiscal_year?: number
          id?: string
          locked_at?: string
          locked_by?: string | null
          root_company_id?: string
          snapshot_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "cycle_decision_snapshots_chosen_scenario_id_fkey"
            columns: ["chosen_scenario_id"]
            isOneToOne: false
            referencedRelation: "decision_scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cycle_decision_snapshots_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cycle_decision_snapshots_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_scenario_items: {
        Row: {
          annual_impact: number | null
          box_position: number | null
          created_at: string
          current_salary: number | null
          employee_id: string
          id: string
          monthly_impact: number | null
          scenario_id: string
          scenario_merit_pct: number | null
          suggested_merit_pct: number | null
          unit_id: string | null
        }
        Insert: {
          annual_impact?: number | null
          box_position?: number | null
          created_at?: string
          current_salary?: number | null
          employee_id: string
          id?: string
          monthly_impact?: number | null
          scenario_id: string
          scenario_merit_pct?: number | null
          suggested_merit_pct?: number | null
          unit_id?: string | null
        }
        Update: {
          annual_impact?: number | null
          box_position?: number | null
          created_at?: string
          current_salary?: number | null
          employee_id?: string
          id?: string
          monthly_impact?: number | null
          scenario_id?: string
          scenario_merit_pct?: number | null
          suggested_merit_pct?: number | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decision_scenario_items_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "decision_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_scenarios: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          filter_box_max: number | null
          filter_box_min: number | null
          filter_unit_ids: string[] | null
          fiscal_year: number
          high_performers_retained: number | null
          id: string
          is_active: boolean | null
          low_performers_included: number | null
          multiplier: number
          payroll_increase_pct: number | null
          root_company_id: string
          scenario_name: string
          strategy: string
          total_annual_impact: number | null
          total_headcount: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          filter_box_max?: number | null
          filter_box_min?: number | null
          filter_unit_ids?: string[] | null
          fiscal_year: number
          high_performers_retained?: number | null
          id?: string
          is_active?: boolean | null
          low_performers_included?: number | null
          multiplier?: number
          payroll_increase_pct?: number | null
          root_company_id: string
          scenario_name: string
          strategy?: string
          total_annual_impact?: number | null
          total_headcount?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          filter_box_max?: number | null
          filter_box_min?: number | null
          filter_unit_ids?: string[] | null
          fiscal_year?: number
          high_performers_retained?: number | null
          id?: string
          is_active?: boolean | null
          low_performers_included?: number | null
          multiplier?: number
          payroll_increase_pct?: number | null
          root_company_id?: string
          scenario_name?: string
          strategy?: string
          total_annual_impact?: number | null
          total_headcount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_scenarios_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_scenarios_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_coupons: {
        Row: {
          applicable_plans: string[] | null
          code: string
          created_at: string | null
          created_by: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_billing_cycle: string | null
          updated_at: string | null
          used_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applicable_plans?: string[] | null
          code: string
          created_at?: string | null
          created_by?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_billing_cycle?: string | null
          updated_at?: string | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applicable_plans?: string[] | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_billing_cycle?: string | null
          updated_at?: string | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      economic_parameters: {
        Row: {
          created_at: string | null
          effective_date: string
          end_date: string | null
          id: string
          metadata: Json | null
          parameter_key: string
          updated_at: string | null
          value: number
        }
        Insert: {
          created_at?: string | null
          effective_date: string
          end_date?: string | null
          id?: string
          metadata?: Json | null
          parameter_key: string
          updated_at?: string | null
          value: number
        }
        Update: {
          created_at?: string | null
          effective_date?: string
          end_date?: string | null
          id?: string
          metadata?: Json | null
          parameter_key?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
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
          {
            foreignKeyName: "employee_benefits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "employee_benefits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employee_benefits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employee_benefits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_benefits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      employee_import_changes: {
        Row: {
          created_at: string
          field: string
          id: string
          new_value: string | null
          old_value: string | null
          profile_id: string | null
          row_number: number | null
          run_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          field: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          profile_id?: string | null
          row_number?: number | null
          run_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          field?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          profile_id?: string | null
          row_number?: number | null
          run_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_import_changes_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "employee_import_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_import_mappings: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          mapping: Json
          name: string
          source_system: string | null
          tenant_id: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          mapping?: Json
          name: string
          source_system?: string | null
          tenant_id: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          mapping?: Json
          name?: string
          source_system?: string | null
          tenant_id?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_import_mappings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_import_mappings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_import_row_errors: {
        Row: {
          created_at: string
          error_type: string
          field: string | null
          id: string
          message: string
          resolved: boolean
          row_data: Json
          row_number: number
          run_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          error_type: string
          field?: string | null
          id?: string
          message: string
          resolved?: boolean
          row_data?: Json
          row_number: number
          run_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          error_type?: string
          field?: string | null
          id?: string
          message?: string
          resolved?: boolean
          row_data?: Json
          row_number?: number
          run_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_import_row_errors_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "employee_import_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_import_runs: {
        Row: {
          created_at: string
          created_by: string | null
          duplicate_strategy: string
          error_count: number
          file_name: string
          id: string
          ignored_count: number
          imported_count: number
          mapping: Json
          sheet_name: string | null
          source_system: string | null
          status: string
          tenant_id: string
          total_rows: number
          updated_at: string
          updated_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          duplicate_strategy?: string
          error_count?: number
          file_name: string
          id?: string
          ignored_count?: number
          imported_count?: number
          mapping?: Json
          sheet_name?: string | null
          source_system?: string | null
          status?: string
          tenant_id: string
          total_rows?: number
          updated_at?: string
          updated_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          duplicate_strategy?: string
          error_count?: number
          file_name?: string
          id?: string
          ignored_count?: number
          imported_count?: number
          mapping?: Json
          sheet_name?: string | null
          source_system?: string | null
          status?: string
          tenant_id?: string
          total_rows?: number
          updated_at?: string
          updated_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_import_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_import_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
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
            foreignKeyName: "employee_incentive_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "employee_incentive_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employee_incentive_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employee_incentive_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_incentive_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
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
      engagement_metrics: {
        Row: {
          created_at: string | null
          cycle_id: string | null
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
          period_end: string
          period_start: string
          root_company_id: string
        }
        Insert: {
          created_at?: string | null
          cycle_id?: string | null
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value: number
          period_end: string
          period_start: string
          root_company_id: string
        }
        Update: {
          created_at?: string | null
          cycle_id?: string | null
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          period_end?: string
          period_start?: string
          root_company_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "engagement_metrics_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "performance_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_metrics_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_metrics_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          company_id: string | null
          component_stack: string | null
          created_at: string
          error_message: string
          error_stack: string | null
          id: string
          metadata: Json | null
          route_path: string | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          component_stack?: string | null
          created_at?: string
          error_message: string
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          route_path?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          component_stack?: string | null
          created_at?: string
          error_message?: string
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          route_path?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      evaluation_potential_dimensions: {
        Row: {
          comment: string | null
          created_at: string
          dimension: string
          evaluation_id: string
          id: string
          root_company_id: string
          score: number
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          dimension: string
          evaluation_id: string
          id?: string
          root_company_id: string
          score?: number
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          dimension?: string
          evaluation_id?: string
          id?: string
          root_company_id?: string
          score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_potential_dimensions_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "performance_evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_potential_dimensions_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "v_performance_evaluations_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_potential_dimensions_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["evaluation_id"]
          },
          {
            foreignKeyName: "evaluation_potential_dimensions_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_potential_dimensions_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      executive_dashboard_indicators: {
        Row: {
          created_at: string
          fetched_at: string
          id: string
          indicator_key: string
          indicator_value: number
          metadata: Json | null
          reference_date: string
          source: string | null
        }
        Insert: {
          created_at?: string
          fetched_at?: string
          id?: string
          indicator_key: string
          indicator_value: number
          metadata?: Json | null
          reference_date: string
          source?: string | null
        }
        Update: {
          created_at?: string
          fetched_at?: string
          id?: string
          indicator_key?: string
          indicator_value?: number
          metadata?: Json | null
          reference_date?: string
          source?: string | null
        }
        Relationships: []
      }
      executive_ltip_simulations: {
        Row: {
          bear_growth_rate: number | null
          bear_value_at_vest: number | null
          bull_growth_rate: number | null
          bull_value_at_vest: number | null
          clawback_clause: string | null
          cliff_months: number
          created_at: string
          created_by: string
          current_share_price: number | null
          dilution_percentage: number | null
          employee_contribution_pct: number | null
          employee_id: string | null
          exercise_price: number | null
          forfeiture_rules: Json | null
          grant_value: number
          id: string
          instrument_type: string
          leaver_treatment: Json | null
          liquidity_event_assumption: string | null
          matching_percentage: number | null
          notes: string | null
          num_shares: number | null
          projected_growth_rate: number | null
          root_company_id: string
          scenario_name: string
          tax_impact_estimated: number | null
          tax_treatment: string | null
          total_value_at_vest: number | null
          updated_at: string
          vesting_type: string | null
          vesting_years: number
        }
        Insert: {
          bear_growth_rate?: number | null
          bear_value_at_vest?: number | null
          bull_growth_rate?: number | null
          bull_value_at_vest?: number | null
          clawback_clause?: string | null
          cliff_months?: number
          created_at?: string
          created_by: string
          current_share_price?: number | null
          dilution_percentage?: number | null
          employee_contribution_pct?: number | null
          employee_id?: string | null
          exercise_price?: number | null
          forfeiture_rules?: Json | null
          grant_value: number
          id?: string
          instrument_type: string
          leaver_treatment?: Json | null
          liquidity_event_assumption?: string | null
          matching_percentage?: number | null
          notes?: string | null
          num_shares?: number | null
          projected_growth_rate?: number | null
          root_company_id: string
          scenario_name: string
          tax_impact_estimated?: number | null
          tax_treatment?: string | null
          total_value_at_vest?: number | null
          updated_at?: string
          vesting_type?: string | null
          vesting_years?: number
        }
        Update: {
          bear_growth_rate?: number | null
          bear_value_at_vest?: number | null
          bull_growth_rate?: number | null
          bull_value_at_vest?: number | null
          clawback_clause?: string | null
          cliff_months?: number
          created_at?: string
          created_by?: string
          current_share_price?: number | null
          dilution_percentage?: number | null
          employee_contribution_pct?: number | null
          employee_id?: string | null
          exercise_price?: number | null
          forfeiture_rules?: Json | null
          grant_value?: number
          id?: string
          instrument_type?: string
          leaver_treatment?: Json | null
          liquidity_event_assumption?: string | null
          matching_percentage?: number | null
          notes?: string | null
          num_shares?: number | null
          projected_growth_rate?: number | null
          root_company_id?: string
          scenario_name?: string
          tax_impact_estimated?: number | null
          tax_treatment?: string | null
          total_value_at_vest?: number | null
          updated_at?: string
          vesting_type?: string | null
          vesting_years?: number
        }
        Relationships: [
          {
            foreignKeyName: "executive_ltip_simulations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executive_ltip_simulations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "executive_ltip_simulations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "executive_ltip_simulations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "executive_ltip_simulations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executive_ltip_simulations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      external_feedback_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          custom_message: string | null
          cycle_id: string | null
          deadline: string
          employee_id: string
          external_email: string
          external_name: string
          external_type: Database["public"]["Enums"]["external_evaluator_type"]
          id: string
          requested_by: string
          root_company_id: string
          sent_at: string | null
          status: Database["public"]["Enums"]["external_feedback_status"]
          template_questions: Json | null
          token: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          custom_message?: string | null
          cycle_id?: string | null
          deadline: string
          employee_id: string
          external_email: string
          external_name: string
          external_type?: Database["public"]["Enums"]["external_evaluator_type"]
          id?: string
          requested_by: string
          root_company_id: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["external_feedback_status"]
          template_questions?: Json | null
          token?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          custom_message?: string | null
          cycle_id?: string | null
          deadline?: string
          employee_id?: string
          external_email?: string
          external_name?: string
          external_type?: Database["public"]["Enums"]["external_evaluator_type"]
          id?: string
          requested_by?: string
          root_company_id?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["external_feedback_status"]
          template_questions?: Json | null
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_feedback_requests_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "performance_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_feedback_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_feedback_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "external_feedback_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "external_feedback_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "external_feedback_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_feedback_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "external_feedback_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_feedback_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "external_feedback_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "external_feedback_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "external_feedback_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_feedback_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "external_feedback_requests_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_feedback_requests_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      external_feedback_responses: {
        Row: {
          additional_comments: string | null
          answers: Json
          created_at: string
          id: string
          improvement_areas: string | null
          overall_rating: number | null
          request_id: string
          strengths: string | null
        }
        Insert: {
          additional_comments?: string | null
          answers?: Json
          created_at?: string
          id?: string
          improvement_areas?: string | null
          overall_rating?: number | null
          request_id: string
          strengths?: string | null
        }
        Update: {
          additional_comments?: string | null
          answers?: Json
          created_at?: string
          id?: string
          improvement_areas?: string | null
          overall_rating?: number | null
          request_id?: string
          strengths?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_feedback_responses_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "external_feedback_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      glossary_terms: {
        Row: {
          category: string
          created_at: string | null
          definition: string
          id: string
          is_active: boolean | null
          related_terms: string[] | null
          synonyms: string[] | null
          term: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          definition: string
          id?: string
          is_active?: boolean | null
          related_terms?: string[] | null
          synonyms?: string[] | null
          term: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          definition?: string
          id?: string
          is_active?: boolean | null
          related_terms?: string[] | null
          synonyms?: string[] | null
          term?: string
          updated_at?: string | null
        }
        Relationships: []
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
          {
            foreignKeyName: "incentive_programs_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
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
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices_redacted_for_hr"
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
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
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
          root_company_id: string | null
          updated_at: string | null
        }
        Insert: {
          color_class?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          root_company_id?: string | null
          updated_at?: string | null
        }
        Update: {
          color_class?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          root_company_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_families_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_families_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      job_matching_history: {
        Row: {
          created_at: string
          created_by: string | null
          gap_pct: number | null
          id: string
          internal_median: number | null
          job_title_id: string
          market_median: number | null
          match_score: number
          matched_cbo_code: string | null
          matched_market_role: string
          parameters: Json | null
          reasoning: string | null
          recommendations: string | null
          review_notes: string | null
          root_company_id: string
          source: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          gap_pct?: number | null
          id?: string
          internal_median?: number | null
          job_title_id: string
          market_median?: number | null
          match_score: number
          matched_cbo_code?: string | null
          matched_market_role: string
          parameters?: Json | null
          reasoning?: string | null
          recommendations?: string | null
          review_notes?: string | null
          root_company_id: string
          source?: string
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          gap_pct?: number | null
          id?: string
          internal_median?: number | null
          job_title_id?: string
          market_median?: number | null
          match_score?: number
          matched_cbo_code?: string | null
          matched_market_role?: string
          parameters?: Json | null
          reasoning?: string | null
          recommendations?: string | null
          review_notes?: string | null
          root_company_id?: string
          source?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_matching_history_job_title_id_fkey"
            columns: ["job_title_id"]
            isOneToOne: false
            referencedRelation: "job_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_matching_history_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_matching_history_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      job_matching_results: {
        Row: {
          ai_original_reasoning: string | null
          ai_original_score: number | null
          created_at: string
          created_by: string | null
          final_reasoning: string | null
          gap_pct: number | null
          id: string
          internal_median: number | null
          job_title_id: string
          market_median: number | null
          match_score: number
          matched_cbo_code: string | null
          matched_market_role: string
          reasoning: string | null
          recommendations: string | null
          review_notes: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          root_company_id: string
          updated_at: string
          version: number
        }
        Insert: {
          ai_original_reasoning?: string | null
          ai_original_score?: number | null
          created_at?: string
          created_by?: string | null
          final_reasoning?: string | null
          gap_pct?: number | null
          id?: string
          internal_median?: number | null
          job_title_id: string
          market_median?: number | null
          match_score: number
          matched_cbo_code?: string | null
          matched_market_role: string
          reasoning?: string | null
          recommendations?: string | null
          review_notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          root_company_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          ai_original_reasoning?: string | null
          ai_original_score?: number | null
          created_at?: string
          created_by?: string | null
          final_reasoning?: string | null
          gap_pct?: number | null
          id?: string
          internal_median?: number | null
          job_title_id?: string
          market_median?: number | null
          match_score?: number
          matched_cbo_code?: string | null
          matched_market_role?: string
          reasoning?: string | null
          recommendations?: string | null
          review_notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          root_company_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_matching_results_job_title_id_fkey"
            columns: ["job_title_id"]
            isOneToOne: false
            referencedRelation: "job_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_matching_results_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_matching_results_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
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
          hay_accountability_freedom: string | null
          hay_accountability_impact: string | null
          hay_accountability_magnitude: string | null
          hay_evaluation_notes: string | null
          hay_knowhow_human_relations: string | null
          hay_knowhow_managerial: string | null
          hay_knowhow_technical: string | null
          hay_problem_challenge: string | null
          hay_problem_environment: string | null
          hay_profile: string | null
          hay_total_points: number | null
          id: string
          is_active: boolean
          job_family: string
          job_impact: string | null
          key_factors: string | null
          main_responsibilities: string | null
          median_points: number
          required_education: string | null
          required_experience: string | null
          root_company_id: string
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
          hay_accountability_freedom?: string | null
          hay_accountability_impact?: string | null
          hay_accountability_magnitude?: string | null
          hay_evaluation_notes?: string | null
          hay_knowhow_human_relations?: string | null
          hay_knowhow_managerial?: string | null
          hay_knowhow_technical?: string | null
          hay_problem_challenge?: string | null
          hay_problem_environment?: string | null
          hay_profile?: string | null
          hay_total_points?: number | null
          id?: string
          is_active?: boolean
          job_family: string
          job_impact?: string | null
          key_factors?: string | null
          main_responsibilities?: string | null
          median_points: number
          required_education?: string | null
          required_experience?: string | null
          root_company_id: string
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
          hay_accountability_freedom?: string | null
          hay_accountability_impact?: string | null
          hay_accountability_magnitude?: string | null
          hay_evaluation_notes?: string | null
          hay_knowhow_human_relations?: string | null
          hay_knowhow_managerial?: string | null
          hay_knowhow_technical?: string | null
          hay_problem_challenge?: string | null
          hay_problem_environment?: string | null
          hay_profile?: string | null
          hay_total_points?: number | null
          id?: string
          is_active?: boolean
          job_family?: string
          job_impact?: string | null
          key_factors?: string | null
          main_responsibilities?: string | null
          median_points?: number
          required_education?: string | null
          required_experience?: string | null
          root_company_id?: string
          salary_range_id?: string | null
          soft_skills?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_titles_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_titles_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "knowledge_base_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          cargo: string | null
          consentimento_lgpd: boolean
          created_at: string
          email: string
          empresa: string | null
          id: string
          lead_magnet: string | null
          modulo_interesse: string | null
          nome: string
          origem: string | null
          porte: string | null
          status: string
          updated_at: string
        }
        Insert: {
          cargo?: string | null
          consentimento_lgpd?: boolean
          created_at?: string
          email: string
          empresa?: string | null
          id?: string
          lead_magnet?: string | null
          modulo_interesse?: string | null
          nome: string
          origem?: string | null
          porte?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          cargo?: string | null
          consentimento_lgpd?: boolean
          created_at?: string
          email?: string
          empresa?: string | null
          id?: string
          lead_magnet?: string | null
          modulo_interesse?: string | null
          nome?: string
          origem?: string | null
          porte?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
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
      ltip_scenario_comparisons: {
        Row: {
          cliff_months: number
          comparison_name: string
          created_at: string
          created_by: string
          employee_id: string | null
          grant_value: number
          growth_rate: number
          id: string
          instruments_compared: Json
          recommendation: string | null
          results: Json
          root_company_id: string
          updated_at: string
          vesting_years: number
        }
        Insert: {
          cliff_months?: number
          comparison_name: string
          created_at?: string
          created_by: string
          employee_id?: string | null
          grant_value: number
          growth_rate?: number
          id?: string
          instruments_compared: Json
          recommendation?: string | null
          results: Json
          root_company_id: string
          updated_at?: string
          vesting_years?: number
        }
        Update: {
          cliff_months?: number
          comparison_name?: string
          created_at?: string
          created_by?: string
          employee_id?: string | null
          grant_value?: number
          growth_rate?: number
          id?: string
          instruments_compared?: Json
          recommendation?: string | null
          results?: Json
          root_company_id?: string
          updated_at?: string
          vesting_years?: number
        }
        Relationships: [
          {
            foreignKeyName: "ltip_scenario_comparisons_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ltip_scenario_comparisons_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      market_insights_cache: {
        Row: {
          cache_key: string
          created_at: string
          expires_at: string
          fetched_at: string
          id: string
          question: string
          result: Json
          topic: string
          updated_at: string
        }
        Insert: {
          cache_key: string
          created_at?: string
          expires_at?: string
          fetched_at?: string
          id?: string
          question: string
          result?: Json
          topic: string
          updated_at?: string
        }
        Update: {
          cache_key?: string
          created_at?: string
          expires_at?: string
          fetched_at?: string
          id?: string
          question?: string
          result?: Json
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      market_insights_usage: {
        Row: {
          created_at: string
          from_cache: boolean
          id: string
          question: string
          rejected: boolean
          rejection_reason: string | null
          root_company_id: string | null
          topic: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          from_cache?: boolean
          id?: string
          question: string
          rejected?: boolean
          rejection_reason?: string | null
          root_company_id?: string | null
          topic?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          from_cache?: boolean
          id?: string
          question?: string
          rejected?: boolean
          rejection_reason?: string | null
          root_company_id?: string | null
          topic?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      merit_approval_history: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          new_status: string | null
          notes: string | null
          previous_status: string | null
          request_id: string
          snapshot: Json | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: string
          new_status?: string | null
          notes?: string | null
          previous_status?: string | null
          request_id: string
          snapshot?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          new_status?: string | null
          notes?: string | null
          previous_status?: string | null
          request_id?: string
          snapshot?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "merit_approval_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "merit_approval_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      merit_approval_requests: {
        Row: {
          annual_impact: number
          applied_at: string | null
          applied_by: string | null
          approval_notes: string | null
          approver_id: string | null
          box_position: number | null
          budget_after_request: number | null
          budget_available_pct: number | null
          budget_remaining_annual: number | null
          compa_ratio: number | null
          created_at: string
          current_salary: number
          employee_id: string
          fiscal_year: number
          gate_warnings: Json | null
          id: string
          is_blocked: boolean
          justification: string
          monthly_impact: number
          months_since_last_raise: number | null
          new_salary: number
          override_reason: string | null
          performance_score: number | null
          range_position_pct: number | null
          requested_by: string
          requested_merit_pct: number
          reviewed_at: string | null
          root_company_id: string
          status: string
          suggested_merit_pct: number
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          annual_impact: number
          applied_at?: string | null
          applied_by?: string | null
          approval_notes?: string | null
          approver_id?: string | null
          box_position?: number | null
          budget_after_request?: number | null
          budget_available_pct?: number | null
          budget_remaining_annual?: number | null
          compa_ratio?: number | null
          created_at?: string
          current_salary: number
          employee_id: string
          fiscal_year?: number
          gate_warnings?: Json | null
          id?: string
          is_blocked?: boolean
          justification: string
          monthly_impact: number
          months_since_last_raise?: number | null
          new_salary: number
          override_reason?: string | null
          performance_score?: number | null
          range_position_pct?: number | null
          requested_by: string
          requested_merit_pct: number
          reviewed_at?: string | null
          root_company_id: string
          status?: string
          suggested_merit_pct: number
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          annual_impact?: number
          applied_at?: string | null
          applied_by?: string | null
          approval_notes?: string | null
          approver_id?: string | null
          box_position?: number | null
          budget_after_request?: number | null
          budget_available_pct?: number | null
          budget_remaining_annual?: number | null
          compa_ratio?: number | null
          created_at?: string
          current_salary?: number
          employee_id?: string
          fiscal_year?: number
          gate_warnings?: Json | null
          id?: string
          is_blocked?: boolean
          justification?: string
          monthly_impact?: number
          months_since_last_raise?: number | null
          new_salary?: number
          override_reason?: string | null
          performance_score?: number | null
          range_position_pct?: number | null
          requested_by?: string
          requested_merit_pct?: number
          reviewed_at?: string | null
          root_company_id?: string
          status?: string
          suggested_merit_pct?: number
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      merit_budget_ledger: {
        Row: {
          amount_annual: number
          balance_after: number | null
          budget_id: string
          created_at: string
          created_by: string | null
          employee_id: string | null
          fiscal_year: number
          id: string
          movement_type: string
          notes: string | null
          source_id: string | null
          source_type: string
          unit_id: string
        }
        Insert: {
          amount_annual: number
          balance_after?: number | null
          budget_id: string
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          fiscal_year: number
          id?: string
          movement_type: string
          notes?: string | null
          source_id?: string | null
          source_type: string
          unit_id: string
        }
        Update: {
          amount_annual?: number
          balance_after?: number | null
          budget_id?: string
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          fiscal_year?: number
          id?: string
          movement_type?: string
          notes?: string | null
          source_id?: string | null
          source_type?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "merit_budget_ledger_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "unit_merit_budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      module_pricing: {
        Row: {
          created_at: string
          faixa_max_colaboradores: number | null
          faixa_min_colaboradores: number
          id: string
          module_id: string
          preco_mensal: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          faixa_max_colaboradores?: number | null
          faixa_min_colaboradores: number
          id?: string
          module_id: string
          preco_mensal?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          faixa_max_colaboradores?: number | null
          faixa_min_colaboradores?: number
          id?: string
          module_id?: string
          preco_mensal?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_pricing_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          categoria: string | null
          created_at: string
          descricao: string | null
          icone: string | null
          id: string
          is_active: boolean
          is_legal_product: boolean
          is_negotiable: boolean
          nome: string
          nome_agente: string | null
          ordem: number
          slug: string
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          is_active?: boolean
          is_legal_product?: boolean
          is_negotiable?: boolean
          nome: string
          nome_agente?: string | null
          ordem?: number
          slug: string
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          is_active?: boolean
          is_legal_product?: boolean
          is_negotiable?: boolean
          nome?: string
          nome_agente?: string | null
          ordem?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      nr1_access_log: {
        Row: {
          action: string
          actor_role: string
          actor_user_id: string
          blocked: boolean | null
          company_id: string
          created_at: string
          filters: Json | null
          id: string
          ip: unknown
          k_value: number | null
          reason: string | null
          resource: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_role: string
          actor_user_id: string
          blocked?: boolean | null
          company_id: string
          created_at?: string
          filters?: Json | null
          id?: string
          ip?: unknown
          k_value?: number | null
          reason?: string | null
          resource: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_role?: string
          actor_user_id?: string
          blocked?: boolean | null
          company_id?: string
          created_at?: string
          filters?: Json | null
          id?: string
          ip?: unknown
          k_value?: number | null
          reason?: string | null
          resource?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      nr1_checkins_semanais: {
        Row: {
          acoes_executadas: Json
          comentario: string | null
          criado_em: string
          humor_1_10: number
          id: string
          jornada_id: string
          semana: number
        }
        Insert: {
          acoes_executadas?: Json
          comentario?: string | null
          criado_em?: string
          humor_1_10: number
          id?: string
          jornada_id: string
          semana: number
        }
        Update: {
          acoes_executadas?: Json
          comentario?: string | null
          criado_em?: string
          humor_1_10?: number
          id?: string
          jornada_id?: string
          semana?: number
        }
        Relationships: [
          {
            foreignKeyName: "nr1_checkins_semanais_jornada_id_fkey"
            columns: ["jornada_id"]
            isOneToOne: false
            referencedRelation: "nr1_jornadas"
            referencedColumns: ["id"]
          },
        ]
      }
      nr1_diagnostico_respostas: {
        Row: {
          created_at: string
          diagnostico_id: string
          id: string
          questao_id: string
          respondent_hash: string
          resposta: number
        }
        Insert: {
          created_at?: string
          diagnostico_id: string
          id?: string
          questao_id: string
          respondent_hash: string
          resposta: number
        }
        Update: {
          created_at?: string
          diagnostico_id?: string
          id?: string
          questao_id?: string
          respondent_hash?: string
          resposta?: number
        }
        Relationships: [
          {
            foreignKeyName: "nr1_diagnostico_respostas_diagnostico_id_fkey"
            columns: ["diagnostico_id"]
            isOneToOne: false
            referencedRelation: "nr1_diagnosticos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nr1_diagnostico_respostas_diagnostico_id_fkey"
            columns: ["diagnostico_id"]
            isOneToOne: false
            referencedRelation: "vw_nr1_clima_copsoq_correlacao"
            referencedColumns: ["diagnostico_id"]
          },
          {
            foreignKeyName: "nr1_diagnostico_respostas_questao_id_fkey"
            columns: ["questao_id"]
            isOneToOne: false
            referencedRelation: "nr1_questoes"
            referencedColumns: ["id"]
          },
        ]
      }
      nr1_diagnosticos: {
        Row: {
          ciclo_nome: string
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          nivel_risco: Database["public"]["Enums"]["nr1_nivel_risco"] | null
          observacoes: string | null
          periodo_fim: string | null
          periodo_inicio: string
          score_geral: number | null
          scores_dimensao: Json | null
          status: Database["public"]["Enums"]["nr1_diagnostico_status"]
          total_respondentes: number
          updated_at: string
        }
        Insert: {
          ciclo_nome: string
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          nivel_risco?: Database["public"]["Enums"]["nr1_nivel_risco"] | null
          observacoes?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string
          score_geral?: number | null
          scores_dimensao?: Json | null
          status?: Database["public"]["Enums"]["nr1_diagnostico_status"]
          total_respondentes?: number
          updated_at?: string
        }
        Update: {
          ciclo_nome?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          nivel_risco?: Database["public"]["Enums"]["nr1_nivel_risco"] | null
          observacoes?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string
          score_geral?: number | null
          scores_dimensao?: Json | null
          status?: Database["public"]["Enums"]["nr1_diagnostico_status"]
          total_respondentes?: number
          updated_at?: string
        }
        Relationships: []
      }
      nr1_importacoes_matriz: {
        Row: {
          arquivo_mime: string | null
          arquivo_nome: string | null
          arquivo_path: string | null
          arquivo_tamanho: number | null
          company_id: string
          consultoria: string | null
          created_at: string
          created_by: string | null
          data_diagnostico: string | null
          diagnostico_id: string | null
          erro_mensagem: string | null
          id: string
          mapeamento_aplicado: Json | null
          mapeamento_resultado: Json | null
          metodologia: Database["public"]["Enums"]["nr1_matriz_metodologia"]
          metodologia_outra: string | null
          modo: Database["public"]["Enums"]["nr1_matriz_modo"]
          observacoes: string | null
          processado_em: string | null
          status: Database["public"]["Enums"]["nr1_matriz_status"]
          template_id: string | null
          texto_livre: string | null
          updated_at: string
        }
        Insert: {
          arquivo_mime?: string | null
          arquivo_nome?: string | null
          arquivo_path?: string | null
          arquivo_tamanho?: number | null
          company_id: string
          consultoria?: string | null
          created_at?: string
          created_by?: string | null
          data_diagnostico?: string | null
          diagnostico_id?: string | null
          erro_mensagem?: string | null
          id?: string
          mapeamento_aplicado?: Json | null
          mapeamento_resultado?: Json | null
          metodologia: Database["public"]["Enums"]["nr1_matriz_metodologia"]
          metodologia_outra?: string | null
          modo?: Database["public"]["Enums"]["nr1_matriz_modo"]
          observacoes?: string | null
          processado_em?: string | null
          status?: Database["public"]["Enums"]["nr1_matriz_status"]
          template_id?: string | null
          texto_livre?: string | null
          updated_at?: string
        }
        Update: {
          arquivo_mime?: string | null
          arquivo_nome?: string | null
          arquivo_path?: string | null
          arquivo_tamanho?: number | null
          company_id?: string
          consultoria?: string | null
          created_at?: string
          created_by?: string | null
          data_diagnostico?: string | null
          diagnostico_id?: string | null
          erro_mensagem?: string | null
          id?: string
          mapeamento_aplicado?: Json | null
          mapeamento_resultado?: Json | null
          metodologia?: Database["public"]["Enums"]["nr1_matriz_metodologia"]
          metodologia_outra?: string | null
          modo?: Database["public"]["Enums"]["nr1_matriz_modo"]
          observacoes?: string | null
          processado_em?: string | null
          status?: Database["public"]["Enums"]["nr1_matriz_status"]
          template_id?: string | null
          texto_livre?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nr1_importacoes_matriz_diagnostico_id_fkey"
            columns: ["diagnostico_id"]
            isOneToOne: false
            referencedRelation: "nr1_diagnosticos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nr1_importacoes_matriz_diagnostico_id_fkey"
            columns: ["diagnostico_id"]
            isOneToOne: false
            referencedRelation: "vw_nr1_clima_copsoq_correlacao"
            referencedColumns: ["diagnostico_id"]
          },
          {
            foreignKeyName: "nr1_importacoes_matriz_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "nr1_mapeamentos_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      nr1_jornada_mensagens: {
        Row: {
          content: string
          created_at: string
          id: string
          jornada_id: string
          momento: number | null
          role: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          jornada_id: string
          momento?: number | null
          role: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          jornada_id?: string
          momento?: number | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "nr1_jornada_mensagens_jornada_id_fkey"
            columns: ["jornada_id"]
            isOneToOne: false
            referencedRelation: "nr1_jornadas"
            referencedColumns: ["id"]
          },
        ]
      }
      nr1_jornadas: {
        Row: {
          company_id: string
          concluded_at: string | null
          consent_anonimo_at: string | null
          consent_id_at: string | null
          created_at: string
          encerramento_motivo: string | null
          id: string
          momento_atual: number
          semana_atual: number
          started_at: string
          status: Database["public"]["Enums"]["nr1_jornada_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          concluded_at?: string | null
          consent_anonimo_at?: string | null
          consent_id_at?: string | null
          created_at?: string
          encerramento_motivo?: string | null
          id?: string
          momento_atual?: number
          semana_atual?: number
          started_at?: string
          status?: Database["public"]["Enums"]["nr1_jornada_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          concluded_at?: string | null
          consent_anonimo_at?: string | null
          consent_id_at?: string | null
          created_at?: string
          encerramento_motivo?: string | null
          id?: string
          momento_atual?: number
          semana_atual?: number
          started_at?: string
          status?: Database["public"]["Enums"]["nr1_jornada_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nr1_leads: {
        Row: {
          cargo: string | null
          created_at: string
          email: string
          empresa: string
          id: string
          nivel_risco_free:
            | Database["public"]["Enums"]["nr1_nivel_risco"]
            | null
          nome: string
          origem: string | null
          respostas_free: Json | null
          score_free: number | null
          tamanho_empresa: string | null
          telefone: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          email: string
          empresa: string
          id?: string
          nivel_risco_free?:
            | Database["public"]["Enums"]["nr1_nivel_risco"]
            | null
          nome: string
          origem?: string | null
          respostas_free?: Json | null
          score_free?: number | null
          tamanho_empresa?: string | null
          telefone?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          cargo?: string | null
          created_at?: string
          email?: string
          empresa?: string
          id?: string
          nivel_risco_free?:
            | Database["public"]["Enums"]["nr1_nivel_risco"]
            | null
          nome?: string
          origem?: string | null
          respostas_free?: Json | null
          score_free?: number | null
          tamanho_empresa?: string | null
          telefone?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      nr1_mapeamentos_templates: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          is_default: boolean
          mapeamento: Json
          metodologia: Database["public"]["Enums"]["nr1_matriz_metodologia"]
          nome: string
          ultimo_uso_em: string | null
          updated_at: string
          uso_count: number
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          is_default?: boolean
          mapeamento?: Json
          metodologia: Database["public"]["Enums"]["nr1_matriz_metodologia"]
          nome: string
          ultimo_uso_em?: string | null
          updated_at?: string
          uso_count?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          is_default?: boolean
          mapeamento?: Json
          metodologia?: Database["public"]["Enums"]["nr1_matriz_metodologia"]
          nome?: string
          ultimo_uso_em?: string | null
          updated_at?: string
          uso_count?: number
        }
        Relationships: []
      }
      nr1_planos_acao: {
        Row: {
          aprovacao_status: Database["public"]["Enums"]["nr1_aprovacao_status"]
          clima_pesquisa_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          custo_estimado: number | null
          descricao: string | null
          diagnostico_id: string | null
          dimensao: string | null
          dimensoes_relacionadas: string[] | null
          evidencias: string | null
          id: string
          impacto_estimado: string | null
          observacao_aprovacao: string | null
          origem: string | null
          prazo: string | null
          prioridade: Database["public"]["Enums"]["nr1_acao_prioridade"]
          progresso: number
          responsavel: string | null
          revisado_em: string | null
          revisado_por: string | null
          status: Database["public"]["Enums"]["nr1_acao_status"]
          submetido_em: string | null
          submetido_por: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          aprovacao_status?: Database["public"]["Enums"]["nr1_aprovacao_status"]
          clima_pesquisa_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          custo_estimado?: number | null
          descricao?: string | null
          diagnostico_id?: string | null
          dimensao?: string | null
          dimensoes_relacionadas?: string[] | null
          evidencias?: string | null
          id?: string
          impacto_estimado?: string | null
          observacao_aprovacao?: string | null
          origem?: string | null
          prazo?: string | null
          prioridade?: Database["public"]["Enums"]["nr1_acao_prioridade"]
          progresso?: number
          responsavel?: string | null
          revisado_em?: string | null
          revisado_por?: string | null
          status?: Database["public"]["Enums"]["nr1_acao_status"]
          submetido_em?: string | null
          submetido_por?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          aprovacao_status?: Database["public"]["Enums"]["nr1_aprovacao_status"]
          clima_pesquisa_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          custo_estimado?: number | null
          descricao?: string | null
          diagnostico_id?: string | null
          dimensao?: string | null
          dimensoes_relacionadas?: string[] | null
          evidencias?: string | null
          id?: string
          impacto_estimado?: string | null
          observacao_aprovacao?: string | null
          origem?: string | null
          prazo?: string | null
          prioridade?: Database["public"]["Enums"]["nr1_acao_prioridade"]
          progresso?: number
          responsavel?: string | null
          revisado_em?: string | null
          revisado_por?: string | null
          status?: Database["public"]["Enums"]["nr1_acao_status"]
          submetido_em?: string | null
          submetido_por?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nr1_planos_acao_diagnostico_id_fkey"
            columns: ["diagnostico_id"]
            isOneToOne: false
            referencedRelation: "nr1_diagnosticos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nr1_planos_acao_diagnostico_id_fkey"
            columns: ["diagnostico_id"]
            isOneToOne: false
            referencedRelation: "vw_nr1_clima_copsoq_correlacao"
            referencedColumns: ["diagnostico_id"]
          },
        ]
      }
      nr1_planos_aprovacao_historico: {
        Row: {
          acao: string
          ator_id: string | null
          ator_nome: string | null
          company_id: string
          created_at: string
          id: string
          observacao: string | null
          plano_id: string
          status_anterior:
            | Database["public"]["Enums"]["nr1_aprovacao_status"]
            | null
          status_novo:
            | Database["public"]["Enums"]["nr1_aprovacao_status"]
            | null
        }
        Insert: {
          acao: string
          ator_id?: string | null
          ator_nome?: string | null
          company_id: string
          created_at?: string
          id?: string
          observacao?: string | null
          plano_id: string
          status_anterior?:
            | Database["public"]["Enums"]["nr1_aprovacao_status"]
            | null
          status_novo?:
            | Database["public"]["Enums"]["nr1_aprovacao_status"]
            | null
        }
        Update: {
          acao?: string
          ator_id?: string | null
          ator_nome?: string | null
          company_id?: string
          created_at?: string
          id?: string
          observacao?: string | null
          plano_id?: string
          status_anterior?:
            | Database["public"]["Enums"]["nr1_aprovacao_status"]
            | null
          status_novo?:
            | Database["public"]["Enums"]["nr1_aprovacao_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "nr1_planos_aprovacao_historico_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "nr1_planos_acao"
            referencedColumns: ["id"]
          },
        ]
      }
      nr1_questoes: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          dimensao: Database["public"]["Enums"]["nr1_dimensao"]
          enunciado: string
          id: string
          is_free_diagnostic: boolean
          ordem: number
          peso: number
          reverso: boolean
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          dimensao: Database["public"]["Enums"]["nr1_dimensao"]
          enunciado: string
          id?: string
          is_free_diagnostic?: boolean
          ordem?: number
          peso?: number
          reverso?: boolean
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          dimensao?: Database["public"]["Enums"]["nr1_dimensao"]
          enunciado?: string
          id?: string
          is_free_diagnostic?: boolean
          ordem?: number
          peso?: number
          reverso?: boolean
        }
        Relationships: []
      }
      nr1_subscriptions: {
        Row: {
          company_id: string
          created_at: string
          ends_at: string | null
          grau_risco_inss: number | null
          id: string
          max_employees: number | null
          mrr: number | null
          plan_tier: Database["public"]["Enums"]["nr1_plan_tier"]
          started_at: string
          status: Database["public"]["Enums"]["nr1_subscription_status"]
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          ends_at?: string | null
          grau_risco_inss?: number | null
          id?: string
          max_employees?: number | null
          mrr?: number | null
          plan_tier?: Database["public"]["Enums"]["nr1_plan_tier"]
          started_at?: string
          status?: Database["public"]["Enums"]["nr1_subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          ends_at?: string | null
          grau_risco_inss?: number | null
          id?: string
          max_employees?: number | null
          mrr?: number | null
          plan_tier?: Database["public"]["Enums"]["nr1_plan_tier"]
          started_at?: string
          status?: Database["public"]["Enums"]["nr1_subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      nr1_terceiros: {
        Row: {
          area_atuacao: string | null
          ativo: boolean
          cnpj: string
          company_id: string
          contato_email: string | null
          contato_nome: string | null
          contato_telefone: string | null
          contrato_inicio: string | null
          created_at: string
          created_by: string | null
          emergencia_email: string | null
          emergencia_nome: string | null
          emergencia_telefone: string | null
          grau_risco: number | null
          id: string
          nome_fantasia: string | null
          num_colaboradores: number | null
          observacoes: string | null
          razao_social: string
          updated_at: string
        }
        Insert: {
          area_atuacao?: string | null
          ativo?: boolean
          cnpj: string
          company_id: string
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          contrato_inicio?: string | null
          created_at?: string
          created_by?: string | null
          emergencia_email?: string | null
          emergencia_nome?: string | null
          emergencia_telefone?: string | null
          grau_risco?: number | null
          id?: string
          nome_fantasia?: string | null
          num_colaboradores?: number | null
          observacoes?: string | null
          razao_social: string
          updated_at?: string
        }
        Update: {
          area_atuacao?: string | null
          ativo?: boolean
          cnpj?: string
          company_id?: string
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          contrato_inicio?: string | null
          created_at?: string
          created_by?: string | null
          emergencia_email?: string | null
          emergencia_nome?: string | null
          emergencia_telefone?: string | null
          grau_risco?: number | null
          id?: string
          nome_fantasia?: string | null
          num_colaboradores?: number | null
          observacoes?: string | null
          razao_social?: string
          updated_at?: string
        }
        Relationships: []
      }
      nr1_terceiros_pgr: {
        Row: {
          company_id: string
          created_at: string
          data_emissao: string | null
          data_vencimento: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          observacoes: string | null
          terceiro_id: string
          uploaded_by: string | null
          versao: string
        }
        Insert: {
          company_id: string
          created_at?: string
          data_emissao?: string | null
          data_vencimento?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          observacoes?: string | null
          terceiro_id: string
          uploaded_by?: string | null
          versao: string
        }
        Update: {
          company_id?: string
          created_at?: string
          data_emissao?: string | null
          data_vencimento?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          observacoes?: string | null
          terceiro_id?: string
          uploaded_by?: string | null
          versao?: string
        }
        Relationships: [
          {
            foreignKeyName: "nr1_terceiros_pgr_terceiro_id_fkey"
            columns: ["terceiro_id"]
            isOneToOne: false
            referencedRelation: "nr1_terceiros"
            referencedColumns: ["id"]
          },
        ]
      }
      organizational_structure: {
        Row: {
          address: string | null
          base_date: string | null
          billing_cycle: string | null
          checkup_addon_enabled: boolean
          clima_addon_enabled: boolean
          code: string | null
          created_at: string
          data_deletion_scheduled_at: string | null
          default_language: string | null
          description: string | null
          fantasy_name: string | null
          fib_addon_enabled: boolean
          id: string
          industry_sector: string | null
          is_founder: boolean | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          nr1_addon_enabled: boolean
          parent_id: string | null
          psicossociais_addon_enabled: boolean
          risk_grade: number | null
          root_company_id: string | null
          selected_modules: string[]
          selected_plan: string | null
          social_charges_percentage: number | null
          subscription_plan_id: string | null
          subscription_started_at: string | null
          subscription_status: string | null
          total_price: number | null
          trial_ends_at: string | null
          type: string
          union_name: string | null
          unit_role: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          base_date?: string | null
          billing_cycle?: string | null
          checkup_addon_enabled?: boolean
          clima_addon_enabled?: boolean
          code?: string | null
          created_at?: string
          data_deletion_scheduled_at?: string | null
          default_language?: string | null
          description?: string | null
          fantasy_name?: string | null
          fib_addon_enabled?: boolean
          id?: string
          industry_sector?: string | null
          is_founder?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          nr1_addon_enabled?: boolean
          parent_id?: string | null
          psicossociais_addon_enabled?: boolean
          risk_grade?: number | null
          root_company_id?: string | null
          selected_modules?: string[]
          selected_plan?: string | null
          social_charges_percentage?: number | null
          subscription_plan_id?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          total_price?: number | null
          trial_ends_at?: string | null
          type: string
          union_name?: string | null
          unit_role?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          base_date?: string | null
          billing_cycle?: string | null
          checkup_addon_enabled?: boolean
          clima_addon_enabled?: boolean
          code?: string | null
          created_at?: string
          data_deletion_scheduled_at?: string | null
          default_language?: string | null
          description?: string | null
          fantasy_name?: string | null
          fib_addon_enabled?: boolean
          id?: string
          industry_sector?: string | null
          is_founder?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          nr1_addon_enabled?: boolean
          parent_id?: string | null
          psicossociais_addon_enabled?: boolean
          risk_grade?: number | null
          root_company_id?: string | null
          selected_modules?: string[]
          selected_plan?: string | null
          social_charges_percentage?: number | null
          subscription_plan_id?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          total_price?: number | null
          trial_ends_at?: string | null
          type?: string
          union_name?: string | null
          unit_role?: string | null
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
            foreignKeyName: "organizational_structure_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
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
            foreignKeyName: "organizational_structure_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
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
      pay_equity_alerts: {
        Row: {
          affected_count: number | null
          alert_type: string
          created_at: string
          gap_percentage: number | null
          grade: string | null
          group_a_avg_salary: number | null
          group_a_label: string
          group_b_avg_salary: number | null
          group_b_label: string
          id: string
          job_title: string | null
          resolution_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          root_company_id: string
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          affected_count?: number | null
          alert_type: string
          created_at?: string
          gap_percentage?: number | null
          grade?: string | null
          group_a_avg_salary?: number | null
          group_a_label: string
          group_b_avg_salary?: number | null
          group_b_label: string
          id?: string
          job_title?: string | null
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          root_company_id: string
          severity?: string
          status?: string
          updated_at?: string
        }
        Update: {
          affected_count?: number | null
          alert_type?: string
          created_at?: string
          gap_percentage?: number | null
          grade?: string | null
          group_a_avg_salary?: number | null
          group_a_label?: string
          group_b_avg_salary?: number | null
          group_b_label?: string
          id?: string
          job_title?: string | null
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          root_company_id?: string
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      pay_equity_regression_results: {
        Row: {
          analysis_date: string
          controls_used: Json
          created_at: string
          created_by: string | null
          explained_gap_pct: number
          group_a_label: string
          group_b_label: string
          id: string
          notes: string | null
          protected_attribute: string
          raw_gap_pct: number
          root_company_id: string
          sample_size: number
          severity: string
          statistical_significance: number | null
          unexplained_gap_pct: number
        }
        Insert: {
          analysis_date?: string
          controls_used?: Json
          created_at?: string
          created_by?: string | null
          explained_gap_pct: number
          group_a_label: string
          group_b_label: string
          id?: string
          notes?: string | null
          protected_attribute: string
          raw_gap_pct: number
          root_company_id: string
          sample_size: number
          severity: string
          statistical_significance?: number | null
          unexplained_gap_pct: number
        }
        Update: {
          analysis_date?: string
          controls_used?: Json
          created_at?: string
          created_by?: string | null
          explained_gap_pct?: number
          group_a_label?: string
          group_b_label?: string
          id?: string
          notes?: string | null
          protected_attribute?: string
          raw_gap_pct?: number
          root_company_id?: string
          sample_size?: number
          severity?: string
          statistical_significance?: number | null
          unexplained_gap_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "pay_equity_regression_results_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pay_equity_regression_results_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          brand: string | null
          company_id: string
          created_at: string | null
          holder_name: string | null
          id: string
          is_default: boolean | null
          last_four: string | null
          pagarme_card_id: string | null
          pagarme_customer_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          company_id: string
          created_at?: string | null
          holder_name?: string | null
          id?: string
          is_default?: boolean | null
          last_four?: string | null
          pagarme_card_id?: string | null
          pagarme_customer_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          company_id?: string
          created_at?: string | null
          holder_name?: string | null
          id?: string
          is_default?: boolean | null
          last_four?: string | null
          pagarme_card_id?: string | null
          pagarme_customer_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      performai_conversations: {
        Row: {
          answer: string
          context_data: Json | null
          created_at: string
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
          created_at?: string
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
          created_at?: string
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
            foreignKeyName: "performai_conversations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      performance_alerts: {
        Row: {
          alert_type: string
          context: Json | null
          created_at: string | null
          employee_id: string | null
          id: string
          is_resolved: boolean | null
          message: string | null
          resolved_at: string | null
          resolved_by: string | null
          root_company_id: string
          severity: string
          title: string
        }
        Insert: {
          alert_type: string
          context?: Json | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          is_resolved?: boolean | null
          message?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          root_company_id: string
          severity: string
          title: string
        }
        Update: {
          alert_type?: string
          context?: Json | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          is_resolved?: boolean | null
          message?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          root_company_id?: string
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_alerts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_alerts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performance_alerts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_alerts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_alerts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_alerts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performance_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_alerts_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_alerts_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_competency_scores: {
        Row: {
          comments: string | null
          competency_id: string
          created_at: string
          evaluated_level: string | null
          evaluation_id: string
          expected_level: string | null
          id: string
          score: number | null
        }
        Insert: {
          comments?: string | null
          competency_id: string
          created_at?: string
          evaluated_level?: string | null
          evaluation_id: string
          expected_level?: string | null
          id?: string
          score?: number | null
        }
        Update: {
          comments?: string | null
          competency_id?: string
          created_at?: string
          evaluated_level?: string | null
          evaluation_id?: string
          expected_level?: string | null
          id?: string
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_competency_scores_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_competency_scores_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "performance_evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_competency_scores_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "v_performance_evaluations_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_competency_scores_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["evaluation_id"]
          },
        ]
      }
      performance_cycles: {
        Row: {
          competency_weight: number | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          evaluation_angle: Database["public"]["Enums"]["performance_evaluation_angle"]
          evaluation_end_date: string | null
          evaluation_start_date: string | null
          fiscal_year: number
          goals_end_date: string | null
          goals_start_date: string | null
          goals_weight: number | null
          id: string
          incentive_weight_percentage: number | null
          include_competencies: boolean | null
          include_probationary: boolean | null
          is_active: boolean | null
          linked_incentive_program_id: string | null
          name: string
          root_company_id: string
          scale_type: Database["public"]["Enums"]["performance_scale_type"]
          start_date: string
          status: Database["public"]["Enums"]["performance_cycle_status"]
          updated_at: string
        }
        Insert: {
          competency_weight?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          evaluation_angle?: Database["public"]["Enums"]["performance_evaluation_angle"]
          evaluation_end_date?: string | null
          evaluation_start_date?: string | null
          fiscal_year: number
          goals_end_date?: string | null
          goals_start_date?: string | null
          goals_weight?: number | null
          id?: string
          incentive_weight_percentage?: number | null
          include_competencies?: boolean | null
          include_probationary?: boolean | null
          is_active?: boolean | null
          linked_incentive_program_id?: string | null
          name: string
          root_company_id: string
          scale_type?: Database["public"]["Enums"]["performance_scale_type"]
          start_date: string
          status?: Database["public"]["Enums"]["performance_cycle_status"]
          updated_at?: string
        }
        Update: {
          competency_weight?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          evaluation_angle?: Database["public"]["Enums"]["performance_evaluation_angle"]
          evaluation_end_date?: string | null
          evaluation_start_date?: string | null
          fiscal_year?: number
          goals_end_date?: string | null
          goals_start_date?: string | null
          goals_weight?: number | null
          id?: string
          incentive_weight_percentage?: number | null
          include_competencies?: boolean | null
          include_probationary?: boolean | null
          is_active?: boolean | null
          linked_incentive_program_id?: string | null
          name?: string
          root_company_id?: string
          scale_type?: Database["public"]["Enums"]["performance_scale_type"]
          start_date?: string
          status?: Database["public"]["Enums"]["performance_cycle_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_cycles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_cycles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performance_cycles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_cycles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_cycles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_cycles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_cycles_linked_incentive_program_id_fkey"
            columns: ["linked_incentive_program_id"]
            isOneToOne: false
            referencedRelation: "incentive_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_cycles_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_cycles_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_evaluations: {
        Row: {
          ai_feedback: string | null
          approved_at: string | null
          approved_by: string | null
          competency_score: number | null
          created_at: string
          cycle_id: string
          employee_comments: string | null
          employee_id: string
          evaluator_id: string
          evaluator_type: Database["public"]["Enums"]["performance_evaluator_type"]
          final_score: number | null
          goals_score: number | null
          id: string
          impact_level: Database["public"]["Enums"]["impact_level"] | null
          improvement_areas: string | null
          is_probationary: boolean | null
          manager_comments: string | null
          potential_score: number | null
          probationary_decision: string | null
          retention_risk_factors: Json | null
          retention_risk_level:
            | Database["public"]["Enums"]["retention_risk_level"]
            | null
          retention_risk_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          root_company_id: string
          status: Database["public"]["Enums"]["performance_evaluation_status"]
          strengths: string | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          ai_feedback?: string | null
          approved_at?: string | null
          approved_by?: string | null
          competency_score?: number | null
          created_at?: string
          cycle_id: string
          employee_comments?: string | null
          employee_id: string
          evaluator_id: string
          evaluator_type?: Database["public"]["Enums"]["performance_evaluator_type"]
          final_score?: number | null
          goals_score?: number | null
          id?: string
          impact_level?: Database["public"]["Enums"]["impact_level"] | null
          improvement_areas?: string | null
          is_probationary?: boolean | null
          manager_comments?: string | null
          potential_score?: number | null
          probationary_decision?: string | null
          retention_risk_factors?: Json | null
          retention_risk_level?:
            | Database["public"]["Enums"]["retention_risk_level"]
            | null
          retention_risk_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          root_company_id: string
          status?: Database["public"]["Enums"]["performance_evaluation_status"]
          strengths?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          ai_feedback?: string | null
          approved_at?: string | null
          approved_by?: string | null
          competency_score?: number | null
          created_at?: string
          cycle_id?: string
          employee_comments?: string | null
          employee_id?: string
          evaluator_id?: string
          evaluator_type?: Database["public"]["Enums"]["performance_evaluator_type"]
          final_score?: number | null
          goals_score?: number | null
          id?: string
          impact_level?: Database["public"]["Enums"]["impact_level"] | null
          improvement_areas?: string | null
          is_probationary?: boolean | null
          manager_comments?: string | null
          potential_score?: number | null
          probationary_decision?: string | null
          retention_risk_factors?: Json | null
          retention_risk_level?:
            | Database["public"]["Enums"]["retention_risk_level"]
            | null
          retention_risk_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          root_company_id?: string
          status?: Database["public"]["Enums"]["performance_evaluation_status"]
          strengths?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_evaluations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_evaluations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performance_evaluations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_evaluations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_evaluations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_evaluations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_evaluations_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "performance_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_evaluations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_evaluations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performance_evaluations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_evaluations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_evaluations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_evaluations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performance_evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_evaluations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_evaluations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performance_evaluations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_evaluations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_evaluations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_evaluations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_evaluations_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_evaluations_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_evaluations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "performance_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_glossary_terms: {
        Row: {
          category: string
          created_at: string
          definition: string
          id: string
          is_active: boolean | null
          related_terms: string[] | null
          root_company_id: string | null
          synonyms: string[] | null
          term: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          definition: string
          id?: string
          is_active?: boolean | null
          related_terms?: string[] | null
          root_company_id?: string | null
          synonyms?: string[] | null
          term: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          definition?: string
          id?: string
          is_active?: boolean | null
          related_terms?: string[] | null
          root_company_id?: string | null
          synonyms?: string[] | null
          term?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_glossary_terms_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_glossary_terms_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_goals: {
        Row: {
          achieved_at: string | null
          created_at: string
          created_by: string | null
          current_value: number | null
          cycle_id: string
          description: string | null
          due_date: string | null
          employee_id: string | null
          id: string
          job_title_id: string | null
          level: Database["public"]["Enums"]["performance_goal_level"]
          parent_goal_id: string | null
          root_company_id: string
          status: Database["public"]["Enums"]["performance_goal_status"]
          target_value: number | null
          title: string
          unit_id: string | null
          unit_of_measure: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          achieved_at?: string | null
          created_at?: string
          created_by?: string | null
          current_value?: number | null
          cycle_id: string
          description?: string | null
          due_date?: string | null
          employee_id?: string | null
          id?: string
          job_title_id?: string | null
          level: Database["public"]["Enums"]["performance_goal_level"]
          parent_goal_id?: string | null
          root_company_id: string
          status?: Database["public"]["Enums"]["performance_goal_status"]
          target_value?: number | null
          title: string
          unit_id?: string | null
          unit_of_measure?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          achieved_at?: string | null
          created_at?: string
          created_by?: string | null
          current_value?: number | null
          cycle_id?: string
          description?: string | null
          due_date?: string | null
          employee_id?: string | null
          id?: string
          job_title_id?: string | null
          level?: Database["public"]["Enums"]["performance_goal_level"]
          parent_goal_id?: string | null
          root_company_id?: string
          status?: Database["public"]["Enums"]["performance_goal_status"]
          target_value?: number | null
          title?: string
          unit_id?: string | null
          unit_of_measure?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performance_goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_goals_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "performance_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_goals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_goals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performance_goals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_goals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_goals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_goals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_goals_job_title_id_fkey"
            columns: ["job_title_id"]
            isOneToOne: false
            referencedRelation: "job_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_goals_parent_goal_id_fkey"
            columns: ["parent_goal_id"]
            isOneToOne: false
            referencedRelation: "performance_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_goals_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_goals_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_goals_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_goals_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_kudos: {
        Row: {
          category: Database["public"]["Enums"]["performance_kudos_category"]
          created_at: string
          from_employee_id: string
          id: string
          is_public: boolean | null
          is_read: boolean | null
          message: string
          root_company_id: string
          to_employee_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["performance_kudos_category"]
          created_at?: string
          from_employee_id: string
          id?: string
          is_public?: boolean | null
          is_read?: boolean | null
          message: string
          root_company_id: string
          to_employee_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["performance_kudos_category"]
          created_at?: string
          from_employee_id?: string
          id?: string
          is_public?: boolean | null
          is_read?: boolean | null
          message?: string
          root_company_id?: string
          to_employee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_kudos_from_employee_id_fkey"
            columns: ["from_employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_kudos_from_employee_id_fkey"
            columns: ["from_employee_id"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performance_kudos_from_employee_id_fkey"
            columns: ["from_employee_id"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_kudos_from_employee_id_fkey"
            columns: ["from_employee_id"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_kudos_from_employee_id_fkey"
            columns: ["from_employee_id"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_kudos_from_employee_id_fkey"
            columns: ["from_employee_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_kudos_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_kudos_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_kudos_to_employee_id_fkey"
            columns: ["to_employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_kudos_to_employee_id_fkey"
            columns: ["to_employee_id"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performance_kudos_to_employee_id_fkey"
            columns: ["to_employee_id"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_kudos_to_employee_id_fkey"
            columns: ["to_employee_id"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_kudos_to_employee_id_fkey"
            columns: ["to_employee_id"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_kudos_to_employee_id_fkey"
            columns: ["to_employee_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      performance_merit_recommendations: {
        Row: {
          applied_to_budget: boolean | null
          approved_at: string | null
          approved_by: string | null
          budget_projection_id: string | null
          created_at: string
          employee_id: string
          evaluation_id: string
          id: string
          notes: string | null
          recommended_new_job_title_id: string | null
          recommended_percentage: number
          recommended_type: Database["public"]["Enums"]["performance_merit_type"]
          status: Database["public"]["Enums"]["performance_merit_status"]
          updated_at: string
        }
        Insert: {
          applied_to_budget?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          budget_projection_id?: string | null
          created_at?: string
          employee_id: string
          evaluation_id: string
          id?: string
          notes?: string | null
          recommended_new_job_title_id?: string | null
          recommended_percentage: number
          recommended_type?: Database["public"]["Enums"]["performance_merit_type"]
          status?: Database["public"]["Enums"]["performance_merit_status"]
          updated_at?: string
        }
        Update: {
          applied_to_budget?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          budget_projection_id?: string | null
          created_at?: string
          employee_id?: string
          evaluation_id?: string
          id?: string
          notes?: string | null
          recommended_new_job_title_id?: string | null
          recommended_percentage?: number
          recommended_type?: Database["public"]["Enums"]["performance_merit_type"]
          status?: Database["public"]["Enums"]["performance_merit_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_merit_recommendat_recommended_new_job_title_id_fkey"
            columns: ["recommended_new_job_title_id"]
            isOneToOne: false
            referencedRelation: "job_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_merit_recommendations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_merit_recommendations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performance_merit_recommendations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_merit_recommendations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_merit_recommendations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_merit_recommendations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_merit_recommendations_budget_projection_id_fkey"
            columns: ["budget_projection_id"]
            isOneToOne: false
            referencedRelation: "budget_employee_projections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_merit_recommendations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_merit_recommendations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performance_merit_recommendations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_merit_recommendations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_merit_recommendations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_merit_recommendations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_merit_recommendations_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "performance_evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_merit_recommendations_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "v_performance_evaluations_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_merit_recommendations_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["evaluation_id"]
          },
        ]
      }
      performance_merit_rules: {
        Row: {
          created_at: string
          cycle_id: string | null
          id: string
          is_active: boolean | null
          max_score: number
          merit_percentage: number
          min_score: number
          promotion_eligible: boolean | null
          root_company_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cycle_id?: string | null
          id?: string
          is_active?: boolean | null
          max_score: number
          merit_percentage: number
          min_score: number
          promotion_eligible?: boolean | null
          root_company_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cycle_id?: string | null
          id?: string
          is_active?: boolean | null
          max_score?: number
          merit_percentage?: number
          min_score?: number
          promotion_eligible?: boolean | null
          root_company_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_merit_rules_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "performance_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_merit_rules_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_merit_rules_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_one_on_ones: {
        Row: {
          action_items: Json | null
          agenda_items: Json | null
          completed_at: string | null
          created_at: string
          employee_id: string
          id: string
          is_completed: boolean | null
          manager_id: string
          notes: string | null
          root_company_id: string
          scheduled_date: string
          updated_at: string
        }
        Insert: {
          action_items?: Json | null
          agenda_items?: Json | null
          completed_at?: string | null
          created_at?: string
          employee_id: string
          id?: string
          is_completed?: boolean | null
          manager_id: string
          notes?: string | null
          root_company_id: string
          scheduled_date: string
          updated_at?: string
        }
        Update: {
          action_items?: Json | null
          agenda_items?: Json | null
          completed_at?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          is_completed?: boolean | null
          manager_id?: string
          notes?: string | null
          root_company_id?: string
          scheduled_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_one_on_ones_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_one_on_ones_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performance_one_on_ones_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_one_on_ones_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_one_on_ones_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_one_on_ones_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_one_on_ones_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_one_on_ones_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performance_one_on_ones_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_one_on_ones_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_one_on_ones_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_one_on_ones_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_one_on_ones_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_one_on_ones_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_pdi: {
        Row: {
          action_items: Json | null
          competency_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          employee_id: string
          evaluation_id: string | null
          id: string
          progress_percentage: number | null
          root_company_id: string
          status: Database["public"]["Enums"]["performance_pdi_status"]
          title: string
          updated_at: string
        }
        Insert: {
          action_items?: Json | null
          competency_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          employee_id: string
          evaluation_id?: string | null
          id?: string
          progress_percentage?: number | null
          root_company_id: string
          status?: Database["public"]["Enums"]["performance_pdi_status"]
          title: string
          updated_at?: string
        }
        Update: {
          action_items?: Json | null
          competency_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          employee_id?: string
          evaluation_id?: string | null
          id?: string
          progress_percentage?: number | null
          root_company_id?: string
          status?: Database["public"]["Enums"]["performance_pdi_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_pdi_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_pdi_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_pdi_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performance_pdi_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_pdi_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_pdi_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_pdi_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_pdi_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_pdi_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performance_pdi_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_pdi_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_pdi_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_pdi_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_pdi_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "performance_evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_pdi_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "v_performance_evaluations_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_pdi_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["evaluation_id"]
          },
          {
            foreignKeyName: "performance_pdi_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_pdi_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_succession: {
        Row: {
          approval_comments: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          development_plan: string | null
          id: string
          key_position_id: string
          notes: string | null
          rank: number | null
          readiness: Database["public"]["Enums"]["performance_readiness"]
          root_company_id: string
          selected_as_successor: boolean | null
          status: string | null
          successor_employee_id: string
          updated_at: string
        }
        Insert: {
          approval_comments?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          development_plan?: string | null
          id?: string
          key_position_id: string
          notes?: string | null
          rank?: number | null
          readiness?: Database["public"]["Enums"]["performance_readiness"]
          root_company_id: string
          selected_as_successor?: boolean | null
          status?: string | null
          successor_employee_id: string
          updated_at?: string
        }
        Update: {
          approval_comments?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          development_plan?: string | null
          id?: string
          key_position_id?: string
          notes?: string | null
          rank?: number | null
          readiness?: Database["public"]["Enums"]["performance_readiness"]
          root_company_id?: string
          selected_as_successor?: boolean | null
          status?: string | null
          successor_employee_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_succession_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_succession_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performance_succession_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_succession_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_succession_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_succession_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_succession_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_succession_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performance_succession_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_succession_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_succession_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_succession_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_succession_key_position_id_fkey"
            columns: ["key_position_id"]
            isOneToOne: false
            referencedRelation: "job_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_succession_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_succession_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_succession_successor_employee_id_fkey"
            columns: ["successor_employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_succession_successor_employee_id_fkey"
            columns: ["successor_employee_id"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performance_succession_successor_employee_id_fkey"
            columns: ["successor_employee_id"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_succession_successor_employee_id_fkey"
            columns: ["successor_employee_id"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_succession_successor_employee_id_fkey"
            columns: ["successor_employee_id"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_succession_successor_employee_id_fkey"
            columns: ["successor_employee_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      performance_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          indicators: Json | null
          is_active: boolean | null
          is_global: boolean | null
          name: string
          root_company_id: string | null
          suggested_competency_ids: string[] | null
          template_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          indicators?: Json | null
          is_active?: boolean | null
          is_global?: boolean | null
          name: string
          root_company_id?: string | null
          suggested_competency_ids?: string[] | null
          template_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          indicators?: Json | null
          is_active?: boolean | null
          is_global?: boolean | null
          name?: string
          root_company_id?: string | null
          suggested_competency_ids?: string[] | null
          template_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performance_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_templates_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_templates_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_variable_link: {
        Row: {
          calculated_multiplier: number
          created_at: string
          evaluation_id: string
          id: string
          incentive_program_id: string
          notes: string | null
          weight_percentage: number
        }
        Insert: {
          calculated_multiplier?: number
          created_at?: string
          evaluation_id: string
          id?: string
          incentive_program_id: string
          notes?: string | null
          weight_percentage?: number
        }
        Update: {
          calculated_multiplier?: number
          created_at?: string
          evaluation_id?: string
          id?: string
          incentive_program_id?: string
          notes?: string | null
          weight_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "performance_variable_link_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "performance_evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_variable_link_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "v_performance_evaluations_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_variable_link_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["evaluation_id"]
          },
          {
            foreignKeyName: "performance_variable_link_incentive_program_id_fkey"
            columns: ["incentive_program_id"]
            isOneToOne: false
            referencedRelation: "incentive_programs"
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
          age_range: string | null
          avatar_url: string | null
          benefits_value: number | null
          birth_date: string | null
          cpf: string | null
          created_at: string
          department: string | null
          email: string | null
          employee_number: string | null
          full_name: string
          gender: string | null
          grade: string | null
          has_system_access: boolean | null
          hire_date: string | null
          id: string
          job_title: string | null
          job_title_id: string | null
          leadership_level: string | null
          long_term_incentive: number | null
          manager_id: string | null
          nr1_consent_at: string | null
          nr1_consent_version: string | null
          pcd: boolean | null
          performance_rating: number | null
          phone: string | null
          preferred_language: string | null
          race_ethnicity: string | null
          root_company_id: string | null
          salary: number | null
          salary_range_percentage: number | null
          shift: string | null
          short_term_incentive: number | null
          status: Database["public"]["Enums"]["user_status"]
          termination_date: string | null
          unit_id: string | null
          updated_at: string
          variable_salary: number | null
          work_modality: string | null
        }
        Insert: {
          age_range?: string | null
          avatar_url?: string | null
          benefits_value?: number | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          employee_number?: string | null
          full_name: string
          gender?: string | null
          grade?: string | null
          has_system_access?: boolean | null
          hire_date?: string | null
          id: string
          job_title?: string | null
          job_title_id?: string | null
          leadership_level?: string | null
          long_term_incentive?: number | null
          manager_id?: string | null
          nr1_consent_at?: string | null
          nr1_consent_version?: string | null
          pcd?: boolean | null
          performance_rating?: number | null
          phone?: string | null
          preferred_language?: string | null
          race_ethnicity?: string | null
          root_company_id?: string | null
          salary?: number | null
          salary_range_percentage?: number | null
          shift?: string | null
          short_term_incentive?: number | null
          status?: Database["public"]["Enums"]["user_status"]
          termination_date?: string | null
          unit_id?: string | null
          updated_at?: string
          variable_salary?: number | null
          work_modality?: string | null
        }
        Update: {
          age_range?: string | null
          avatar_url?: string | null
          benefits_value?: number | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          employee_number?: string | null
          full_name?: string
          gender?: string | null
          grade?: string | null
          has_system_access?: boolean | null
          hire_date?: string | null
          id?: string
          job_title?: string | null
          job_title_id?: string | null
          leadership_level?: string | null
          long_term_incentive?: number | null
          manager_id?: string | null
          nr1_consent_at?: string | null
          nr1_consent_version?: string | null
          pcd?: boolean | null
          performance_rating?: number | null
          phone?: string | null
          preferred_language?: string | null
          race_ethnicity?: string | null
          root_company_id?: string | null
          salary?: number | null
          salary_range_percentage?: number | null
          shift?: string | null
          short_term_incentive?: number | null
          status?: Database["public"]["Enums"]["user_status"]
          termination_date?: string | null
          unit_id?: string | null
          updated_at?: string
          variable_salary?: number | null
          work_modality?: string | null
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
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "profiles_position_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_position_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_directory: {
        Row: {
          avatar_url: string | null
          full_name: string
          grade: string | null
          job_title: string | null
          root_company_id: string | null
          status: Database["public"]["Enums"]["user_status"] | null
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          full_name: string
          grade?: string | null
          job_title?: string | null
          root_company_id?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          full_name?: string
          grade?: string | null
          job_title?: string | null
          root_company_id?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limit_log: {
        Row: {
          created_at: string
          function_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      rh_service_diagnostico_respostas: {
        Row: {
          created_at: string
          diagnostico_id: string
          id: string
          questao_id: string
          resposta_numerica: number | null
          resposta_texto: string | null
          tenant_id: string
          updated_at: string
          versao_id: string
        }
        Insert: {
          created_at?: string
          diagnostico_id: string
          id?: string
          questao_id: string
          resposta_numerica?: number | null
          resposta_texto?: string | null
          tenant_id: string
          updated_at?: string
          versao_id: string
        }
        Update: {
          created_at?: string
          diagnostico_id?: string
          id?: string
          questao_id?: string
          resposta_numerica?: number | null
          resposta_texto?: string | null
          tenant_id?: string
          updated_at?: string
          versao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rh_service_diagnostico_respostas_diagnostico_id_fkey"
            columns: ["diagnostico_id"]
            isOneToOne: false
            referencedRelation: "rh_service_diagnosticos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_service_diagnostico_respostas_questao_id_fkey"
            columns: ["questao_id"]
            isOneToOne: false
            referencedRelation: "rh_service_maturidade_questoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_service_diagnostico_respostas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_service_diagnostico_respostas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_service_diagnostico_respostas_versao_id_fkey"
            columns: ["versao_id"]
            isOneToOne: false
            referencedRelation: "rh_service_maturidade_versoes"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_service_diagnostico_scores: {
        Row: {
          created_at: string
          diagnostico_id: string
          id: string
          module_slug: string | null
          nivel: string | null
          pratica: string
          score: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          diagnostico_id: string
          id?: string
          module_slug?: string | null
          nivel?: string | null
          pratica: string
          score: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          diagnostico_id?: string
          id?: string
          module_slug?: string | null
          nivel?: string | null
          pratica?: string
          score?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rh_service_diagnostico_scores_diagnostico_id_fkey"
            columns: ["diagnostico_id"]
            isOneToOne: false
            referencedRelation: "rh_service_diagnosticos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_service_diagnostico_scores_module_slug_fkey"
            columns: ["module_slug"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "rh_service_diagnostico_scores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_service_diagnostico_scores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_service_diagnosticos: {
        Row: {
          consultor_id: string | null
          created_at: string
          diagnostico: Json
          id: string
          maturidade: number | null
          modulo_avaliado: string | null
          nivel: string | null
          projeto_id: string | null
          recomendacoes: Json
          status: string
          tenant_id: string
          updated_at: string
          versao_id: string
        }
        Insert: {
          consultor_id?: string | null
          created_at?: string
          diagnostico?: Json
          id?: string
          maturidade?: number | null
          modulo_avaliado?: string | null
          nivel?: string | null
          projeto_id?: string | null
          recomendacoes?: Json
          status?: string
          tenant_id: string
          updated_at?: string
          versao_id: string
        }
        Update: {
          consultor_id?: string | null
          created_at?: string
          diagnostico?: Json
          id?: string
          maturidade?: number | null
          modulo_avaliado?: string | null
          nivel?: string | null
          projeto_id?: string | null
          recomendacoes?: Json
          status?: string
          tenant_id?: string
          updated_at?: string
          versao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rh_service_diagnosticos_consultor_id_fkey"
            columns: ["consultor_id"]
            isOneToOne: false
            referencedRelation: "consultores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_service_diagnosticos_modulo_avaliado_fkey"
            columns: ["modulo_avaliado"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "rh_service_diagnosticos_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "rh_service_projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_service_diagnosticos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_service_diagnosticos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_service_diagnosticos_versao_id_fkey"
            columns: ["versao_id"]
            isOneToOne: false
            referencedRelation: "rh_service_maturidade_versoes"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_service_horas: {
        Row: {
          consultor_id: string | null
          created_at: string
          data: string
          descricao: string | null
          horas: number
          id: string
          projeto_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          consultor_id?: string | null
          created_at?: string
          data?: string
          descricao?: string | null
          horas: number
          id?: string
          projeto_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          consultor_id?: string | null
          created_at?: string
          data?: string
          descricao?: string | null
          horas?: number
          id?: string
          projeto_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rh_service_horas_consultor_id_fkey"
            columns: ["consultor_id"]
            isOneToOne: false
            referencedRelation: "consultores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_service_horas_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "rh_service_projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_service_horas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_service_horas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_service_maturidade_questoes: {
        Row: {
          created_at: string
          enunciado: string
          escala_max: number
          id: string
          module_slug: string | null
          ordem: number
          peso: number
          pratica: string
          updated_at: string
          versao_id: string
        }
        Insert: {
          created_at?: string
          enunciado: string
          escala_max?: number
          id?: string
          module_slug?: string | null
          ordem?: number
          peso?: number
          pratica: string
          updated_at?: string
          versao_id: string
        }
        Update: {
          created_at?: string
          enunciado?: string
          escala_max?: number
          id?: string
          module_slug?: string | null
          ordem?: number
          peso?: number
          pratica?: string
          updated_at?: string
          versao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rh_service_maturidade_questoes_module_slug_fkey"
            columns: ["module_slug"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "rh_service_maturidade_questoes_versao_id_fkey"
            columns: ["versao_id"]
            isOneToOne: false
            referencedRelation: "rh_service_maturidade_versoes"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_service_maturidade_versoes: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          is_active: boolean
          nome: string
          updated_at: string
          versao: number
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          is_active?: boolean
          nome: string
          updated_at?: string
          versao: number
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          is_active?: boolean
          nome?: string
          updated_at?: string
          versao?: number
        }
        Relationships: []
      }
      rh_service_projetos: {
        Row: {
          consultor_id: string | null
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          escopo: string | null
          horas_estimadas: number | null
          id: string
          status: string
          tenant_id: string
          titulo: string
          updated_at: string
          valor_negociado: number | null
        }
        Insert: {
          consultor_id?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          escopo?: string | null
          horas_estimadas?: number | null
          id?: string
          status?: string
          tenant_id: string
          titulo: string
          updated_at?: string
          valor_negociado?: number | null
        }
        Update: {
          consultor_id?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          escopo?: string | null
          horas_estimadas?: number | null
          id?: string
          status?: string
          tenant_id?: string
          titulo?: string
          updated_at?: string
          valor_negociado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rh_service_projetos_consultor_id_fkey"
            columns: ["consultor_id"]
            isOneToOne: false
            referencedRelation: "consultores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_service_projetos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_service_projetos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      rh_service_recomendacoes: {
        Row: {
          created_at: string
          diagnostico_id: string
          id: string
          justificativa: string | null
          module_slug: string
          origem: string
          pratica: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          diagnostico_id: string
          id?: string
          justificativa?: string | null
          module_slug: string
          origem?: string
          pratica?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          diagnostico_id?: string
          id?: string
          justificativa?: string | null
          module_slug?: string
          origem?: string
          pratica?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rh_service_recomendacoes_diagnostico_id_fkey"
            columns: ["diagnostico_id"]
            isOneToOne: false
            referencedRelation: "rh_service_diagnosticos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_service_recomendacoes_module_slug_fkey"
            columns: ["module_slug"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "rh_service_recomendacoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rh_service_recomendacoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
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
          {
            foreignKeyName: "salary_assistant_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "salary_assistant_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "salary_assistant_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "salary_assistant_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_assistant_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
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
          reference_points: number | null
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
          reference_points?: number | null
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
          reference_points?: number | null
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
          is_template: boolean
          modality: Database["public"]["Enums"]["salary_modality"]
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
          is_template?: boolean
          modality?: Database["public"]["Enums"]["salary_modality"]
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
          is_template?: boolean
          modality?: Database["public"]["Enums"]["salary_modality"]
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
          {
            foreignKeyName: "salary_tables_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          company_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          source_ip: string | null
          status: string | null
          target_email: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          company_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity: string
          source_ip?: string | null
          status?: string | null
          target_email?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          company_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          source_ip?: string | null
          status?: string | null
          target_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      security_scan_snapshots: {
        Row: {
          active_error_count: number
          created_at: string
          created_by: string | null
          id: string
          ignored_findings: Json
        }
        Insert: {
          active_error_count?: number
          created_at?: string
          created_by?: string | null
          id?: string
          ignored_findings?: Json
        }
        Update: {
          active_error_count?: number
          created_at?: string
          created_by?: string | null
          id?: string
          ignored_findings?: Json
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          section_key: string
          section_name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          section_key: string
          section_name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          section_key?: string
          section_name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
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
          module_core_price: number | null
          module_insight_price: number | null
          module_match_price: number | null
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
          module_core_price?: number | null
          module_insight_price?: number | null
          module_match_price?: number | null
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
          module_core_price?: number | null
          module_insight_price?: number | null
          module_match_price?: number | null
          monthly_price?: number
          name?: string
          plan_type?: string
          setup_fee?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      succession_decisions: {
        Row: {
          ai_recommendation: string | null
          comments: string | null
          created_at: string
          decision_at: string
          decision_by: string
          decision_type: string
          id: string
          key_position_id: string
          linked_evaluation_id: string | null
          root_company_id: string
          succession_id: string
          successor_employee_id: string
        }
        Insert: {
          ai_recommendation?: string | null
          comments?: string | null
          created_at?: string
          decision_at?: string
          decision_by: string
          decision_type: string
          id?: string
          key_position_id: string
          linked_evaluation_id?: string | null
          root_company_id: string
          succession_id: string
          successor_employee_id: string
        }
        Update: {
          ai_recommendation?: string | null
          comments?: string | null
          created_at?: string
          decision_at?: string
          decision_by?: string
          decision_type?: string
          id?: string
          key_position_id?: string
          linked_evaluation_id?: string | null
          root_company_id?: string
          succession_id?: string
          successor_employee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "succession_decisions_decision_by_fkey"
            columns: ["decision_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "succession_decisions_decision_by_fkey"
            columns: ["decision_by"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "succession_decisions_decision_by_fkey"
            columns: ["decision_by"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "succession_decisions_decision_by_fkey"
            columns: ["decision_by"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "succession_decisions_decision_by_fkey"
            columns: ["decision_by"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "succession_decisions_decision_by_fkey"
            columns: ["decision_by"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "succession_decisions_key_position_id_fkey"
            columns: ["key_position_id"]
            isOneToOne: false
            referencedRelation: "job_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "succession_decisions_linked_evaluation_id_fkey"
            columns: ["linked_evaluation_id"]
            isOneToOne: false
            referencedRelation: "performance_evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "succession_decisions_linked_evaluation_id_fkey"
            columns: ["linked_evaluation_id"]
            isOneToOne: false
            referencedRelation: "v_performance_evaluations_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "succession_decisions_linked_evaluation_id_fkey"
            columns: ["linked_evaluation_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["evaluation_id"]
          },
          {
            foreignKeyName: "succession_decisions_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "succession_decisions_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "succession_decisions_succession_id_fkey"
            columns: ["succession_id"]
            isOneToOne: false
            referencedRelation: "performance_succession"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "succession_decisions_successor_employee_id_fkey"
            columns: ["successor_employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "succession_decisions_successor_employee_id_fkey"
            columns: ["successor_employee_id"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "succession_decisions_successor_employee_id_fkey"
            columns: ["successor_employee_id"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "succession_decisions_successor_employee_id_fkey"
            columns: ["successor_employee_id"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "succession_decisions_successor_employee_id_fkey"
            columns: ["successor_employee_id"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "succession_decisions_successor_employee_id_fkey"
            columns: ["successor_employee_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      super_admin_active_company: {
        Row: {
          active_company_id: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_company_id: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_company_id?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "super_admin_active_company_active_company_id_fkey"
            columns: ["active_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "super_admin_active_company_active_company_id_fkey"
            columns: ["active_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
          modality: Database["public"]["Enums"]["salary_modality"]
          name: string
          root_company_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_amplitude?: number | null
          effective_month: number
          effective_year: number
          id?: string
          is_active?: boolean
          modality?: Database["public"]["Enums"]["salary_modality"]
          name: string
          root_company_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_amplitude?: number | null
          effective_month?: number
          effective_year?: number
          id?: string
          is_active?: boolean
          modality?: Database["public"]["Enums"]["salary_modality"]
          name?: string
          root_company_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_tables_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_tables_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      system_labels: {
        Row: {
          created_at: string
          custom_label: string | null
          default_label: string
          description: string | null
          id: string
          key: string
          root_company_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_label?: string | null
          default_label: string
          description?: string | null
          id?: string
          key: string
          root_company_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_label?: string | null
          default_label?: string
          description?: string | null
          id?: string
          key?: string
          root_company_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_labels_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_labels_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_intelligence_recommendations: {
        Row: {
          ai_reasoning: string | null
          applied_at: string | null
          approver_notes: string | null
          box_position: number | null
          created_at: string
          current_salary: number | null
          cycle_id: string | null
          employee_id: string
          financial_impact_annual: number | null
          financial_impact_monthly: number | null
          id: string
          manual_override_pct: number | null
          override_justification: string | null
          performance_score: number | null
          potential_score: number | null
          recommended_grade: string | null
          recommended_merit_pct: number | null
          recommended_new_salary: number | null
          recommended_promotion: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          root_company_id: string
          status: string
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          ai_reasoning?: string | null
          applied_at?: string | null
          approver_notes?: string | null
          box_position?: number | null
          created_at?: string
          current_salary?: number | null
          cycle_id?: string | null
          employee_id: string
          financial_impact_annual?: number | null
          financial_impact_monthly?: number | null
          id?: string
          manual_override_pct?: number | null
          override_justification?: string | null
          performance_score?: number | null
          potential_score?: number | null
          recommended_grade?: string | null
          recommended_merit_pct?: number | null
          recommended_new_salary?: number | null
          recommended_promotion?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          root_company_id: string
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          ai_reasoning?: string | null
          applied_at?: string | null
          approver_notes?: string | null
          box_position?: number | null
          created_at?: string
          current_salary?: number | null
          cycle_id?: string | null
          employee_id?: string
          financial_impact_annual?: number | null
          financial_impact_monthly?: number | null
          id?: string
          manual_override_pct?: number | null
          override_justification?: string | null
          performance_score?: number | null
          potential_score?: number | null
          recommended_grade?: string | null
          recommended_merit_pct?: number | null
          recommended_new_salary?: number | null
          recommended_promotion?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          root_company_id?: string
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_intelligence_recommendations_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "performance_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_intelligence_recommendations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_intelligence_recommendations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "talent_intelligence_recommendations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "talent_intelligence_recommendations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "talent_intelligence_recommendations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_intelligence_recommendations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      talent_recommendation_history: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          new_status: string | null
          notes: string | null
          previous_status: string | null
          recommendation_id: string
          snapshot: Json | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: string
          new_status?: string | null
          notes?: string | null
          previous_status?: string | null
          recommendation_id: string
          snapshot?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          new_status?: string | null
          notes?: string | null
          previous_status?: string | null
          recommendation_id?: string
          snapshot?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_recommendation_history_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "talent_intelligence_recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_recommendation_history_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["recommendation_id"]
          },
        ]
      }
      tenant_subscriptions: {
        Row: {
          bundle_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          module_id: string | null
          started_at: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          bundle_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          module_id?: string | null
          started_at?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          bundle_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          module_id?: string | null
          started_at?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_subscriptions_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_subscriptions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_merit_budgets: {
        Row: {
          approved_amount_annual: number
          approved_at: string | null
          approved_by: string | null
          ceiling_pct: number
          created_at: string
          fiscal_year: number
          id: string
          notes: string | null
          root_company_id: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          approved_amount_annual: number
          approved_at?: string | null
          approved_by?: string | null
          ceiling_pct?: number
          created_at?: string
          fiscal_year: number
          id?: string
          notes?: string | null
          root_company_id: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          approved_amount_annual?: number
          approved_at?: string | null
          approved_by?: string | null
          ceiling_pct?: number
          created_at?: string
          fiscal_year?: number
          id?: string
          notes?: string | null
          root_company_id?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_merit_budgets_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_merit_budgets_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_merit_budgets_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_merit_budgets_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_events: {
        Row: {
          company_id: string
          created_at: string
          duration_ms: number | null
          event_category: string
          event_name: string
          id: string
          metadata: Json | null
          module_name: string | null
          route_path: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          duration_ms?: number | null
          event_category: string
          event_name: string
          id?: string
          metadata?: Json | null
          module_name?: string | null
          route_path?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          duration_ms?: number | null
          event_category?: string
          event_name?: string
          id?: string
          metadata?: Json | null
          module_name?: string | null
          route_path?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          created_at: string | null
          description: string
          id: string
          internal_notes: string | null
          nps_score: number | null
          page_url: string | null
          root_company_id: string | null
          status: string | null
          title: string
          type: string
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          internal_notes?: string | null
          nps_score?: number | null
          page_url?: string | null
          root_company_id?: string | null
          status?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          internal_notes?: string | null
          nps_score?: number | null
          page_url?: string | null
          root_company_id?: string | null
          status?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_feedback_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
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
      invoices_redacted_for_hr: {
        Row: {
          company_id: string | null
          created_at: string | null
          discount: number | null
          due_date: string | null
          id: string | null
          invoice_number: string | null
          issue_date: string | null
          paid_at: string | null
          payment_method: string | null
          status: string | null
          subtotal: number | null
          tax: number | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          discount?: number | null
          due_date?: string | null
          id?: string | null
          invoice_number?: string | null
          issue_date?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          discount?: number | null
          due_date?: string | null
          id?: string | null
          invoice_number?: string | null
          issue_date?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
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
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      nr1_checkins_agregado: {
        Row: {
          company_id: string | null
          humor_medio: number | null
          primeira_resposta: string | null
          semana: number | null
          total_respondentes: number | null
          ultima_resposta: string | null
        }
        Relationships: []
      }
      organizational_structure_public: {
        Row: {
          code: string | null
          created_at: string | null
          default_language: string | null
          description: string | null
          fantasy_name: string | null
          id: string | null
          industry_sector: string | null
          is_founder: boolean | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string | null
          parent_id: string | null
          root_company_id: string | null
          social_charges_percentage: number | null
          subscription_plan_id: string | null
          subscription_status: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          default_language?: string | null
          description?: string | null
          fantasy_name?: string | null
          id?: string | null
          industry_sector?: string | null
          is_founder?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string | null
          parent_id?: string | null
          root_company_id?: string | null
          social_charges_percentage?: number | null
          subscription_plan_id?: string | null
          subscription_status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          default_language?: string | null
          description?: string | null
          fantasy_name?: string | null
          id?: string | null
          industry_sector?: string | null
          is_founder?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string | null
          parent_id?: string | null
          root_company_id?: string | null
          social_charges_percentage?: number | null
          subscription_plan_id?: string | null
          subscription_status?: string | null
          type?: string | null
          updated_at?: string | null
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
            foreignKeyName: "organizational_structure_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
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
            foreignKeyName: "organizational_structure_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
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
      profiles_compensation_directory: {
        Row: {
          avatar_url: string | null
          email: string | null
          full_name: string | null
          grade: string | null
          hire_date: string | null
          is_active: boolean | null
          job_title: string | null
          job_title_id: string | null
          root_company_id: string | null
          salary: number | null
          total_benefits_value: number | null
          total_incentives_value: number | null
          unit_id: string | null
          unit_name: string | null
          user_id: string | null
          variable_salary: number | null
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
            foreignKeyName: "profiles_position_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_position_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      security_scan_latest: {
        Row: {
          active_error_count: number | null
          created_at: string | null
          created_by: string | null
          id: string | null
          ignored_findings: Json | null
        }
        Relationships: []
      }
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
      v_budget_merit_projection: {
        Row: {
          current_salary: number | null
          employee_id: string | null
          full_name: string | null
          grade: string | null
          job_title: string | null
          last_performance_score: number | null
          range_max: number | null
          range_median: number | null
          range_min: number | null
          root_company_id: string | null
          salary_range_percentage: number | null
          suggested_merit_pct: number | null
          suggested_monthly_impact: number | null
          unit_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_position_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_position_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      v_employee_compensation_intelligence: {
        Row: {
          benefits_value: number | null
          email: string | null
          employee_id: string | null
          full_name: string | null
          grade: string | null
          hire_date: string | null
          job_title: string | null
          job_title_id: string | null
          last_evaluation_date: string | null
          last_performance_score: number | null
          last_potential_score: number | null
          manager_id: string | null
          range_max: number | null
          range_median: number | null
          range_min: number | null
          root_company_id: string | null
          salary: number | null
          salary_range_percentage: number | null
          status: Database["public"]["Enums"]["user_status"] | null
          succession_readiness: string | null
          unit_id: string | null
          variable_salary: number | null
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
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "profiles_position_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_position_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      v_pay_equity_by_gender: {
        Row: {
          avg_salary: number | null
          employee_count: number | null
          gender: string | null
          grade: string | null
          job_title: string | null
          max_salary: number | null
          median_salary: number | null
          min_salary: number | null
          root_company_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      v_pay_equity_by_race: {
        Row: {
          avg_salary: number | null
          employee_count: number | null
          grade: string | null
          job_title: string | null
          median_salary: number | null
          race_ethnicity: string | null
          root_company_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      v_performance_employees: {
        Row: {
          active_goals_count: number | null
          active_pdi_count: number | null
          avatar_url: string | null
          full_name: string | null
          grade: string | null
          hire_date: string | null
          id: string | null
          job_title: string | null
          last_evaluation_score: number | null
          last_evaluation_status:
            | Database["public"]["Enums"]["performance_evaluation_status"]
            | null
          manager_id: string | null
          manager_name: string | null
          pending_feedback_count: number | null
          root_company_id: string | null
          status: Database["public"]["Enums"]["user_status"] | null
          unit_breadcrumb: string | null
          unit_id: string | null
          unit_name: string | null
          unit_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "profiles_position_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_position_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      v_performance_evaluations_directory: {
        Row: {
          ai_feedback: string | null
          approved_at: string | null
          approved_by: string | null
          competency_score: number | null
          created_at: string | null
          cycle_fiscal_year: number | null
          cycle_id: string | null
          cycle_name: string | null
          employee_avatar_url: string | null
          employee_comments: string | null
          employee_full_name: string | null
          employee_grade: string | null
          employee_id: string | null
          employee_job_title: string | null
          evaluator_avatar_url: string | null
          evaluator_full_name: string | null
          evaluator_id: string | null
          evaluator_type:
            | Database["public"]["Enums"]["performance_evaluator_type"]
            | null
          final_score: number | null
          goals_score: number | null
          id: string | null
          improvement_areas: string | null
          is_probationary: boolean | null
          manager_comments: string | null
          potential_score: number | null
          probationary_decision: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          root_company_id: string | null
          status:
            | Database["public"]["Enums"]["performance_evaluation_status"]
            | null
          strengths: string | null
          template_id: string | null
          template_name: string | null
          template_type: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_evaluations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_evaluations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performance_evaluations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_evaluations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_evaluations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_evaluations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_evaluations_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "performance_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_evaluations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_evaluations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performance_evaluations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_evaluations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_evaluations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_evaluations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performance_evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_evaluations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_evaluations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles_compensation_directory"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performance_evaluations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_budget_merit_projection"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_evaluations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_employee_compensation_intelligence"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_evaluations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_performance_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_evaluations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_talent_intelligence_dashboard"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "performance_evaluations_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_evaluations_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_evaluations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "performance_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      v_talent_intelligence_dashboard: {
        Row: {
          box_position: number | null
          current_salary: number | null
          cycle_id: string | null
          employee_id: string | null
          evaluation_id: string | null
          financial_impact_annual: number | null
          full_name: string | null
          grade: string | null
          job_title: string | null
          performance_score: number | null
          potential_score: number | null
          recommendation_id: string | null
          recommendation_status: string | null
          recommended_merit_pct: number | null
          recommended_new_salary: number | null
          root_company_id: string | null
          suggested_merit_pct: number | null
          unit_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_evaluations_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "performance_cycles"
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
            foreignKeyName: "profiles_position_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_root_company_id_fkey"
            columns: ["root_company_id"]
            isOneToOne: false
            referencedRelation: "organizational_structure_public"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_nr1_clima_copsoq_correlacao: {
        Row: {
          clima_dim: string | null
          clima_id: string | null
          clima_nome: string | null
          clima_respondentes: number | null
          clima_score: number | null
          clima_status: string | null
          company_id: string | null
          copsoq_dim: string | null
          copsoq_score_eq: number | null
          copsoq_score_raw: number | null
          copsoq_status: string | null
          diag_nome: string | null
          diag_respondentes: number | null
          diagnostico_id: string | null
          prioridade: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_merit_to_budget: {
        Args: {
          p_amount_annual: number
          p_employee_id?: string
          p_fiscal_year: number
          p_notes?: string
          p_source_id: string
          p_source_type: string
          p_unit_id: string
        }
        Returns: string
      }
      audit_rls_tenant_isolation: {
        Args: never
        Returns: {
          affected_rows: number
          details: string
          operation: string
          status: string
          table_name: string
        }[]
      }
      audit_sensitive_data_access: {
        Args: never
        Returns: {
          details: string
          sensitive_field: string
          status: string
          table_name: string
        }[]
      }
      build_scenario_from_9box: {
        Args: {
          p_filter_box_max?: number
          p_filter_box_min?: number
          p_filter_unit_ids?: string[]
          p_fiscal_year: number
          p_multiplier?: number
          p_root_company_id: string
          p_scenario_name: string
          p_strategy?: string
        }
        Returns: string
      }
      calculate_9box_position: {
        Args: { p_performance: number; p_potential: number }
        Returns: number
      }
      calculate_employee_benefits: {
        Args: { p_employee_id: string }
        Returns: number
      }
      calculate_merit_by_9box: {
        Args: { p_box_position: number }
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
      calculate_smart_merit: {
        Args: {
          p_box_position: number
          p_budget_available_pct?: number
          p_compa_ratio?: number
          p_months_since_last_raise?: number
        }
        Returns: Json
      }
      calculate_transportation_benefit: {
        Args: { p_employee_id: string; p_monthly_cost: number }
        Returns: {
          company_subsidy: number
          employee_discount: number
          total_cost: number
        }[]
      }
      check_budget_capacity: {
        Args: {
          p_amount_annual: number
          p_fiscal_year: number
          p_unit_id: string
        }
        Returns: Json
      }
      check_budget_ceiling: {
        Args: {
          p_ceiling_pct?: number
          p_fiscal_year?: number
          p_unit_id?: string
        }
        Returns: {
          ceiling_pct: number
          excess_annual: number
          payroll_increase_pct: number
          scenario: string
          status: string
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
      check_rate_limit: {
        Args: {
          p_function_name: string
          p_max_requests?: number
          p_user_id: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_expired_unsubscribe_tokens: { Args: never; Returns: number }
      cleanup_old_telemetry: { Args: never; Returns: Json }
      cleanup_rate_limit_logs: { Args: never; Returns: undefined }
      company_has_plan_tier: {
        Args: { _company_id: string; _min_tier: string }
        Returns: boolean
      }
      compare_scenarios: {
        Args: { p_scenario_ids: string[] }
        Returns: {
          avg_merit_pct: number
          high_performers_retained: number
          low_performers_included: number
          multiplier: number
          payroll_increase_pct: number
          scenario_id: string
          scenario_name: string
          strategy: string
          total_annual_impact: number
          total_headcount: number
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
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
      email_queue_dispatch: { Args: never; Returns: undefined }
      employee_import_can_manage: {
        Args: { _tenant_id: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      escalate_overdue_approvals: {
        Args: never
        Returns: {
          escalated_count: number
        }[]
      }
      evaluate_merit_governance: {
        Args: {
          p_annual_impact: number
          p_budget_available_pct: number
          p_budget_remaining_annual: number
          p_compa_ratio: number
          p_employee_id: string
          p_months_since_last_raise: number
          p_requested_pct: number
          p_suggested_pct: number
        }
        Returns: Json
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
      get_clima_externo_publico: {
        Args: { p_token: string }
        Returns: {
          id: string
          modalidade: string
          nome: string
          status: string
        }[]
      }
      get_clima_pesquisa_publica: {
        Args: { _token: string }
        Returns: {
          company_id: string
          id: string
          modalidade: string
          nome: string
          periodo_fim: string
          periodo_inicio: string
          status: string
        }[]
      }
      get_companies_billing_info: {
        Args: { _company_ids: string[] }
        Returns: {
          billing_email: string
          cnpj: string
          custom_annual_price: number
          custom_monthly_price: number
          id: string
          payment_method: string
        }[]
      }
      get_company_billing_details: {
        Args: { p_company_id: string }
        Returns: {
          billing_email: string
          cnpj: string
          custom_annual_price: number
          custom_monthly_price: number
          id: string
          payment_method: string
          subscription_started_at: string
          trial_ends_at: string
        }[]
      }
      get_company_billing_info: {
        Args: { _company_id: string }
        Returns: {
          billing_email: string
          cnpj: string
          custom_annual_price: number
          custom_monthly_price: number
          id: string
          payment_method: string
        }[]
      }
      get_company_plan: { Args: { _company_id: string }; Returns: string }
      get_compensation_mismatch_kpi: {
        Args: never
        Returns: {
          high_perf_low_salary: number
          low_perf_high_salary: number
          mismatch_percentage: number
          total_employees: number
          total_mismatches: number
        }[]
      }
      get_equity_alerts: {
        Args: { p_threshold_pct?: number }
        Returns: {
          employee_count: number
          gap_percentage: number
          grade: string
          job_title: string
          max_salary: number
          min_salary: number
          severity: string
        }[]
      }
      get_feedback_request_by_token: {
        Args: { p_token: string }
        Returns: {
          company_logo_url: string
          company_name: string
          custom_message: string
          deadline: string
          employee_job_title: string
          employee_name: string
          external_name: string
          external_type: Database["public"]["Enums"]["external_evaluator_type"]
          id: string
          status: Database["public"]["Enums"]["external_feedback_status"]
          template_questions: Json
        }[]
      }
      get_manager_direct_reports: {
        Args: never
        Returns: {
          age_range: string
          avatar_url: string
          benefits_value: number
          created_at: string
          email: string
          employee_number: string
          full_name: string
          grade: string
          has_system_access: boolean
          hire_date: string
          id: string
          job_title: string
          job_title_id: string
          long_term_incentive: number
          manager_id: string
          performance_rating: number
          phone: string
          preferred_language: string
          root_company_id: string
          salary: number
          salary_range_percentage: number
          short_term_incentive: number
          status: string
          termination_date: string
          unit_id: string
          updated_at: string
          variable_salary: number
        }[]
      }
      get_market_alerts: {
        Args: { threshold_pct?: number }
        Returns: {
          employee_id: string
          employee_name: string
          gap_amount: number
          gap_pct: number
          grade: string
          internal_salary: number
          job_title: string
          market_median: number
          recommendation: string
          severity: string
        }[]
      }
      get_market_benchmark_summary: {
        Args: never
        Returns: {
          above_market: number
          avg_competitiveness_pct: number
          below_market: number
          competitive: number
          critical_alerts: number
          total_gap_amount: number
          total_matched: number
        }[]
      }
      get_market_competitiveness: {
        Args: never
        Returns: {
          competitiveness_pct: number
          employee_id: string
          employee_name: string
          grade: string
          internal_salary: number
          job_title: string
          market_median: number
          market_position: string
          market_q1: number
          market_q3: number
          survey_name: string
          unit_id: string
          unit_name: string
        }[]
      }
      get_merit_suggestion: {
        Args: { p_employee_id: string }
        Returns: {
          annual_impact: number
          current_salary: number
          employee_id: string
          is_mismatch: boolean
          mismatch_reason: string
          monthly_impact: number
          performance_score: number
          range_position_percentage: number
          recommendation: string
          suggested_merit_percentage: number
          suggested_new_salary: number
        }[]
      }
      get_my_approval_inbox: {
        Args: never
        Returns: {
          annual_impact: number
          approval_type: string
          assigned_at: string
          assignment_id: string
          deadline_at: string
          employee_name: string
          escalated: boolean
          hours_remaining: number
          is_overdue: boolean
          requested_pct: number
          source_id: string
          status: string
        }[]
      }
      get_org_breadcrumb: { Args: { entity_id: string }; Returns: string }
      get_org_breadcrumb_friendly: {
        Args: { entity_id: string }
        Returns: string
      }
      get_pay_gap_by_gender: {
        Args: never
        Returns: {
          avg_salary: number
          employee_count: number
          gap_vs_male_percentage: number
          gender: string
          median_salary: number
        }[]
      }
      get_pay_gap_by_grade: {
        Args: never
        Returns: {
          avg_salary: number
          coefficient_variation: number
          employee_count: number
          grade: string
          max_salary: number
          min_salary: number
          std_deviation: number
        }[]
      }
      get_salary_gini_index: {
        Args: never
        Returns: {
          gini_index: number
          interpretation: string
          total_employees: number
          total_payroll: number
        }[]
      }
      get_tenant_modules: {
        Args: never
        Returns: {
          slug: string
        }[]
      }
      get_top_compensation_mismatches: {
        Args: { p_limit?: number }
        Returns: {
          employee_id: string
          full_name: string
          job_title: string
          mismatch_severity: string
          performance_score: number
          salary_range_percentage: number
        }[]
      }
      get_unit_budget_status: {
        Args: { p_fiscal_year?: number; p_root_company_id: string }
        Returns: {
          approved_amount_annual: number
          available_amount: number
          burn_pct: number
          consumed_amount: number
          fiscal_year: number
          ledger_count: number
          reserved_amount: number
          status: string
          unit_id: string
          unit_name: string
        }[]
      }
      get_user_company_id: { Args: never; Returns: string }
      get_user_root_company_id_strict: { Args: never; Returns: string }
      get_visible_employees: {
        Args: { p_company_id: string; p_user_id: string }
        Returns: {
          employee_id: string
        }[]
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_consultor_modulo_access: {
        Args: { _module_slug: string; _tenant_id: string }
        Returns: boolean
      }
      has_module: { Args: { _slug: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      import_employees_batch: {
        Args: { p_rows: Json; p_run: Json }
        Returns: Json
      }
      is_super_admin: { Args: { _user_id?: string }; Returns: boolean }
      log_consultor_core_access: {
        Args: {
          _action: string
          _details?: Json
          _granted?: boolean
          _tenant_id: string
        }
        Returns: undefined
      }
      manage_user_roles: {
        Args: {
          p_roles: Database["public"]["Enums"]["app_role"][]
          p_user_id: string
        }
        Returns: undefined
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      nr1_calc_risco: {
        Args: { score: number }
        Returns: Database["public"]["Enums"]["nr1_nivel_risco"]
      }
      nr1_plano_transicao: {
        Args: {
          _novo_status: Database["public"]["Enums"]["nr1_aprovacao_status"]
          _observacao?: string
          _plano_id: string
        }
        Returns: {
          aprovacao_status: Database["public"]["Enums"]["nr1_aprovacao_status"]
          clima_pesquisa_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          custo_estimado: number | null
          descricao: string | null
          diagnostico_id: string | null
          dimensao: string | null
          dimensoes_relacionadas: string[] | null
          evidencias: string | null
          id: string
          impacto_estimado: string | null
          observacao_aprovacao: string | null
          origem: string | null
          prazo: string | null
          prioridade: Database["public"]["Enums"]["nr1_acao_prioridade"]
          progresso: number
          responsavel: string | null
          revisado_em: string | null
          revisado_por: string | null
          status: Database["public"]["Enums"]["nr1_acao_status"]
          submetido_em: string | null
          submetido_por: string | null
          titulo: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "nr1_planos_acao"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      nr1_recompute_scores: {
        Args: { p_diagnostico_id: string }
        Returns: undefined
      }
      nr1_template_marcar_uso: {
        Args: { _template_id: string }
        Returns: undefined
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
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
      registrar_envio_convites_clima: {
        Args: { _pesquisa_id: string; _quantidade: number }
        Returns: undefined
      }
      revert_merit_from_budget: {
        Args: { p_reason?: string; p_source_id: string; p_source_type: string }
        Returns: string
      }
      rh_service_calcular_nivel: { Args: { _score: number }; Returns: string }
      rh_service_calcular_scores: {
        Args: { _diagnostico_id: string }
        Returns: undefined
      }
      rh_service_can_read: { Args: { _tenant_id: string }; Returns: boolean }
      rh_service_can_write: { Args: { _tenant_id: string }; Returns: boolean }
      rh_service_gerar_recomendacoes: {
        Args: { _diagnostico_id: string; _limiar?: number }
        Returns: number
      }
      simulate_9box_budget: {
        Args: {
          p_ceiling_pct?: number
          p_fiscal_year?: number
          p_root_company_id: string
        }
        Returns: {
          avg_box_position: number
          ceiling_amount_annual: number
          ceiling_pct: number
          current_payroll_annual: number
          excess_annual: number
          headcount: number
          high_performers: number
          low_performers: number
          payroll_increase_pct: number
          proposed_merit_impact_annual: number
          status: string
          unit_id: string
          unit_name: string
        }[]
      }
      simulate_budget_scenarios: {
        Args: { p_fiscal_year?: number; p_unit_id?: string }
        Returns: {
          avg_merit_pct: number
          multiplier: number
          payroll_increase_pct: number
          scenario: string
          total_current_payroll: number
          total_employees: number
          total_merit_impact_annual: number
          total_merit_impact_monthly: number
        }[]
      }
      snapshot_cycle_decision: {
        Args: {
          p_cycle_name: string
          p_fiscal_year: number
          p_notes?: string
          p_root_company_id: string
          p_scenario_id: string
        }
        Returns: string
      }
      submit_clima_externo_resposta: {
        Args: {
          p_fingerprint: string
          p_nps: number
          p_pontos_fortes: string
          p_pontos_melhoria: string
          p_score_geral: number
          p_scores_dimensao: Json
          p_setor: string
          p_tempo_relacionamento: string
          p_tipo_stakeholder: string
          p_token: string
        }
        Returns: string
      }
      submit_clima_resposta_anonima: {
        Args: {
          _departamento: string
          _funcao_nivel: string
          _itens: Json
          _modalidade_trabalho: string
          _respondent_hash: string
          _score_geral: number
          _scores_dimensao: Json
          _tempo_empresa: string
          _tipo_respondente: string
          _token: string
        }
        Returns: string
      }
      submit_external_feedback: {
        Args: {
          p_additional_comments: string
          p_answers: Json
          p_improvement_areas: string
          p_overall_rating: number
          p_strengths: string
          p_token: string
        }
        Returns: string
      }
      suggest_next_employee_number: { Args: never; Returns: string }
      test_audit_rollback_on_insert_failure: {
        Args: never
        Returns: {
          details: string
          scenario: string
          status: string
        }[]
      }
      validate_coupon_code: {
        Args: { p_billing_cycle?: string; p_code: string; p_plan_id?: string }
        Returns: {
          discount_type: string
          discount_value: number
          error_message: string
          is_valid: boolean
        }[]
      }
      validate_cpf_format: { Args: { cpf_value: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "hr_manager"
        | "manager"
        | "employee"
        | "super_admin"
        | "occupational_health"
        | "consultor"
      calculation_mode: "manual" | "automatic"
      clima_modalidade:
        | "isolada"
        | "integrada_psicossocial"
        | "com_clientes_externos"
      clima_pesquisa_status: "rascunho" | "aberta" | "fechada" | "arquivada"
      clima_tipo_respondente:
        | "colaborador"
        | "lideranca"
        | "cliente_interno"
        | "cliente_externo"
      external_evaluator_type: "customer" | "supplier" | "partner" | "other"
      external_feedback_status:
        | "pending"
        | "sent"
        | "completed"
        | "expired"
        | "cancelled"
      impact_level: "low" | "medium" | "high"
      nr1_acao_prioridade: "baixa" | "media" | "alta" | "critica"
      nr1_acao_status: "pendente" | "em_andamento" | "concluido" | "atrasado"
      nr1_aprovacao_status:
        | "rascunho"
        | "em_aprovacao"
        | "aprovado"
        | "rejeitado"
        | "revisao_solicitada"
      nr1_diagnostico_status: "em_andamento" | "concluido" | "arquivado"
      nr1_dimensao:
        | "demandas_trabalho"
        | "organizacao_conteudo"
        | "relacoes_lideranca"
        | "interface_trabalho_individuo"
        | "valores_trabalho"
        | "saude_bem_estar"
      nr1_jornada_status:
        | "ativa"
        | "pausada"
        | "concluida"
        | "encerrada_pelo_usuario"
      nr1_matriz_metodologia: "COPSOQ-III" | "HSE" | "JCQ" | "ERI" | "OUTRA"
      nr1_matriz_modo: "arquivo" | "texto"
      nr1_matriz_status:
        | "pendente"
        | "em_mapeamento"
        | "mapeado"
        | "publicado"
        | "erro"
      nr1_nivel_risco: "baixo" | "moderado" | "alto" | "critico"
      nr1_plan_tier: "essencial" | "pro"
      nr1_subscription_status:
        | "trial"
        | "active"
        | "past_due"
        | "canceled"
        | "included"
      performance_cycle_status:
        | "draft"
        | "goals"
        | "monitoring"
        | "insights"
        | "closing"
        | "closed"
      performance_evaluation_angle: "90" | "180" | "360"
      performance_evaluation_status:
        | "draft"
        | "pending_review"
        | "reviewed"
        | "approved"
        | "returned"
      performance_evaluator_type:
        | "self"
        | "manager"
        | "superior"
        | "peer"
        | "hr"
      performance_goal_level:
        | "company"
        | "area"
        | "department"
        | "position"
        | "individual"
      performance_goal_status:
        | "pending"
        | "in_progress"
        | "achieved"
        | "not_achieved"
      performance_kudos_category:
        | "teamwork"
        | "innovation"
        | "leadership"
        | "customer_focus"
        | "excellence"
      performance_merit_status: "pending" | "approved" | "rejected" | "applied"
      performance_merit_type: "merit_increase" | "promotion" | "none"
      performance_pdi_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "cancelled"
      performance_readiness:
        | "ready_now"
        | "ready_1_year"
        | "ready_2_years"
        | "development"
      performance_scale_type: "numeric_1_5" | "conceptual" | "percentage"
      proficiency_level: "basic" | "intermediate" | "advanced" | "expert"
      retention_risk_level: "low" | "medium" | "high"
      salary_modality: "fixed_salary" | "total_cash" | "total_compensation"
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
      app_role: [
        "admin",
        "hr_manager",
        "manager",
        "employee",
        "super_admin",
        "occupational_health",
        "consultor",
      ],
      calculation_mode: ["manual", "automatic"],
      clima_modalidade: [
        "isolada",
        "integrada_psicossocial",
        "com_clientes_externos",
      ],
      clima_pesquisa_status: ["rascunho", "aberta", "fechada", "arquivada"],
      clima_tipo_respondente: [
        "colaborador",
        "lideranca",
        "cliente_interno",
        "cliente_externo",
      ],
      external_evaluator_type: ["customer", "supplier", "partner", "other"],
      external_feedback_status: [
        "pending",
        "sent",
        "completed",
        "expired",
        "cancelled",
      ],
      impact_level: ["low", "medium", "high"],
      nr1_acao_prioridade: ["baixa", "media", "alta", "critica"],
      nr1_acao_status: ["pendente", "em_andamento", "concluido", "atrasado"],
      nr1_aprovacao_status: [
        "rascunho",
        "em_aprovacao",
        "aprovado",
        "rejeitado",
        "revisao_solicitada",
      ],
      nr1_diagnostico_status: ["em_andamento", "concluido", "arquivado"],
      nr1_dimensao: [
        "demandas_trabalho",
        "organizacao_conteudo",
        "relacoes_lideranca",
        "interface_trabalho_individuo",
        "valores_trabalho",
        "saude_bem_estar",
      ],
      nr1_jornada_status: [
        "ativa",
        "pausada",
        "concluida",
        "encerrada_pelo_usuario",
      ],
      nr1_matriz_metodologia: ["COPSOQ-III", "HSE", "JCQ", "ERI", "OUTRA"],
      nr1_matriz_modo: ["arquivo", "texto"],
      nr1_matriz_status: [
        "pendente",
        "em_mapeamento",
        "mapeado",
        "publicado",
        "erro",
      ],
      nr1_nivel_risco: ["baixo", "moderado", "alto", "critico"],
      nr1_plan_tier: ["essencial", "pro"],
      nr1_subscription_status: [
        "trial",
        "active",
        "past_due",
        "canceled",
        "included",
      ],
      performance_cycle_status: [
        "draft",
        "goals",
        "monitoring",
        "insights",
        "closing",
        "closed",
      ],
      performance_evaluation_angle: ["90", "180", "360"],
      performance_evaluation_status: [
        "draft",
        "pending_review",
        "reviewed",
        "approved",
        "returned",
      ],
      performance_evaluator_type: ["self", "manager", "superior", "peer", "hr"],
      performance_goal_level: [
        "company",
        "area",
        "department",
        "position",
        "individual",
      ],
      performance_goal_status: [
        "pending",
        "in_progress",
        "achieved",
        "not_achieved",
      ],
      performance_kudos_category: [
        "teamwork",
        "innovation",
        "leadership",
        "customer_focus",
        "excellence",
      ],
      performance_merit_status: ["pending", "approved", "rejected", "applied"],
      performance_merit_type: ["merit_increase", "promotion", "none"],
      performance_pdi_status: [
        "pending",
        "in_progress",
        "completed",
        "cancelled",
      ],
      performance_readiness: [
        "ready_now",
        "ready_1_year",
        "ready_2_years",
        "development",
      ],
      performance_scale_type: ["numeric_1_5", "conceptual", "percentage"],
      proficiency_level: ["basic", "intermediate", "advanced", "expert"],
      retention_risk_level: ["low", "medium", "high"],
      salary_modality: ["fixed_salary", "total_cash", "total_compensation"],
      user_status: ["active", "inactive"],
    },
  },
} as const
