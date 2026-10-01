



Ponto Certo
Plataforma web para controle de jornada, ponto, escalas, sobreaviso, chamados e gestão de equipe.

📌 Visão geral
O projeto Ponto Certo corresponde, no código atual, a uma aplicação de controle de jornada que também reúne recursos de rodízio, gestão de setores, acompanhamento da equipe, sobreaviso e chamados.

No código enviado, a interface utiliza a identidade “Ponto & Rodízio” e o pacote está identificado como ponto-e-rodizio. Neste README, Ponto Certo é usado como nome do projeto solicitado.

A aplicação possui integração direta com Supabase, autenticação de usuário, controle de acesso por papel e páginas protegidas.

🎯 Objetivo
Centralizar em um único sistema:

Registro de entrada.

Saída para almoço.

Retorno do almoço.

Saída.

Espelho mensal de ponto.

Saldo de horas.

Solicitação de ajustes.

Aprovação/recusa de ajustes por gestor.

Organização por setores.

Gestão da equipe.

Rodízio e escalas.

Períodos de sobreaviso.

Registro de chamados atendidos.

Exportação do espelho em PDF e CSV.

✨ Funcionalidades
⏱️ Meu ponto
O colaborador possui quatro tipos de marcação:

Entrada
   ↓
Saída para almoço
   ↓
Retorno do almoço
   ↓
Saída
As marcações são armazenadas em time_punches.

Cada registro possui:

id

user_id

kind

punched_at

note

created_at

adjusted_by

📋 Espelho mensal
O sistema agrupa as marcações por dia e calcula:

Horas trabalhadas.

Saldo diário.

Jornada.

Situação de completude da marcação.

A lógica utiliza a jornada definida no perfil.

A constante existente no código é:

JORNADA_MINUTOS = 8h48
TOLERANCIA_MINUTOS = 10 minutos
A jornada padrão documentada no código é 08:00–17:48 com 1 hora de almoço.

A aplicação também possui jornada_minutos por perfil, portanto a jornada pode ser armazenada individualmente.

🛠️ Ajustes de ponto
O colaborador pode solicitar correção de uma marcação informando:

Tipo da marcação.

Data e hora corretas.

Motivo.

Os pedidos são armazenados em:

punch_adjustments
O pedido possui campos como:

Usuário.

Tipo de marcação.

Horário solicitado.

Motivo.

Status.

Observação do gestor.

Data da revisão.

Responsável pela revisão.

Fluxo
Colaborador
    ↓
Solicita ajuste
    ↓
Pedido fica pendente
    ↓
Gestor analisa
    ↓
Aprovar ou recusar
    ↓
Se aprovado, ajuste é aplicado
A aprovação utiliza a função:

review_adjustment
👥 Equipe
Gestores possuem uma tela específica para acompanhar o ponto da equipe.

É possível consultar:

Colaboradores.

E-mail.

Cargo.

Jornada.

Marcações.

Espelho do colaborador.

Também existe recurso de:

Inclusão manual de marcação.

Exclusão de marcação.

O acesso é condicionado ao papel do usuário.

🏢 Setores
Administradores possuem o módulo de setores.

O módulo permite:

Criar setores.

Excluir setores.

Vincular colaboradores a setores.

Alterar o papel do colaborador.

Os registros são armazenados em:

sectors
Os perfis possuem referência para o setor através de:

profiles.sector_id
🔐 Papéis e permissões
Os papéis existentes no banco são:

admin
gestor
funcionario
A tabela utilizada é:

user_roles
A aplicação também utiliza funções do banco:

has_role
can_manage
set_user_role
review_adjustment
Administrador
Possui acesso ao módulo de setores e gerenciamento das atribuições de usuários.

Gestor
Possui acesso à área de equipe e aos ajustes de ponto dos colaboradores que ele gerencia.

Funcionário
Pode consultar e registrar o próprio ponto e solicitar ajustes.

As regras definitivas de acesso dependem das políticas e funções configuradas no projeto Supabase.

🔄 Rodízio
O módulo Rodízio reúne diferentes recursos operacionais em abas.

Participantes
Cadastro de participantes com:

Nome.

Função.

Status.

Tabela:

participants
Escalas
Cadastro de escalas com:

Data.

Horário inicial.

Horário final.

Tipo.

Participante.

Tabela:

schedules
Sobreaviso
Cadastro de períodos de sobreaviso com:

Data.

Horário inicial.

Horário final.

Participante.

Tabela:

on_call_periods
Chamados
Registro de chamados atendidos com:

Número do chamado.

Data.

Início.

Fim.

Descrição.

Participante.

Tabela:

support_tickets
📊 Resumo de sobreaviso
O sistema possui cálculo de:

Quantidade de períodos.

Quantidade de chamados.

Minutos de atendimento.

A tela apresenta o resumo do mês atual por participante.

📤 Exportação do espelho
Existe um componente específico:

ExportEspelho.tsx
Ele permite:

Exportar para PDF.

Exportar para CSV.

A implementação utiliza:

jspdf
jspdf-autotable
🔑 Autenticação
A autenticação é feita através do Supabase Auth.

O código utiliza:

