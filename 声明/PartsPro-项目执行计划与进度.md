# PartsPro 项目执行计划与进度

版本：2026-05-22  
执行方式：每个阶段使用一条可复制的 `/goal` 指令推进。  
UI 基准文件：`/Users/kyox215/Documents/partspro/声明/PartsPro-UI设计声明-AntDesignVue.md`

---

## 0. 使用规则

本文件用于持续跟踪 PartsPro 项目的开发进度。

每完成一个阶段，必须做三件事：

1. 将对应阶段状态从 `[ ]` 改为 `[x]`。
2. 在“完成说明”中写清楚本阶段实际完成了什么、改动了哪些核心文件、运行了哪些验证命令。
3. 如果有未完成项或技术债，写入“遗留问题 / 下一步”。

状态定义：

| 状态 | 含义 |
|---|---|
| `[ ]` | 未开始 |
| `[~]` | 进行中 |
| `[x]` | 已完成 |
| `[!]` | 被阻塞，需要用户或外部条件 |

---

## 1. 总体项目路线

PartsPro 第一版采用“意大利完整 MVP”范围：

- Vue3 + Vite + TypeScript + Ant Design Vue + Supabase + Vercel。
- 前台默认意大利语，提供中文切换选项。
- 访客可浏览商品但不能看 B2B 价格。
- 登录客户可看 B2B 价格、阶梯价、加购、结账、订单和 RMA。
- 员工后台处理商品、库存、订单、发货、B2B 审核和 RMA。
- 首版 UI 必须覆盖 VAT/发票字段、法律页、Cookie/GDPR、电池安全和 RMA 入口。

---

## 2. 进度总表

| 阶段 | 状态 | 名称 | 目标 |
|---|---|---|---|
| P0 | [x] | 项目规划与执行文件 | 建立本执行计划、进度规则和 `/goal` 阶段指令 |
| P1 | [x] | 项目脚手架 | 初始化 Vue3/Vite/TS/Ant Design Vue/Supabase 项目 |
| P2 | [x] | 设计系统与基础布局 | 落地主题 token、路由、i18n、Storefront/Admin 布局 |
| P3 | [x] | 公开首页与商品目录 | 完成首页、搜索、分类、商品卡、访客隐藏价格 |
| P4 | [x] | 认证与客户权限 | 邮箱/Google 登录、角色判断、登录后显示客户价格 |
| P5 | [x] | B2B 注册与客户中心 | B2B 申请、公司/VAT/发票字段、客户中心基础页 |
| P6 | [x] | 购物车与结账 | 加购、购物车、结账、支付入口、VAT/配送/条款 |
| P7 | [x] | RMA 与法律页面 | RMA 申请/状态、政策页、Cookie/GDPR、电池安全 |
| P8 | [x] | 员工后台订单与库存 | 后台权限、订单流程、库存、发货扣库存 |
| P9 | [x] | 商品/PIM 与 B2B 审核 | 商品管理、价格组、客户审核、批次/供应商字段 |
| P10 | [~] | 验证、优化与部署准备 | build/test、响应式检查、Vercel/Supabase 配置说明 |

---

## 3. 阶段 `/goal` 指令

### P1 - 项目脚手架

```text
/goal 根据 /Users/kyox215/Documents/partspro/声明/PartsPro-UI设计声明-AntDesignVue.md 初始化 PartsPro 项目脚手架。技术栈必须是 Vue3 + Vite + TypeScript + Ant Design Vue + Supabase。创建 package.json、Vite 配置、TypeScript 配置、src/main.ts、src/App.vue、基础目录结构、环境变量示例和 README。不要使用 Element Plus。完成条件：npm install 可安装依赖，npm run build 通过，首页能显示 PartsPro 基础壳。
```

验收：

- `package.json` 存在并包含 Vue3、Vite、TypeScript、Ant Design Vue、Supabase。
- `src/main.ts` 接入 Ant Design Vue。
- `.env.example` 包含 Supabase 必要变量。
- `npm run build` 通过。

---

### P2 - 设计系统与基础布局

```text
/goal 按 /Users/kyox215/Documents/partspro/声明/PartsPro-UI设计声明-AntDesignVue.md 落地 PartsPro 设计系统和基础布局。实现 Ant Design Vue ConfigProvider 主题 token、意大利语默认 locale、中文切换预留、Vue Router、Pinia、StorefrontLayout、AdminLayout、基础导航、页脚、权限占位和响应式容器。完成条件：/ 和 /admin 基础布局可访问；主题色 #2563EB、深蓝黑导航 #0F172A 生效；移动端 360px 不横向溢出。
```

验收：

- `ConfigProvider` 统一主题。
- `StorefrontLayout` 有顶部通知条、Logo、搜索、账户、语言、购物车、品类导航。
- `AdminLayout` 有侧边栏和顶部栏。
- 路由分前台、客户、后台三类。

---

### P3 - 公开首页与商品目录

```text
/goal 完成 PartsPro 公开首页和商品目录。根据 UI 声明实现首页 Hero、强搜索入口、品牌入口、品类入口、质量等级说明、B2B入口、配送/RMA承诺；实现 /products 商品列表、筛选抽屉/侧栏、商品卡片、商品详情基础页。必须保证未登录访客可以浏览商品，但价格区域只显示 “Accedi per vedere il prezzo B2B / 登录查看批发价”，加购按钮跳转登录。完成条件：/、/products、/products/:skuCode 可访问；访客商品卡和详情页不显示真实价格。
```

验收：

- 首页搜索框首屏明显。
- 商品卡展示图片、SKU、品牌、型号、质量等级、库存状态。
- 未登录价格隐藏。
- 移动端商品列表单列，筛选使用 Drawer 或底部弹层。

---

### P4 - 认证与客户权限

