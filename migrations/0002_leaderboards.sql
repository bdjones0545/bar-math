-- Public speed-round leaderboards. Unowned rows (no accounts).
-- Periods are computed from created_at (timestamptz, server clock).

create table if not exists lb_rounds (
  id text primary key,
  token_hash text not null unique,
  mode text not null,
  difficulty text not null,
  client_id text not null,
  started_at timestamptz not null default now(),
  submitted_at timestamptz
);

create index if not exists lb_rounds_client_started_idx
  on lb_rounds (client_id, started_at desc);

create table if not exists lb_scores (
  id text primary key,
  round_id text not null unique,
  client_id text not null,
  display_name text not null,
  mode text not null,
  difficulty text not null,
  score integer not null,
  correct integer not null,
  incorrect integer not null,
  accuracy integer not null,
  created_at timestamptz not null default now()
);

create index if not exists lb_scores_board_idx
  on lb_scores (mode, difficulty, created_at desc);

create index if not exists lb_scores_rank_idx
  on lb_scores (mode, difficulty, correct desc, accuracy desc, created_at asc);

create table if not exists lb_rate (
  bucket text not null,
  window_id text not null,
  count integer not null default 0,
  primary key (bucket, window_id)
);
