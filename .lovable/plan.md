# Roadmap — 6 módulos solicitados

O escopo é enorme (cada item é praticamente um produto). Para entregar com qualidade, proponho dividir em **6 fases sequenciais**, cada uma navegável e funcional ao final. Você aprova esta divisão e eu começo pela Fase 1 — depois seguimos uma a uma.

---

## Fase 1 — Waitlist inteligente + Anti no-show

**Backend (novas tabelas / colunas):**
- `waitlist`: adicionar `position`, `notified_at`, `response_deadline`, `status` (`waiting|offered|accepted|expired|seated|cancelled`), `confidence_score_snapshot`.
- `restaurants`: colunas de política — `no_show_policy` (`none|card|deposit|fine`), `deposit_amount`, `fine_amount`, `offer_timeout_minutes`.
- `customer_reliability`: view/função que calcula score 0–100 a partir de `reservations` (comparecimentos vs no-shows vs cancelamentos tardios).
- Função `promote_next_in_waitlist(restaurant_id)` — chamada quando uma reserva é cancelada/mesa libera.

**Frontend:**
- Reescrever `app.waitlist.tsx`: fila ordenada com posição, tempo estimado (média de dwell × posição/mesas compatíveis), botão "Oferecer vaga" e contagem regressiva de aceite.
- Em `app.settings.tsx`: aba "Política anti no-show" (cartão/sinal/multa + timeout).
- Notificação in-app (toast + badge) quando vaga é oferecida; integração real de WhatsApp fica na Fase 6.

**Dashboard:** taxa comparecimento, cancelamento, top clientes faltosos, score médio. Vai em `app.analytics.tsx` como nova seção.

---

## Fase 2 — Gerenciador visual de mesas (drag & drop real)

- Reescrever `app.floor-plan.tsx` com canvas drag (mouse + touch), resize handles, edição de capacidade inline.
- Unir/separar mesas: nova tabela `table_groups` (mesas filhas → mesa lógica temporária).
- Status real-time via Supabase Realtime em `tables` + `reservations` (verde/amarelo/vermelho derivado do estado atual).
- Persistir `pos_x/pos_y/width/height/shape` por mesa.

---

## Fase 3 — CRM completo

- Estender `customers`: `email`, `dietary_preferences[]`, `internal_notes`, `avg_ticket` (calculado), `classification` (view/função: VIP/Recorrente/Novo/Inativo baseada em visitas + recência + ticket).
- Reescrever `app.customers.tsx`: lista + perfil lateral com timeline de visitas, gasto, preferências, notas.
- Nova rota `app.campaigns.tsx`: criar segmento (filtros) + redigir mensagem (envio real fica para Fase 6).

---

## Fase 4 — Programa de fidelidade

- Tabelas: `loyalty_rules` (pontos por reserva, pontos por R$ gasto), `loyalty_rewards` (catálogo de recompensas), `loyalty_ledger` (créditos/débitos por cliente).
- Trigger em `reservations` ao marcar `completed` e em `checks` ao fechar → credita pontos.
- Nova rota `app.loyalty.tsx`: configurar regras e recompensas + estatísticas de retenção.
- Painel do cliente: aba dentro do perfil em CRM (saldo, histórico, resgates).

---

## Fase 5 — IA de ocupação (preenche horários vazios)

- Server function `analyze_occupancy` (Lovable AI / Gemini): lê histórico de reservas dos últimos 90 dias, identifica janelas frias por dia da semana.
- Gera sugestões de promoção (texto + desconto sugerido + público-alvo VIP/Recorrente).
- Nova rota `app.ai-insights.tsx`: painel com ocupação por horário, sugestões da IA, "Receita recuperada" (reservas vindas de campanha IA).
- Disparo de oferta usa o pipeline da Fase 3 (campanhas) + Fase 6 (WhatsApp).

---

## Fase 6 — WhatsApp (Twilio + templates configuráveis)

- Tabelas: `message_templates` (chave: confirmation/reminder_24h/reminder_2h/offer + corpo com variáveis `{{guest}}` `{{time}}`), `message_log`.
- Server route `/api/public/hooks/whatsapp-webhook` recebe respostas (CONFIRMAR/CANCELAR).
- Cron pg_cron a cada 15 min envia lembretes 24h/2h.
- Connector Twilio (gateway) — pedirei pra você conectar quando chegarmos nessa fase.
- UI em `app.settings.tsx` aba "WhatsApp": editar templates, ver histórico.

---

## Como vamos trabalhar

Cada fase = 1 a 3 migrations + páginas/rotas novas + atualizações no sidebar. Ao fim de cada fase você testa, valida, e seguimos para a próxima. **Aprovar este plano = aprovar a Fase 1**, que começo imediatamente.

Se quiser reordenar (ex.: começar pelo WhatsApp, ou juntar Floor Plan + Waitlist), me diga antes de aprovar.