```text
/goal 完成 PartsPro 认证与角色权限。接入 Supabase Auth，支持邮箱登录和 Google 登录，建立 auth store、路由守卫、客户/员工角色判断。登录客户进入商品列表和详情页时显示客户价格占位逻辑；未登录访问 /cart、/checkout、/account 自动跳转 /login；普通 customer 不能进入 /admin。完成条件：登录/退出流程可用，路由权限生效，访客和客户看到不同商品价格状态。
```

验收：

- `/login` 有邮箱和 Google 登录入口。
- 登录状态全站可识别。
- 访客不能进入客户和后台页面。
- 员工角色和客户角色 UI 明确区分。

---

### P5 - B2B 注册与客户中心

```text
/goal 完成 B2B 注册和客户中心基础页。B2B 注册采用 Ant Design Vue Steps + Form，字段包含公司名称、P.IVA、Codice Fiscale、SDI、PEC、注册地址、收货地址、WhatsApp、公司类型、月采购额、感兴趣品类、付款需求和条款确认。客户中心包含订单入口、重复购买、RMA、发票、地址、公司资料、专属价格入口。完成条件：/b2b/register 表单可提交到占位 service；/account 基础页面可访问并符合移动端/桌面端布局。
```

验收：

- B2B 注册桌面左右布局，移动端分步。
- 表单错误提示清楚。
- 营销订阅不默认勾选。
- 客户中心移动端使用入口卡片。

---

### P6 - 购物车与结账

```text
/goal 完成购物车和结账 UI 与服务层。实现 Add to Cart、数量修改、MOQ提示、库存不足提示、购物车摘要、VAT显示、配送方式、Stripe/PayPal/Bonifico Bancario 支付入口、条款/隐私勾选。下单价格必须通过后端 service/RPC 占位重新计算，不允许前端直接信任商品页价格。完成条件：登录客户可从商品页加入购物车，进入 /cart 和 /checkout，提交订单调用 create_order_from_cart 服务占位。
```

验收：

- 访客加购跳转登录。
- 登录客户可加购和修改数量。
- 购物车桌面左列表右摘要，移动端底部固定总价。
- 结账分 4 步：客户、发票、配送、支付确认。

---

### P7 - RMA 与法律页面

```text
/goal 完成 RMA 和法律/政策页面。RMA 申请使用 Steps：选择订单、选择商品、问题类型、问题描述、上传照片/视频、确认规则、提交。实现 RMA 状态流。创建 Termini e Condizioni、Privacy Policy、Cookie Policy、Politica di Reso、Garanzia e RMA、Spedizioni、Pagamenti、Informazioni Legali、Sicurezza Batterie、Qualita dei Ricambi 页面。完成条件：/account/rma 和所有 /legal/* 页面可访问，页脚入口完整。
```

验收：

- RMA 支持照片/视频上传 UI。
- 屏幕和电池有不同风险提示。
- Cookie/GDPR/隐私入口清晰。
- 页脚显示公司信息字段占位。

---

### P8 - 员工后台订单与库存

```text
/goal 完成员工后台订单与库存 MVP。实现 /admin、/admin/orders、/admin/orders/:id、/admin/inventory、/admin/stock-movements。订单按 submitted、accepted、picking、packed、shipped、completed 状态处理；发货必须调用 staff_ship_order service/RPC 占位，UI 不直接修改库存。库存页面展示 actual_qty、locked_qty、available_qty、incoming、QC、RMA、defective、batch、location。完成条件：员工可查看订单、推进状态、查看库存；普通 customer 不能访问后台。
```

验收：

- 后台 Table + Drawer 详情可用。
- 订单状态流用 Steps/Timeline 展示。
- 库存数量和状态用 Tag 区分。
- 发货动作有确认 Modal。

---

### P9 - 商品/PIM 与 B2B 审核

```text
/goal 完成商品/PIM、客户审核和价格组基础后台。实现 /admin/products、/admin/customers、/admin/b2b-approvals、/admin/prices、/admin/batches。商品字段包含 SKU、品牌、型号、型号代码、品类、质量等级、颜色、是否带框、成本、零售价、B2B价格、阶梯价、库存、库位、批次、供应商、质保、重量、电池/危险品、MSDS/UN38.3、兼容型号、替代SKU和加购商品。完成条件：员工可查看和编辑商品基础信息、审核 B2B 申请、维护价格组占位。
```

验收：

- 商品列表信息密度适合后台。
- 编辑用 Drawer/Form。
- B2B 审核状态清楚。
- 价格组和阶梯价有基础 UI。

---

### P10 - 验证、优化与部署准备

```text
/goal 对 PartsPro MVP 做完整验证和部署准备。运行 npm run build、类型检查、关键页面人工检查；补齐 README、.env.example、Vercel 部署说明、Supabase 配置说明。检查 360px、390px、430px、768px、1280px、1440px 响应式规则；检查访客隐藏价格、客户显示价格、员工后台隔离。完成条件：构建通过，关键验收项记录到进度文件，部署前说明完整。
```

验收：

- 构建通过。
- 关键路由可访问。
- 权限视觉状态正确。
- 响应式无明显溢出。
- README 可指导下一位开发者继续。

---

## 4. 当前完成说明

### P0 - 项目规划与执行文件

状态：`[x] 已完成`

完成内容：

- 已读取并整合 UI 声明文件。
- 已确认当前项目目录还没有源码，只有 `声明/PartsPro-UI设计声明-AntDesignVue.md`。
- 已建立本文件作为项目执行路线图和进度追踪文件。
- 已拆分 P1-P10 阶段，并为每个阶段写好可复制的 `/goal` 指令。
- 已明确每个阶段的验收标准，方便每完成一个进度后标记和说明。

验证：

```text
find /Users/kyox215/Documents/partspro -maxdepth 3 -type f
rg -n "^#|^##|完整 MVP|首版实现优先级|最终设计原则|Ant Design Vue|Supabase" /Users/kyox215/Documents/partspro/声明/PartsPro-UI设计声明-AntDesignVue.md
```

遗留问题 / 下一步：

- 下一步从 P1 开始，初始化真实 Vue3 + Vite + TypeScript + Ant Design Vue 项目脚手架。
- P1 可能需要联网安装 npm 依赖；如果沙盒网络受限，需要用户批准网络命令。

