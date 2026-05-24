# PartsPro - PROJECT_PLAN.md

## 项目目标

PartsPro 是一个面向意大利手机维修行业的现代 B2B/B2C 手机维修配件采购平台。

项目重点：

- SKU 精准管理
- 高密度商品展示
- 快速搜索
- 库存管理
- B2B 客户管理
- 后台订单/商品/客户/库存管理
- GitHub → Vercel 自动部署
- Supabase 数据库/Auth/Storage

---

## 当前总进度

- PHASE 01 项目初始化：已完成。
- PHASE 02 Modern Design System：已完成基础 UI 框架。
- PHASE 03 Supabase 数据库结构：已完成初始 schema、seed、RLS、索引和类型文件；需要在 Docker/Supabase local 可用后执行数据库级验证。
- PHASE 04 Auth 与权限系统：已完成 Auth UI、server actions、session helper、Proxy 和后台保护占位；需要连接 Supabase 环境后复验登录/注册/角色流。
- PHASE 05 Frontend 商城：首页与商品浏览流程已完成静态版本；包含商品列表、搜索结果、分类页、品牌页、详情页、本地购物车 Drawer、Toast 与 Skeleton。
- PHASE 06 Admin Dashboard：已完成静态运营后台；包含受保护 Admin Shell、KPI、图表、Products/Orders/Customers/Inventory 表格、筛选、排序、分页、批量操作、确认弹窗和 Toast。
- PHASE 07 微交互与动画：已完成页面入场、Toast、Drawer、购物车列表、加购反馈、数量反馈、Skeleton shimmer、按钮 pressed 状态和 reduced-motion 保护。
- PHASE 08 部署与优化：已完成部署准备、CI、metadata、sitemap、robots 与 ENV 清单；实际 GitHub/Vercel 线上发布待账号授权和 remote 绑定。
- PHASE 09 UI 验收修复：已完成 360px 前台核心路由无横向溢出、移动商品卡密度、Toast 避让、购物车 Drawer、admin 权限跳转和 Lighthouse Performance 90 验证。
- 本地 Git 基线：已完成提交前安全检查，153 个文件已 staged；等待配置 Git identity 后创建 baseline commit。

---

# PHASE 01 - 项目初始化

目标：搭建完整现代化开发框架。

任务：

- 初始化 Next.js 16
- 配置 TypeScript
- 配置 TailwindCSS
- 初始化 shadcn/ui
- 配置 Supabase
- 安装 TanStack Table
- 安装 React Hook Form + Zod
- 安装 Framer Motion
- 安装 Lucide React
- 创建 i18n 结构
- 创建目录结构
- 配置 ESLint
- 配置 Prettier
- 创建 `.env.example`

验收：

```bash
npm run lint
npm run build
```

---

# PHASE 02 - Modern Design System

目标：建立完整现代 SaaS UI 系统。

模块：

```txt
Colors
Typography
Buttons
Inputs
Cards
Badges
Toast
Dialogs
Drawers
Sidebar
Bottom Navigation
Tables
Charts
Skeletons
Loading States
Empty States
```

要求：

```txt
高密度
现代化
移动端优先
扁平化
轻渐变
微交互
纯图标
```

交付物：

- `DESIGN_TOKENS.md`
- `COMPONENTS.md`
- Tailwind tokens
- 基础 UI 组件
- 业务 UI 组件

---

# PHASE 03 - Supabase 数据库结构

目标：完成 Supabase Schema。

核心表：

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

要求：

```txt
RLS
Indexes
Foreign Keys
Seed Data
Storage Buckets
```

交付物：

- `DATABASE_SCHEMA.md`
- Supabase migration
- seed.sql
- generated TypeScript types

---

# PHASE 04 - Auth 与权限系统

目标：完成登录、角色和后台保护。

模块：

```txt
Supabase Auth
Session Management
Role System
Admin Middleware
Protected Routes
B2B Customer Status
```

角色：

```txt
admin
manager
staff
warehouse
customer
b2b_customer
```

交付物：

- `ROLES_AND_PERMISSIONS.md`
- admin protected routes
- local seed admin

---

# PHASE 05 - Frontend 商城

页面：

```txt
首页
分类页
搜索页
商品详情页
品牌页
购物车
B2B注册页
```

功能：

```txt
SKU搜索
分类筛选
库存显示
快速加购
高密度商品卡
Toast提示
移动端 Bottom Nav
移动端 Drawer
```

---

# PHASE 06 - Admin Dashboard

页面：

```txt
/admin
/admin/products
/admin/orders
/admin/customers
/admin/inventory
/admin/analytics
```

功能：

```txt
CRUD
Dense Table
Charts
Dashboard KPI
Filter
Pagination
Bulk Actions
Status Badges
Confirm Dialog
Toast Feedback
```

---

# PHASE 07 - 微交互与动画

目标：增强现代感，但不牺牲性能。

模块：

```txt
Button Hover
Add To Cart Animation
Skeleton Loading
Page Transition
Toast Animation
Drawer Animation
Swipe Actions
Quantity Stepper Animation
```

规则：

```txt
150ms-250ms
使用 Framer Motion
避免复杂大动画
```

---

# PHASE 08 - 部署与优化

任务：

```txt
GitHub Repo
Vercel Auto Deploy
Supabase ENV
SEO
Image Optimization
Performance Optimization
Metadata
Sitemap
Robots
```

验收：

```txt
push 自动部署
production 正常访问
Lighthouse Performance > 85
```

当前状态：

```txt
部署配置已完成
本地 lint/build 已通过
GitHub remote 尚未绑定
Vercel production deploy 需要账号授权
Supabase Production ENV 需要填入真实项目值
```

---

# 后续扩展

```txt
RMA系统
B2B价格体系
阶梯价
Excel批量下单
多仓库
供应商系统
物流系统
发票系统
AI客服
ERP扩展
```
