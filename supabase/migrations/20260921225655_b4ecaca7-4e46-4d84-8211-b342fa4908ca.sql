CREATE OR REPLACE FUNCTION public.import_employees_batch(p_run jsonb, p_rows jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant uuid := public.get_user_company_id();
  v_strategy text := COALESCE(p_run->>'duplicate_strategy','update');
  v_run_id uuid;
  v_row jsonb;
  v_fields jsonb;
  v_row_number integer;
  v_is_consultor boolean := public.has_role(auth.uid(), 'consultor');
  v_allowed text[] := ARRAY[
    'full_name','email','employee_number','phone','cpf','birth_date','hire_date',
    'termination_date','job_title','grade','job_title_id','salary','variable_salary',
    'benefits_value','performance_rating','unit_id','manager_id','department',
    'gender','race_ethnicity','age_range','work_modality','shift','leadership_level','pcd'
  ];
  v_key text;
  v_val text;
  v_sets text[];
  v_cols text[];
  v_vals text[];
  v_existing_by_number uuid;
  v_existing_by_cpf uuid;
  v_target uuid;
  v_old jsonb;
  v_imported integer := 0;
  v_updated integer := 0;
  v_ignored integer := 0;
  v_errors integer := 0;
  v_total integer := 0;
BEGIN
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'Empresa não identificada para a importação';
  END IF;
  IF NOT public.employee_import_can_manage(v_tenant) THEN
    IF v_is_consultor THEN
      PERFORM public.log_consultor_core_access(
        'core_employee_import', v_tenant,
        jsonb_build_object('file_name', p_run->>'file_name'), false
      );
    END IF;
    RAISE EXCEPTION 'Sem permissão para importar colaboradores';
  END IF;
  IF NOT public.has_module('core') THEN
    RAISE EXCEPTION 'Módulo Core não está ativo para esta empresa';
  END IF;
  IF v_strategy NOT IN ('update','ignore','only_new') THEN
    RAISE EXCEPTION 'Estratégia de duplicados inválida';
  END IF;

  IF v_is_consultor THEN
    PERFORM public.log_consultor_core_access(
      'core_employee_import', v_tenant,
      jsonb_build_object('file_name', p_run->>'file_name', 'duplicate_strategy', v_strategy), true
    );
  END IF;

  INSERT INTO public.employee_import_runs (
    tenant_id, created_by, file_name, sheet_name, source_system,
    duplicate_strategy, mapping, total_rows, status
  ) VALUES (
    v_tenant, auth.uid(),
    COALESCE(p_run->>'file_name','(sem nome)'),
    p_run->>'sheet_name',
    p_run->>'source_system',
    v_strategy,
    COALESCE(p_run->'mapping','{}'::jsonb),
    COALESCE((p_run->>'total_rows')::integer, jsonb_array_length(COALESCE(p_rows,'[]'::jsonb))),
    'em_andamento'
  ) RETURNING id INTO v_run_id;

  -- erros de validação detectados no preview
  FOR v_row IN SELECT * FROM jsonb_array_elements(COALESCE(p_run->'validation_errors','[]'::jsonb))
  LOOP
    INSERT INTO public.employee_import_row_errors (
      run_id, tenant_id, row_number, error_type, field, message, row_data
    ) VALUES (
      v_run_id, v_tenant,
      COALESCE((v_row->>'row_number')::integer, 0),
      COALESCE(v_row->>'error_type','validacao'),
      v_row->>'field',
      COALESCE(v_row->>'message','Erro de validação'),
      COALESCE(v_row->'row_data','{}'::jsonb)
    );
    IF COALESCE(v_row->>'error_type','validacao') <> 'aviso' THEN
      v_errors := v_errors + 1;
    END IF;
  END LOOP;

  FOR v_row IN SELECT * FROM jsonb_array_elements(COALESCE(p_rows,'[]'::jsonb))
  LOOP
    v_total := v_total + 1;
    v_row_number := COALESCE((v_row->>'row_number')::integer, v_total);
    v_fields := COALESCE(v_row->'fields','{}'::jsonb);

    v_existing_by_number := NULL;
    v_existing_by_cpf := NULL;

    IF COALESCE(v_fields->>'employee_number','') <> '' THEN
      SELECT id INTO v_existing_by_number FROM public.profiles
        WHERE employee_number = v_fields->>'employee_number'
        LIMIT 1;
    END IF;
    IF COALESCE(v_fields->>'cpf','') <> '' THEN
      SELECT id INTO v_existing_by_cpf FROM public.profiles
        WHERE cpf = v_fields->>'cpf' AND root_company_id = v_tenant
        LIMIT 1;
    END IF;

    IF v_existing_by_number IS NOT NULL AND v_existing_by_cpf IS NOT NULL
       AND v_existing_by_number <> v_existing_by_cpf THEN
      INSERT INTO public.employee_import_row_errors (
        run_id, tenant_id, row_number, error_type, message, row_data
      ) VALUES (
        v_run_id, v_tenant, v_row_number, 'conflito',
        'Matrícula e CPF apontam para colaboradores diferentes. Linha não importada.',
        v_fields
      );
      v_errors := v_errors + 1;
      CONTINUE;
    END IF;

    v_target := COALESCE(v_existing_by_number, v_existing_by_cpf);

    IF v_target IS NOT NULL THEN
      IF v_strategy = 'only_new' THEN
        v_ignored := v_ignored + 1;
        CONTINUE;
      ELSIF v_strategy = 'ignore' THEN
        INSERT INTO public.employee_import_row_errors (
          run_id, tenant_id, row_number, error_type, message, row_data
        ) VALUES (
          v_run_id, v_tenant, v_row_number, 'ignorado',
          'Colaborador já existente — mantido sem alteração.', v_fields
        );
        v_ignored := v_ignored + 1;
        CONTINUE;
      END IF;

      SELECT to_jsonb(p) INTO v_old FROM public.profiles p WHERE p.id = v_target;

      IF COALESCE(v_old->>'root_company_id','') <> v_tenant::text THEN
        INSERT INTO public.employee_import_row_errors (
          run_id, tenant_id, row_number, error_type, message, row_data
        ) VALUES (
          v_run_id, v_tenant, v_row_number, 'conflito',
          'Matrícula ou CPF pertence a colaborador de outra empresa. Linha não importada.',
          v_fields
        );
        v_errors := v_errors + 1;
        CONTINUE;
      END IF;

      v_sets := ARRAY[]::text[];
      FOR v_key IN SELECT jsonb_object_keys(v_fields)
      LOOP
        IF NOT (v_key = ANY(v_allowed)) THEN CONTINUE; END IF;
        v_val := NULLIF(v_fields->>v_key, '');
        IF COALESCE(v_old->>v_key,'') = COALESCE(v_val,'') THEN CONTINUE; END IF;
        v_sets := v_sets || format('%I = %L', v_key, v_val);
        INSERT INTO public.employee_import_changes (
          run_id, tenant_id, profile_id, row_number, field, old_value, new_value
        ) VALUES (v_run_id, v_tenant, v_target, v_row_number, v_key, v_old->>v_key, v_val);
      END LOOP;

      IF array_length(v_sets, 1) IS NULL THEN
        v_ignored := v_ignored + 1;
        CONTINUE;
      END IF;

      EXECUTE format(
        'UPDATE public.profiles SET %s, updated_at = now() WHERE id = %L',
        array_to_string(v_sets, ', '), v_target
      );
      v_updated := v_updated + 1;
    ELSE
      IF COALESCE(v_fields->>'full_name','') = '' THEN
        INSERT INTO public.employee_import_row_errors (
          run_id, tenant_id, row_number, error_type, field, message, row_data
        ) VALUES (
          v_run_id, v_tenant, v_row_number, 'gravacao', 'full_name',
          'Nome do colaborador em branco. Linha não importada.', v_fields
        );
        v_errors := v_errors + 1;
        CONTINUE;
      END IF;

      v_cols := ARRAY['id','root_company_id','status','has_system_access'];
      v_vals := ARRAY[
        format('%L', gen_random_uuid()),
        format('%L', v_tenant),
        quote_literal('active') || '::user_status',
        'false'
      ];
      FOR v_key IN SELECT jsonb_object_keys(v_fields)
      LOOP
        IF NOT (v_key = ANY(v_allowed)) THEN CONTINUE; END IF;
        v_val := NULLIF(v_fields->>v_key, '');
        v_cols := v_cols || quote_ident(v_key);
        v_vals := v_vals || format('%L', v_val);
      END LOOP;

      EXECUTE format(
        'INSERT INTO public.profiles (%s) VALUES (%s)',
        array_to_string(v_cols, ', '), array_to_string(v_vals, ', ')
      );
      v_imported := v_imported + 1;
    END IF;
  END LOOP;

  UPDATE public.employee_import_runs
     SET imported_count = v_imported,
         updated_count = v_updated,
         ignored_count = v_ignored,
         error_count = v_errors,
         total_rows = GREATEST(total_rows, v_total),
         status = 'concluido',
         updated_at = now()
   WHERE id = v_run_id;

  RETURN jsonb_build_object(
    'run_id', v_run_id,
    'imported', v_imported,
    'updated', v_updated,
    'ignored', v_ignored,
    'errors', v_errors,
    'total', v_total
  );
END;
$function$;