---

### P1 - 项目脚手架

状态：`[x] 已完成`

完成内容：

- 已初始化 Vue3 + Vite + TypeScript 项目基础。
- 已接入 Ant Design Vue、`@ant-design/icons-vue`、Pinia、Vue Router、Supabase JS。
- 已创建 `ConfigProvider` 主题壳，使用主色 `#2563EB`、页面背景 `#F8FAFC`、字体和基础组件 token。
- 已创建基础前台布局 `StorefrontLayout`，包含顶部发货提示、Logo、大搜索框、账户、语言切换、购物车和品类导航。
- 已创建基础后台布局 `AdminLayout`，包含深色侧边栏、顶部角色栏和后台首页占位。
- 已创建 Supabase client、环境变量示例、README、Vite/TypeScript 配置。
- 已修复构建中发现的类型问题：Ant Design Vue Layout token、语言切换事件类型、Vite env 类型、图标导入。
- 已启动本地 Vite dev server，并用浏览器验证首页和后台基础页可访问。
- 已修复首屏导航背景被 Ant Design 默认 Header 色覆盖的问题。

改动文件：

- `package.json`
- `package-lock.json`
- `index.html`
- `.env.example`
- `README.md`
- `vite.config.ts`
- `tsconfig.json`
- `tsconfig.node.json`
- `src/main.ts`
- `src/App.vue`
- `src/router/index.ts`
- `src/lib/supabase.ts`
- `src/stores/ui.store.ts`
- `src/layouts/StorefrontLayout.vue`
- `src/layouts/AdminLayout.vue`
- `src/pages/storefront/HomePage.vue`
- `src/pages/admin/AdminDashboardPage.vue`
- `src/styles/base.css`
- `src/vite-env.d.ts`
- `声明/partspro-home-preview.png`

验证：

```text
npm install --foreground-scripts
npm run build
浏览器打开 http://127.0.0.1:5173/
浏览器打开 http://127.0.0.1:5173/admin
```

验证结果：

- `npm install` 完成，发现 0 个漏洞。
- `npm run build` 通过。
- Vite 输出 `dist/` 构建产物。
- 首页浏览器验证通过：标题、搜索、中文切换、登录看价提示均存在。
- 后台浏览器验证通过：`/admin` 显示后台标题、订单指标和库存入口。
- 构建有一个 chunk size 提醒：当前 Ant Design Vue 整体引入导致主 JS 超过 500 kB，后续可在 P2/P3 做按需加载或手动分包优化。

遗留问题 / 下一步：

- 下一步进入 P2：设计系统与基础布局，继续完善主题 token、路由结构、i18n、前台/后台 layout 和响应式容器。
- 目前 Supabase 使用 `.env.example` 占位，真实连接需要填写 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`。

---

### P2 - 设计系统与基础布局

状态：`[x] 已完成`

完成内容：

- 已将 Ant Design Vue 主题从 `App.vue` 抽离到集中主题文件，方便后续统一维护 token。
- 已建立基础 i18n 文案结构，默认意大利语，并保留中文切换。
- 已建立权限类型和 auth store 占位，当前为 demo access，后续 P4 接入 Supabase Auth 后替换为真实角色判断。
- 已扩展 Vue Router：前台、商品、品牌、型号、B2B注册、登录、购物车、结账、客户中心、RMA、法律页、后台订单、库存、商品/PIM、客户、价格、员工设置等路由均有基础骨架。
- 已完善 StorefrontLayout：顶部通知条、Logo、大搜索、语言切换、账户、购物车、品类导航、移动抽屉菜单、合规页脚。
- 已完善 AdminLayout：深色侧边栏、后台模块菜单、顶部搜索、角色提示、Demo access 标记。
- 已创建前台和后台占位页，确保后续阶段可以按路由逐页替换为真实功能。
- 已修复 P2 构建中发现的 Ant Design Vue Table token 类型不兼容问题。
- 已保存 P2 首页预览截图。

改动文件：

- `src/theme/partsproTheme.ts`
- `src/types/auth.ts`
- `src/i18n/messages.ts`
- `src/stores/auth.store.ts`
- `src/stores/ui.store.ts`
- `src/App.vue`
- `src/router/index.ts`
- `src/layouts/StorefrontLayout.vue`
- `src/layouts/AdminLayout.vue`
- `src/pages/storefront/PlaceholderPage.vue`
- `src/pages/admin/AdminPlaceholderPage.vue`
- `src/styles/base.css`
- `声明/partspro-p2-home-preview.png`
- `声明/PartsPro-项目执行计划与进度.md`

验证：

```text
npm run build
浏览器打开 http://127.0.0.1:5174/
浏览器打开 http://127.0.0.1:5174/products
浏览器打开 http://127.0.0.1:5174/admin/inventory
```

验证结果：

- `npm run build` 通过。
- 首页验证通过：页脚、移动菜单按钮、品类导航、中文切换均存在。
- 商品目录占位路由验证通过：`/products` 显示 `Catalogo prodotti` 和 `Struttura pronta`。
- 后台库存路由验证通过：`/admin/inventory` 显示 `Inventario`、后台菜单、`Demo access` 和 `Ruolo: admin`。
- 本地预览可用地址：`http://127.0.0.1:5174/`。
- 构建仍有 chunk size 提醒，原因仍是 Ant Design Vue 目前整包接入；后续可在 P3 或优化阶段处理。

遗留问题 / 下一步：

- 下一步进入 P3：公开首页与商品目录，开始实现真实商品列表、筛选、商品卡片和访客隐藏价格。
- 当前权限是 demo 占位；P4 接入 Supabase Auth 后需要改成真实登录和角色守卫。

---

### P3 - 公开首页与商品目录

状态：`[x] 已完成`

完成内容：

