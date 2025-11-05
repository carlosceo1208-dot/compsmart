import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      email, 
      full_name, 
      employee_number,
      phone,
      cpf,
      birth_date,
      job_title,
      job_title_id,
      grade,
      salary,
      variable_salary,
      salary_range_percentage,
      performance_rating,
      unit_id,
      manager_id,
      has_system_access
    } = await req.json();

    console.log('Creating/updating employee:', { email, employee_number });

    // 1. Validar employee_number se fornecido
    if (employee_number) {
      const { data: existingRE, error: checkError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('employee_number', employee_number)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking employee_number:', checkError);
        throw new Error(`Erro ao validar número de registro: ${checkError.message}`);
      }
      
      if (existingRE && existingRE.email !== email) {
        throw new Error(`Número de Registro ${employee_number} já está em uso por ${existingRE.email}`);
      }
    }

    // 2. Se não fornecido, sugerir o próximo
    let finalEmployeeNumber = employee_number;
    if (!finalEmployeeNumber) {
      console.log('Generating next employee number...');
      const { data: suggestedNumber, error: rpcError } = await supabase.rpc('suggest_next_employee_number');
      
      if (rpcError) {
        console.error('Error generating employee number:', rpcError);
        throw new Error(`Erro ao gerar número de registro: ${rpcError.message}`);
      }
      
      finalEmployeeNumber = suggestedNumber;
      console.log('Generated employee number:', finalEmployeeNumber);
    }

    // 3. Verificar se usuário já existe por email
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (profileCheckError) {
      console.error('Error checking existing profile:', profileCheckError);
      throw new Error(`Erro ao verificar perfil existente: ${profileCheckError.message}`);
    }

    const profileData = {
      full_name,
      employee_number: finalEmployeeNumber,
      phone: phone || null,
      cpf: cpf || null,
      birth_date: birth_date || null,
      job_title: job_title || null,
      job_title_id: job_title_id || null,
      grade: grade || null,
      salary: salary || null,
      variable_salary: variable_salary || null,
      salary_range_percentage: salary_range_percentage || null,
      performance_rating: performance_rating || null,
      unit_id: unit_id || null,
      manager_id: manager_id || null,
      has_system_access: has_system_access ?? false,
    };

    if (existingProfile) {
      // UPDATE perfil existente
      console.log('Updating existing profile:', existingProfile.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', existingProfile.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating profile:', error);
        throw new Error(`Erro ao atualizar perfil: ${error.message}`);
      }

      console.log('Profile updated successfully');
      return new Response(JSON.stringify({ 
        success: true, 
        data,
        action: 'updated'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      // CREATE novo usuário
      console.log('Creating new user account...');
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: 'TempPass123!', // Senha temporária
        email_confirm: true,
        user_metadata: { full_name }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        throw new Error(`Erro ao criar usuário: ${authError.message}`);
      }

      console.log('Auth user created, updating profile...');

      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', authData.user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating new profile:', error);
        throw new Error(`Erro ao atualizar perfil do novo usuário: ${error.message}`);
      }

      console.log('New employee created successfully');
      return new Response(JSON.stringify({ 
        success: true, 
        data,
        action: 'created'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error: any) {
    console.error('Error in create-employee-user function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
