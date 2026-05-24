# PartsPro - CODING_STANDARDS.md

## 1. TypeScript

所有文件使用 TypeScript。

禁止：

```txt
any 滥用
未定义 props 类型
隐式 any
```

---

## 2. 命名规范

组件：

```txt
PascalCase
ProductCard.tsx
AdminSidebar.tsx
```

函数：

```txt
camelCase
getProductBySlug
updateOrderStatus
```

文件：

```txt
kebab-case
product-card.tsx
admin-sidebar.tsx
```

---

## 3. Server / Client Component

默认使用 Server Component。

只有以下情况使用 Client Component：

```txt
useState
useEffect
事件处理
Form
Dialog
Drawer
Toast
Animation
```

---

## 4. Supabase Client

路径：

```txt
src/lib/supabase/server.ts
src/lib/supabase/browser.ts
src/lib/supabase/admin.ts
```

规则：

- browser client 不包含 service role。
- admin client 只能 server side 使用。
- server actions 使用 server client。

---

## 5. 表单规范

统一：

```txt
React Hook Form
+
Zod
```

路径：

```txt
src/lib/validations/
```

---

## 6. 表格规范

统一：

```txt
TanStack Table
```

要求：

- pagination
- sorting
- filtering
- loading state
- empty state
- bulk actions

---

## 7. Toast 规范

所有 mutation 必须 Toast：

```txt
create
update
delete
add to cart
login
logout
submit
```

---

## 8. i18n 规范

所有文案放在：

```txt
src/messages/it.json
src/messages/en.json
src/messages/zh.json
```

禁止组件内写死大段文案。

---

## 9. Build 规范

每次任务结束必须运行：

```bash
npm run lint
npm run build
```
