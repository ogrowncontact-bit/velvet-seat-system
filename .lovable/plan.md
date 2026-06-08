# Fase 6 — Automação WhatsApp via Twilio

## O que vai ser entregue

1. **Templates configuráveis por restaurante** — mensagens de confirmação, lembrete 24h, lembrete 2h e oferta de vaga, com variáveis `{{guest}}`, `{{time}}`, `{{party}}`, `{{restaurant}}`.
2. **Envio automático**:
   - Confirmação dispara ao criar reserva (trigger de banco enfileira).
   - Lembrete 24h e lembrete 2h disparam por cron a cada 15 min.
   - Oferta de vaga (waitlist) dispara quando `promote_next_waitlist` muda status para `offered`.
3. **Recebimento (cancelar/confirmar pelo WhatsApp)**:
   - Endpoint público `/api/public/hooks/whatsapp-webhook` recebe respostas do Twilio.
   - Palavras-chave: `CONFIRMAR` / `CONFIRMO` → marca reserva `confirmed`; `CANCELAR` → marca `cancelled`.
   - Resposta automática de confirmação ao cliente.
4. **Histórico completo** em `message_log` (direção, status, payload, erro, reserva relacionada).
5. **UI** em `app.settings.tsx` (nova aba "WhatsApp"): editar templates, ativar/desativar tipos, ver últimas 50 mensagens com status. Botão de teste manual.

## Backend

**Migrations:**
- `message_templates(restaurant_id, kind enum, body text, enabled bool)` — kind: `confirmation|reminder_24h|reminder_2h|waitlist_offer|reply_confirmed|reply_cancelled`. Seed com defaults em PT-BR no insert do restaurante.
- `message_log(restaurant_id, reservation_id?, waitlist_id?, to_phone, body, direction enum in|out, kind, status enum queued|sent|delivered|failed|received, provider_sid, error, created_at)`.
- `message_queue(restaurant_id, kind, payload jsonb, scheduled_for timestamptz, processed_at, attempts)` — fila simples processada pelo cron.
- `restaurants`: colunas `whatsapp_enabled bool`, `whatsapp_from text` (número Twilio E.164).
- Trigger em `reservations` AFTER INSERT → enfileira `confirmation` imediata + `reminder_24h` e `reminder_2h` agendados.
- Trigger em `waitlist` AFTER UPDATE quando status vira `offered` → enfileira `waitlist_offer`.

**Server routes:**
- `/api/public/hooks/whatsapp-webhook` (POST, x-www-form-urlencoded do Twilio) — valida assinatura `X-Twilio-Signature`, parseia `From` + `Body`, casa reserva ativa pelo telefone, atualiza status e responde TwiML.
- `/api/public/hooks/whatsapp-dispatch` (POST, autenticado por `apikey` anon) — chamado pelo cron a cada 15 min: busca itens em `message_queue` com `scheduled_for <= now()`, renderiza template, envia via Twilio gateway, grava em `message_log`.

**pg_cron:** job a cada 15 minutos chamando `/api/public/hooks/whatsapp-dispatch`.

**Twilio:** via connector `twilio` (gateway). Vou pedir pra você conectar quando aprovar.

## Frontend

- `app.settings.tsx` aba "WhatsApp": toggle global, número From, editor de cada template (textarea + preview com variáveis), botão "Enviar teste".
- Componente `<MessageHistory />`: tabela com direção (↑/↓), telefone, kind, status, hora, erro. Auto-refresh 30s.

## Ordem de execução

1. Migration (tabelas + triggers + seed dos templates default).
2. Server routes (webhook + dispatch).
3. Cron job (insert tool, depois da migration).
4. UI de settings + histórico.
5. Pedir conexão Twilio.

Aprova? Depois de aprovar eu mando a migration pra você confirmar e sigo na sequência.