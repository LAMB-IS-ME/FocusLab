-- FocusLab: chạy một lần trên Supabase PostgreSQL (15 trở lên).
-- ID text giữ nguyên mã dữ liệu cũ; khóa ghép ngăn liên kết sang tài khoản khác.
begin;
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  display_name text not null default '' check (length(display_name) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  theme text not null default 'system' check (theme in ('light','dark','system')),
  pomodoro_duration integer not null default 25 check (pomodoro_duration between 1 and 180),
  short_break_duration integer not null default 5 check (short_break_duration between 1 and 60),
  long_break_duration integer not null default 15 check (long_break_duration between 1 and 120),
  weekly_goal numeric not null default 20 check (weekly_goal between 1 and 168),
  collapsed boolean not null default false,
  updated_at timestamptz not null default now()
);
create table public.subjects (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (length(id) between 1 and 200),
  name text not null check (length(btrim(name)) between 1 and 200),
  color text not null check (color ~ '^#[a-fA-F0-9]{6}$'),
  icon text not null check (icon in ('math','brain','code','network','language','book')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create table public.tasks (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (length(id) between 1 and 200),
  title text not null check (length(title) between 1 and 200),
  description text not null default '' check (length(description) <= 10000),
  subject_id text ,
  priority text not null check (priority in ('low','medium','high')),
  due_date date ,
  status text not null check (status in ('todo','progress','done')),
  completed_at timestamptz ,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, subject_id) references public.subjects(user_id, id) on delete set null (subject_id)
);
create table public.notes (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (length(id) between 1 and 200),
  title text not null check (length(title) between 1 and 200),
  content text not null default '' check (length(content) <= 100000),
  pinned boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);
create table public.calendar_events (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (length(id) between 1 and 200),
  title text not null check (length(title) between 1 and 200),
  subject_id text ,
  date date not null,
  start_time time ,
  duration integer not null default 0 check (duration between 0 and 1440),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, subject_id) references public.subjects(user_id, id) on delete set null (subject_id)
);
create table public.focus_sessions (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (length(id) between 1 and 200),
  subject_id text ,
  task_id text ,
  duration numeric not null check (duration > 0 and duration <= 180),
  completed_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, subject_id) references public.subjects(user_id, id) on delete set null (subject_id),
  foreign key (user_id, task_id) references public.tasks(user_id, id) on delete set null (task_id)
);

create index tasks_subject_idx on public.tasks(user_id, subject_id);
create index tasks_due_idx on public.tasks(user_id, due_date);
create index events_subject_idx on public.calendar_events(user_id, subject_id);
create index events_date_idx on public.calendar_events(user_id, date);
create index sessions_subject_idx on public.focus_sessions(user_id, subject_id);
create index sessions_task_idx on public.focus_sessions(user_id, task_id);
create index sessions_completed_idx on public.focus_sessions(user_id, completed_at desc);
create index notes_updated_idx on public.notes(user_id, updated_at desc);

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

-- Chỉ trigger khởi tạo dùng quyền chủ sở hữu; không nhận quyền từ metadata.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(user_id) values (new.id);
  insert into public.user_settings(user_id) values (new.id);
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();
-- Hỗ trợ tài khoản được tạo trước khi chạy migration.
insert into public.profiles(user_id) select id from auth.users on conflict do nothing;
insert into public.user_settings(user_id) select id from auth.users on conflict do nothing;

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
create policy own_select on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_update on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy own_delete on public.profiles for delete to authenticated using ((select auth.uid()) = user_id);
create trigger touch_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();

alter table public.user_settings enable row level security;
revoke all on public.user_settings from anon, authenticated;
grant select, insert, update, delete on public.user_settings to authenticated;
create policy own_select on public.user_settings for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.user_settings for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_update on public.user_settings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy own_delete on public.user_settings for delete to authenticated using ((select auth.uid()) = user_id);
create trigger touch_updated_at before update on public.user_settings
for each row execute function public.touch_updated_at();

