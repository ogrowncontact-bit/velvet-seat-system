# Separação em 3 perfis de acesso

A plataforma hoje tem um único `/login` que serve admin geral e funcionários do restaurante, e `/book` que é totalmente público (sem conta). Vou separar em três experiências distintas, com rotas, telas de login e dashboards próprios.

## Os 3 perfis

| Perfil | Rota de login | Após login |
|---|---|---|
| **Admin geral** (você) | `/admin/login` | `/admin` — painel da plataforma (restaurantes, métricas globais, billing) |
| **Restaurante** (dono/garçom/gerente) | `/staff/login` | `/app` — painel atual de operação (mesas, reservas, caixa, etc.) |
| **Cliente** (faz reservas) | `/cliente/login` | `/cliente` — "Minhas reservas" + botão "Nova reserva" |

Cada login tem visual e copy próprios para ficar óbvio onde a pessoa está entrando.

## Como o sistema decide o perfil

Já existe a tabela `platform_admins` (admin geral) e `restaurant_members` (staff). Vou adicionar:
- **`customer_accounts`** (novo) — liga `auth.users.id` a um registro de cliente (nome, telefone, e-mail). Criada automaticamente no signup do cliente.
- Função `public.get_user_role(uid)` que retorna `'admin' | 'staff' | 'customer' | null` — usada para decidir o destino correto após login e bloquear acessos cruzados.

Regras de acesso:
- `/admin/*` → só `platform_admins`
- `/app/*` → só quem está em `restaurant_members` (ou admin)
- `/cliente/*` → qualquer pessoa autenticada (admin/staff também podem acessar, mas geralmente entram pelo painel deles)

Se alguém fizer login pela porta errada (ex.: cliente em `/staff/login`), redireciono pro destino certo automaticamente.

## Fluxo do cliente (novo)

1. `/cliente/login` — login + cadastro (e-mail/senha + Google) específico pra cliente.
2. `/cliente` — lista das reservas (passadas e futuras), botão "Cancelar" e "Nova reserva".
3. `/book` continua existindo público (para QR code do restaurante e link de Instagram), mas:
   - se o cliente estiver logado, pré-preenche nome/telefone/email
   - oferece "Salvar nas minhas reservas" se não estiver logado
4. Reserva criada por cliente logado é vinculada via `customer_accounts.user_id` → `reservations.customer_id`.

## Mudanças técnicas

**Backend (1 migration):**
- Tabela `customer_accounts` (user_id PK → auth.users, name, phone, email, created_at).
- Trigger no signup que cria `customer_accounts` quando o `raw_user_meta_data.role = 'customer'`.
- Função `get_user_role`.
- RLS: cliente pode ler/cancelar só suas próprias reservas (via `customer_id` casando com seu `customer_accounts`).

**Frontend:**
- Substituir `/login` por 3 telas: `/admin/login`, `/staff/login`, `/cliente/login` (mantém `/login` como redirect para `/staff/login` por compatibilidade).
- Novo layout `src/routes/cliente.tsx` + `src/routes/cliente.index.tsx` (lista de reservas).
- `src/routes/admin.tsx` (gate de admin) + mover `app.admin.tsx` para fora do `/app`.
- Atualizar a landing `/` com 3 CTAs: "Sou cliente", "Sou restaurante", "Admin".
- Hook `useAuth` ganha `role` derivada de `get_user_role`.

**Booking público:**
- `/book` segue funcionando sem login. Se o cliente estiver logado, mostra "Olá, {nome}" e pré-preenche dados.

## Ordem de execução

1. Migration + função de role.
2. Refatoração do `useAuth` para incluir `role`.
3. Três telas de login + redirects.
4. Layout `/cliente` + página "Minhas reservas".
5. Mover console admin para `/admin`.
6. Atualizar a landing com os 3 CTAs.

Aprova? Se quiser ajustar nomes de rotas (ex.: `/customer` em inglês, ou outro), me diz antes.