- 已建立商品数据类型和公开目录 mock service，包含 SKU、品牌、型号、型号代码、品类、质量等级、颜色、是否带框、库存状态、MOQ、B2B价、VAT、质保天数、兼容表和商品卖点。
- 已实现公开商品列表 `/products`，支持搜索结果读取 URL query、品牌筛选、品类筛选、库存筛选、移动端筛选抽屉和桌面端筛选侧栏。
- 已实现商品卡片组件，展示产品图占位、质量等级标签、库存状态、商品名、SKU、型号、颜色、MOQ和操作区。
- 已保证访客状态下商品卡片不显示真实 B2B 价格，只显示 `Accedi per vedere il prezzo B2B`。
- 已实现商品详情页 `/products/:skuCode`，展示图片占位、标题、SKU、质量标签、库存、MOQ、颜色、是否带框、质保、兼容表、质量说明、安装/RMA提示和电池安全提示。
- 已将首页 `Browse Products` 和 `Richiedi account B2B` 按钮接到真实路由。
- 已保存 P3 商品目录预览截图。

改动文件：

- `src/types/product.ts`
- `src/services/products.service.ts`
- `src/components/ProductCard.vue`
- `src/pages/storefront/ProductsPage.vue`
- `src/pages/storefront/ProductDetailPage.vue`
- `src/pages/storefront/HomePage.vue`
- `src/router/index.ts`
- `src/stores/auth.store.ts`
- `src/styles/base.css`
- `声明/partspro-p3-catalog-preview.png`
- `声明/PartsPro-项目执行计划与进度.md`

验证：

```text
npm run build
浏览器打开 http://127.0.0.1:5174/products
浏览器打开 http://127.0.0.1:5174/products/IP11-SCR-SOFT-BLK
```

验证结果：

- `npm run build` 通过。
- `/products` 验证通过：显示 `Catalogo prodotti`、SKU `IP11-SCR-SOFT-BLK`、访客登录看价提示。
- `/products` 未泄露已知真实价格 `€32.00 / €32,00`。
- `/products/IP11-SCR-SOFT-BLK` 验证通过：显示商品标题、兼容性、安装/RMA和登录看价提示。
- 商品详情页未泄露已知真实价格 `€32.00 / €32,00`。
- 构建仍有 chunk size 提醒，原因仍是 Ant Design Vue 目前整包接入；后续可在优化阶段处理。

遗留问题 / 下一步：

- 下一步进入 P4：认证与客户权限，接入 Supabase Auth、登录页、路由守卫，并把当前 demo access 替换为真实访客/客户/员工状态。
- 当前商品数据为前端 mock 数据，P4/P6 后应逐步改为从 Supabase RPC/service 获取价格和库存。

---

### P4 - 认证与客户权限

状态：`[x] 已完成`

完成内容：

- 已实现 `auth.service.ts`，封装 Supabase Auth 的当前会话、邮箱登录、Google OAuth 和退出登录。
- 已实现真实 auth store 结构：profile、role、isAuthenticated、isStaff、canViewCustomerPrices、canAccess。
- 已取消 P2 的 demo 全局放行，路由守卫现在按 `public / customer / staff / admin` 访问级别判断。
- 已实现 `/login` 登录页，包含邮箱登录、Google 登录和本地 Demo 登录。
- 当 Supabase 环境变量未配置时，登录页显示提醒，并允许使用 Demo customer / sales / warehouse / admin 测试权限流。
- Demo 登录已持久化到 localStorage，刷新或直接打开 URL 后仍能保持 Demo 身份。
- 已在前台导航显示当前角色和 Logout 按钮，方便测试和用户切换身份。
- 已实现未登录访问 `/cart`、`/checkout`、`/account` 自动跳转 `/login?returnUrl=...`。
- 已实现 customer 无法访问 `/admin`，staff/admin 可以访问后台。
- 已将商品列表和商品详情的价格显示改为依赖 `canViewCustomerPrices`。
- 已将商品卡和详情页的访客加购动作改为跳转登录，而不是静态禁用。
- 已保存 P4 登录后预览截图。

改动文件：

- `src/services/auth.service.ts`
- `src/stores/auth.store.ts`
- `src/types/auth.ts`
- `src/pages/storefront/LoginPage.vue`
- `src/router/index.ts`
- `src/layouts/StorefrontLayout.vue`
- `src/components/ProductCard.vue`
- `src/pages/storefront/ProductsPage.vue`
- `src/pages/storefront/ProductDetailPage.vue`
- `src/styles/base.css`
- `声明/partspro-p4-auth-preview.png`
- `声明/PartsPro-项目执行计划与进度.md`

验证：

```text
npm run build
浏览器打开 http://127.0.0.1:5174/products
浏览器打开 http://127.0.0.1:5174/cart
使用 Demo customer 登录
浏览器打开 http://127.0.0.1:5174/products
浏览器打开 http://127.0.0.1:5174/admin
退出后使用 Demo admin 登录
浏览器打开 http://127.0.0.1:5174/admin
```

验证结果：

- `npm run build` 通过。
- 访客访问 `/products`：显示 `Accedi per vedere il prezzo B2B`，未泄露 `€32.00 / €32,00`。
- 访客访问 `/cart`：自动跳转 `/login?returnUrl=/cart`。
- Demo customer 登录后访问 `/products`：显示 B2B 价格，不再显示登录看价提示。
- Demo customer 访问 `/admin`：被阻止，跳回 `/products`。
- Logout 后使用 Demo admin 登录：成功进入 `/admin`，显示 `PartsPro Admin`、`Ruolo: admin` 和 `Demo access`。
- 构建仍有 chunk size 提醒，原因仍是 Ant Design Vue 目前整包接入；后续可在优化阶段处理。

遗留问题 / 下一步：