alter table public.subjects enable row level security;
revoke all on public.subjects from anon, authenticated;
grant select, insert, update, delete on public.subjects to authenticated;
create policy own_select on public.subjects for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.subjects for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_update on public.subjects for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy own_delete on public.subjects for delete to authenticated using ((select auth.uid()) = user_id);
create trigger touch_updated_at before update on public.subjects
for each row execute function public.touch_updated_at();

alter table public.tasks enable row level security;
revoke all on public.tasks from anon, authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
create policy own_select on public.tasks for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.tasks for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_update on public.tasks for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy own_delete on public.tasks for delete to authenticated using ((select auth.uid()) = user_id);
create trigger touch_updated_at before update on public.tasks
for each row execute function public.touch_updated_at();

alter table public.notes enable row level security;
revoke all on public.notes from anon, authenticated;
grant select, insert, update, delete on public.notes to authenticated;
create policy own_select on public.notes for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.notes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_update on public.notes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy own_delete on public.notes for delete to authenticated using ((select auth.uid()) = user_id);
create trigger touch_updated_at before update on public.notes
for each row execute function public.touch_updated_at();

alter table public.calendar_events enable row level security;
revoke all on public.calendar_events from anon, authenticated;
grant select, insert, update, delete on public.calendar_events to authenticated;
create policy own_select on public.calendar_events for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.calendar_events for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_update on public.calendar_events for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy own_delete on public.calendar_events for delete to authenticated using ((select auth.uid()) = user_id);
create trigger touch_updated_at before update on public.calendar_events
for each row execute function public.touch_updated_at();

alter table public.focus_sessions enable row level security;
revoke all on public.focus_sessions from anon, authenticated;
grant select, insert, update, delete on public.focus_sessions to authenticated;
create policy own_select on public.focus_sessions for select to authenticated using ((select auth.uid()) = user_id);
create policy own_insert on public.focus_sessions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_update on public.focus_sessions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy own_delete on public.focus_sessions for delete to authenticated using ((select auth.uid()) = user_id);
create trigger touch_updated_at before update on public.focus_sessions
for each row execute function public.touch_updated_at();

-- Một snapshot nhất quán, không bị giới hạn 1.000 dòng của REST select.
create function public.get_workspace() returns jsonb
language sql stable security invoker set search_path = '' as $$
select jsonb_build_object(
  'subjects', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'color', color, 'icon', icon) order by created_at, id) from public.subjects where user_id = auth.uid()), '[]'::jsonb),
  'tasks', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'title', title, 'description', description, 'subjectId', coalesce(subject_id, ''), 'priority', priority, 'dueDate', coalesce(due_date::text, ''), 'status', status, 'completedAt', completed_at) order by created_at, id) from public.tasks where user_id = auth.uid()), '[]'::jsonb),
  'notes', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'title', title, 'content', content, 'pinned', pinned, 'updatedAt', updated_at) order by updated_at desc, id) from public.notes where user_id = auth.uid()), '[]'::jsonb),
  'events', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'title', title, 'subjectId', coalesce(subject_id, ''), 'date', date, 'startTime', coalesce(to_char(start_time, 'HH24:MI'), ''), 'duration', duration) order by created_at, id) from public.calendar_events where user_id = auth.uid()), '[]'::jsonb),
  'sessions', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'subjectId', coalesce(subject_id, ''), 'taskId', coalesce(task_id, ''), 'duration', duration, 'completedAt', completed_at) order by created_at, id) from public.focus_sessions where user_id = auth.uid()), '[]'::jsonb),
  'settings', (select jsonb_build_object('theme', theme, 'focus', pomodoro_duration,
    'short', short_break_duration, 'long', long_break_duration, 'weeklyGoal', weekly_goal,
    'collapsed', collapsed) from public.user_settings where user_id = auth.uid())
);
$$;