supabase.auth.signInWithPassword()
supabase.auth.signUp()
supabase.auth.getSession()
supabase.auth.getUser()
supabase.auth.signOut()
Cadastro
A tela de autenticação possui os modos:

Login
Criar conta
O cadastro utiliza e-mail e senha e armazena o nome completo nos dados do usuário.

Proteção de rotas
As páginas autenticadas ficam sob:

/_authenticated
A rota verifica:

supabase.auth.getUser()
Sem usuário autenticado, o sistema redireciona para:

/auth
🧱 Arquitetura
O projeto utiliza TanStack React Start com rotas baseadas em arquivos.

Arquitetura conceitual:

┌─────────────────────────────┐
│           Browser           │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│      React  +  TanStack     │
│        Router / Start       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│       Supabase Client       │
│       Auth + Database       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│          Supabase           │
│    PostgreSQL + Auth        │
└─────────────────────────────┘
O projeto também possui camada server-side para operações autenticadas e proteção de requisições.

🛠️ Tecnologias utilizadas
As tecnologias abaixo foram identificadas diretamente no package.json e no código enviado.

Front-end
React
Versão declarada:

19.2.0
Utilizado para construção dos componentes e telas.

TypeScript
Versão declarada:

5.8.3
Linguagem principal do código de interface e servidor.

TanStack Router
Versão declarada:

1.170.18
Utilizado para roteamento baseado em arquivos.

TanStack React Start
Versão declarada:

1.168.32
Utilizado na estrutura da aplicação e na camada server-side.

TanStack React Query
Versão declarada:

5.101.1
Utilizado nas consultas, cache e atualização de dados do Supabase.

Tailwind CSS
Versão declarada:

4.2.1
Utilizado para estilização das interfaces.

Lucide React
Utilizado para os ícones da aplicação.

🎨 Componentes de interface
O projeto utiliza componentes próprios e componentes baseados em Radix UI.

Dependências Radix identificadas:

@radix-ui/react-dialog
@radix-ui/react-label
@radix-ui/react-separator
@radix-ui/react-slot
@radix-ui/react-tabs
@radix-ui/react-toggle
@radix-ui/react-tooltip
Esses componentes são utilizados em elementos como:

Dialog.

Label.

Separator.

Tabs.

Toggle.

Tooltip.

Sheet.

🗄️ Banco de dados
Supabase
O projeto utiliza Supabase como plataforma de backend e banco de dados.

O código possui tipos gerados para as tabelas públicas.

Tabelas identificadas
profiles
user_roles
sectors
time_punches
punch_adjustments
participants
schedules
on_call_periods
support_tickets
📚 Modelo de dados
profiles
Informações do usuário:

id
full_name
email
cargo
jornada_minutos
sector_id
created_at
user_roles
Relaciona o usuário ao papel:

id
user_id
role
sectors
Cadastro de setores:

id
name
created_at
time_punches
Marcações:

id
user_id
kind
punched_at
note
adjusted_by
created_at
punch_adjustments
Pedidos de ajuste:

id
user_id
kind
requested_at
reason
status
review_note
reviewed_at
reviewed_by
created_at
participants
Participantes do rodízio:

id
name
role
status
user_id
created_at
schedules
Escalas:

id
schedule_date
start_time
end_time
kind
participant_id
user_id
created_at
on_call_periods
Sobreaviso:

id
on_call_date
start_time
end_time
participant_id
user_id
created_at
support_tickets
Chamados atendidos:

id
ticket_number
ticket_date
started_at
ended_at
description
participant_id
user_id
created_at
🔐 Segurança
A aplicação utiliza o Supabase Auth para autenticação.

Também existem componentes server-side relacionados à validação de requisições autenticadas:

auth-attacher.ts
auth-middleware.ts
client.server.ts
Bearer Token
As requisições server-side podem utilizar:

Authorization: Bearer <token>
O middleware valida o token antes de liberar determinadas operações.

Chave administrativa
O arquivo client.server.ts contém suporte para:

SUPABASE_SERVICE_ROLE_KEY
Essa chave é destinada exclusivamente ao servidor.

Ela não deve ser enviada ao navegador ou commitada no Git.

🌐 Variáveis de ambiente
O projeto possui .env.example.

Variáveis identificadas:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=

SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=

SUPABASE_SERVICE_ROLE_KEY=
Uso
As variáveis públicas são utilizadas pelo cliente conforme a configuração do projeto.

As variáveis server-side são utilizadas durante a execução do servidor.

A SUPABASE_SERVICE_ROLE_KEY deve permanecer exclusivamente no ambiente do servidor.

📁 Estrutura do projeto
Estrutura relevante identificada:

