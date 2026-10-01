import { defineApp } from '@mohou/contract'

type TodoItem = { id: string; title: string; done: boolean; createdAt: number }
type Filter = 'all' | 'active' | 'done'

function uid() {
  return 't_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// ⭐ key: local data uses ctx.storage.kv() (get/set/delete/clear). Growing records use their own keys, or schema SQL.
async function loadItems(ctx): Promise<TodoItem[]> {
  const items = await ctx.storage.kv().get('items')
  return Array.isArray(items) ? items : []
}
async function saveItems(ctx, items: TodoItem[]) {
  await ctx.storage.kv().set('items', items)
}
function statsOf(items: TodoItem[]) {
  const done = items.filter(i => i.done).length
  return { total: items.length, active: items.length - done, done }
}

export default defineApp({
  name: '今日待办',
  description: '打开就看见我的一屏：本地事项 + 筛选 + 归档',
  api: {
    async list(ctx, args?: { filter?: Filter }) {
      const all = await loadItems(ctx)
      return {
        items: args?.filter === 'active' ? all.filter(i => !i.done) : args?.filter === 'done' ? all.filter(i => i.done) : all,
        stats: statsOf(all),
      }
    },
    async add(ctx, args?: { title?: string }) {
      const title = (args?.title ?? '').trim()
      if (!title) throw new Error('请填写标题')
      const items = await loadItems(ctx)
      const item: TodoItem = { id: uid(), title, done: false, createdAt: Date.now() }
      items.unshift(item)
      await saveItems(ctx, items)
      return item
    },
    async toggle(ctx, args?: { id?: string }) {
      const id = args?.id
      if (!id) throw new Error('缺少 id')
      const items = await loadItems(ctx)
      if (!items.some(item => item.id === id)) throw new Error('任务不存在')
      const next = items.map(item => (item.id === id ? { ...item, done: !item.done } : item))
      await saveItems(ctx, next)
      return next.find(it => it.id === id)
    },
    async remove(ctx, args?: { id?: string }) {
      const items = await loadItems(ctx)
      const next = items.filter(it => it.id !== args?.id)
      if (next.length === items.length) throw new Error('任务不存在')
      await saveItems(ctx, next)
      return { ok: true }
    },
    async clearDone(ctx) {
      const items = await loadItems(ctx)
      await saveItems(ctx, items.filter(i => !i.done))
      return { ok: true }
    },
    // ⭐ key: archive lives under its own kv key so the live list rewrite does not carry the archive.
    async archive(ctx) {
      const items = await loadItems(ctx)
      const done = items.filter(i => i.done)
      if (!done.length) return { ok: true, archived: 0 }
      const prev = await ctx.storage.kv().get('done')
      const archived = Array.isArray(prev) ? prev : []
      await ctx.storage.kv().set('done', [...archived, ...done])
      await saveItems(ctx, items.filter(i => !i.done))
      return { ok: true, archived: done.length }
    },
  },
})
