-- Engrity Resume Flow — Supabase schema
-- Run in the Supabase SQL editor. Requires pgvector for semantic search.

create extension if not exists vector;
create extension if not exists pgcrypto;

-- Mirrors auth.users; extended profile for invited/signed-up team members
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null default 'recruiter' check (role in ('admin', 'recruiter', 'viewer')),
  invited_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever someone completes sign-up (full_name comes
-- from the `data.full_name` passed to supabase.auth.signUp on the client).
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Configurable designations (job templates), e.g. "QC Inspector", "API Inspector",
-- "Third Party Inspector" — managed from the Settings page.
create table if not exists public.designations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

insert into public.designations (name) values
  ('QC Inspector'), ('API Inspector'), ('Third Party Inspector')
on conflict (name) do nothing;

-- One row per candidate resume built in the app
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,

  -- Header / contact
  candidate_name text not null,
  first_name text,
  last_name text,
  job_title text,                     -- e.g. "QC Inspector"
  designation text references public.designations(name),
  email text,
  phone text,
  address text,

  -- Free-form sections stored as JSON so the builder can render them dynamically
  profile_summary text,
  certifications jsonb not null default '[]',   -- [{ name, endorsements: [] }]
  education jsonb not null default '[]',        -- [{ credential, institution }]
  safety_tickets jsonb not null default '[]',   -- [ "CSTS 2020", "WHMIS 2015", ... ]
  skills jsonb not null default '[]',            -- [ "..." ]
  computer_skills jsonb not null default '[]',
  employment jsonb not null default '[]',
  -- employment[i] = {
  --   id, company, location, title, start_date, end_date, is_present,
  --   responsibilities: string[]
  -- }

  font text default 'plus-jakarta-sans',

  -- Source + status
  source_file_path text,              -- path in Supabase Storage of the original upload
  status text not null default 'draft' check (status in ('draft', 'review', 'final')),

  -- Embedding of the flattened resume text, used by the semantic search bar
  search_embedding vector(1536),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resumes_owner_idx on public.resumes (owner_id);
create index if not exists resumes_embedding_idx on public.resumes
  using ivfflat (search_embedding vector_cosine_ops) with (lists = 100);

-- Generated export artifacts (docx / pdf) kept for re-download without regenerating
create table if not exists public.resume_exports (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references public.resumes(id) on delete cascade,
  format text not null check (format in ('docx', 'pdf')),
  storage_path text not null,
  created_at timestamptz not null default now()
);

-- Simple audit trail for the AI chat sidecar edits
create table if not exists public.resume_edit_log (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references public.resumes(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  instruction text not null,          -- "make Silent-Aire bullets more QC-focused"
  ai_provider text not null,          -- 'anthropic' | 'openai' | 'gemini'
  diff_summary text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.designations enable row level security;
alter table public.resumes enable row level security;
alter table public.resume_exports enable row level security;
alter table public.resume_edit_log enable row level security;

create policy "authenticated read resumes" on public.resumes
  for select using (auth.role() = 'authenticated');
create policy "authenticated write resumes" on public.resumes
  for insert with check (auth.role() = 'authenticated');
create policy "authenticated update resumes" on public.resumes
  for update using (auth.role() = 'authenticated');

create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "authenticated read designations" on public.designations
  for select using (auth.role() = 'authenticated');
create policy "authenticated write designations" on public.designations
  for insert with check (auth.role() = 'authenticated');
create policy "authenticated delete designations" on public.designations
  for delete using (auth.role() = 'authenticated');

-- Semantic search RPC used by /api/search — cosine distance over search_embedding.
create or replace function match_resumes(query_embedding vector(1536), match_count int default 20)
returns setof public.resumes
language sql stable as $$
  select *
  from public.resumes
  where search_embedding is not null
  order by search_embedding <=> query_embedding
  limit match_count;
$$;

-- Storage bucket for original uploads and generated export artifacts.
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

create policy "authenticated read resume files" on storage.objects
  for select using (bucket_id = 'resumes' and auth.role() = 'authenticated');
create policy "authenticated upload resume files" on storage.objects
  for insert with check (bucket_id = 'resumes' and auth.role() = 'authenticated');
