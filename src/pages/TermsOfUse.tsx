import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import compsmartLogo from "@/assets/compsmart-logo.png";
import { Footer } from "@/components/landing/Footer";

const TermsOfUse = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Termos de Uso — CompSmart</title>
        <meta name="description" content="Termos e condições de uso da plataforma CompSmart: direitos, deveres, planos, cancelamento e responsabilidades das partes." />
        <link rel="canonical" href="https://www.compsmart.ia.br/termos-de-uso" />
        <meta property="og:title" content="Termos de Uso — CompSmart" />
        <meta property="og:description" content="Termos e condições de uso da plataforma CompSmart." />
        <meta property="og:url" content="https://www.compsmart.ia.br/termos-de-uso" />
      </Helmet>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <img src={compsmartLogo} alt="CompSmart" className="h-8 w-auto object-contain" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8">
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Termos de Uso</h1>
            <p className="text-muted-foreground">
              Última atualização: 26 de novembro de 2025
            </p>
          </div>

          {/* Sections */}
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ao acessar e utilizar a plataforma CompSmart ("Plataforma"), você ("Usuário" ou "Cliente") 
                concorda em cumprir e estar vinculado aos presentes Termos de Uso. Se você não concorda com 
                qualquer parte destes termos, não deve utilizar a Plataforma.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Estes Termos constituem um acordo legal vinculativo entre você e a CompSmart, 
                operada por [Nome da Empresa], inscrita no CNPJ sob nº [CNPJ], com sede em [Endereço].
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Definições</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Plataforma:</strong> Sistema SaaS CompSmart para gestão estratégica de remuneração e benefícios.</li>
                <li><strong>Serviços:</strong> Funcionalidades oferecidas pela Plataforma, incluindo análise salarial, gestão de benefícios, assistentes inteligentes e relatórios.</li>
                <li><strong>Conta:</strong> Registro de acesso do Cliente à Plataforma.</li>
                <li><strong>Dados Pessoais:</strong> Informações sobre colaboradores processadas através da Plataforma.</li>
                <li><strong>Conteúdo do Cliente:</strong> Todos os dados, informações e arquivos inseridos pelo Cliente na Plataforma.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Descrição do Serviço</h2>
              <p className="text-muted-foreground leading-relaxed">
                A CompSmart oferece uma plataforma completa de gestão de remuneração estratégica, incluindo:
              </p>
              <ul className="space-y-2 text-muted-foreground mt-2">
                <li>• Módulos de gestão salarial, benefícios e incentivos (ICP/ILP)</li>
                <li>• Assistentes inteligentes com inteligência artificial (IA)</li>
                <li>• Análise de equidade interna e benchmark de mercado</li>
                <li>• Gestão de estruturas organizacionais e cargos</li>
                <li>• Relatórios e dashboards analíticos</li>
                <li>• Conformidade com legislação trabalhista brasileira e LGPD</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Cadastro e Conta do Usuário</h2>
              <p className="text-muted-foreground leading-relaxed">
                <strong>4.1 Elegibilidade:</strong> Apenas pessoas jurídicas ou maiores de 18 anos podem criar uma Conta.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                <strong>4.2 Informações Precisas:</strong> O Cliente compromete-se a fornecer informações verdadeiras, 
                precisas e atualizadas durante o cadastro.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                <strong>4.3 Segurança:</strong> O Cliente é responsável pela confidencialidade de suas credenciais de 
                acesso e por todas as atividades realizadas sob sua Conta.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                <strong>4.4 Notificação de Uso Não Autorizado:</strong> O Cliente deve notificar imediatamente a 
                CompSmart sobre qualquer uso não autorizado de sua Conta.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Responsabilidades do Usuário</h2>
              <p className="text-muted-foreground leading-relaxed">
                O Cliente concorda em:
              </p>
              <ul className="space-y-2 text-muted-foreground mt-2">
                <li>• Utilizar a Plataforma apenas para fins legítimos e em conformidade com a legislação aplicável</li>
                <li>• Não realizar engenharia reversa, descompilar ou tentar acessar o código-fonte da Plataforma</li>
                <li>• Não transmitir vírus, malware ou qualquer código malicioso</li>
                <li>• Não utilizar a Plataforma para violar direitos de terceiros</li>
                <li>• Respeitar os direitos de propriedade intelectual da CompSmart e de terceiros</li>
                <li>• Garantir que possui base legal para o tratamento de dados pessoais inseridos na Plataforma</li>
                <li>• Não compartilhar credenciais de acesso com terceiros não autorizados</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Propriedade Intelectual</h2>
              <p className="text-muted-foreground leading-relaxed">
                <strong>6.1 Propriedade da CompSmart:</strong> Todos os direitos de propriedade intelectual sobre a 
                Plataforma, incluindo software, interface, design, marcas, logos e conteúdo, pertencem exclusivamente 
                à CompSmart ou seus licenciadores.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                <strong>6.2 Licença de Uso:</strong> A CompSmart concede ao Cliente uma licença não exclusiva, 
                intransferível e revogável para utilizar a Plataforma conforme estes Termos e o plano contratado.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                <strong>6.3 Propriedade do Cliente:</strong> O Cliente retém todos os direitos sobre o Conteúdo 
                que inserir na Plataforma. A CompSmart não reivindicará propriedade sobre os dados do Cliente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Limitação de Responsabilidade</h2>
              <p className="text-muted-foreground leading-relaxed">
                <strong>7.1 Análises de IA:</strong> As análises, recomendações e sugestões geradas pelos assistentes 
                inteligentes da Plataforma são fornecidas como orientação e não constituem aconselhamento jurídico, 
                contábil ou trabalhista definitivo. O Cliente deve consultar profissionais especializados antes de 
                tomar decisões críticas.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                <strong>7.2 Disponibilidade:</strong> A CompSmart não garante que a Plataforma estará disponível 
                ininterruptamente. Reservamo-nos o direito de realizar manutenções programadas mediante aviso prévio.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                <strong>7.3 Exclusão de Garantias:</strong> A Plataforma é fornecida "no estado em que se encontra" 
                ("as is"), sem garantias expressas ou implícitas de adequação a um fim específico.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                <strong>7.4 Limitação de Danos:</strong> Em nenhuma hipótese a CompSmart será responsável por danos 
                indiretos, incidentais, especiais ou consequenciais, incluindo lucros cessantes, decorrentes do uso 
                ou impossibilidade de uso da Plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Modificações dos Termos</h2>
              <p className="text-muted-foreground leading-relaxed">
                A CompSmart reserva-se o direito de modificar estes Termos a qualquer momento. As alterações 
                substanciais serão comunicadas aos Clientes com antecedência mínima de 30 dias. O uso continuado 
                da Plataforma após a entrada em vigor das modificações constituirá aceitação dos novos Termos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Rescisão</h2>
              <p className="text-muted-foreground leading-relaxed">
                <strong>9.1 Rescisão pelo Cliente:</strong> O Cliente pode cancelar sua assinatura a qualquer momento 
                através das configurações da Conta ou entrando em contato com o suporte.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                <strong>9.2 Rescisão pela CompSmart:</strong> Reservamo-nos o direito de suspender ou encerrar o 
                acesso à Plataforma em caso de violação destes Termos, inadimplência ou uso indevido dos Serviços.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                <strong>9.3 Efeitos da Rescisão:</strong> Após o término da assinatura, o Cliente terá um período 
                de 30 dias para exportar seus dados. Após esse prazo, os dados poderão ser excluídos permanentemente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Lei Aplicável e Foro</h2>
              <p className="text-muted-foreground leading-relaxed">
                Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da Comarca 
                de São Paulo, Estado de São Paulo, para dirimir quaisquer controvérsias decorrentes destes Termos, 
                com renúncia expressa a qualquer outro, por mais privilegiado que seja.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Contato</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para dúvidas, solicitações ou comunicações relacionadas a estes Termos de Uso, entre em contato:
              </p>
              <ul className="space-y-1 text-muted-foreground mt-2">
                <li>📧 E-mail: contato@compsmart.com.br</li>
                <li>📞 Telefone: +55 (11) 9999-9999</li>
                <li>📍 Endereço: São Paulo, Brasil</li>
              </ul>
            </section>
          </div>

          {/* Bottom Notice */}
          <div className="border-t border-border pt-6 mt-12">
            <p className="text-sm text-muted-foreground text-center">
              Ao utilizar a plataforma CompSmart, você reconhece ter lido, compreendido e concordado 
              com estes Termos de Uso.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfUse;