-- Chỉ gửi các hàng đã đổi; toàn bộ thao tác thành công hoặc cùng rollback.
-- expected_user_id chỉ là chốt chống đổi tài khoản giữa lúc gửi, không cấp quyền.
create function public.apply_workspace_changes(changes jsonb, expected_user_id uuid) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare actor uuid := auth.uid();
begin
  if actor is null or actor <> expected_user_id then
    raise exception 'Phiên đăng nhập đã thay đổi' using errcode = '42501';
  end if;
  -- Tuần tự hóa các lần ghi của cùng user, kể cả từ nhiều thiết bị.
  perform pg_advisory_xact_lock(hashtextextended(actor::text, 0));
  -- Thêm mới không ghi đè hàng đã xuất hiện trên thiết bị khác trong lúc nhập bản sao.
  insert into public.subjects(user_id, id, name, color, icon)
  select actor, r."id", r."name", r."color", r."icon"
  from jsonb_to_recordset(coalesce(changes->'subjects'->'insert', '[]'::jsonb)) as r("id" text, "name" text, "color" text, "icon" text)
  on conflict (user_id, id) do nothing;
  insert into public.subjects(user_id, id, name, color, icon)
  select actor, r."id", r."name", r."color", r."icon"
  from jsonb_to_recordset(coalesce(changes->'subjects'->'upsert', '[]'::jsonb)) as r("id" text, "name" text, "color" text, "icon" text)
  on conflict (user_id, id) do update set name = excluded.name, color = excluded.color, icon = excluded.icon;
  insert into public.tasks(user_id, id, title, description, subject_id, priority, due_date, status, completed_at)
  select actor, r."id", r."title", r."description", nullif(r."subjectId", ''), r."priority", nullif(r."dueDate", '')::date, r."status", r."completedAt"
  from jsonb_to_recordset(coalesce(changes->'tasks'->'insert', '[]'::jsonb)) as r("id" text, "title" text, "description" text, "subjectId" text, "priority" text, "dueDate" text, "status" text, "completedAt" timestamptz)
  on conflict (user_id, id) do nothing;
  insert into public.tasks(user_id, id, title, description, subject_id, priority, due_date, status, completed_at)
  select actor, r."id", r."title", r."description", nullif(r."subjectId", ''), r."priority", nullif(r."dueDate", '')::date, r."status", r."completedAt"
  from jsonb_to_recordset(coalesce(changes->'tasks'->'upsert', '[]'::jsonb)) as r("id" text, "title" text, "description" text, "subjectId" text, "priority" text, "dueDate" text, "status" text, "completedAt" timestamptz)
  on conflict (user_id, id) do update set title = excluded.title, description = excluded.description, subject_id = excluded.subject_id, priority = excluded.priority, due_date = excluded.due_date, status = excluded.status, completed_at = excluded.completed_at;
  insert into public.notes(user_id, id, title, content, pinned, updated_at)
  select actor, r."id", r."title", r."content", r."pinned", r."updatedAt"
  from jsonb_to_recordset(coalesce(changes->'notes'->'insert', '[]'::jsonb)) as r("id" text, "title" text, "content" text, "pinned" boolean, "updatedAt" timestamptz)
  on conflict (user_id, id) do nothing;
  insert into public.notes(user_id, id, title, content, pinned, updated_at)
  select actor, r."id", r."title", r."content", r."pinned", r."updatedAt"
  from jsonb_to_recordset(coalesce(changes->'notes'->'upsert', '[]'::jsonb)) as r("id" text, "title" text, "content" text, "pinned" boolean, "updatedAt" timestamptz)
  on conflict (user_id, id) do update set title = excluded.title, content = excluded.content, pinned = excluded.pinned, updated_at = excluded.updated_at;
  insert into public.calendar_events(user_id, id, title, subject_id, date, start_time, duration)
  select actor, r."id", r."title", nullif(r."subjectId", ''), r."date", nullif(r."startTime", '')::time, r."duration"
  from jsonb_to_recordset(coalesce(changes->'events'->'insert', '[]'::jsonb)) as r("id" text, "title" text, "subjectId" text, "date" date, "startTime" text, "duration" integer)
  on conflict (user_id, id) do nothing;
  insert into public.calendar_events(user_id, id, title, subject_id, date, start_time, duration)
  select actor, r."id", r."title", nullif(r."subjectId", ''), r."date", nullif(r."startTime", '')::time, r."duration"
  from jsonb_to_recordset(coalesce(changes->'events'->'upsert', '[]'::jsonb)) as r("id" text, "title" text, "subjectId" text, "date" date, "startTime" text, "duration" integer)
  on conflict (user_id, id) do update set title = excluded.title, subject_id = excluded.subject_id, date = excluded.date, start_time = excluded.start_time, duration = excluded.duration;
  insert into public.focus_sessions(user_id, id, subject_id, task_id, duration, completed_at)
  select actor, r."id", nullif(r."subjectId", ''), nullif(r."taskId", ''), r."duration", r."completedAt"
  from jsonb_to_recordset(coalesce(changes->'sessions'->'insert', '[]'::jsonb)) as r("id" text, "subjectId" text, "taskId" text, "duration" numeric, "completedAt" timestamptz)
  on conflict (user_id, id) do nothing;
  insert into public.focus_sessions(user_id, id, subject_id, task_id, duration, completed_at)
  select actor, r."id", nullif(r."subjectId", ''), nullif(r."taskId", ''), r."duration", r."completedAt"
  from jsonb_to_recordset(coalesce(changes->'sessions'->'upsert', '[]'::jsonb)) as r("id" text, "subjectId" text, "taskId" text, "duration" numeric, "completedAt" timestamptz)
  on conflict (user_id, id) do update set subject_id = excluded.subject_id, task_id = excluded.task_id, duration = excluded.duration, completed_at = excluded.completed_at;
  delete from public.focus_sessions where user_id = actor and id in (select jsonb_array_elements_text(coalesce(changes->'sessions'->'delete', '[]'::jsonb)));
  delete from public.calendar_events where user_id = actor and id in (select jsonb_array_elements_text(coalesce(changes->'events'->'delete', '[]'::jsonb)));
  delete from public.notes where user_id = actor and id in (select jsonb_array_elements_text(coalesce(changes->'notes'->'delete', '[]'::jsonb)));
  delete from public.tasks where user_id = actor and id in (select jsonb_array_elements_text(coalesce(changes->'tasks'->'delete', '[]'::jsonb)));
  delete from public.subjects where user_id = actor and id in (select jsonb_array_elements_text(coalesce(changes->'subjects'->'delete', '[]'::jsonb)));
  if changes ? 'settings' then
    insert into public.user_settings(user_id, theme, pomodoro_duration, short_break_duration,
      long_break_duration, weekly_goal, collapsed)
    select actor, r.theme, r.focus, r.short, r.long, r."weeklyGoal", r.collapsed
    from jsonb_to_record(changes->'settings') as r(theme text, focus integer, short integer,
      long integer, "weeklyGoal" numeric, collapsed boolean)
    on conflict (user_id) do update set theme = excluded.theme,
      pomodoro_duration = excluded.pomodoro_duration, short_break_duration = excluded.short_break_duration,
      long_break_duration = excluded.long_break_duration, weekly_goal = excluded.weekly_goal,
      collapsed = excluded.collapsed;
  end if;
  return public.get_workspace();
end;
$$;

-- Đặt lại chỉ dữ liệu của người đang đăng nhập, trong một giao dịch.
create function public.reset_workspace(expected_user_id uuid) returns void
language plpgsql security invoker set search_path = '' as $$
declare actor uuid := auth.uid();
begin
  if actor is null or actor <> expected_user_id then raise exception 'Không có quyền' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(actor::text, 0));
  delete from public.focus_sessions where user_id = actor;
  delete from public.calendar_events where user_id = actor;
  delete from public.notes where user_id = actor;
  delete from public.tasks where user_id = actor;
  delete from public.subjects where user_id = actor;
  delete from public.user_settings where user_id = actor;
  insert into public.user_settings(user_id) values (actor);
end;
$$;
revoke all on function public.get_workspace() from public, anon;
revoke all on function public.apply_workspace_changes(jsonb, uuid) from public, anon;
revoke all on function public.reset_workspace(uuid) from public, anon;
grant execute on function public.get_workspace() to authenticated;
grant execute on function public.apply_workspace_changes(jsonb, uuid) to authenticated;
grant execute on function public.reset_workspace(uuid) to authenticated;
commit;
