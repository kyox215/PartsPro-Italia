# PartsPro 项目总规划（2026 重构版）

## 项目基础信息

| 项目 | 内容 |
|---|---|
| 项目名称 | PartsPro |
| 域名 | partspro.app |
| 默认语言 | 意大利语（IT） |
| 支持语言 | 意大利语 / 英语 / 中文 |
| 项目定位 | 手机维修配件 B2B / B2C 采购平台 |
| 核心市场 | 意大利 + 欧盟 |
| 部署方式 | GitHub → Vercel 自动部署 |
| 数据库 | Supabase |
| 前端框架 | Next.js 16 |
| UI系统 | TailwindCSS + shadcn/ui + Radix UI |
| 后台表格 | TanStack Table |
| 表单系统 | React Hook Form + Zod |
| 动画系统 | Framer Motion |
| 开发模式 | Codex + 多 Agent 协同开发 |

---

# 一、项目目标

PartsPro 不是普通商城，而是：

> 面向手机维修店、翻新商、批发商和维修行业客户的专业配件采购平台。

核心目标：

- 快速搜索配件
- SKU 和兼容性准确
- B2B价格体系
- 高效后台管理
- 库存可追踪
- RMA售后流程
- 多语言支持
- 可扩展 ERP 化

---

# 二、MVP 第一阶段范围

## 前台（必须完成）

### 首页

- Hero 介绍
- 搜索框
- 品牌入口
- 配件分类入口
- 热门产品
- B2B 注册入口
- 配送/RMA说明

### 商城

- 商品列表页
- 商品详情页
- 搜索页
- 分类页
- 品牌页
- 本地购物车
- 登录/注册

### B2B

- B2B 注册入口
- 客户登录
- 客户账户中心基础版

---

## 后台（必须完成）

### Dashboard

- 今日订单
- 销售统计
- 库存提醒
- 客户统计

### 商品管理

- 商品 CRUD
- SKU 管理
- 分类管理
- 品牌管理
- 图片上传

### 库存管理

- 实时库存
- 库存调整
- 库存状态
- SKU库存

### 订单管理

- 订单列表
- 订单详情
- 状态修改
- 发货状态

### 客户管理

- 客户列表
- B2B客户
- 客户等级
- 订单历史

---

# 三、技术架构

## 核心技术栈

```txt
Next.js 16
TypeScript
TailwindCSS
shadcn/ui
Radix UI
Supabase
TanStack Table
React Hook Form
Zod
Framer Motion
```

---

## 部署架构

```txt
本地开发
↓
GitHub
↓
Vercel 自动部署
↓
Supabase 数据库/Auth/Storage
```

---

# 四、UI 设计系统（2026 Modern SaaS Edition）

PartsPro UI 最终风格：

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

核心关键词：

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

## UI 核心规则

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

## 颜色系统

| 类型 | HEX | 用途 |
|---|---|---|
| Primary | #6366F1 | 主按钮 |
| Primary Hover | #4F46E5 | hover |
| Purple | #8B5CF6 | 渐变强调 |
| Info Blue | #3B82F6 | 信息 |
| Background | #F8FAFC | 页面背景 |
| Card | #FFFFFF | 卡片 |
| Border | #E5E7EB | 边框 |
| Text Primary | #111827 | 主文字 |
| Text Secondary | #6B7280 | 副文字 |

## 渐变系统

```css
--gradient-primary: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
--gradient-blue: linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%);
--gradient-success: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
--gradient-warning: linear-gradient(135deg, #F59E0B 0%, #FB923C 100%);
--gradient-danger: linear-gradient(135deg, #EF4444 0%, #F87171 100%);
```

## 必备组件

```txt
Button
Input
Badge
Card
Toast
Dialog
Drawer
Sidebar
MobileBottomNav
DenseTable
Skeleton
EmptyState
ProductCompactCard
StockBadge
QualityBadge
OrderStatusBadge
```

---

# 五、数据库结构（MVP）

## 必要数据表

```txt
profiles
customers
brands
categories
products
product_skus
inventory
orders
order_items
```

---

## 商品结构（推荐方案）

```txt
Product
↓
SKU Variants
↓
Inventory
```

示例：

```txt
iPhone 11 Display
├── Soft OLED Black
├── Hard OLED Black
├── TFT Black
└── With Frame Version
```

---

# 六、项目目录结构