ponto-certo--main/
├── public/
│   ├── favicon.svg
│   └── robots.txt
│
├── src/
│   ├── assets/
│   │   └── hero02-main.webp
│   │
│   ├── components/
│   │   ├── Ajustes.tsx
│   │   ├── AppShell.tsx
│   │   ├── ExportEspelho.tsx
│   │   ├── TubesBackground.tsx
│   │   └── ui/
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   └── useSession.tsx
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── auth-attacher.ts
│   │       ├── auth-middleware.ts
│   │       ├── client.server.ts
│   │       ├── client.ts
│   │       └── types.ts
│   │
│   ├── lib/
│   │   ├── error-capture.ts
│   │   ├── error-page.ts
│   │   ├── espelho-export.ts
│   │   ├── ponto.ts
│   │   ├── utils.ts
│   │   └── vendor/
│   │
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── auth.tsx
│   │   ├── index.tsx
│   │   └── _authenticated/
│   │       ├── equipe.tsx
│   │       ├── ponto.tsx
│   │       ├── rodizio.tsx
│   │       ├── route.tsx
│   │       └── setores.tsx
│   │
│   ├── routeTree.gen.ts
│   ├── router.tsx
│   ├── server.ts
│   ├── start.ts
│   └── styles.css
│
├── .env.example
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── bunfig.toml
├── components.json
└── eslint.config.js
⚙️ Scripts
Scripts definidos no package.json:

npm run dev
npm run build
npm run build:dev
npm run preview
npm run lint
npm run format
Desenvolvimento
npm run dev
Build
npm run build
Preview
npm run preview
Lint
npm run lint
Formatação
npm run format
📦 Instalação
Pré-requisitos
Node.js — versão exata a definir.

npm.

Um projeto Supabase configurado.

1. Clonar
git clone <URL_DO_REPOSITORIO>
cd ponto-certo--main
2. Instalar
npm install
3. Configurar ambiente
Crie:

.env
A partir de .env.example.

Preencha as credenciais do projeto Supabase.

4. Executar
npm run dev
🧪 Testes
Framework de testes automatizados:

a definir.

O projeto possui mecanismos de validação e tratamento de erros, mas não foi identificada uma suíte formal de testes automatizados no conteúdo enviado.

📱 PWA
Status:

a definir / não confirmado no código enviado.

Embora o projeto seja uma aplicação web responsiva e possua estrutura moderna de front-end, não foi confirmado no código analisado um conjunto completo de recursos PWA como:

Manifest.

Service Worker.

Cache offline.

Estratégia de atualização offline.

Push notifications.

Esses itens permanecem como a definir.

🚀 Deploy
O projeto foi estruturado para build com Vite/TanStack Start.

O provedor definitivo de produção:

a definir.

A infraestrutura de produção do Supabase:

definida pelo projeto Supabase utilizado.

Domínio de produção:

a definir.

🔄 Fluxos principais
Jornada do colaborador
Login
 ↓
Meu ponto
 ↓
Registrar marcação
 ↓
Espelho mensal
 ↓
Consultar saldo
 ↓
Solicitar ajuste, quando necessário
Jornada do gestor
Login
 ↓
Equipe
 ↓
Consultar colaboradores
 ↓
Consultar espelho
 ↓
Ajustar marcação manualmente
 ↓
Analisar pedidos de ajuste
Jornada do administrador
Login
 ↓
Setores
 ↓
Criar / excluir setor
 ↓
Distribuir colaboradores
 ↓
Definir papel
Rodízio
Participantes
 ↓
Escalas
 ↓
Sobreaviso
 ↓
Chamados
 ↓
Resumo operacional
🗺️ Roadmap
✅ Implementado no código
Autenticação Supabase.

Cadastro de conta.

Proteção de rotas.

Controle por papel.

Registro de ponto.

Quatro marcações diárias.

Espelho mensal.

Cálculo de horas.

Saldo diário.

Solicitação de ajuste.

Aprovação de ajuste.

Gestão da equipe.

Gestão de setores.

Participantes.

Escalas.

Sobreaviso.

Chamados.

Exportação PDF.

Exportação CSV.

🚧 A definir / evolução
Matriz detalhada de permissões.

Auditoria completa.

Notificações.

Política de retenção de dados.

Estratégia PWA completa.

Suíte de testes automatizados.

Monitoramento de produção.

Pipeline CI/CD.

Estratégia de backup documentada.

Domínio definitivo.

Configuração de produção documentada.

📌 Estado atual
Ponto Certo — em desenvolvimento.

A versão enviada possui funcionalidades reais conectadas ao Supabase, autenticação, persistência de dados, registro de ponto, ajustes, gestão de equipe, setores, rodízio, sobreaviso, chamados e exportação.

Itens não confirmados diretamente no código foram marcados como a definir para evitar atribuir ao projeto tecnologias ou recursos que não foram encontrados.

📄 Licença
Licença:

a definir.

Até que uma licença seja escolhida e adicionada ao repositório, não se deve assumir que o código pode ser redistribuído ou comercializado livremente.

👩‍💻 Informações do projeto
Nome solicitado: Ponto Certo
Nome apresentado atualmente na interface: Ponto & Rodízio
Pacote: ponto-e-rodizio
Categoria: Sistema de controle de jornada e gestão de equipe
Front-end: React + TypeScript
Framework: TanStack React Start
Roteamento: TanStack Router
Estado/cache: TanStack React Query
Estilização: Tailwind CSS
Backend/Banco: Supabase
Autenticação: Supabase Auth
Exportação: jsPDF + jsPDF AutoTable
Status: Em desenvolvimento
