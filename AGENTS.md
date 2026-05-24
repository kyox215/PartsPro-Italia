# PartsPro - AGENTS.md

## 项目简介

PartsPro 是一个基于 Next.js 16 + Supabase 构建的现代化手机维修配件 B2B/B2C 平台。

- 默认语言：意大利语
- 支持语言：意大利语 / 英语 / 中文
- 部署方式：GitHub → Vercel 自动部署
- 数据库与认证：Supabase
- 目标市场：意大利 + 欧盟
- 项目定位：手机维修配件 B2B/B2C 采购平台

---

## 技术栈

- Next.js 16
- TypeScript
- TailwindCSS
- shadcn/ui
- Radix UI
- Supabase
- TanStack Table
- React Hook Form
- Zod
- Framer Motion
- Lucide React

---

## UI 设计规范

### UI 风格

```txt
Modern SaaS
+
Apple Clean
+
High Density ERP
+
Flat Design
+
Gradient Accent
+
Mobile Dense Commerce
```

### UI 关键词

```txt
Modern
Dense
Compact
Flat
Fast
Professional
Micro Interaction
B2B Procurement
```

### UI 核心规则

1. 所有 UI 必须高密度化，尤其移动端。
2. 移动端优先显示 SKU、库存、价格、质量等级。
3. 所有关键操作必须有 Toast 反馈。
4. 所有关键操作必须带微交互。
5. 所有页面必须支持 Skeleton Loading。
6. Dashboard 使用现代 SaaS 风格。
7. 后台 Table 使用高密度 ERP 风格。
8. Sidebar 使用现代 CRM Dashboard 风格。
9. Mobile 使用 Bottom Navigation + Drawer。
10. 所有 Icon 使用 Lucide React。
11. 禁止使用未批准的重型 UI 框架。
12. 禁止 Bootstrap、DaisyUI、jQuery UI。

---

## 配色规则

### 主色

```txt
Primary: #6366F1
Primary Hover: #4F46E5
Purple: #8B5CF6
Info Blue: #3B82F6
Cyan: #06B6D4
```

### 中性色

```txt
Background: #F8FAFC
Card: #FFFFFF
Border: #E5E7EB
Divider: #EEF2F7
Text Primary: #111827
Text Secondary: #6B7280
Text Light: #9CA3AF
```

### 状态色

```txt
Success: #22C55E
Warning: #F59E0B
Danger: #EF4444
Info: #3B82F6
```

---

## 动效系统

统一规则：

```txt
150ms-250ms
轻量级
微动效
性能优先
```

必须支持：

```txt
Hover
Pressed
Loading
Skeleton
Toast
Smooth Transition
Drawer Animation
Add To Cart Feedback
```

---

## 开发规则

1. 不要一次性开发整个系统。
2. 每次只完成一个明确模块。
3. 所有代码必须使用 TypeScript。
4. 所有 UI 必须基于 shadcn/ui + TailwindCSS。
5. 所有表单必须使用 React Hook Form + Zod。
6. 所有表格必须使用 TanStack Table。
7. 所有页面必须支持 it/en/zh。
8. Mobile First。
9. 所有页面必须响应式。
10. 所有组件必须可复用。
11. 完成后必须运行：

```bash
npm run lint
npm run build
```

---

## Supabase 规则

- 区分 browser client 和 server client。
- 所有 admin 页面必须做权限保护。
- 使用 RLS。
- 不允许把 service role 暴露到前端。
- 所有 uploads 使用 Supabase Storage。
- 所有数据库 schema 必须通过 migration 管理。
- 所有生产环境密钥必须配置在 Vercel Environment Variables。

---

## Git 规则

提交格式：

```txt
feat:
fix:
refactor:
ui:
chore:
docs:
db:
```

禁止：

```txt
直接 push 未测试代码
直接 commit build 错误代码
把 .env.local 提交到仓库
把 service role key 写进前端
```

---

## MVP 模块

### Frontend

- 首页
- 搜索
- 商品列表
- 商品详情
- 分类页
- 品牌页
- 购物车
- B2B 注册

### Admin

- Dashboard
- 商品管理
- 库存管理
- 订单管理
- 客户管理
- Analytics

---

## 本地管理员

```txt
email: kyox120@gmail.com
password: admin
role: admin
```

注意：仅用于本地开发测试。上线前必须修改。
