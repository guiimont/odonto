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
      anamnesis_answers: {
        Row: {
          answer_text: string | null
          answered_by_patient: boolean
          clinic_id: number
          created_at: string
          deleted_at: string | null
          id: number
          legacy_id: string | null
          patient_anamnesis_id: number
          public_id: string
          question_id: number
          question_snapshot: string
          selection:
            | Database["public"]["Enums"]["anamnesis_answer_selection"]
            | null
          source_system: string | null
          updated_at: string
        }
        Insert: {
          answer_text?: string | null
          answered_by_patient?: boolean
          clinic_id: number
          created_at?: string
          deleted_at?: string | null
          id?: never
          legacy_id?: string | null
          patient_anamnesis_id: number
          public_id?: string
          question_id: number
          question_snapshot: string
          selection?:
            | Database["public"]["Enums"]["anamnesis_answer_selection"]
            | null
          source_system?: string | null
          updated_at?: string
        }
        Update: {
          answer_text?: string | null
          answered_by_patient?: boolean
          clinic_id?: number
          created_at?: string
          deleted_at?: string | null
          id?: never
          legacy_id?: string | null
          patient_anamnesis_id?: number
          public_id?: string
          question_id?: number
          question_snapshot?: string
          selection?:
            | Database["public"]["Enums"]["anamnesis_answer_selection"]
            | null
          source_system?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_answers_clinic_id_patient_anamnesis_id_fkey"
            columns: ["clinic_id", "patient_anamnesis_id"]
            isOneToOne: false
            referencedRelation: "patient_anamneses"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "anamnesis_answers_clinic_id_question_id_fkey"
            columns: ["clinic_id", "question_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_questions"
            referencedColumns: ["clinic_id", "id"]
          },
        ]
      }
      anamnesis_questions: {
        Row: {
          allows_free_text: boolean
          allows_selection: boolean
          clinic_id: number
          created_at: string
          deleted_at: string | null
          id: number
          legacy_id: string | null
          position: number
          prompt: string
          public_id: string
          required: boolean
          source_system: string | null
          template_id: number
          updated_at: string
        }
        Insert: {
          allows_free_text?: boolean
          allows_selection?: boolean
          clinic_id: number
          created_at?: string
          deleted_at?: string | null
          id?: never
          legacy_id?: string | null
          position: number
          prompt: string
          public_id?: string
          required?: boolean
          source_system?: string | null
          template_id: number
          updated_at?: string
        }
        Update: {
          allows_free_text?: boolean
          allows_selection?: boolean
          clinic_id?: number
          created_at?: string
          deleted_at?: string | null
          id?: never
          legacy_id?: string | null
          position?: number
          prompt?: string
          public_id?: string
          required?: boolean
          source_system?: string | null
          template_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_questions_clinic_id_template_id_fkey"
            columns: ["clinic_id", "template_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_templates"
            referencedColumns: ["clinic_id", "id"]
          },
        ]
      }
      anamnesis_templates: {
        Row: {
          active: boolean
          clinic_id: number
          created_at: string
          deleted_at: string | null
          id: number
          legacy_id: string | null
          name: string
          public_id: string
          source_system: string | null
          updated_at: string
          version: number
        }
        Insert: {
          active?: boolean
          clinic_id: number
          created_at?: string
          deleted_at?: string | null
          id?: never
          legacy_id?: string | null
          name: string
          public_id?: string
          source_system?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          active?: boolean
          clinic_id?: number
          created_at?: string
          deleted_at?: string | null
          id?: never
          legacy_id?: string | null
          name?: string
          public_id?: string
          source_system?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_templates_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          chair_id: number | null
          clinic_id: number
          created_at: string
          deleted_at: string | null
          dental_plan_id: number | null
          duration_minutes: number | null
          ends_at: string
          first_appointment: boolean
          id: number
          legacy_id: string | null
          observations: string | null
          patient_id: number
          professional_profile_id: string
          public_id: string
          reminder_sent_at: string | null
          source_payload: Json
          source_system: string | null
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          status_changed_at: string
          status_changed_by: string | null
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          chair_id?: number | null
          clinic_id: number
          created_at?: string
          deleted_at?: string | null
          dental_plan_id?: number | null
          duration_minutes?: number | null
          ends_at: string
          first_appointment?: boolean
          id?: never
          legacy_id?: string | null
          observations?: string | null
          patient_id: number
          professional_profile_id: string
          public_id?: string
          reminder_sent_at?: string | null
          source_payload?: Json
          source_system?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          status_changed_at?: string
          status_changed_by?: string | null
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          chair_id?: number | null
          clinic_id?: number
          created_at?: string
          deleted_at?: string | null
          dental_plan_id?: number | null
          duration_minutes?: number | null
          ends_at?: string
          first_appointment?: boolean
          id?: never
          legacy_id?: string | null
          observations?: string | null
          patient_id?: number
          professional_profile_id?: string
          public_id?: string
          reminder_sent_at?: string | null
          source_payload?: Json
          source_system?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          status_changed_at?: string
          status_changed_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_clinic_id_chair_id_fkey"
            columns: ["clinic_id", "chair_id"]
            isOneToOne: false
            referencedRelation: "chairs"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "appointments_clinic_id_dental_plan_id_fkey"
            columns: ["clinic_id", "dental_plan_id"]
            isOneToOne: false
            referencedRelation: "dental_plans"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "appointments_clinic_id_patient_id_fkey"
            columns: ["clinic_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "appointments_professional_profile_id_fkey"
            columns: ["professional_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_status_changed_by_fkey"
            columns: ["status_changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_item_targets: {
        Row: {
          budget_item_id: number
          clinic_id: number
          created_at: string
          deleted_at: string | null
          id: number
          public_id: string
          region: Database["public"]["Enums"]["odontogram_region"]
          surfaces: Database["public"]["Enums"]["odontogram_surface"][]
          tooth_code: number | null
          tooth_set: Database["public"]["Enums"]["tooth_set"] | null
          updated_at: string
        }
        Insert: {
          budget_item_id: number
          clinic_id: number
          created_at?: string
          deleted_at?: string | null
          id?: never
          public_id?: string
          region?: Database["public"]["Enums"]["odontogram_region"]
          surfaces?: Database["public"]["Enums"]["odontogram_surface"][]
          tooth_code?: number | null
          tooth_set?: Database["public"]["Enums"]["tooth_set"] | null
          updated_at?: string
        }
        Update: {
          budget_item_id?: number
          clinic_id?: number
          created_at?: string
          deleted_at?: string | null
          id?: never
          public_id?: string
          region?: Database["public"]["Enums"]["odontogram_region"]
          surfaces?: Database["public"]["Enums"]["odontogram_surface"][]
          tooth_code?: number | null
          tooth_set?: Database["public"]["Enums"]["tooth_set"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_item_targets_clinic_id_budget_item_id_fkey"
            columns: ["clinic_id", "budget_item_id"]
            isOneToOne: false
            referencedRelation: "budget_items"
            referencedColumns: ["clinic_id", "id"]
          },
        ]
      }
      budget_items: {
        Row: {
          allocated_discount_amount: number
          approved: boolean
          approved_at: string | null
          budget_id: number
          cancelled_at: string | null
          cancelled_reason: string | null
          clinic_id: number
          created_at: string
          deleted_at: string | null
          dental_plan_id: number | null
          gross_amount: number | null
          id: number
          legacy_id: string | null
          multiply_price_by_tooth: boolean
          net_amount: number | null
          position: number
          professional_profile_id: string | null
          public_id: string
          quantity: number
          source_payload: Json
          source_system: string | null
          treatment_catalog_id: number | null
          treatment_name_snapshot: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          allocated_discount_amount?: number
          approved?: boolean
          approved_at?: string | null
          budget_id: number
          cancelled_at?: string | null
          cancelled_reason?: string | null
          clinic_id: number
          created_at?: string
          deleted_at?: string | null
          dental_plan_id?: number | null
          gross_amount?: number | null
          id?: never
          legacy_id?: string | null
          multiply_price_by_tooth?: boolean
          net_amount?: number | null
          position?: number
          professional_profile_id?: string | null
          public_id?: string
          quantity?: number
          source_payload?: Json
          source_system?: string | null
          treatment_catalog_id?: number | null
          treatment_name_snapshot: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          allocated_discount_amount?: number
          approved?: boolean
          approved_at?: string | null
          budget_id?: number
          cancelled_at?: string | null
          cancelled_reason?: string | null
          clinic_id?: number
          created_at?: string
          deleted_at?: string | null
          dental_plan_id?: number | null
          gross_amount?: number | null
          id?: never
          legacy_id?: string | null
          multiply_price_by_tooth?: boolean
          net_amount?: number | null
          position?: number
          professional_profile_id?: string | null
          public_id?: string
          quantity?: number
          source_payload?: Json
          source_system?: string | null
          treatment_catalog_id?: number | null
          treatment_name_snapshot?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_clinic_id_budget_id_fkey"
            columns: ["clinic_id", "budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "budget_items_clinic_id_dental_plan_id_fkey"
            columns: ["clinic_id", "dental_plan_id"]
            isOneToOne: false
            referencedRelation: "dental_plans"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "budget_items_clinic_id_treatment_catalog_id_fkey"
            columns: ["clinic_id", "treatment_catalog_id"]
            isOneToOne: false
            referencedRelation: "treatments_catalog"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "budget_items_professional_profile_id_fkey"
            columns: ["professional_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          cancelled_reason: string | null
          clinic_id: number
          created_at: string
          currency: string
          deleted_at: string | null
          description: string
          discount_amount: number
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          entry_amount: number
          generate_contract: boolean
          has_installments: boolean
          id: number
          issued_at: string
          legacy_id: string | null
          legacy_reference: string | null
          observations: string | null
          original_budget_id: number | null
          patient_id: number
          public_id: string
          remaining_installments_count: number
          source_payload: Json
          source_system: string | null
          status: Database["public"]["Enums"]["budget_status"]
          subtotal_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancelled_reason?: string | null
          clinic_id: number
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description: string
          discount_amount?: number
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          entry_amount?: number
          generate_contract?: boolean
          has_installments?: boolean
          id?: never
          issued_at?: string
          legacy_id?: string | null
          legacy_reference?: string | null
          observations?: string | null
          original_budget_id?: number | null
          patient_id: number
          public_id?: string
          remaining_installments_count?: number
          source_payload?: Json
          source_system?: string | null
          status?: Database["public"]["Enums"]["budget_status"]
          subtotal_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancelled_reason?: string | null
          clinic_id?: number
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string
          discount_amount?: number
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          entry_amount?: number
          generate_contract?: boolean
          has_installments?: boolean
          id?: never
          issued_at?: string
          legacy_id?: string | null
          legacy_reference?: string | null
          observations?: string | null
          original_budget_id?: number | null
          patient_id?: number
          public_id?: string
          remaining_installments_count?: number
          source_payload?: Json
          source_system?: string | null
          status?: Database["public"]["Enums"]["budget_status"]
          subtotal_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_clinic_id_original_budget_id_fkey"
            columns: ["clinic_id", "original_budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "budgets_clinic_id_patient_id_fkey"
            columns: ["clinic_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["clinic_id", "id"]
          },
        ]
      }
      chairs: {
        Row: {
          active: boolean
          clinic_id: number
          created_at: string
          deleted_at: string | null
          id: number
          legacy_id: string | null
          name: string
          public_id: string
          source_system: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          clinic_id: number
          created_at?: string
          deleted_at?: string | null
          id?: never
          legacy_id?: string | null
          name: string
          public_id?: string
          source_system?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          clinic_id?: number
          created_at?: string
          deleted_at?: string | null
          id?: never
          legacy_id?: string | null
          name?: string
          public_id?: string
          source_system?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chairs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_memberships: {
        Row: {
          accepted_at: string | null
          clinic_id: number
          created_at: string
          deleted_at: string | null
          id: number
          invited_at: string | null
          legacy_id: string | null
          profile_id: string
          public_id: string
          role: Database["public"]["Enums"]["clinic_role"]
          source_system: string | null
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          clinic_id: number
          created_at?: string
          deleted_at?: string | null
          id?: never
          invited_at?: string | null
          legacy_id?: string | null
          profile_id: string
          public_id?: string
          role: Database["public"]["Enums"]["clinic_role"]
          source_system?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          clinic_id?: number
          created_at?: string
          deleted_at?: string | null
          id?: never
          invited_at?: string | null
          legacy_id?: string | null
          profile_id?: string
          public_id?: string
          role?: Database["public"]["Enums"]["clinic_role"]
          source_system?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_memberships_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_evolution_procedures: {
        Row: {
          clinic_id: number
          clinical_procedure_id: number
          created_at: string
          deleted_at: string | null
          evolution_id: number
          id: number
          public_id: string
          updated_at: string
        }
        Insert: {
          clinic_id: number
          clinical_procedure_id: number
          created_at?: string
          deleted_at?: string | null
          evolution_id: number
          id?: never
          public_id?: string
          updated_at?: string
        }
        Update: {
          clinic_id?: number
          clinical_procedure_id?: number
          created_at?: string
          deleted_at?: string | null
          evolution_id?: number
          id?: never
          public_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_evolution_procedures_clinic_id_clinical_procedure_fkey"
            columns: ["clinic_id", "clinical_procedure_id"]
            isOneToOne: false
            referencedRelation: "clinical_procedures"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "clinical_evolution_procedures_clinic_id_evolution_id_fkey"
            columns: ["clinic_id", "evolution_id"]
            isOneToOne: false
            referencedRelation: "clinical_evolutions"
            referencedColumns: ["clinic_id", "id"]
          },
        ]
      }
      clinical_evolutions: {
        Row: {
          amendment_of_id: number | null
          clinic_id: number
          created_at: string
          deleted_at: string | null
          description: string
          id: number
          is_automatic: boolean
          legacy_id: string | null
          occurred_at: string
          patient_id: number
          professional_profile_id: string
          public_id: string
          signature_hash: string | null
          signature_provider: string | null
          signed_at: string | null
          signed_by: string | null
          source_payload: Json
          source_system: string | null
          status: Database["public"]["Enums"]["evolution_status"]
          updated_at: string
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          amendment_of_id?: number | null
          clinic_id: number
          created_at?: string
          deleted_at?: string | null
          description: string
          id?: never
          is_automatic?: boolean
          legacy_id?: string | null
          occurred_at: string
          patient_id: number
          professional_profile_id: string
          public_id?: string
          signature_hash?: string | null
          signature_provider?: string | null
          signed_at?: string | null
          signed_by?: string | null
          source_payload?: Json
          source_system?: string | null
          status?: Database["public"]["Enums"]["evolution_status"]
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          amendment_of_id?: number | null
          clinic_id?: number
          created_at?: string
          deleted_at?: string | null
          description?: string
          id?: never
          is_automatic?: boolean
          legacy_id?: string | null
          occurred_at?: string
          patient_id?: number
          professional_profile_id?: string
          public_id?: string
          signature_hash?: string | null
          signature_provider?: string | null
          signed_at?: string | null
          signed_by?: string | null
          source_payload?: Json
          source_system?: string | null
          status?: Database["public"]["Enums"]["evolution_status"]
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_evolutions_clinic_id_amendment_of_id_fkey"
            columns: ["clinic_id", "amendment_of_id"]
            isOneToOne: false
            referencedRelation: "clinical_evolutions"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "clinical_evolutions_clinic_id_patient_id_fkey"
            columns: ["clinic_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "clinical_evolutions_professional_profile_id_fkey"
            columns: ["professional_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_evolutions_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_evolutions_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_procedures: {
        Row: {
          budget_item_id: number | null
          cancelled_at: string | null
          cancelled_reason: string | null
          charged_amount: number
          clinic_id: number
          completed_at: string | null
          created_at: string
          deleted_at: string | null
          dental_plan_id: number | null
          id: number
          legacy_id: string | null
          notes: string | null
          patient_id: number
          planned_at: string | null
          professional_profile_id: string | null
          public_id: string
          source_payload: Json
          source_system: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["clinical_procedure_status"]
          treatment_catalog_id: number | null
          treatment_name_snapshot: string
          updated_at: string
        }
        Insert: {
          budget_item_id?: number | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          charged_amount?: number
          clinic_id: number
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          dental_plan_id?: number | null
          id?: never
          legacy_id?: string | null
          notes?: string | null
          patient_id: number
          planned_at?: string | null
          professional_profile_id?: string | null
          public_id?: string
          source_payload?: Json
          source_system?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["clinical_procedure_status"]
          treatment_catalog_id?: number | null
          treatment_name_snapshot: string
          updated_at?: string
        }
        Update: {
          budget_item_id?: number | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          charged_amount?: number
          clinic_id?: number
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          dental_plan_id?: number | null
          id?: never
          legacy_id?: string | null
          notes?: string | null
          patient_id?: number
          planned_at?: string | null
          professional_profile_id?: string | null
          public_id?: string
          source_payload?: Json
          source_system?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["clinical_procedure_status"]
          treatment_catalog_id?: number | null
          treatment_name_snapshot?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_procedures_clinic_id_budget_item_id_fkey"
            columns: ["clinic_id", "budget_item_id"]
            isOneToOne: false
            referencedRelation: "budget_items"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "clinical_procedures_clinic_id_dental_plan_id_fkey"
            columns: ["clinic_id", "dental_plan_id"]
            isOneToOne: false
            referencedRelation: "dental_plans"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "clinical_procedures_clinic_id_patient_id_fkey"
            columns: ["clinic_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "clinical_procedures_clinic_id_treatment_catalog_id_fkey"
            columns: ["clinic_id", "treatment_catalog_id"]
            isOneToOne: false
            referencedRelation: "treatments_catalog"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "clinical_procedures_professional_profile_id_fkey"
            columns: ["professional_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          created_at: string
          currency: string
          deleted_at: string | null
          document_digits: string | null
          email: string | null
          id: number
          legacy_id: string | null
          legal_name: string | null
          phone_e164: string | null
          public_id: string
          source_system: string | null
          timezone: string
          trade_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          deleted_at?: string | null
          document_digits?: string | null
          email?: string | null
          id?: never
          legacy_id?: string | null
          legal_name?: string | null
          phone_e164?: string | null
          public_id?: string
          source_system?: string | null
          timezone?: string
          trade_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          deleted_at?: string | null
          document_digits?: string | null
          email?: string | null
          id?: never
          legacy_id?: string | null
          legal_name?: string | null
          phone_e164?: string | null
          public_id?: string
          source_system?: string | null
          timezone?: string
          trade_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      commission_rules: {
        Row: {
          active: boolean
          calculation_basis: Database["public"]["Enums"]["commission_basis"]
          calculation_type: Database["public"]["Enums"]["commission_calculation"]
          clinic_id: number
          created_at: string
          deleted_at: string | null
          dental_plan_id: number | null
          effective_from: string
          effective_until: string | null
          id: number
          legacy_id: string | null
          professional_profile_id: string
          public_id: string
          source_system: string | null
          treatment_catalog_id: number | null
          treatment_category: string | null
          trigger_event: Database["public"]["Enums"]["commission_trigger"]
          updated_at: string
          value: number
        }
        Insert: {
          active?: boolean
          calculation_basis: Database["public"]["Enums"]["commission_basis"]
          calculation_type: Database["public"]["Enums"]["commission_calculation"]
          clinic_id: number
          created_at?: string
          deleted_at?: string | null
          dental_plan_id?: number | null
          effective_from?: string
          effective_until?: string | null
          id?: never
          legacy_id?: string | null
          professional_profile_id: string
          public_id?: string
          source_system?: string | null
          treatment_catalog_id?: number | null
          treatment_category?: string | null
          trigger_event: Database["public"]["Enums"]["commission_trigger"]
          updated_at?: string
          value: number
        }
        Update: {
          active?: boolean
          calculation_basis?: Database["public"]["Enums"]["commission_basis"]
          calculation_type?: Database["public"]["Enums"]["commission_calculation"]
          clinic_id?: number
          created_at?: string
          deleted_at?: string | null
          dental_plan_id?: number | null
          effective_from?: string
          effective_until?: string | null
          id?: never
          legacy_id?: string | null
          professional_profile_id?: string
          public_id?: string
          source_system?: string | null
          treatment_catalog_id?: number | null
          treatment_category?: string | null
          trigger_event?: Database["public"]["Enums"]["commission_trigger"]
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_rules_clinic_id_dental_plan_id_fkey"
            columns: ["clinic_id", "dental_plan_id"]
            isOneToOne: false
            referencedRelation: "dental_plans"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "commission_rules_clinic_id_treatment_catalog_id_fkey"
            columns: ["clinic_id", "treatment_catalog_id"]
            isOneToOne: false
            referencedRelation: "treatments_catalog"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "commission_rules_professional_profile_id_fkey"
            columns: ["professional_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          accrued_at: string
          approved_at: string | null
          basis_amount: number
          calculation_basis: Database["public"]["Enums"]["commission_basis"]
          calculation_type: Database["public"]["Enums"]["commission_calculation"]
          clinic_id: number
          clinical_procedure_id: number | null
          commission_amount: number
          commission_rule_id: number | null
          created_at: string
          deleted_at: string | null
          id: number
          installment_id: number | null
          legacy_id: string | null
          paid_at: string | null
          payment_settlement_id: number | null
          professional_profile_id: string
          public_id: string
          reversal_reason: string | null
          reversed_at: string | null
          rule_value: number
          source_payload: Json
          source_system: string | null
          status: Database["public"]["Enums"]["commission_status"]
          trigger_event: Database["public"]["Enums"]["commission_trigger"]
          updated_at: string
        }
        Insert: {
          accrued_at: string
          approved_at?: string | null
          basis_amount: number
          calculation_basis: Database["public"]["Enums"]["commission_basis"]
          calculation_type: Database["public"]["Enums"]["commission_calculation"]
          clinic_id: number
          clinical_procedure_id?: number | null
          commission_amount: number
          commission_rule_id?: number | null
          created_at?: string
          deleted_at?: string | null
          id?: never
          installment_id?: number | null
          legacy_id?: string | null
          paid_at?: string | null
          payment_settlement_id?: number | null
          professional_profile_id: string
          public_id?: string
          reversal_reason?: string | null
          reversed_at?: string | null
          rule_value: number
          source_payload?: Json
          source_system?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          trigger_event: Database["public"]["Enums"]["commission_trigger"]
          updated_at?: string
        }
        Update: {
          accrued_at?: string
          approved_at?: string | null
          basis_amount?: number
          calculation_basis?: Database["public"]["Enums"]["commission_basis"]
          calculation_type?: Database["public"]["Enums"]["commission_calculation"]
          clinic_id?: number
          clinical_procedure_id?: number | null
          commission_amount?: number
          commission_rule_id?: number | null
          created_at?: string
          deleted_at?: string | null
          id?: never
          installment_id?: number | null
          legacy_id?: string | null
          paid_at?: string | null
          payment_settlement_id?: number | null
          professional_profile_id?: string
          public_id?: string
          reversal_reason?: string | null
          reversed_at?: string | null
          rule_value?: number
          source_payload?: Json
          source_system?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          trigger_event?: Database["public"]["Enums"]["commission_trigger"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_clinic_id_clinical_procedure_id_fkey"
            columns: ["clinic_id", "clinical_procedure_id"]
            isOneToOne: false
            referencedRelation: "clinical_procedures"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "commissions_clinic_id_commission_rule_id_fkey"
            columns: ["clinic_id", "commission_rule_id"]
            isOneToOne: false
            referencedRelation: "commission_rules"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "commissions_clinic_id_installment_id_fkey"
            columns: ["clinic_id", "installment_id"]
            isOneToOne: false
            referencedRelation: "installments"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "commissions_clinic_id_payment_settlement_id_fkey"
            columns: ["clinic_id", "payment_settlement_id"]
            isOneToOne: false
            referencedRelation: "payment_settlements"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "commissions_professional_profile_id_fkey"
            columns: ["professional_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_plans: {
        Row: {
          active: boolean
          clinic_id: number
          created_at: string
          deleted_at: string | null
          id: number
          is_private_pay: boolean
          legacy_id: string | null
          name: string
          public_id: string
          source_system: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          clinic_id: number
          created_at?: string
          deleted_at?: string | null
          id?: never
          is_private_pay?: boolean
          legacy_id?: string | null
          name: string
          public_id?: string
          source_system?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          clinic_id?: number
          created_at?: string
          deleted_at?: string | null
          id?: never
          is_private_pay?: boolean
          legacy_id?: string | null
          name?: string
          public_id?: string
          source_system?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dental_plans_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          budget_id: number | null
          category: string | null
          clinic_id: number
          clinical_procedure_id: number | null
          created_at: string
          currency: string
          deleted_at: string | null
          description: string
          direction: Database["public"]["Enums"]["transaction_direction"]
          gross_amount: number
          id: number
          legacy_id: string | null
          observations: string | null
          occurred_at: string
          patient_id: number | null
          public_id: string
          source_payload: Json
          source_system: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          updated_at: string
        }
        Insert: {
          budget_id?: number | null
          category?: string | null
          clinic_id: number
          clinical_procedure_id?: number | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description: string
          direction: Database["public"]["Enums"]["transaction_direction"]
          gross_amount: number
          id?: never
          legacy_id?: string | null
          observations?: string | null
          occurred_at?: string
          patient_id?: number | null
          public_id?: string
          source_payload?: Json
          source_system?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          updated_at?: string
        }
        Update: {
          budget_id?: number | null
          category?: string | null
          clinic_id?: number
          clinical_procedure_id?: number | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string
          direction?: Database["public"]["Enums"]["transaction_direction"]
          gross_amount?: number
          id?: never
          legacy_id?: string | null
          observations?: string | null
          occurred_at?: string
          patient_id?: number | null
          public_id?: string
          source_payload?: Json
          source_system?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_clinic_id_budget_id_fkey"
            columns: ["clinic_id", "budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "financial_transactions_clinic_id_clinical_procedure_id_fkey"
            columns: ["clinic_id", "clinical_procedure_id"]
            isOneToOne: false
            referencedRelation: "clinical_procedures"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "financial_transactions_clinic_id_patient_id_fkey"
            columns: ["clinic_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["clinic_id", "id"]
          },
        ]
      }
      installments: {
        Row: {
          amount: number
          budget_id: number | null
          cancelled_at: string | null
          cancelled_reason: string | null
          clinic_id: number
          created_at: string
          deleted_at: string | null
          due_date: string
          id: number
          is_entry: boolean
          legacy_id: string | null
          paid_amount: number
          patient_id: number | null
          public_id: string
          sequence_number: number
          settled_amount: number
          source_payload: Json
          source_system: string | null
          status: Database["public"]["Enums"]["installment_status"]
          total_installments: number
          transaction_id: number
          updated_at: string
        }
        Insert: {
          amount: number
          budget_id?: number | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          clinic_id: number
          created_at?: string
          deleted_at?: string | null
          due_date: string
          id?: never
          is_entry?: boolean
          legacy_id?: string | null
          paid_amount?: number
          patient_id?: number | null
          public_id?: string
          sequence_number: number
          settled_amount?: number
          source_payload?: Json
          source_system?: string | null
          status?: Database["public"]["Enums"]["installment_status"]
          total_installments: number
          transaction_id: number
          updated_at?: string
        }
        Update: {
          amount?: number
          budget_id?: number | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          clinic_id?: number
          created_at?: string
          deleted_at?: string | null
          due_date?: string
          id?: never
          is_entry?: boolean
          legacy_id?: string | null
          paid_amount?: number
          patient_id?: number | null
          public_id?: string
          sequence_number?: number
          settled_amount?: number
          source_payload?: Json
          source_system?: string | null
          status?: Database["public"]["Enums"]["installment_status"]
          total_installments?: number
          transaction_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installments_clinic_id_budget_id_fkey"
            columns: ["clinic_id", "budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "installments_clinic_id_patient_id_fkey"
            columns: ["clinic_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "installments_clinic_id_transaction_id_fkey"
            columns: ["clinic_id", "transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "installments_clinic_id_transaction_id_fkey"
            columns: ["clinic_id", "transaction_id"]
            isOneToOne: false
            referencedRelation: "patient_ledger"
            referencedColumns: ["clinic_id", "transaction_id"]
          },
        ]
      }
      legacy_id_map: {
        Row: {
          clinic_id: number
          created_at: string
          deleted_at: string | null
          entity_type: string
          id: number
          import_run_id: string
          imported_at: string
          legacy_id: string
          payload_sha256: string
          source_system: string
          target_id: string
          target_table: unknown
          updated_at: string
        }
        Insert: {
          clinic_id: number
          created_at?: string
          deleted_at?: string | null
          entity_type: string
          id?: never
          import_run_id: string
          imported_at?: string
          legacy_id: string
          payload_sha256: string
          source_system: string
          target_id: string
          target_table: unknown
          updated_at?: string
        }
        Update: {
          clinic_id?: number
          created_at?: string
          deleted_at?: string | null
          entity_type?: string
          id?: never
          import_run_id?: string
          imported_at?: string
          legacy_id?: string
          payload_sha256?: string
          source_system?: string
          target_id?: string
          target_table?: unknown
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legacy_id_map_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      odontogram_entries: {
        Row: {
          clinic_id: number
          clinical_procedure_id: number | null
          created_at: string
          deleted_at: string | null
          description: string
          diagnosis_code: string | null
          entry_kind: Database["public"]["Enums"]["odontogram_entry_kind"]
          id: number
          legacy_id: string | null
          occurred_at: string
          patient_id: number
          public_id: string
          recorded_by: string | null
          region: Database["public"]["Enums"]["odontogram_region"]
          source_payload: Json
          source_system: string | null
          status: Database["public"]["Enums"]["clinical_procedure_status"]
          surfaces: Database["public"]["Enums"]["odontogram_surface"][]
          tooth_code: number | null
          tooth_set: Database["public"]["Enums"]["tooth_set"] | null
          updated_at: string
        }
        Insert: {
          clinic_id: number
          clinical_procedure_id?: number | null
          created_at?: string
          deleted_at?: string | null
          description: string
          diagnosis_code?: string | null
          entry_kind: Database["public"]["Enums"]["odontogram_entry_kind"]
          id?: never
          legacy_id?: string | null
          occurred_at?: string
          patient_id: number
          public_id?: string
          recorded_by?: string | null
          region?: Database["public"]["Enums"]["odontogram_region"]
          source_payload?: Json
          source_system?: string | null
          status?: Database["public"]["Enums"]["clinical_procedure_status"]
          surfaces?: Database["public"]["Enums"]["odontogram_surface"][]
          tooth_code?: number | null
          tooth_set?: Database["public"]["Enums"]["tooth_set"] | null
          updated_at?: string
        }
        Update: {
          clinic_id?: number
          clinical_procedure_id?: number | null
          created_at?: string
          deleted_at?: string | null
          description?: string
          diagnosis_code?: string | null
          entry_kind?: Database["public"]["Enums"]["odontogram_entry_kind"]
          id?: never
          legacy_id?: string | null
          occurred_at?: string
          patient_id?: number
          public_id?: string
          recorded_by?: string | null
          region?: Database["public"]["Enums"]["odontogram_region"]
          source_payload?: Json
          source_system?: string | null
          status?: Database["public"]["Enums"]["clinical_procedure_status"]
          surfaces?: Database["public"]["Enums"]["odontogram_surface"][]
          tooth_code?: number | null
          tooth_set?: Database["public"]["Enums"]["tooth_set"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "odontogram_entries_clinic_id_clinical_procedure_id_fkey"
            columns: ["clinic_id", "clinical_procedure_id"]
            isOneToOne: false
            referencedRelation: "clinical_procedures"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "odontogram_entries_clinic_id_patient_id_fkey"
            columns: ["clinic_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "odontogram_entries_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_files: {
        Row: {
          category: string
          clinic_id: number
          created_at: string
          deleted_at: string | null
          description: string | null
          id: number
          legacy_id: string | null
          mime_type: string
          original_name: string
          patient_id: number
          public_id: string
          size_bytes: number
          source_system: string | null
          storage_path: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          category?: string
          clinic_id: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: never
          legacy_id?: string | null
          mime_type: string
          original_name: string
          patient_id: number
          public_id?: string
          size_bytes: number
          source_system?: string | null
          storage_path: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          category?: string
          clinic_id?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: never
          legacy_id?: string | null
          mime_type?: string
          original_name?: string
          patient_id?: number
          public_id?: string
          size_bytes?: number
          source_system?: string | null
          storage_path?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_files_clinic_id_patient_id_fkey"
            columns: ["clinic_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "patient_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_anamneses: {
        Row: {
          answered_by_patient: boolean
          answered_by_profile_id: string | null
          clinic_id: number
          completed_at: string | null
          created_at: string
          deleted_at: string | null
          id: number
          legacy_id: string | null
          patient_id: number
          public_id: string
          signed_at: string | null
          source_payload: Json
          source_system: string | null
          template_id: number
          template_version: number
          updated_at: string
        }
        Insert: {
          answered_by_patient?: boolean
          answered_by_profile_id?: string | null
          clinic_id: number
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: never
          legacy_id?: string | null
          patient_id: number
          public_id?: string
          signed_at?: string | null
          source_payload?: Json
          source_system?: string | null
          template_id: number
          template_version: number
          updated_at?: string
        }
        Update: {
          answered_by_patient?: boolean
          answered_by_profile_id?: string | null
          clinic_id?: number
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: never
          legacy_id?: string | null
          patient_id?: number
          public_id?: string
          signed_at?: string | null
          source_payload?: Json
          source_system?: string | null
          template_id?: number
          template_version?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_anamneses_answered_by_profile_id_fkey"
            columns: ["answered_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_anamneses_clinic_id_patient_id_fkey"
            columns: ["clinic_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "patient_anamneses_clinic_id_template_id_fkey"
            columns: ["clinic_id", "template_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_templates"
            referencedColumns: ["clinic_id", "id"]
          },
        ]
      }
      patient_medical_alerts: {
        Row: {
          active: boolean
          alert_type: string
          clinic_id: number
          created_at: string
          deleted_at: string | null
          description: string
          id: number
          legacy_id: string | null
          patient_id: number
          public_id: string
          severity: string
          source_system: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          active?: boolean
          alert_type: string
          clinic_id: number
          created_at?: string
          deleted_at?: string | null
          description: string
          id?: never
          legacy_id?: string | null
          patient_id: number
          public_id?: string
          severity?: string
          source_system?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          active?: boolean
          alert_type?: string
          clinic_id?: number
          created_at?: string
          deleted_at?: string | null
          description?: string
          id?: never
          legacy_id?: string | null
          patient_id?: number
          public_id?: string
          severity?: string
          source_system?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_medical_alerts_clinic_id_patient_id_fkey"
            columns: ["clinic_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "patient_medical_alerts_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          birth_date: string | null
          city: string | null
          clinic_id: number
          code: string | null
          cpf_digits: string | null
          created_at: string
          deleted_at: string | null
          dental_plan_id: number | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone_e164: string | null
          full_name: string
          gender: string | null
          id: number
          legacy_id: string | null
          neighborhood: string | null
          notes: string | null
          phone_e164: string | null
          postal_code_digits: string | null
          public_id: string
          reminder_preference:
            | Database["public"]["Enums"]["reminder_preference"]
            | null
          social_name: string | null
          source_payload: Json
          source_system: string | null
          state: string | null
          updated_at: string
          whatsapp_e164: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          birth_date?: string | null
          city?: string | null
          clinic_id: number
          code?: string | null
          cpf_digits?: string | null
          created_at?: string
          deleted_at?: string | null
          dental_plan_id?: number | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone_e164?: string | null
          full_name: string
          gender?: string | null
          id?: never
          legacy_id?: string | null
          neighborhood?: string | null
          notes?: string | null
          phone_e164?: string | null
          postal_code_digits?: string | null
          public_id?: string
          reminder_preference?:
            | Database["public"]["Enums"]["reminder_preference"]
            | null
          social_name?: string | null
          source_payload?: Json
          source_system?: string | null
          state?: string | null
          updated_at?: string
          whatsapp_e164?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          birth_date?: string | null
          city?: string | null
          clinic_id?: number
          code?: string | null
          cpf_digits?: string | null
          created_at?: string
          deleted_at?: string | null
          dental_plan_id?: number | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone_e164?: string | null
          full_name?: string
          gender?: string | null
          id?: never
          legacy_id?: string | null
          neighborhood?: string | null
          notes?: string | null
          phone_e164?: string | null
          postal_code_digits?: string | null
          public_id?: string
          reminder_preference?:
            | Database["public"]["Enums"]["reminder_preference"]
            | null
          social_name?: string | null
          source_payload?: Json
          source_system?: string | null
          state?: string | null
          updated_at?: string
          whatsapp_e164?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_dental_plan_id_fkey"
            columns: ["clinic_id", "dental_plan_id"]
            isOneToOne: false
            referencedRelation: "dental_plans"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_method_fees: {
        Row: {
          clinic_id: number
          created_at: string
          deleted_at: string | null
          fee_percentage: number
          fixed_fee_amount: number
          id: number
          installments_count: number
          legacy_id: string | null
          payment_method_id: number
          public_id: string
          source_system: string | null
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          clinic_id: number
          created_at?: string
          deleted_at?: string | null
          fee_percentage?: number
          fixed_fee_amount?: number
          id?: never
          installments_count?: number
          legacy_id?: string | null
          payment_method_id: number
          public_id?: string
          source_system?: string | null
          updated_at?: string
          valid_from: string
          valid_until?: string | null
        }
        Update: {
          clinic_id?: number
          created_at?: string
          deleted_at?: string | null
          fee_percentage?: number
          fixed_fee_amount?: number
          id?: never
          installments_count?: number
          legacy_id?: string | null
          payment_method_id?: number
          public_id?: string
          source_system?: string | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_method_fees_clinic_id_payment_method_id_fkey"
            columns: ["clinic_id", "payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["clinic_id", "id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          active: boolean
          clinic_id: number
          created_at: string
          deleted_at: string | null
          display_name: string
          id: number
          kind: Database["public"]["Enums"]["payment_method_kind"]
          legacy_id: string | null
          provider_name: string | null
          public_id: string
          settlement_days: number
          source_system: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          clinic_id: number
          created_at?: string
          deleted_at?: string | null
          display_name: string
          id?: never
          kind: Database["public"]["Enums"]["payment_method_kind"]
          legacy_id?: string | null
          provider_name?: string | null
          public_id?: string
          settlement_days?: number
          source_system?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          clinic_id?: number
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          id?: never
          kind?: Database["public"]["Enums"]["payment_method_kind"]
          legacy_id?: string | null
          provider_name?: string | null
          public_id?: string
          settlement_days?: number
          source_system?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_reversals: {
        Row: {
          amount: number
          clinic_id: number
          created_at: string
          deleted_at: string | null
          id: number
          legacy_id: string | null
          occurred_at: string
          payment_settlement_id: number
          provider_reference: string | null
          public_id: string
          reason: string
          reversal_type: Database["public"]["Enums"]["payment_status"]
          reversed_by: string | null
          source_payload: Json
          source_system: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          clinic_id: number
          created_at?: string
          deleted_at?: string | null
          id?: never
          legacy_id?: string | null
          occurred_at?: string
          payment_settlement_id: number
          provider_reference?: string | null
          public_id?: string
          reason: string
          reversal_type: Database["public"]["Enums"]["payment_status"]
          reversed_by?: string | null
          source_payload?: Json
          source_system?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          clinic_id?: number
          created_at?: string
          deleted_at?: string | null
          id?: never
          legacy_id?: string | null
          occurred_at?: string
          payment_settlement_id?: number
          provider_reference?: string | null
          public_id?: string
          reason?: string
          reversal_type?: Database["public"]["Enums"]["payment_status"]
          reversed_by?: string | null
          source_payload?: Json
          source_system?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_reversals_clinic_id_payment_settlement_id_fkey"
            columns: ["clinic_id", "payment_settlement_id"]
            isOneToOne: false
            referencedRelation: "payment_settlements"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "payment_reversals_reversed_by_fkey"
            columns: ["reversed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_settlements: {
        Row: {
          card_installments: number
          clinic_id: number
          created_at: string
          deleted_at: string | null
          expected_settlement_at: string | null
          fee_amount: number
          fee_percentage: number
          gross_amount: number
          id: number
          installment_id: number
          legacy_id: string | null
          net_amount: number
          observations: string | null
          paid_at: string | null
          payment_method_fee_id: number | null
          payment_method_id: number
          provider_name: string | null
          provider_reference: string | null
          public_id: string
          receipt_issued_at: string | null
          receipt_reference: string | null
          settled_at: string | null
          source_payload: Json
          source_system: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          card_installments?: number
          clinic_id: number
          created_at?: string
          deleted_at?: string | null
          expected_settlement_at?: string | null
          fee_amount?: number
          fee_percentage?: number
          gross_amount: number
          id?: never
          installment_id: number
          legacy_id?: string | null
          net_amount: number
          observations?: string | null
          paid_at?: string | null
          payment_method_fee_id?: number | null
          payment_method_id: number
          provider_name?: string | null
          provider_reference?: string | null
          public_id?: string
          receipt_issued_at?: string | null
          receipt_reference?: string | null
          settled_at?: string | null
          source_payload?: Json
          source_system?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          card_installments?: number
          clinic_id?: number
          created_at?: string
          deleted_at?: string | null
          expected_settlement_at?: string | null
          fee_amount?: number
          fee_percentage?: number
          gross_amount?: number
          id?: never
          installment_id?: number
          legacy_id?: string | null
          net_amount?: number
          observations?: string | null
          paid_at?: string | null
          payment_method_fee_id?: number | null
          payment_method_id?: number
          provider_name?: string | null
          provider_reference?: string | null
          public_id?: string
          receipt_issued_at?: string | null
          receipt_reference?: string | null
          settled_at?: string | null
          source_payload?: Json
          source_system?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_settlements_clinic_id_installment_id_fkey"
            columns: ["clinic_id", "installment_id"]
            isOneToOne: false
            referencedRelation: "installments"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "payment_settlements_clinic_id_payment_method_fee_id_fkey"
            columns: ["clinic_id", "payment_method_fee_id"]
            isOneToOne: false
            referencedRelation: "payment_method_fees"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "payment_settlements_clinic_id_payment_method_id_fkey"
            columns: ["clinic_id", "payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["clinic_id", "id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          cro_number: string | null
          cro_state: string | null
          deleted_at: string | null
          email: string | null
          full_name: string
          id: string
          phone_e164: string | null
          specialty: string | null
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          cro_number?: string | null
          cro_state?: string | null
          deleted_at?: string | null
          email?: string | null
          full_name: string
          id: string
          phone_e164?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          cro_number?: string | null
          cro_state?: string | null
          deleted_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone_e164?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      treatments_catalog: {
        Row: {
          active: boolean
          base_price: number
          category: string | null
          clinic_id: number
          code: string | null
          cost_amount: number
          created_at: string
          deleted_at: string | null
          dental_plan_id: number | null
          description: string | null
          estimated_minutes: number | null
          id: number
          legacy_id: string | null
          name: string
          public_id: string
          segmented_by_tooth: boolean
          source_system: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_price?: number
          category?: string | null
          clinic_id: number
          code?: string | null
          cost_amount?: number
          created_at?: string
          deleted_at?: string | null
          dental_plan_id?: number | null
          description?: string | null
          estimated_minutes?: number | null
          id?: never
          legacy_id?: string | null
          name: string
          public_id?: string
          segmented_by_tooth?: boolean
          source_system?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_price?: number
          category?: string | null
          clinic_id?: number
          code?: string | null
          cost_amount?: number
          created_at?: string
          deleted_at?: string | null
          dental_plan_id?: number | null
          description?: string | null
          estimated_minutes?: number | null
          id?: never
          legacy_id?: string | null
          name?: string
          public_id?: string
          segmented_by_tooth?: boolean
          source_system?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatments_catalog_clinic_id_dental_plan_id_fkey"
            columns: ["clinic_id", "dental_plan_id"]
            isOneToOne: false
            referencedRelation: "dental_plans"
            referencedColumns: ["clinic_id", "id"]
          },
          {
            foreignKeyName: "treatments_catalog_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      patient_ledger: {
        Row: {
          clinic_id: number | null
          description: string | null
          display_status: string | null
          due_date: string | null
          expected_settlement_at: string | null
          fee_amount: number | null
          fee_percentage: number | null
          gross_amount: number | null
          installment_id: number | null
          is_entry: boolean | null
          net_amount: number | null
          paid_amount: number | null
          paid_at: string | null
          patient_id: number | null
          payment_method:
            | Database["public"]["Enums"]["payment_method_kind"]
            | null
          payment_method_name: string | null
          payment_settlement_id: number | null
          provider_name: string | null
          receipt_issued_at: string | null
          sequence_number: number | null
          settled_amount: number | null
          settled_at: string | null
          total_installments: number | null
          transaction_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_clinic_id_patient_id_fkey"
            columns: ["clinic_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["clinic_id", "id"]
          },
        ]
      }
    }
    Functions: {
      approve_patient_budget: {
        Args: { p_budget_public_id: string }
        Returns: string
      }
      create_patient_budget: {
        Args: {
          p_description: string
          p_discount_type: Database["public"]["Enums"]["discount_type"]
          p_discount_value: number
          p_entry_amount: number
          p_first_due_date: string
          p_items: Json
          p_observations?: string
          p_patient_public_id: string
          p_remaining_installments_count: number
        }
        Returns: string
      }
      register_installment_payment: {
        Args: {
          p_amount: number
          p_card_installments?: number
          p_installment_public_id: string
          p_observations?: string
          p_payment_method_public_id: string
        }
        Returns: string
      }
      submit_patient_anamnesis: {
        Args: {
          p_answered_by_patient?: boolean
          p_answers: Json
          p_patient_public_id: string
        }
        Returns: string
      }
    }
    Enums: {
      anamnesis_answer_selection: "yes" | "no" | "unknown"
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "waiting_room"
        | "in_service"
        | "completed"
        | "no_show"
        | "cancelled"
      budget_status:
        | "draft"
        | "pending"
        | "partially_approved"
        | "approved"
        | "cancelled"
      clinic_role:
        | "owner"
        | "admin"
        | "dentist"
        | "assistant"
        | "secretary"
        | "financial"
        | "auditor"
      clinical_procedure_status:
        | "planned"
        | "in_progress"
        | "completed"
        | "cancelled"
      commission_basis:
        | "procedure_gross"
        | "procedure_net_after_discount"
        | "installment_gross"
        | "payment_net"
      commission_calculation: "percentage" | "fixed_amount"
      commission_status: "open" | "approved" | "paid" | "cancelled" | "reversed"
      commission_trigger: "treatment_completed" | "installment_paid"
      discount_type: "fixed_amount" | "percentage"
      evolution_status: "draft" | "final" | "signed" | "voided"
      installment_status:
        | "open"
        | "partially_paid"
        | "paid"
        | "awaiting_settlement"
        | "settled"
        | "cancelled"
        | "reversed"
      membership_status: "invited" | "active" | "suspended" | "revoked"
      odontogram_entry_kind:
        | "diagnosis"
        | "condition"
        | "planned_procedure"
        | "executed_procedure"
      odontogram_region: "tooth" | "upper_arch" | "lower_arch" | "full_mouth"
      odontogram_surface:
        | "mesial"
        | "occlusal_incisal"
        | "distal"
        | "vestibular"
        | "lingual_palatal"
        | "cervical"
        | "all"
      payment_method_kind:
        | "cash"
        | "credit_card"
        | "debit_card"
        | "boleto"
        | "check"
        | "pix"
        | "ted"
        | "other"
      payment_status:
        | "pending"
        | "captured"
        | "awaiting_settlement"
        | "settled"
        | "cancelled"
        | "reversed"
        | "refunded"
        | "failed"
      reminder_preference: "whatsapp" | "sms" | "email" | "none"
      tooth_set: "permanent" | "deciduous"
      transaction_direction: "income" | "expense"
      transaction_status:
        | "draft"
        | "open"
        | "partially_paid"
        | "paid"
        | "cancelled"
        | "reversed"
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
      anamnesis_answer_selection: ["yes", "no", "unknown"],
      appointment_status: [
        "scheduled",
        "confirmed",
        "waiting_room",
        "in_service",
        "completed",
        "no_show",
        "cancelled",
      ],
      budget_status: [
        "draft",
        "pending",
        "partially_approved",
        "approved",
        "cancelled",
      ],
      clinic_role: [
        "owner",
        "admin",
        "dentist",
        "assistant",
        "secretary",
        "financial",
        "auditor",
      ],
      clinical_procedure_status: [
        "planned",
        "in_progress",
        "completed",
        "cancelled",
      ],
      commission_basis: [
        "procedure_gross",
        "procedure_net_after_discount",
        "installment_gross",
        "payment_net",
      ],
      commission_calculation: ["percentage", "fixed_amount"],
      commission_status: ["open", "approved", "paid", "cancelled", "reversed"],
      commission_trigger: ["treatment_completed", "installment_paid"],
      discount_type: ["fixed_amount", "percentage"],
      evolution_status: ["draft", "final", "signed", "voided"],
      installment_status: [
        "open",
        "partially_paid",
        "paid",
        "awaiting_settlement",
        "settled",
        "cancelled",
        "reversed",
      ],
      membership_status: ["invited", "active", "suspended", "revoked"],
      odontogram_entry_kind: [
        "diagnosis",
        "condition",
        "planned_procedure",
        "executed_procedure",
      ],
      odontogram_region: ["tooth", "upper_arch", "lower_arch", "full_mouth"],
      odontogram_surface: [
        "mesial",
        "occlusal_incisal",
        "distal",
        "vestibular",
        "lingual_palatal",
        "cervical",
        "all",
      ],
      payment_method_kind: [
        "cash",
        "credit_card",
        "debit_card",
        "boleto",
        "check",
        "pix",
        "ted",
        "other",
      ],
      payment_status: [
        "pending",
        "captured",
        "awaiting_settlement",
        "settled",
        "cancelled",
        "reversed",
        "refunded",
        "failed",
      ],
      reminder_preference: ["whatsapp", "sms", "email", "none"],
      tooth_set: ["permanent", "deciduous"],
      transaction_direction: ["income", "expense"],
      transaction_status: [
        "draft",
        "open",
        "partially_paid",
        "paid",
        "cancelled",
        "reversed",
      ],
    },
  },
} as const
