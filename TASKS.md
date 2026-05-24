# PartsPro - TASKS.md

## 当前进度

- TASK 01 初始化项目：已完成。
- TASK 02 Modern Design System：已完成基础组件与设计令牌落地。
- TASK 03 创建数据库：已完成初始 migration、seed、RLS、索引与 TypeScript 类型；本地数据库 lint/reset 需等待 Docker/Supabase local 启动后复验。
- TASK 04 Auth 系统：已完成登录/注册、session helper、Proxy、角色保护和占位受保护路由；需要连接 Supabase 环境后做端到端登录验证。
- TASK 05 Frontend 首页：已完成本地化采购首页、搜索入口、分类入口、热门商品、品牌推荐、B2B CTA、Toast 占位反馈和移动端底部导航。
- TASK 06 商品系统：已完成静态商品目录、SKU 搜索、分类/品牌/质量筛选、商品详情、快速加购、本地购物车 Drawer、Toast 与 Skeleton Loading。
- TASK 07 Admin Dashboard：已完成受保护后台 Shell、KPI、图表、Products/Orders/Customers/Inventory 高密度表格、筛选、排序、分页、批量操作、确认弹窗和 Toast 反馈。
- TASK 08 动效系统：已完成 Framer Motion 页面入场、Toast 动画、Drawer/购物车列表动画、加购反馈、数量反馈、Skeleton shimmer、按钮 pressed 状态和 reduced-motion 保护。
- TASK 09 GitHub + Vercel 部署：已完成部署准备文件、CI、metadata、sitemap、robots 与 ENV 清单；实际 GitHub remote / Vercel production deploy 需要账号授权后执行。
- TASK 10 UI 验收修复：已完成移动端 360px 密度修复、商品列表首屏卡片可见、Toast 避让关键导航、购物车 Drawer 验证、受保护 admin 跳转验证；Lighthouse Performance `/it` 本地生产预览得分 90。
- 本地 Git 基线：已完成提交前安全检查和 baseline 文档，153 个文件已 staged；首个 commit 等待配置 `user.name` / `user.email`。

---

# TASK 01 - 初始化项目

目标：创建现代化项目框架。

任务：

- 创建 Next.js 16 项目
- 配置 TailwindCSS
- 初始化 shadcn/ui
- 配置 Supabase
- 安装 TanStack Table
- 安装 React Hook Form
- 安装 Zod
- 安装 Framer Motion
- 安装 Lucide React
- 创建 i18n
- 创建 README.md
- 创建 .env.example

验收：

```bash
npm run lint
npm run build
```

---

# TASK 02 - 创建 Modern Design System

目标：建立现代 SaaS UI 系统。

组件：

```txt
Buttons
Inputs
Cards
Badges
Toast
Dialog
Drawer
Sidebar
Bottom Navigation
Dense Table
Charts
Skeleton
Loading State
Empty State
```

要求：

```txt
高密度
移动端优先
渐变系统
微交互
Flat Design
纯图标
```

验收：

- 所有组件有 default / hover / disabled / loading 状态。
- Toast 可用于成功、失败、警告、信息。
- Skeleton 用于页面和卡片加载。
- 移动端组件不横向溢出。

---

# TASK 03 - 创建数据库

目标：完成 Supabase Schema。

任务：

```txt
products
product_skus
inventory
orders
order_items
brands
categories
customers
profiles
```

验收：

```txt
Migration 正常
Seed 正常
RLS 正常
FK 正常
Indexes 正常
```

---

# TASK 04 - 创建 Auth 系统

目标：完成认证和权限。

任务：

```txt
Login
Register
Session
Role
Admin Middleware
Protected Routes
```

验收：

```txt
admin 页面受保护
登录后 session 正常
非 admin 无法进入后台
```

---

# TASK 05 - 创建 Frontend 首页

目标：完成现代化首页。

模块：

```txt
Hero
搜索框
分类入口
热门产品
品牌推荐
高密度商品卡
B2B入口
Toast
微交互
```

验收：

```txt
移动端高密度显示
Lighthouse > 85
360px 不横向溢出
```

---

# TASK 06 - 商品系统

目标：完成商城浏览流程。

页面：

```txt
/products
/product/[slug]
/search
/category/[slug]
/brand/[slug]
```

功能：

```txt
SKU搜索
分类筛选
库存显示
快速加购
购物车
Toast 提示
Skeleton Loading
```

验收：

```txt
搜索正常
响应式正常
移动端高密度正常
商品卡显示 SKU / 价格 / 库存 / 质量等级
```

---

# TASK 07 - Admin Dashboard

目标：完成现代 SaaS Dashboard。

页面：

```txt
/admin
/admin/products
/admin/orders
/admin/customers
/admin/inventory
```

功能：

```txt
Dense Table
Charts
KPI Cards
Pagination
Filters
Bulk Actions
Status Badges
Confirm Dialog
Toast Feedback
```

验收：

```txt
TanStack Table 正常
Charts 正常
权限正常
分页/筛选/排序正常
```

---

# TASK 08 - 动效系统

目标：增强现代 UI 体验。

任务：

```txt
Hover
Pressed
Toast Animation
Drawer Animation
Page Transition
Skeleton Loading
Add To Cart Animation
```

验收：

```txt
动画流畅
不影响性能
移动端不卡顿
```

---

# TASK 09 - GitHub + Vercel 部署

目标：完成生产部署。

任务：

```txt
GitHub Repo
Vercel Deploy
Supabase ENV
Domain Connect
Production ENV
```

验收：

```txt
push 自动部署
production 正常访问
env 配置正确
```

当前交付：

```txt
vercel.json
.github/workflows/ci.yml
DEPLOYMENT.md
Metadata
Sitemap
Robots
Supabase ENV checklist
```

待外部授权：

```txt
GitHub remote 创建/绑定
Vercel GitHub import
Vercel production deploy
Custom domain connect
Production ENV values
```

---

# TASK 10 - UI 验收修复

目标：按 UI_ACCEPTANCE_CHECKLIST.md 完成验收。

验收重点：

```txt
移动端 360px
高密度商品卡
Toast
Skeleton
Admin Dense Table
权限
构建通过
```

当前交付：

```txt
移动端商品列表筛选改为横向高密度 chips
移动端商品卡压缩高度并保留 SKU / 价格 / 库存 / 质量等级
Toast 移动端下移到 Header 下方，避免遮挡购物车按钮和底部导航
购物车 Drawer 加购后可立即打开
360px 核心前台路由无横向溢出
admin 未授权访问跳转 login?next=/it/admin
Lighthouse Performance 90
```