- 下一步进入 P5：B2B 注册与客户中心，完成 B2B 申请表、公司/VAT/发票字段、客户中心基础入口。
- 真实 Supabase 登录需要填写 `.env.local` 中的 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`，并在 `app_metadata.role` 或 `profiles.role` 中提供角色字段；不要用用户可编辑 metadata 做权限判断。

---

### P5 - B2B 注册与客户中心

状态：`[x] 已完成`

完成内容：

- 已实现 B2B 申请数据类型，覆盖 Email、联系人、电话、WhatsApp、公司名称、P.IVA、Codice Fiscale、SDI、PEC、注册地址、收货地址、公司类型、月采购额、感兴趣品类、付款需求、条款/隐私/营销勾选。
- 已实现 B2B 申请 service 占位，提交后返回申请 ID、状态和提交时间，后续可替换为 Supabase insert / Edge Function。
- 已将 `/b2b/register` 从占位页替换为真实分步表单。
- B2B 注册页桌面端使用左侧优势说明 + 右侧 Steps 表单；移动端保持单列响应式。
- B2B 注册流程包含 5 步：账户、公司和 VAT、发票和配送、采购需求、确认提交。
- 已确保营销订阅不默认勾选，条款和隐私必须勾选才能提交。
- 已实现 `/account` 客户中心基础页，展示客户角色、邮箱、客户等级、订单、重复购买、RMA、发票、常购清单、地址、公司资料、专属价格入口。
- 已保存 P5 客户中心预览截图。

改动文件：

- `src/types/b2b.ts`
- `src/services/b2b.service.ts`
- `src/pages/storefront/B2BRegisterPage.vue`
- `src/pages/storefront/AccountPage.vue`
- `src/router/index.ts`
- `src/styles/base.css`
- `声明/partspro-p5-account-preview.png`
- `声明/PartsPro-项目执行计划与进度.md`

验证：

```text
npm run build
浏览器打开 http://127.0.0.1:5174/b2b/register
点击 Avanti 至最终确认步骤
勾选 Termini e Condizioni 和 Privacy Policy
提交 B2B 申请
浏览器打开 http://127.0.0.1:5174/account
```

验证结果：

- `npm run build` 通过。
- `/b2b/register` 显示 `Richiedi account B2B`、B2B 优势说明和 Steps。
- B2B 注册可推进到最终确认步骤。
- 条款和隐私勾选后可提交，提交后显示 `Richiesta B2B inviata` 和申请 ID。
- `/account` 显示 `Area cliente`、`Ordini`、`RMA`、`Fatture`、`Dati aziendali` 等入口。
- 构建仍有 chunk size 提醒，原因仍是 Ant Design Vue 目前整包接入；后续可在优化阶段处理。

遗留问题 / 下一步：

- 下一步进入 P6：购物车与结账，完成加购、购物车、VAT、配送方式、Stripe/PayPal/Bonifico Bancario 入口和下单 service/RPC 占位。
- B2B 申请目前提交到前端 service 占位，后续需要连接 Supabase 表或 Edge Function。

---

### P6 - 购物车与结账

状态：`[x] 已完成`

完成内容：

- 已实现购物车数据类型，包含 cart item、cart line、summary、checkout payload、created order。
- 已实现购物车 service，占位模拟 `create_order_from_cart` RPC，并在前端 service 中重新按商品数据计算价格、VAT、运费和总价。
- 已实现 cart store，支持加购、数量修改、删除、清空、MOQ/缺货阻断、localStorage 持久化。
- 已将商品卡片和商品详情页的 Add 接入购物车；访客点击会跳登录，登录客户/员工点击会加入购物车。
- 已将顶部购物车 badge 接到真实购物车数量。
- 已将 `/cart` 从占位页替换为真实购物车页，展示商品行、SKU、质量、库存、MOQ、单价、小计、VAT、运费、总价和 checkout 按钮。
- 已将 `/checkout` 从占位页替换为四步结账页：Cliente、Fatturazione、Spedizione、Pagamento。
- 结账页已包含 P.IVA、Codice Fiscale、SDI、PEC、配送方式、客户备注、Stripe、PayPal、Bonifico Bancario、条款和隐私勾选。
- 结账提交会调用 `createOrderFromCart` 占位服务，成功后显示订单号和 `submitted` 状态，并清空购物车。
- 已保存 P6 购物车预览截图。

改动文件：

- `src/types/cart.ts`
- `src/services/cart.service.ts`
- `src/stores/cart.store.ts`
- `src/components/ProductCard.vue`
- `src/pages/storefront/ProductDetailPage.vue`
- `src/pages/storefront/CartPage.vue`
- `src/pages/storefront/CheckoutPage.vue`
- `src/layouts/StorefrontLayout.vue`
- `src/router/index.ts`
- `src/styles/base.css`
- `声明/partspro-p6-cart-preview.png`
- `声明/PartsPro-项目执行计划与进度.md`

验证：

```text
npm run build
浏览器打开 http://127.0.0.1:5174/products/IP11-SCR-SOFT-BLK
点击 Add to Cart
浏览器打开 http://127.0.0.1:5174/cart
浏览器打开 http://127.0.0.1:5174/checkout
点击 Avanti 到支付确认步骤
勾选 Termini e Condizioni 和 Privacy Policy
点击 Conferma ordine
```

验证结果：

- `npm run build` 通过。
- 商品详情页 Add to Cart 可加入购物车。
- `/cart` 显示 `IP11-SCR-SOFT-BLK`、`Riepilogo ordine`、`IVA 22%`、`Vai al checkout`。
- `/checkout` 显示 Stripe、PayPal、Bonifico Bancario 和 `create_order_from_cart RPC` 说明。
- 勾选条款和隐私后，`Conferma ordine` 可用。
- 提交后显示 `Ordine inviato` 和 `submitted` 状态。
- 构建仍有 chunk size 提醒，原因仍是 Ant Design Vue 目前整包接入；后续可在优化阶段处理。

遗留问题 / 下一步：

- 下一步进入 P7：RMA 与法律页面，完成 RMA 申请、RMA 状态流、政策页、Cookie/GDPR、电池安全页面。
- 当前 `createOrderFromCart` 是前端占位服务；后续必须替换为 Supabase RPC，保证价格和库存不能被前端篡改。

---

### P7 - RMA 与法律页面

状态：`[x] 已完成`

完成内容：

- 已实现 RMA 数据类型，覆盖订单号、SKU、数量、问题类型、问题描述、安装前测试、是否安装、物理损坏、申请处理方式。
- 已实现 RMA service 占位，提交后返回 RMA ID、状态和提交时间，后续可替换为 Supabase insert / Edge Function。
- 已将 `/account/rma` 从占位页替换为真实 RMA 申请页。
- RMA 申请流程包含 5 步：Ordine、Prodotto、Problema、Prove、Conferma。
- RMA 页面包含照片/视频上传 UI、安装前测试提醒、电池安全提醒和 RMA 状态流。
- 已实现法律/政策页面模板，并接入 `/legal/:page`。
- 法律页面覆盖 Termini e Condizioni、Privacy Policy、Cookie Policy、Politica di Reso、Garanzia e RMA、Spedizioni、Pagamenti、Sicurezza Batterie、Informazioni Legali。
- 法律页面明确标注“Bozza operativa”，提醒正式法律文本需由意大利法律/税务顾问确认。
- 已保存 P7 RMA 预览截图。

改动文件：

- `src/types/rma.ts`
- `src/services/rma.service.ts`
- `src/pages/storefront/RmaPage.vue`
- `src/pages/storefront/LegalPage.vue`
- `src/router/index.ts`
- `src/styles/base.css`
- `声明/partspro-p7-rma-preview.png`
- `声明/PartsPro-项目执行计划与进度.md`

验证：

```text
npm run build
浏览器打开 http://127.0.0.1:5174/account/rma
点击 Avanti 到最终确认步骤
点击 Invia RMA
浏览器打开 http://127.0.0.1:5174/legal/privacy
浏览器打开 http://127.0.0.1:5174/legal/battery-safety
```

验证结果：

- `npm run build` 通过。
- `/account/rma` 显示 `Richiedi RMA`、电池安全提醒和 `Flusso stato RMA`。
- RMA 可推进到最终确认步骤并提交，提交后显示 `RMA inviata` 和 `Pratica RMA-...`。
- `/legal/privacy` 显示 `Privacy Policy` 和 `GDPR`。
- `/legal/battery-safety` 显示 `Sicurezza Batterie` 和电池安全警告。
- 构建仍有 chunk size 提醒，原因仍是 Ant Design Vue 目前整包接入；后续可在优化阶段处理。

遗留问题 / 下一步：

- 下一步进入 P8：员工后台订单与库存，完成后台订单表、订单状态推进、库存页、库存流水和发货 RPC 占位。
- RMA 当前提交到前端 service 占位，后续需要连接 Supabase RMA 表、文件上传和员工后台审核流程。

---

### P8 - 员工后台订单与库存

状态：`[x] 已完成`

完成内容：

- 已实现后台订单与库存数据类型，覆盖订单状态、支付状态、库存风险、订单行、库存项和库存流水。
- 已实现员工后台 service，占位模拟 `staff_ship_order` RPC；发货动作通过 service 执行，UI 不直接修改库存数量。
- 已将 `/admin/orders` 从占位页替换为订单处理页，包含状态筛选、订单指标、订单 Table、Drawer 详情、订单状态 Steps、订单行 stock/batch/location 信息。
- 已实现订单状态推进：submitted、accepted、picking、packed、shipped、completed；packed 到 shipped 会弹出确认并调用 `staff_ship_order` 占位。
- 已实现 `/admin/orders/:id` 订单详情页，展示客户、VAT/SDI/PEC、配送、订单总额、状态 Steps、订单行和运营备注。
- 已实现 `/admin/inventory` 库存页，展示 actual_qty、locked_qty、available_qty、incoming、QC、RMA、defective、batch、location、supplier。
- 已实现 `/admin/stock-movements` 库存流水页，展示 purchase_in、order_lock、ship_out、rma_in、qc_hold、adjustment。
- 已更新 Admin Dashboard，用后台 mock service 显示订单、库存和支付待处理指标。
- 顺带完成首页意大利语/中文双语文案，意大利语为默认显示；Header、Footer、首页 Hero、品类、品牌和价值区都会跟随语言切换。
- 已优化首页和后台的桌面/移动布局：主页 390px 不横向溢出，后台移动端侧栏 0 宽收起，表格使用横向滚动容器。
- 已保存 P8 首页桌面、首页移动端和后台订单预览截图。

改动文件：

- `src/types/admin.ts`
- `src/services/admin.service.ts`
- `src/pages/admin/AdminDashboardPage.vue`
- `src/pages/admin/AdminOrdersPage.vue`
- `src/pages/admin/AdminOrderDetailPage.vue`
- `src/pages/admin/AdminInventoryPage.vue`
- `src/pages/admin/AdminStockMovementsPage.vue`
- `src/pages/storefront/HomePage.vue`
- `src/i18n/messages.ts`
- `src/layouts/StorefrontLayout.vue`
- `src/layouts/AdminLayout.vue`
- `src/router/index.ts`
- `src/styles/base.css`
- `声明/partspro-p8-home-desktop-preview.png`
- `声明/partspro-p8-home-mobile-preview.png`
- `声明/partspro-p8-admin-orders-preview.png`
- `声明/PartsPro-项目执行计划与进度.md`

验证：

```text
npm run build
浏览器打开 http://127.0.0.1:5174/
点击中文语言切换
设置 1280x900 验证首页桌面布局
设置 390x900 验证首页移动布局
浏览器打开 http://127.0.0.1:5174/admin/orders
点击 packed 订单的 Spedisci，并确认 staff_ship_order
浏览器打开 http://127.0.0.1:5174/admin/inventory
浏览器打开 http://127.0.0.1:5174/admin/stock-movements
设置 390x900 验证后台移动端不横向溢出
```

验证结果：

- `npm run build` 通过。
- 首页默认显示意大利语：`Ricambi per smartphone per professionisti della riparazione`。
- 点击中文切换后，首页显示 `面向专业维修商的手机配件采购平台`，Footer 显示中文法律入口。
- 首页桌面 1280px 验证通过，`scrollWidth = width = 1280`。
- 首页移动 390px 验证通过，`scrollWidth = width = 390`。
- `/admin/orders` 显示订单 `SO-20260522-027` 和 `staff_ship_order` 提示。
- packed 订单点击 `Spedisci` 后出现确认弹窗，确认按钮为 `Chiama staff_ship_order`，确认后页面显示 shipped 状态。
- `/admin/inventory` 显示 `IP11-SCR-SOFT-BLK`、Actual、Available 等库存字段。
- `/admin/stock-movements` 显示 `purchase_in` 和订单库存流水。
- 后台移动 390px 验证通过，`scrollWidth = width = 390`。
- 浏览器 console error 数量为 0。
- 构建仍有 chunk size 提醒，原因仍是 Ant Design Vue 目前整包接入；后续 P10 可做动态路由拆包或 manualChunks 优化。

遗留问题 / 下一步：

- 下一步进入 P9：商品/PIM、B2B 审核、价格组、批次/供应商字段和商品编辑 Drawer。
- 当前后台订单、库存和流水仍为前端 mock 数据，后续需要替换为 Supabase 表、RPC 和 RLS。
- `staff_ship_order` 当前只是 service 占位，真实上线前必须在 Supabase RPC 中原子校验库存、写库存流水并更新订单状态。

---

### P9 - 商品/PIM 与 B2B 审核

状态：`[x] 已完成`

完成内容：

- 已扩展后台数据类型，新增 AdminProduct、CustomerAccount、B2BApproval、PriceGroup、AdminBatch 等模型。
- 已扩展后台 service，提供商品/PIM、客户、B2B 审核、价格组、批次的 mock 数据和操作占位。
- 已将 `/admin/products` 从占位页替换为商品/PIM 页面，覆盖 SKU、品牌、型号、型号代码、品类、质量等级、颜色、是否带框、成本、零售价、B2B价格、阶梯价、库存、库位、批次、供应商、质保、重量、电池/危险品、MSDS/UN38.3、兼容型号、替代SKU和加购商品。
- 已实现商品编辑 Drawer，可修改 PIM 基础字段、价格、库存、合规和关联 SKU，并保存到 mock service。
- 已将 `/admin/customers` 替换为客户管理页，展示公司、联系人、P.IVA、SDI、PEC、客户等级、价格组、采购额、订单数、信用额度和付款条款。
- 已将 `/admin/b2b-approvals` 替换为 B2B 审核页，支持按状态筛选、查看申请资料、选择价格组、审批或拒绝。
- 已将 `/admin/prices` 替换为价格组页面，展示客户数、默认毛利、付款条款、可见品类和阶梯价规则。
- 已将 `/admin/batches` 替换为批次页面，展示批次、供应商、采购单、QC、库位、电池批次、MSDS/UN38.3 和备注。
- 已保存 P9 商品/PIM、B2B 审核和价格组预览截图。

改动文件：

- `src/types/admin.ts`
- `src/services/admin.service.ts`
- `src/pages/admin/AdminProductsPage.vue`
- `src/pages/admin/AdminCustomersPage.vue`
- `src/pages/admin/AdminB2BApprovalsPage.vue`
- `src/pages/admin/AdminPricesPage.vue`
- `src/pages/admin/AdminBatchesPage.vue`
- `src/router/index.ts`
- `声明/partspro-p9-products-preview.png`
- `声明/partspro-p9-b2b-approvals-preview.png`
- `声明/partspro-p9-prices-preview.png`
- `声明/PartsPro-项目执行计划与进度.md`

验证：

```text
npm run build
浏览器打开 http://127.0.0.1:5174/admin/products
打开商品 PIM 编辑 Drawer 并点击 Salva prodotto
浏览器打开 http://127.0.0.1:5174/admin/b2b-approvals
点击 Approva，确认 B2B 审核弹窗并完成审批
浏览器打开 http://127.0.0.1:5174/admin/customers
浏览器打开 http://127.0.0.1:5174/admin/prices
浏览器打开 http://127.0.0.1:5174/admin/batches
设置 390x900 验证 /admin/products 移动端不横向溢出
```

验证结果：

- `npm run build` 通过。
- `/admin/products` 显示 `Prodotti / PIM`、`IP11-SCR-SOFT-BLK`、MSDS/UN38.3 合规标签和 `Modifica`。
- 商品 PIM 编辑 Drawer 可打开，显示 `Modifica prodotto PIM` 和 `Salva prodotto`，保存后出现 `Prodotto PIM aggiornato`。
- `/admin/b2b-approvals` 显示 `Repair Hub Napoli`、`Approva`、`Respingi`，审批确认弹窗可打开并成功显示 `Richiesta B2B approvata`。
- `/admin/customers` 显示 `RiparaVeloce Milano`、P.IVA、客户等级和价格组。
- `/admin/prices` 显示 `Standard B2B`、`Gruppi prezzo` 和 `Fasce quantita`。
- `/admin/batches` 显示 `BATCH-MI-0520`、MSDS 和 UN38.3。
- `/admin/products` 移动 390px 验证通过，`scrollWidth = width = 390`。
- 浏览器 console error 数量为 0。
- 构建仍有 chunk size 提醒，原因仍是 Ant Design Vue 目前整包接入；P10 可集中处理动态拆包和部署前优化。

遗留问题 / 下一步：

- 下一步进入 P10：完整验证、响应式检查、README/.env/Vercel/Supabase 部署说明和部署前优化。
- P9 当前仍为 mock service；真实上线前需要 Supabase 表、RLS、审计日志、文件存储和价格计算 RPC。
- 商品编辑 Drawer 目前覆盖核心字段，后续可扩展为更完整的媒体管理、富文本质量说明和批量导入。

---

### P10 - 验证、优化与部署准备

状态：`[~] 进行中`

本轮完成内容：

- 已创建 Supabase 迁移文件：`supabase/migrations/20260522152536_partspro_mvp_schema.sql`。
- 迁移覆盖 profiles、products、price_groups、customers、b2b_applications、batches、inventory_items、stock_movements、orders、order_lines、rma_requests、RLS policies、Data API grants 和 `staff_ship_order` RPC 占位。
- 已连接 Supabase 云端项目 `PartsPro-Italia`（project ref：`zethhymziiziiwrypsnc`），并成功应用 MVP schema 迁移。
- 已新增并应用权限加固迁移：`supabase/migrations/20260522160746_harden_public_product_grants.sql`，限制匿名角色只能读取商品公开展示列，不能读取 `b2b_price`、`cost_price`、`stock_qty` 等批发/后台字段。
- 已修正 Supabase Auth 角色读取：不再从用户可编辑的 `user_metadata` 读取角色，改为读取 `app_metadata.role`，真实权限以 `profiles.role` 和 RLS 为准。
- 已新增 `VITE_USE_SUPABASE_DATA` 配置；前台商品目录/详情和后台 PIM、客户、B2B 审核、价格组、批次会优先读 Supabase，未配置或无权限时回落 mock。
- 已更新前台商品 service：未登录时只查询 Supabase 公开列，登录后才查询 B2B 价格列。
- 已把首页改版为面对客户的展示风格：更强的 B2B 供应商首屏、搜索入口、配件展示视觉、服务承诺、品类/品牌入口和采购流程说明。
- 已优化首页响应式：桌面 1280px 和移动 390px 均无横向溢出。
- 已把后台改为白色主题、中文为主的高密度布局。
- 已在后台增加“回到主页”入口和后台语言切换。
- 已对后台桌面端和移动端做紧凑化：更小的 Header、卡片 padding、表格容器和菜单行高。
- 已对路由做懒加载，并用 Vite `manualChunks` 拆分 `vue-vendor`、`supabase`、`antd`，主入口 JS 从约 1.8MB 降到约 36KB。
- 已保存 P10 首页桌面、首页移动端和后台白色中文布局预览截图。

改动文件：

- `supabase/migrations/20260522152536_partspro_mvp_schema.sql`
- `supabase/migrations/20260522160746_harden_public_product_grants.sql`
- `.env.example`
- `README.md`
- `vite.config.ts`
- `src/App.vue`
- `src/lib/supabase.ts`
- `src/services/auth.service.ts`
- `src/services/products.service.ts`
- `src/services/admin.service.ts`
- `src/pages/storefront/HomePage.vue`
- `src/pages/storefront/ProductsPage.vue`
- `src/pages/storefront/ProductDetailPage.vue`
- `src/layouts/AdminLayout.vue`
- `src/stores/ui.store.ts`
- `src/router/index.ts`
- `src/styles/base.css`
- `src/pages/admin/AdminDashboardPage.vue`
- `src/pages/admin/AdminOrdersPage.vue`
- `src/pages/admin/AdminInventoryPage.vue`
- `src/pages/admin/AdminStockMovementsPage.vue`
- `src/pages/admin/AdminProductsPage.vue`
- `src/pages/admin/AdminCustomersPage.vue`
- `src/pages/admin/AdminB2BApprovalsPage.vue`
- `src/pages/admin/AdminPricesPage.vue`
- `src/pages/admin/AdminBatchesPage.vue`
- `声明/partspro-p10-home-redesign-desktop.png`
- `声明/partspro-p10-home-redesign-mobile.png`
- `声明/partspro-p10-admin-white-zh.png`

验证：

```text
npm run build
浏览器打开 http://127.0.0.1:5174/
设置 1280x900 验证新版首页桌面端
设置 390x900 验证新版首页移动端
浏览器打开 http://127.0.0.1:5174/admin/products
验证后台中文菜单、白色主题、语言切换和回到主页
设置 390x900 验证后台移动端
```

验证结果：

- `npm run build` 通过。
- 首页桌面 1280px 验证通过，`scrollWidth = width = 1280`。
- 首页移动 390px 验证通过，`scrollWidth = width = 390`。
- 后台 `/admin/products` 桌面 1280px 验证通过，显示中文菜单、白色侧栏、语言切换和 `回到主页`。
- 点击 `回到主页` 成功跳转 `/`。
- 后台 `/admin/products` 移动 390px 验证通过，`scrollWidth = width = 390`。
- 浏览器 console error 数量为 0。
- 构建拆包后主入口 JS 约 35.9 kB gzip 12.6 kB；Ant Design Vue vendor chunk 仍较大，后续可进一步按需引入组件或用 `unplugin-vue-components` 优化。
- Supabase smoke test 通过：`public.products` 有 2 条种子商品，`public.price_groups` 有 3 条价格组，核心业务表已创建。
- Supabase RLS 验证通过：profiles、products、price_groups、customers、b2b_applications、batches、inventory_items、stock_movements、orders、order_lines、rma_requests 均已启用 RLS。
- 匿名角色验证通过：可读取商品公开列；直接查询 `public.products.b2b_price` 返回 `permission denied for table products`，确认游客不能从数据库层拿到批发价。

遗留问题 / 下一步：

- Supabase 云端数据库已连接并完成迁移；前端浏览器直连还需要在本地 `.env.local` 填入 `VITE_SUPABASE_URL=https://zethhymziiziiwrypsnc.supabase.co` 和该项目的 `VITE_SUPABASE_ANON_KEY`。
- 真实 Supabase 数据上线后，需要创建 staff/customer 测试用户，并在 `profiles.role` 或 `app_metadata.role` 中写入角色。
- 下一步继续 P10：补齐 Vercel 部署说明、Supabase Auth 测试用户、线上环境变量说明和最终验收清单。

---

## 5. 进度更新模板

每完成一个阶段后，在这里追加：

```text
### P? - 阶段名称

状态：`[x] 已完成`

完成内容：
- ...

改动文件：
- ...

验证：
- ...

遗留问题 / 下一步：
- ...
```
