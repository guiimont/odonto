# Odonto

Sistema odontológico B2B construído a partir da engenharia reversa funcional do Codental, sem reproduzir sua interface.

## Princípios

- aprender com as regras operacionais do legado;
- reconstruir a experiência com padrão premium e menos troca de contexto;
- preservar histórico clínico e financeiro como fatos auditáveis;
- aplicar isolamento multi-tenant e RLS desde a primeira versão;
- validar migração em homologação antes de tocar em produção.

## Primeira fatia de produto

A tela inicial implementa uma visão executiva premium, com:

- indicador de ocupação da agenda e capacidade ociosa;
- produção, recebimento líquido e inadimplência sem misturar conceitos;
- funil financeiro do produzido ao caixa disponível;
- fila de atenção para esperas, orçamentos e repasses;
- próximos atendimentos e acesso direto à operação.

A Agenda diária por profissional inclui:

- leitura real dos atendimentos no Supabase por data e fuso da clínica;
- criação de atendimento com paciente, profissional, consultório, horário e duração;
- busca por paciente, profissional ou motivo;
- transições reais de status protegidas no PostgreSQL;
- bloqueio de sobreposição para profissional e consultório;
- alerta médico em contexto;
- acesso direto ao prontuário pelo painel lateral.

## Acesso e prontuário

- login e criação de conta com Supabase Auth;
- provisionamento automático da primeira clínica somente após confirmação do e-mail;
- onboarding seguro para contas existentes sem clínica;
- contexto de usuário e clínica resolvido no servidor;
- busca e cadastro real de pacientes;
- ficha unificada com alertas médicos, anamnese, odontograma FDI, evolução clínica, planos de tratamento e parcelas;
- encerramento de sessão e proteção de rotas no Proxy.

Somente os indicadores do dashboard continuam como fixtures sintéticas. Agenda, base de pacientes e ficha clínica já consultam o Supabase real. Nenhum dado dos pacientes auditados foi incluído.

## Executar

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

Para conectar o Supabase, copie `.env.example` para `.env.local` e informe a URL e a chave publicável do projeto.

## Banco

O projeto Supabase `Odonto` está ativo na organização Strategic Data Mind. O schema clínico-financeiro possui 29 tabelas com RLS habilitado, trilha de auditoria, soft delete e índices de chaves estrangeiras.

- snapshot consolidado: `supabase/schema.sql`;
- histórico reproduzível: `supabase/migrations/`;
- tipos gerados do banco: `src/types/database.ts`.

Os números exibidos no dashboard ainda são fixtures sintéticas. A próxima etapa substituirá essas fixtures por métricas agregadas e protegidas por RLS.

## Stack

- Next.js 16 com App Router e TypeScript;
- Tailwind CSS 4;
- Supabase SSR preparado para Client Components, Server Components, Server Actions e Proxy;
- PWA manifest inicial.
