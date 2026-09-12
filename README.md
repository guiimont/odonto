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

- ocupação real da agenda e capacidade ociosa;
- produção, recebimento líquido e inadimplência sem misturar conceitos;
- funil financeiro do produzido ao caixa disponível;
- fila de atenção para esperas, orçamentos e repasses;
- próximos atendimentos e acesso direto à operação.

A Agenda diária por profissional inclui:

- pesquisa por paciente ou procedimento;
- horários e duração;
- estados do atendimento;
- alerta médico em contexto;
- resumo financeiro;
- painel lateral sem abandonar a agenda.

Os dados exibidos nesta fase são fixtures sintéticas. Nenhum dado dos pacientes auditados foi incluído.

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

Os números exibidos no dashboard ainda são fixtures sintéticas; nenhum dado dos pacientes auditados foi incluído. A próxima etapa substituirá as fixtures por métricas agregadas e protegidas por RLS.

## Stack

- Next.js 16 com App Router e TypeScript;
- Tailwind CSS 4;
- Supabase SSR preparado para Client Components, Server Components, Server Actions e Proxy;
- PWA manifest inicial.