```txt
partspro/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── page.tsx
│   │   │   ├── products/
│   │   │   ├── product/[slug]/
│   │   │   ├── account/
│   │   │   ├── b2b/
│   │   │   └── admin/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── product/
│   │   ├── admin/
│   │   └── forms/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── validations/
│   │   └── utils.ts
│   ├── messages/
│   │   ├── it.json
│   │   ├── en.json
│   │   └── zh.json
│   ├── types/
│   └── styles/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── AGENTS.md
├── TASKS.md
├── PROJECT_PLAN.md
└── README.md
```

---

# 七、Codex 开发规则

## 总开发规则

```txt
1. 不要一次性开发整个系统。
2. 每次只完成一个明确模块。
3. 所有代码必须使用 TypeScript。
4. 所有 UI 必须基于 shadcn/ui。
5. 所有表单必须使用 React Hook Form + Zod。
6. 后台表格使用 TanStack Table。
7. 移动端优先。
8. 后台优先桌面端。
9. 所有页面必须考虑三语言结构。
10. 完成后必须运行 lint 和 build。
```

---

# 八、Codex 初始任务列表

# TASK 01：初始化项目

## 目标

创建完整项目框架。

## 任务

```txt
1. 创建 Next.js 16 项目
2. 配置 TypeScript
3. 配置 TailwindCSS
4. 初始化 shadcn/ui
5. 配置 Supabase
6. 安装 TanStack Table
7. 安装 React Hook Form
8. 安装 Zod
9. 安装 Framer Motion
10. 创建目录结构
11. 创建多语言结构
12. 创建 README.md
13. 创建 .env.example
14. 配置 ESLint
15. 配置 Prettier
```

---

# TASK 02：创建 Design System

## 目标

创建统一 UI 系统。

## 任务

```txt
1. 创建颜色系统
2. 创建 Typography
3. 创建 Button
4. 创建 Input
5. 创建 Card
6. 创建 Badge
7. 创建 Modal
8. 创建 Drawer
9. 创建 Table
10. 创建 EmptyState
11. 创建 LoadingState
12. 创建 Toast
```

---

# TASK 03：Supabase 数据库

## 目标

完成数据库基础结构。

## 任务

```txt
1. 创建 products 表
2. 创建 product_skus 表
3. 创建 inventory 表
4. 创建 customers 表
5. 创建 orders 表
6. 创建 order_items 表
7. 创建 categories 表
8. 创建 brands 表
9. 创建 RLS
10. 创建 seed.sql
```

---

# TASK 04：认证系统

## 目标

完成管理员和用户认证。

## 任务

```txt
1. 配置 Supabase Auth
2. 创建角色系统
3. 创建 admin middleware
4. 创建登录页面
5. 创建注册页面
6. 创建 session 管理
7. 创建管理员保护路由
```

---

# TASK 05：前台首页

## 目标

完成首页 MVP。

## 页面模块

```txt
1. Hero
2. 大搜索框
3. 品牌入口
4. 分类入口
5. 热门商品
6. B2B入口
7. 发货说明
8. Footer
```

---

# TASK 06：商城系统

## 目标

完成商品浏览流程。

## 页面

```txt
/products
/product/[slug]
/search
/categories
/brands
```

## 功能

```txt
搜索
筛选
库存显示
SKU显示
购物车
```

---

# TASK 07：后台系统

## 目标

完成后台基础 CRUD。

## 页面

```txt
/admin
/admin/products
/admin/orders
/admin/customers
/admin/inventory
```

---

# 九、项目 Agent 系统

# Agent 01：Lead Architect Agent

## 职责

```txt
负责整体架构
目录结构
技术规范
开发顺序
```

---

# Agent 02：Frontend UI Agent

## 职责

```txt
负责前台页面
首页
商城
响应式
动画
UI一致性
```

---

# Agent 03：Admin Dashboard Agent

## 职责

```txt
负责后台系统
高密度表格
Dashboard
CRUD页面
```

---

# Agent 04：Supabase Agent

## 职责

```txt
数据库结构
RLS
Auth
Storage
Supabase Client
```

---

# Agent 05：Table System Agent

## 职责

```txt
TanStack Table
分页
筛选
排序
批量操作
```

---

# Agent 06：Form Validation Agent

## 职责

```txt
React Hook Form
Zod
表单验证
错误处理
```

---

# Agent 07：Motion Agent

## 职责

```txt
Framer Motion
页面动画
卡片动画
过渡效果
```

---

# Agent 08：i18n Agent

## 职责

```txt
三语言系统
翻译结构
语言切换
```

---

