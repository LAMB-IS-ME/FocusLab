import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { createDemoData, emptyData } from '../data/demo'
import { dataSchema } from './storage'
import { diffData } from '../services/workspace'

const alice = '00000000-0000-4000-8000-000000000001'
const bob = '00000000-0000-4000-8000-000000000002'
const db = new PGlite()
const tables = [
  'profiles',
  'user_settings',
  'subjects',
  'tasks',
  'notes',
  'calendar_events',
  'focus_sessions',
]
async function login(userId: string) {
  await db.exec('reset role; set role authenticated;')
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId])
}
async function snapshot() {
  const result = await db.query<{ data: unknown }>('select public.get_workspace() as data')
  return dataSchema.parse({ ...emptyData(), ...(result.rows[0].data as object) })
}

beforeAll(async () => {
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to authenticated, anon;
    grant execute on function auth.uid() to authenticated, anon;
  `)
  await db.exec(await readFile('supabase/migrations/001_initial_schema.sql', 'utf8'))
  await db.query('insert into auth.users(id) values ($1), ($2)', [alice, bob])
}, 30000)
afterAll(async () => {
  await db.close()
})

describe.sequential('PostgreSQL: schema, giao dịch và RLS', () => {
  it('trigger tạo profile và settings, tài khoản mới không có dữ liệu mẫu', async () => {
    await login(alice)
    expect((await snapshot()).tasks).toHaveLength(0)
    expect((await snapshot()).settings.focus).toBe(25)
    expect((await db.query('select * from public.profiles')).rows).toHaveLength(1)
  })

  it('lưu và đọc đủ entity, retry không nhân đôi phiên', async () => {
    const demo = createDemoData()
    const changes = diffData(emptyData(), demo)
    const saved = await db.query<{ data: { tasks: unknown[] } }>(
      'select public.apply_workspace_changes($1::jsonb, $2) as data',
      [JSON.stringify(changes), alice],
    )
    expect(saved.rows[0].data.tasks).toHaveLength(demo.tasks.length)
    await db.query('select public.apply_workspace_changes($1::jsonb, $2)', [
      JSON.stringify(changes),
      alice,
    ])
    const data = await snapshot()
    for (const key of ['tasks', 'subjects', 'notes', 'events', 'sessions'] as const)
      expect(data[key]).toHaveLength(demo[key].length)
    expect(data.tasks.find((task) => task.id === 't2')?.subjectId).toBe('math')
  })

  it('nâng cấp RPC cũ không mất dữ liệu và trả snapshot mới', async () => {
    const before = await snapshot()
    await db.exec(`
      reset role;
      drop function public.apply_workspace_changes(jsonb, uuid);
      create function public.apply_workspace_changes(changes jsonb, expected_user_id uuid)
      returns void language plpgsql as $$ begin return; end; $$;
    `)
    await db.exec(await readFile('supabase/migrations/002_sync_snapshot.sql', 'utf8'))
    await login(alice)
    const result = await db.query<{ data: unknown }>(
      'select public.apply_workspace_changes($1::jsonb, $2) as data',
      ['{}', alice],
    )
    const after = dataSchema.parse({ ...emptyData(), ...(result.rows[0].data as object) })
    expect(after.tasks).toEqual(before.tasks)
    expect(after.notes).toEqual(before.notes)
    expect(after.sessions).toEqual(before.sessions)
  })

  it('B không đọc, sửa, xóa hoặc giả mạo user_id của A trên mọi bảng', async () => {
    await login(bob)
    for (const table of tables) {
      expect(
        (await db.query(`select * from public.${table} where user_id = $1`, [alice])).rows,
      ).toHaveLength(0)
      expect(
        (
          await db.query(`update public.${table} set user_id = $1 where user_id = $1 returning *`, [
            alice,
          ])
        ).rows,
      ).toHaveLength(0)
      expect(
        (await db.query(`delete from public.${table} where user_id = $1 returning *`, [alice]))
          .rows,
      ).toHaveLength(0)
    }
    const inserts = [
      `insert into public.profiles(user_id) values ('${alice}')`,
      `insert into public.user_settings(user_id) values ('${alice}')`,
      `insert into public.subjects(user_id,id,name,color,icon) values ('${alice}','attack','x','#112233','book')`,
      `insert into public.tasks(user_id,id,title,priority,status) values ('${alice}','attack','x','low','todo')`,
      `insert into public.notes(user_id,id,title) values ('${alice}','attack','x')`,
      `insert into public.calendar_events(user_id,id,title,date) values ('${alice}','attack','x','2026-09-18')`,
      `insert into public.focus_sessions(user_id,id,duration,completed_at) values ('${alice}','attack',25,now())`,
    ]
    for (const sql of inserts) await expect(db.exec(sql)).rejects.toThrow(/row-level security/)
    await expect(
      db.query('update public.profiles set user_id = $1 where user_id = $2', [alice, bob]),
    ).rejects.toThrow(/row-level security/)
    await expect(
      db.query('select public.apply_workspace_changes($1::jsonb, $2)', ['{}', alice]),
    ).rejects.toThrow()
  })

  it('khóa ngoại từ chối liên kết môn/công việc của user khác', async () => {
    await expect(
      db.exec(
        "insert into public.tasks(id,title,priority,status,subject_id) values ('bad','x','low','todo','math')",
      ),
    ).rejects.toThrow(/foreign key/)
    await expect(
      db.exec(
        "insert into public.focus_sessions(id,task_id,duration,completed_at) values ('bad','t2',25,now())",
      ),
    ).rejects.toThrow(/foreign key/)
  })

  it('lỗi một hàng rollback toàn bộ thao tác', async () => {
    const changes = {
      subjects: { upsert: [{ id: 'rollback', name: 'x', color: '#112233', icon: 'book' }] },
      tasks: {
        upsert: [{ id: 'bad', title: 'x', description: '', priority: 'invalid', status: 'todo' }],
      },
    }
    await expect(
      db.query('select public.apply_workspace_changes($1::jsonb, $2)', [
        JSON.stringify(changes),
        bob,
      ]),
    ).rejects.toThrow()
    expect((await snapshot()).subjects).toHaveLength(0)
  })

  it('thêm từ bản sao không ghi đè ID đã có trên cloud', async () => {
    await login(alice)
    const before = await snapshot()
    const original = before.tasks.find((task) => task.id === 't2')!
    const changes = { tasks: { insert: [{ ...original, title: 'Không được ghi đè' }] } }
    await db.query('select public.apply_workspace_changes($1::jsonb, $2)', [
      JSON.stringify(changes),
      alice,
    ])
    expect((await snapshot()).tasks.find((task) => task.id === 't2')?.title).toBe(original.title)
  })

  it('WITH CHECK ngăn chuyển chủ sở hữu trên cả bảy bảng', async () => {
    await login(bob)
    const changes = diffData(emptyData(), createDemoData())
    await db.query('select public.apply_workspace_changes($1::jsonb, $2)', [
      JSON.stringify(changes),
      bob,
    ])
    for (const table of tables) {
      await expect(
        db.query(`update public.${table} set user_id = $1 where user_id = $2`, [alice, bob]),
      ).rejects.toThrow(/row-level security/)
    }
    await expect(db.exec('update public.user_settings set pomodoro_duration = 0')).rejects.toThrow(
      /check constraint/,
    )
    await expect(db.exec('update public.focus_sessions set duration = 181')).rejects.toThrow(
      /check constraint/,
    )
  })

  it('xóa môn/công việc giữ lịch sử, reset không ảnh hưởng tài khoản khác', async () => {
    await login(alice)
    await db.exec(
      "delete from public.subjects where id = 'math'; delete from public.tasks where id = 't1';",
    )
    const data = await snapshot()
    expect(data.tasks.find((t) => t.id === 't2')?.subjectId).toBe('')
    expect(data.sessions.length).toBeGreaterThan(0)
    await login(bob)
    await db.query('select public.reset_workspace($1)', [bob])
    expect((await snapshot()).tasks).toHaveLength(0)
    await login(alice)
    expect((await snapshot()).tasks.length).toBeGreaterThan(0)
    await db.query('select public.reset_workspace($1)', [alice])
    expect((await snapshot()).sessions).toHaveLength(0)
    expect((await snapshot()).settings.focus).toBe(25)
  })

  it('anon không đọc bảng hay thực thi RPC', async () => {
    await db.exec('reset role; set role anon;')
    for (const table of tables)
      await expect(db.exec(`select * from public.${table}`)).rejects.toThrow(/permission denied/)
    await expect(db.exec('select public.get_workspace()')).rejects.toThrow(/permission denied/)
    await expect(
      db.query('select public.apply_workspace_changes($1::jsonb, $2)', ['{}', alice]),
    ).rejects.toThrow(/permission denied/)
    await expect(db.query('select public.reset_workspace($1)', [alice])).rejects.toThrow(
      /permission denied/,
    )
  })
})
