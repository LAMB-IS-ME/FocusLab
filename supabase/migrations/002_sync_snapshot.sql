-- Nâng cấp RPC của bản tích hợp ban đầu (trả void) sang snapshot JSON.
-- Chỉ thay hàm trong một transaction; không xóa bảng hoặc dữ liệu người dùng.
begin;
drop function if exists public.apply_workspace_changes(jsonb, uuid);
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

revoke all on function public.apply_workspace_changes(jsonb, uuid) from public, anon;
grant execute on function public.apply_workspace_changes(jsonb, uuid) to authenticated;
notify pgrst, 'reload schema';
commit;