# Agent 09：QA Agent

## 职责

```txt
lint
build
类型检查
响应式检查
组件复用检查
```

---

# 十、AGENTS.md 建议内容

```txt
本项目为：PartsPro。

技术栈：
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

开发规则：
1. 不要一次性重构整个项目。
2. 每次只完成一个明确模块。
3. 所有代码必须使用 TypeScript。
4. 所有 UI 必须基于 shadcn/ui。
5. 不允许使用 Bootstrap。
6. 不允许使用 未批准的重型 UI 框架。
7. 所有表单必须使用 React Hook Form + Zod。
8. 后台表格必须使用 TanStack Table。
9. 所有页面必须支持 it/en/zh 三语言。
10. 所有页面必须考虑移动端。
11. 完成后必须运行 lint、typecheck、build。
12. push 前检查代码质量。
```

---

# 十一、环境变量规划

## .env.example

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

# 十二、本地测试管理员

## 本地开发管理员

```txt
email: kyox120@gmail.com
password: admin
role: admin
```

注意：

```txt
仅用于本地开发。
上线前必须修改。
```

---

# 十三、下一阶段规划

MVP 稳定后再增加：

```txt
RMA系统
B2B价格系统
阶梯价
Excel批量下单
多仓库
供应商系统
发票系统
物流系统
AI客服
高级搜索
ERP扩展
```

---

# 十四、最终开发目标

PartsPro 最终目标：

> 建立一个专业、现代、可扩展的欧洲手机维修配件 B2B 平台。

核心特点：

```txt
专业 UI
强搜索
SKU体系
高性能
高扩展性
B2B友好
后台强管理
移动端优先
GitHub + Vercel 自动化部署
Supabase 一体化后端
```

---

# 十五、AGENTS.md（完整版本）

```md
# PartsPro - AGENTS.md

## 项目简介

PartsPro 是一个基于 Next.js 16 + Supabase 构建的手机维修配件 B2B/B2C 平台。

默认语言：意大利语。
支持：意大利语 / 英语 / 中文。

部署方式：
GitHub → Vercel 自动部署。

数据库与认证：
Supabase。

---

# 技术栈

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

---

# UI规则

设计风格：
Apple Clean + Mobilax B2B。

UI要求：
- 深蓝黑导航
- 白色卡片
- 浅灰背景
- 科技蓝主按钮
- 绿色库存标签
- 橙色警告
- 红色错误
- 圆角12px
- 轻阴影

禁止：
- Bootstrap
- jQuery UI
- 未批准的重型 UI 框架
- DaisyUI

---

# 开发规则

1. 不要一次性开发整个系统。
2. 每次只完成一个明确模块。
3. 所有代码必须使用 TypeScript。
4. 所有 UI 必须基于 shadcn/ui。
5. 表单必须使用 React Hook Form + Zod。
6. 后台表格必须使用 TanStack Table。
7. 所有页面必须支持 it/en/zh 三语言。
8. 移动端优先。
9. 后台优先桌面端。
10. 完成后必须运行：
   - npm run lint
   - npm run build

---

# Supabase规则

- 区分 browser client 和 server client。
- 所有 admin 页面必须做权限保护。
- 使用 RLS。
- 不允许把 service role 暴露到前端。

---

# Git规则

提交格式：

feat:
fix:
refactor:
ui:
chore:

禁止直接 push 未测试代码。

---

# MVP模块

前台：
- 首页
- 商品列表
- 商品详情
- 搜索
- 分类
- 购物车
- B2B注册

后台：
- Dashboard
- 商品管理
- 库存管理
- 订单管理
- 客户管理

---

# 本地管理员

email: kyox120@gmail.com
password: admin

注意：
仅用于本地开发测试。
上线前必须修改。
```

---

# 十六、PROJECT_PLAN.md（完整版本）

