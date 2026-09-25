import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { SeoHead } from "@/components/seo/SeoHead";
import compsmartLogo from "@/assets/compsmart-logo.png";
import { Footer } from "@/components/landing/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <SeoHead path="/politica-de-privacidade" />
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
            <h1 className="text-4xl font-bold">Política de Privacidade</h1>
            <p className="text-muted-foreground">
              Última atualização: 04 de fevereiro de 2026
            </p>
          </div>

          {/* Sections */}
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introdução</h2>
              <p className="text-muted-foreground leading-relaxed">
                A CompSmart ("nós", "nosso" ou "Plataforma") respeita a privacidade de seus usuários e 
                está comprometida com a proteção de dados pessoais, em conformidade com a Lei Geral de 
                Proteção de Dados (LGPD - Lei nº 13.709/2018) e demais legislações aplicáveis.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Esta Política de Privacidade descreve como coletamos, usamos, armazenamos, compartilhamos 
                e protegemos os dados pessoais dos usuários da Plataforma, bem como os direitos dos titulares 
                de dados.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">1.1 Definições</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Para melhor compreensão desta Política, apresentamos os seguintes termos e definições:
              </p>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <strong>"Dados Pessoais":</strong> informações relacionadas à pessoa natural identificada 
                  ou identificável (nome, e-mail, CPF, etc.)
                </li>
                <li>
                  <strong>"Cookies":</strong> pequenos arquivos salvos no navegador para lembrar preferências 
                  e melhorar a experiência de uso.
                </li>
                <li>
                  <strong>"Controlador":</strong> empresa cliente que decide sobre o tratamento dos dados 
                  de seus colaboradores.
                </li>
                <li>
                  <strong>"Operador":</strong> a CompSmart, que processa dados conforme instruções do cliente.
                </li>
                <li>
                  <strong>"LGPD":</strong> Lei Geral de Proteção de Dados (Lei nº 13.709/2018), legislação 
                  brasileira que regula o tratamento de dados pessoais.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Dados Coletados</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                <strong>2.1 Dados Cadastrais do Cliente:</strong>
              </p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Nome da empresa e CNPJ</li>
                <li>• Nome completo e cargo do responsável</li>
                <li>• E-mail corporativo e telefone</li>
                <li>• Endereço comercial</li>
              </ul>

              <p className="text-muted-foreground leading-relaxed mb-4 mt-4">
                <strong>2.2 Dados de Colaboradores (inseridos pelo Cliente):</strong>
              </p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Dados identificadores: nome completo, CPF, data de nascimento</li>
                <li>• Dados profissionais: cargo, salário, benefícios, unidade organizacional</li>
                <li>• Dados de desempenho: avaliações, metas, histórico de movimentações</li>
                <li>• Foto do colaborador (opcional)</li>
              </ul>

              <p className="text-muted-foreground leading-relaxed mb-4 mt-4">
                <strong>2.3 Dados de Uso da Plataforma:</strong>
              </p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Logs de acesso e atividades</li>
                <li>• Endereço IP, navegador e dispositivo</li>
                <li>• Interações com assistentes inteligentes (IA)</li>
                <li>• Relatórios e análises gerados</li>
              </ul>

              <p className="text-muted-foreground leading-relaxed mb-4 mt-4">
                <strong>2.4 Cookies e Tecnologias Similares:</strong>
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos cookies essenciais para o funcionamento da Plataforma, cookies de desempenho 
                para análise de uso e cookies de funcionalidade para personalização da experiência. 
                O usuário pode gerenciar cookies através das configurações do navegador.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Finalidade do Tratamento</h2>
              <p className="text-muted-foreground leading-relaxed">
                Os dados pessoais são tratados para as seguintes finalidades:
              </p>
              <ul className="space-y-2 text-muted-foreground mt-2">
                <li>• Prestação dos serviços de gestão de remuneração e benefícios</li>
                <li>• Análises salariais, cálculos de compa-ratio e benchmarking de mercado</li>
                <li>• Geração de relatórios e dashboards analíticos</li>
                <li>• Operação de assistentes inteligentes com IA (análise salarial, jurídico, R&B)</li>
                <li>• Suporte técnico e atendimento ao cliente</li>
                <li>• Cumprimento de obrigações legais e regulatórias</li>
                <li>• Melhoria contínua da Plataforma e desenvolvimento de novos recursos</li>
                <li>• Segurança e prevenção de fraudes</li>
              </ul>
            </section>

            <section id="lgpd">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold">4. Base Legal (LGPD)</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                O tratamento de dados pessoais pela CompSmart está fundamentado nas seguintes bases legais 
                previstas no Art. 7º e 11º da LGPD:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <strong>I. Execução de Contrato (Art. 7º, V):</strong> Tratamento necessário para a execução 
                  do contrato de prestação de serviços firmado com o Cliente.
                </li>
                <li>
                  <strong>II. Cumprimento de Obrigação Legal (Art. 7º, II):</strong> Tratamento necessário para 
                  cumprir obrigações trabalhistas, previdenciárias e tributárias.
                </li>
                <li>
                  <strong>III. Legítimo Interesse (Art. 7º, IX):</strong> Tratamento necessário para suporte técnico, 
                  segurança da informação e melhoria dos serviços, respeitando os direitos dos titulares.
                </li>
                <li>
                  <strong>IV. Consentimento (Art. 7º, I):</strong> Quando aplicável, obtemos consentimento específico 
                  do titular para finalidades não previstas nas bases anteriores.
                </li>
              </ul>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-6">
                <h3 className="font-semibold mb-2 text-primary">Papel do Cliente (Controlador)</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong>Importante:</strong> O Cliente atua como <strong>Controlador</strong> dos dados de seus 
                  colaboradores inseridos na Plataforma, sendo responsável por garantir que possui base legal adequada 
                  para o tratamento. A CompSmart atua como <strong>Operador</strong>, processando dados estritamente 
                  conforme instruções do Cliente e em conformidade com a LGPD.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Tratamento de Dados de Crianças e Adolescentes</h2>
              <p className="text-muted-foreground leading-relaxed">
                A CompSmart não coleta nem processa intencionalmente dados pessoais de crianças e adolescentes 
                menores de 18 anos. Nossa plataforma é destinada exclusivamente a ambientes corporativos e 
                profissionais.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Caso identifiquemos que dados de menores foram inseridos inadvertidamente, estes serão 
                prontamente eliminados de nossos sistemas.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Compartilhamento de Dados</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                A CompSmart não vende, aluga ou comercializa dados pessoais. Compartilhamos dados apenas 
                nas seguintes situações:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <strong>Provedores de Serviços:</strong> Compartilhamos dados com fornecedores de infraestrutura 
                  de nuvem, processamento de pagamentos e ferramentas de análise que nos auxiliam na operação da 
                  Plataforma. Todos os fornecedores são contratualmente obrigados a proteger os dados.
                </li>
                <li>
                  <strong>Autoridades Públicas:</strong> Podemos divulgar dados quando exigido por lei, ordem 
                  judicial ou solicitação de autoridades competentes.
                </li>
                <li>
                  <strong>Proteção de Direitos:</strong> Podemos compartilhar dados para proteger direitos, 
                  propriedade ou segurança da CompSmart, nossos usuários ou o público.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Armazenamento e Segurança</h2>
              <p className="text-muted-foreground leading-relaxed">
                <strong>7.1 Medidas de Segurança:</strong> Implementamos medidas técnicas e organizacionais 
                de segurança, incluindo:
              </p>
              <ul className="space-y-1 text-muted-foreground mt-2">
                <li>• Criptografia de dados em trânsito (TLS/SSL) e em repouso</li>
                <li>• Controles de acesso baseados em função (RBAC)</li>
                <li>• Autenticação multifator (MFA)</li>
                <li>• Monitoramento contínuo de segurança e logs de auditoria</li>
                <li>• Backups regulares e plano de recuperação de desastres</li>
              </ul>

              <p className="text-muted-foreground leading-relaxed mt-4">
                <strong>7.2 Localização:</strong> Os dados são armazenados em infraestrutura de nuvem segura 
                (Lovable Cloud/AWS), com data centers que garantem conformidade com a LGPD e certificações 
                de segurança internacionais.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Direitos do Titular (LGPD)</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Em conformidade com os Arts. 17 a 22 da LGPD, você tem os seguintes direitos:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>✓ <strong>Confirmação e Acesso:</strong> Confirmar a existência de tratamento e acessar seus dados</li>
                <li>✓ <strong>Correção:</strong> Corrigir dados incompletos, inexatos ou desatualizados</li>
                <li>✓ <strong>Anonimização ou Bloqueio:</strong> Solicitar anonimização ou bloqueio de dados desnecessários</li>
                <li>✓ <strong>Eliminação:</strong> Solicitar eliminação de dados tratados com seu consentimento</li>
                <li>✓ <strong>Portabilidade:</strong> Obter cópia dos dados em formato estruturado</li>
                <li>✓ <strong>Informação sobre Compartilhamento:</strong> Saber com quem seus dados foram compartilhados</li>
                <li>✓ <strong>Revogação de Consentimento:</strong> Revogar consentimento a qualquer momento</li>
                <li>✓ <strong>Oposição:</strong> Opor-se ao tratamento realizado com base em legítimo interesse</li>
              </ul>

              <p className="text-muted-foreground leading-relaxed mt-4">
                Para exercer seus direitos, entre em contato com nosso Encarregado de Dados (DPO) através 
                do e-mail: <strong>contato@compsmart.ia.br</strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Retenção de Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Retemos dados pessoais apenas pelo tempo necessário para cumprir as finalidades para as quais 
                foram coletados, incluindo:
              </p>
              <ul className="space-y-1 text-muted-foreground mt-2">
                <li>• Durante a vigência do contrato de prestação de serviços</li>
                <li>• Pelo período exigido por obrigações legais (ex: dados trabalhistas por 5 anos)</li>
                <li>• Para exercício regular de direitos em processos judiciais, administrativos ou arbitrais</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Após o término desses períodos, os dados serão eliminados de forma segura ou anonimizados.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Transferência Internacional</h2>
              <p className="text-muted-foreground leading-relaxed">
                Caso seja necessário transferir dados pessoais para países estrangeiros, garantiremos que o 
                país de destino oferece grau de proteção adequado ou adotaremos salvaguardas contratuais 
                apropriadas (Cláusulas Contratuais Padrão - SCCs), em conformidade com o Art. 33 da LGPD.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Encarregado de Dados (DPO)</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nomeamos um Encarregado de Proteção de Dados (Data Protection Officer - DPO) para atuar como 
                canal de comunicação entre a CompSmart, os titulares de dados e a Autoridade Nacional de 
                Proteção de Dados (ANPD).
              </p>
              <div className="bg-muted/50 rounded-lg p-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Contato do DPO:</strong>
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground mt-2">
                  <li>📧 E-mail: contato@compsmart.ia.br</li>
                  <li>📍 Endereço: São Paulo, Brasil</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Alterações na Política</h2>
              <p className="text-muted-foreground leading-relaxed">
                Reservamo-nos o direito de atualizar esta Política de Privacidade periodicamente para refletir 
                mudanças em nossas práticas ou na legislação. Alterações substanciais serão comunicadas aos 
                usuários com antecedência mínima de 30 dias através de e-mail ou notificação na Plataforma.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Recomendamos que você revise esta Política regularmente. A versão atualizada estará sempre 
                disponível em nosso site com a data da última modificação.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Contato</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Para dúvidas, solicitações ou reclamações relacionadas a esta Política de Privacidade ou ao 
                tratamento de seus dados pessoais, entre em contato:
              </p>
              <div className="bg-muted/50 rounded-lg p-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><strong>CompSmart - Gestão de Remuneração Estratégica</strong></li>
                  <li>📧 Geral: contato@compsmart.ia.br</li>
                  <li>🔒 Privacidade: contato@compsmart.ia.br</li>
                  <li>📍 Endereço: São Paulo, Brasil</li>
                </ul>
              </div>
            </section>
          </div>

          {/* Bottom Notice */}
          <div className="border-t border-border pt-6 mt-12">
            <p className="text-sm text-muted-foreground text-center">
              Ao utilizar a plataforma CompSmart, você reconhece ter lido, compreendido e concordado 
              com esta Política de Privacidade.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
