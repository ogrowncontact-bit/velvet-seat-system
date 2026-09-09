# Regras de disponibilidade das reservas

Objetivo: nenhuma reserva pode ser criada fora do horário de funcionamento, acima da capacidade de uma mesa, ou em cima de outra reserva na mesma mesa.

## 1. Estrutura de dados

**Horários por dia da semana** — nova tabela `restaurant_hours`
- restaurante, dia da semana (0=domingo … 6=sábado), turno (ex.: Almoço, Jantar), hora de abertura, hora de fechamento, última reserva aceita (minutos antes de fechar), ativo
- Vários turnos por dia são permitidos (almoço 12:00–15:00 e jantar 19:00–23:30)

**Fechamentos pontuais** — nova tabela `restaurant_closures`
- restaurante, data, motivo (feriados, férias, eventos privados)

**Ajustes em tabelas existentes**
- `restaurants`: novo campo de duração média padrão da reserva (minutos, padrão 90) e intervalo entre horários oferecidos (padrão 30 min)
- `tables`: já tem `seats` e `dwell_minutes`; adiciono capacidade mínima opcional para não sentar 2 pessoas numa mesa de 8
- `reservations`: `duration_minutes` já existe e passa a ser preenchido a partir da mesa ou do padrão do restaurante

**Validação no banco (vale para painel, vitrine e API)**
- Gatilho de validação em `reservations` que recusa: dia/horário fechado, data em fechamento pontual, número de pessoas acima da capacidade da mesa escolhida, e sobreposição de horário na mesma mesa (comparando início + duração)
- Função `available_slots(restaurante, data, pessoas)` devolve os horários com pelo menos uma mesa livre
- Função `available_tables(restaurante, horário, pessoas)` devolve as mesas livres, usada na atribuição de mesa

Motivo de colocar a regra no banco: as reservas entram por três caminhos diferentes (equipe, cliente logado e vitrine pública), então a regra precisa ficar num lugar só.

## 2. Interface

**Configurações → nova aba "Horários"**
- Grade dos 7 dias: ligar/desligar o dia, adicionar turnos com hora de início e fim, botão "copiar para todos os dias"
- Duração média da reserva e intervalo entre horários
- Lista de datas fechadas com motivo

**Plano de salão → editar mesa**
- Campo de lotação máxima já existente fica destacado, mais lotação mínima opcional

**Página de reserva pública e criação pela equipe**
- Ao escolher data e nº de pessoas, os horários aparecem como botões: só os disponíveis ficam clicáveis, os cheios aparecem esmaecidos
- Mensagem clara quando o restaurante está fechado naquele dia
- Ao confirmar, o sistema sugere/atribui a mesa livre mais adequada
- Se ainda assim houver conflito (duas pessoas reservando ao mesmo tempo), o erro do banco é traduzido em português na tela

## 3. Ordem de implementação
1. Migração: tabelas de horários e fechamentos, campos novos, funções e gatilho de validação
2. Aba "Horários" nas configurações
3. Seletor de horários com disponibilidade real na página de reserva pública
4. Mesma checagem na criação de reserva pela equipe + atribuição automática de mesa
