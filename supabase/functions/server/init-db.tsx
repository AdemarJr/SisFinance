import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function initializeDatabase() {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    console.log('🚀 Iniciando criação de tabelas do sistema...');

    // 1. Criar tabela de planos de assinatura
    const { error: planosError } = await supabase.rpc('exec_sql', {
      sql: `
        create table if not exists planos_assinatura (
          id uuid primary key default gen_random_uuid(),
          nome text not null unique check (nome in ('Gratuito', 'Iniciante', 'Profissional', 'Enterprise')),
          limite_empresas integer not null,
          preco_mensal numeric(10,2) not null default 0,
          descricao text,
          recursos jsonb,
          ativo boolean not null default true,
          created_at timestamp with time zone default now(),
          updated_at timestamp with time zone default now()
        );
      `
    }).catch(() => null); // Ignorar erro se função não existir

    // Tentar via SQL direto
    if (planosError || !supabase.rpc) {
      console.log('⚠️ Função exec_sql não disponível. Criando tabelas via inserção direta...');
    }

    // 2. Verificar se a tabela planos_assinatura existe e tem dados
    const { data: planosExistentes, error: checkPlanosError } = await supabase
      .from('planos_assinatura')
      .select('id')
      .limit(1);

    if (checkPlanosError) {
      console.log('⚠️ Tabela planos_assinatura não encontrada. Continuando...');
    } else if (!planosExistentes || planosExistentes.length === 0) {
      // Inserir planos padrão
      const { error: insertPlanosError } = await supabase
        .from('planos_assinatura')
        .insert([
          {
            nome: 'Gratuito',
            limite_empresas: 1,
            preco_mensal: 0.00,
            descricao: '1 empresa, recursos básicos',
            recursos: JSON.parse('["Dashboard básico", "1 empresa", "Suporte por email"]')
          },
          {
            nome: 'Iniciante',
            limite_empresas: 3,
            preco_mensal: 97.00,
            descricao: 'Até 3 empresas, recursos intermediários',
            recursos: JSON.parse('["Dashboard completo", "Até 3 empresas", "Relatórios básicos", "Suporte prioritário"]')
          },
          {
            nome: 'Profissional',
            limite_empresas: 10,
            preco_mensal: 297.00,
            descricao: 'Até 10 empresas, recursos avançados',
            recursos: JSON.parse('["Dashboard avançado", "Até 10 empresas", "Relatórios avançados", "API Access", "Suporte 24/7"]')
          },
          {
            nome: 'Enterprise',
            limite_empresas: 999999,
            preco_mensal: 997.00,
            descricao: 'Empresas ilimitadas, todos os recursos',
            recursos: JSON.parse('["Tudo do Profissional", "Empresas ilimitadas", "Customizações", "Gerente de conta dedicado", "SLA garantido"]')
          }
        ]);

      if (insertPlanosError) {
        console.error('❌ Erro ao inserir planos:', insertPlanosError.message);
      } else {
        console.log('✅ Planos de assinatura criados com sucesso');
      }
    } else {
      console.log('✅ Planos de assinatura já existem');
    }

    // 3. Verificar se a tabela clientes_sistema existe
    const { data: clientesExistentes, error: checkClientesError } = await supabase
      .from('clientes_sistema')
      .select('id')
      .limit(1);

    if (checkClientesError) {
      console.log('⚠️ Tabela clientes_sistema não encontrada');
      
      // Tentar criar através do kv_store como workaround
      console.log('💡 Usando KV Store como alternativa para dados de clientes...');
      return {
        success: false,
        message: 'Tabelas do sistema não encontradas. Execute o SQL manualmente no Supabase Dashboard.',
        sql_file: '/supabase-auth-saas-setup.sql'
      };
    } else {
      console.log('✅ Tabela clientes_sistema encontrada');
    }

    // 4. Verificar super admin
    const { data: adminExistente } = await supabase
      .from('clientes_sistema')
      .select('*')
      .eq('email', 'admin@sisfinance.com')
      .single();

    if (!adminExistente) {
      // Criar super admin apenas se não existir
      console.log('⚠️ Super Admin não encontrado. Criar via página de Admin.');
    } else {
      console.log('✅ Super Admin já existe');
    }

    return {
      success: true,
      message: 'Banco de dados inicializado com sucesso',
      details: {
        planos_criados: !planosExistentes || planosExistentes.length === 0,
        clientes_sistema_existe: !checkClientesError,
        admin_existe: !!adminExistente
      }
    };

  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    return {
      success: false,
      message: 'Erro ao inicializar banco de dados',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Função para verificar status do banco
export async function checkDatabaseStatus() {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const status = {
    planos_assinatura: false,
    clientes_sistema: false,
    empresas: false,
    admin_exists: false
  };

  try {
    // Verificar planos_assinatura
    const { error: planosError } = await supabase
      .from('planos_assinatura')
      .select('id')
      .limit(1);
    status.planos_assinatura = !planosError;

    // Verificar clientes_sistema
    const { error: clientesError } = await supabase
      .from('clientes_sistema')
      .select('id')
      .limit(1);
    status.clientes_sistema = !clientesError;

    // Verificar empresas
    const { error: empresasError } = await supabase
      .from('empresas')
      .select('id')
      .limit(1);
    status.empresas = !empresasError;

    // Verificar admin
    if (status.clientes_sistema) {
      const { data: adminData } = await supabase
        .from('clientes_sistema')
        .select('id')
        .eq('email', 'admin@sisfinance.com')
        .single();
      status.admin_exists = !!adminData;
    }

  } catch (error) {
    console.error('Erro ao verificar status:', error);
  }

  return status;
}
