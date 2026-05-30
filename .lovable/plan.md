## Objetivo

Transformar o SeatFlow de protótipo com dados fake em um SaaS real, configurável e pronto para oferecer a clientes, com redesign visual premium (Apple/Linear/Stripe/Notion). Nenhuma feature é removida — tudo passa a usar dados reais do banco.

---

## 1. Backend real (Lovable Cloud)

Ativar Lovable Cloud e criar o schema multi-restaurante com RLS:

- `profiles` — 1:1 com `auth.users` (nome, avatar, restaurante atual)
- `user_roles` — enum `app_role` (`owner`, `manager`, `host`, `staff`) + função `has_role()` security-definer
- `restaurants` — venue (nome, timezone, moeda, depósito padrão, política no-show)
- `restaurant_members` — vínculo user ↔ restaurant com role
- `rooms` — salas (Main, Terrace, Chef's counter, Private dining)
- `tables` — mesa (room_id, label, capacidade, forma, posição x/y, dwell time)
- `customers` — CRM (nome, telefone, email, tags VIP, notas, alergias, total de visitas)
- `reservations` — guest_id, table_id, party_size, datetime, status (`pending|confirmed|seated|completed|no_show|cancelled`), source, depósito, notas
- `waitlist` — entradas com posição, telefone, tempo estimado
- `activity_log` — feed em tempo real (quem fez o quê)

Cada tabela com RLS escopada ao `restaurant_id` do usuário via `has_role` + membership. GRANTs para `authenticated` e `service_role`.

## 2. Autenticação por convite

- Email + senha (sem signup público — desativar signup aberto na UI)
- Tela `/login` minimalista
- Tela `/reset-password`
- Após login, redireciona para `/app`
- Owner pode criar membros em `/app/settings/team` → server function com `supabaseAdmin.auth.admin.createUser` + envio de email de definição de senha
- Layout `_authenticated` com guard de sessão + bearer attacher

## 3. Limpeza dos dados fake

- Apagar todo o conteúdo de `src/lib/demo-data.ts`
- Cada página passa a usar `createServerFn` + TanStack Query
- Estados vazios elegantes ("Nenhuma reserva ainda — crie a primeira") em todas as telas
- Editor visual mínimo para o floor plan funcionar de verdade (adicionar/remover/renomear mesa, mudar capacidade)
- Criação de reserva real via formulário (cliente novo ou existente)
- Mudança de status da reserva (confirmar / sentar / completar / no-show)
- Waitlist real (adicionar, promover para mesa)
- Onboarding na primeira entrada: nome do restaurante → cria `restaurants` + `restaurant_members` (owner) + sala padrão

## 4. Redesign visual premium (tema claro padrão + toggle escuro)

Sistema de design recalibrado em `src/styles.css`:

- **Paleta**: off-white (`oklch(0.99 0.002 80)`), charcoal (`oklch(0.18 0.005 60)`), accent gold sutil (`oklch(0.72 0.09 75)`), bordas ultra suaves (`/0.06`)
- **Tipografia**: headings em Instrument Serif italic com tracking apertado; body em Inter com `font-feature-settings: 'ss01','cv11'`; números tabulares em todas as métricas
- **Espaçamento**: grid de 4px, padding generoso (24–40px), max-width 1280
- **Cards**: `rounded-2xl`, `border` 1px `/0.06`, `shadow-soft` quase invisível; hover sutil
- **Sombras**: 2 níveis apenas (soft, elevated) — nada exagerado
- **Glass**: header, sidebar e popovers com `backdrop-blur-xl` + `bg-background/70`
- **Motion**: transições 200ms `ease-out`, `fade-in`/`scale-in` no mount, hover scale 1.01

Componentes refinados:

- **Sidebar**: navegação mais magra, ícones lineares, indicador ativo com pílula off-white
- **Header**: command palette (`⌘K`) com `cmdk`, busca global real, switcher de venue, avatar
- **Dashboard**: 4 KPIs grandes em serif italic, timeline de reservas do dia (vertical, hora à esquerda), gráfico de ocupação por hora (área suave), feed de atividade compacto, ocupação atual em donut minimalista
- **Floor plan**: canvas com grade sutil, mesas com drag real (mouse + touch), tooltip de status, painel lateral de edição ao clicar
- **Bookings**: tabela com row hover, status chips coloridos sutis, slide-over para detalhe/edição, filtros como segmented control
- **Customers**: lista + perfil em painel lateral com histórico de visitas, total gasto, tags VIP
- **Waitlist**: cartões empilhados, ação rápida "Sentar agora"
- **Analytics**: gráficos Recharts (área, barras horizontais, donut) com cores neutras + 1 accent
- **Billing**: cards de plano + tabela de invoices (sem dados fake até integrar Stripe)
- **Settings**: abas (Restaurant / Hours / Team / Notifications / Booking policy)
- **Landing `/`**: hero cinematográfico, screenshots reais do produto, pricing, CTA
- **`/book`**: fluxo público de reserva 3 passos com transições suaves
- **Dark mode**: classe `.dark` em `<html>` + toggle no header, persistido em `localStorage`
- **Mobile**: sidebar vira sheet, tabelas viram cards empilhados, touch targets ≥ 44px

## 5. O que NÃO entra agora (próximas iterações)

- Stripe (depósitos + subscription) — UI fica pronta, integração depois
- WhatsApp/Twilio — UI pronta, integração depois
- Google Reserve / Instagram — UI pronta
- Editor drag-and-drop avançado do floor plan (entrega versão funcional, refinamento depois)

---

## Detalhes técnicos

- TanStack Start (já no projeto), TanStack Query para todas as leituras
- Server functions em `src/lib/*.functions.ts` com `requireSupabaseAuth`
- `_authenticated.tsx` layout com `beforeLoad` (sessão hidratada)
- `attachSupabaseAuth` em `src/start.ts` (verificar)
- Migrations em ordem: enum → tabelas → grants → RLS → policies → função `has_role`
- `useTheme` hook + classe no `<html>` (sem dependência extra)
- Recharts para gráficos (já disponível via shadcn)
- `cmdk` para command palette (já disponível)

## Entregável

App limpo, com login real, primeira tela criando o restaurante, todas as páginas funcionando contra o banco, visual premium claro/escuro — pronto para você configurar seu primeiro cliente e começar a vender.