```md
# PartsPro - PROJECT_PLAN.md

## Phase 01 - 项目初始化

目标：
搭建完整开发框架。

任务：
- 初始化 Next.js 16
- 配置 TailwindCSS
- 初始化 shadcn/ui
- 配置 Supabase
- 配置 TypeScript
- 安装 TanStack Table
- 安装 React Hook Form
- 安装 Zod
- 安装 Framer Motion
- 创建基础目录结构
- 配置 i18n
- 配置 ESLint
- 配置 Prettier

---

## Phase 02 - Design System

目标：
建立统一 UI 系统。

模块：
- Colors
- Typography
- Buttons
- Inputs
- Cards
- Badges
- Tables
- Drawers
- Dialogs
- Empty States
- Loading States

---

## Phase 03 - 数据库结构

目标：
完成 Supabase 数据库。

数据表：
- profiles
- customers
- brands
- categories
- products
- product_skus
- inventory
- orders
- order_items

---

## Phase 04 - 认证系统

目标：
完成登录与角色系统。

模块：
- Supabase Auth
- Admin Route Protection
- Session Management
- Login
- Register
- Role System

---

## Phase 05 - 前台商城

页面：
- 首页
- 分类页
- 搜索页
- 商品详情页
- 品牌页
- B2B注册页

功能：
- 搜索
- SKU展示
- 库存显示
- 分类筛选
- 本地购物车

---

## Phase 06 - 后台系统

页面：
- /admin
- /admin/products
- /admin/orders
- /admin/customers
- /admin/inventory

功能：
- CRUD
- 表格筛选
- 状态修改
- Dashboard
- 商品图片上传

---

## Phase 07 - 部署与优化

任务：
- GitHub Actions
- Vercel 自动部署
- SEO
- 性能优化
- 图片优化
- Loading优化
- Skeleton UI
- Metadata

---

## 后续扩展

- RMA系统
- B2B价格体系
- 阶梯价
- Excel批量下单
- 多仓库
- 供应商系统
- 发票系统
- API系统
- ERP扩展
```

---

# 十七、TASKS.md（完整版本）

```md
# PartsPro - TASKS.md

# TASK 01 - 初始化项目

目标：
创建项目基础结构。

任务：
- 创建 Next.js 16 项目
- 配置 TailwindCSS
- 初始化 shadcn/ui
- 安装 Supabase
- 安装 TanStack Table
- 安装 React Hook Form
- 安装 Zod
- 安装 Framer Motion
- 创建目录结构
- 创建 README.md
- 创建 .env.example

验收：
- npm run lint 通过
- npm run build 通过

---

# TASK 02 - 创建 Design System

目标：
建立 UI 基础组件。

任务：
- Button
- Card
- Badge
- Input
- Table
- Drawer
- Dialog
- EmptyState
- LoadingState
- Toast

验收：
- 支持深色/浅色
- 响应式正常
- 组件可复用

---

# TASK 03 - 创建数据库

目标：
完成 Supabase Schema。

任务：
- 创建 products
- 创建 product_skus
- 创建 inventory
- 创建 orders
- 创建 order_items
- 创建 categories
- 创建 brands
- 创建 customers

验收：
- migration 可执行
- seed.sql 可运行

---

# TASK 04 - 认证系统

目标：
完成 Auth。

任务：
- Login
- Register
- Session
- Role
- Admin Middleware

验收：
- admin 页面受保护
- 登录后 session 正常

---

# TASK 05 - 首页 UI

目标：
完成首页。

模块：
- Hero
- 搜索框
- 品牌入口
- 分类入口
- 热门商品
- Footer

验收：
- 移动端正常
- Lighthouse > 80

---

# TASK 06 - 商品系统

目标：
完成商城浏览流程。

页面：
- /products
- /product/[slug]
- /search

功能：
- 搜索
- SKU显示
- 库存显示
- 分类筛选
- 本地购物车

验收：
- 商品可正常浏览
- 搜索可用
- 响应式正常

---

# TASK 07 - 后台 Dashboard

目标：
完成后台。

页面：
- /admin
- /admin/products
- /admin/orders
- /admin/customers
- /admin/inventory

功能：
- CRUD
- 表格
- 分页
- 筛选
- 状态修改

验收：
- TanStack Table 正常
- Admin 权限正常

---

# TASK 08 - GitHub + Vercel 部署

目标：
完成部署。

任务：
- GitHub Repo
- Vercel Deploy
- Supabase ENV
- Domain Connect
- Production ENV

验收：
- push 自动部署
- production 正常访问
```

---

# 附录：新增项目文档索引

- `AGENTS.md`
- `PROJECT_PLAN.md`
- `TASKS.md`
- `DESIGN_TOKENS.md`
- `COMPONENTS.md`
- `DATABASE_SCHEMA.md`
- `ROLES_AND_PERMISSIONS.md`
- `UI_ACCEPTANCE_CHECKLIST.md`
- `SEED_DATA.md`
- `SECURITY.md`
- `CODING_STANDARDS.md`
- `CODEX_START_PROMPT.md`

以上文件已作为独立 Markdown 文件生成，可直接复制到项目根目录。
