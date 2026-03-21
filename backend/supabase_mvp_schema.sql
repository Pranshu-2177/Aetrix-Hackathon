create table if not exists sessions (
  session_id text primary key,
  channel text not null,
  language text,
  location jsonb,
  created_at timestamptz default now()
);

create table if not exists messages (
  id bigint generated always as identity primary key,
  session_id text not null references sessions(session_id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists triage_results (
  id bigint generated always as identity primary key,
  session_id text not null references sessions(session_id) on delete cascade,
  triage text not null,
  reason text not null,
  confidence float,
  created_at timestamptz default now()
);
