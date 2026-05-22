# PartsPro UI 设计声明 - Ant Design Vue

版本：2026-05-22  
适用项目：PartsPro 意大利手机维修配件 B2B 订货网站 + 员工运营后台  
默认前台语言：意大利语  
辅助语言：中文切换；英文作为后续欧盟扩展预留  
技术 UI 路线：Vue3 + Vite + TypeScript + Ant Design Vue + Supabase

---

## 1. 声明目的

本文件整合以下两份规划：

- `/Users/kyox215/Downloads/PartsPro-from-zero-executable-plan-v2-public-catalog.md`
- `/Users/kyox215/Downloads/意大利手机维修配件供应商网站建设计划书_更新版.md`

整合后的 UI 决策为：

1. PartsPro 不是普通零售商城，而是面向意大利维修店、翻新商、电商卖家和小型批发商的专业配件采购平台。
2. 第一版按“意大利完整 MVP”设计：强搜索、公开目录、登录看价、B2B开户注册、购物车、结账、支付入口、VAT/发票、RMA、法律页、员工后台订单和库存都纳入首版 UI。
3. 原执行文档中的 Element Plus 路线改为 Ant Design Vue；Vue3、Vite、TypeScript、Supabase、Vercel 路线保留。
4. 所有 UI 必须表达一个核心规则：访客可以浏览商品，但不能看到批发价；登录客户可看自己的 B2B 价格并下单；员工进入后台处理商品、库存、订单、发货和售后。

---

## 2. 产品定位

PartsPro 的首屏和核心流程必须让用户快速理解：

```text
Ricambi per smartphone per professionisti della riparazione.
Prezzi B2B, stock in Italia, spedizione rapida, RMA tracciabile.
```

中文内部含义：

```text
面向维修专业人士的手机配件采购平台。
B2B价格、意大利本地库存、快速发货、可追踪售后。
```

### 2.1 目标用户

| 用户 | 主要需求 | UI 设计重点 |
|---|---|---|
| 维修店老板 | 快速找型号、看价格、补货 | 搜索优先、常购清单、重复购买 |
| 采购人员 | 批量筛选 SKU、看库存、下单 | 桌面端表格视图、批量加购、筛选保留 |
| 维修师傅 | 手机上查型号和库存 | 移动端固定搜索、单列商品卡、底部加购栏 |
| B2B 新客户 | 申请批发账户 | 分步表单、P.IVA/SDI/PEC 清楚说明 |
| 员工 | 订单、库存、发货、RMA | 后台左侧导航、表格、抽屉详情、状态流 |

### 2.2 视觉关键词

```text
专业、稳定、快速、可信赖、现代、信息密度高、搜索强、状态清楚。
```

禁止方向：

- 不做普通 3C 零售商城式大图堆叠。
- 不做过度渐变、强装饰、长篇营销首屏。
- 不把所有价格、促销、风险都做成红色。
- 不让移动端只是桌面端缩小版。

---

## 3. 设计系统路线

### 3.1 组件库

首版 UI 统一使用 Ant Design Vue。不得在同一套界面中混用 Element Plus、Naive UI、Bootstrap 等组件库。

推荐依赖：

```text
ant-design-vue
@ant-design/icons-vue
```

基础接入原则：

- 使用 `ConfigProvider` 统一主题、语言、组件尺寸和空状态。
- 图标统一来自 `@ant-design/icons-vue`。
- 不把 Ant Design 官网图标截图、组件截图当作项目资源。
- 自定义组件必须基于 Ant Design Vue 组件组合，不重新手写一套 Button、Table、Modal、Drawer、Form。

### 3.2 Ant Design 设计价值落地

PartsPro 采用 Ant Design 企业级设计语言，但不是照搬官网风格。落地方式如下：

| Ant Design 能力 | PartsPro 落地 |
|---|---|
| 企业级一致性 | 前台、客户中心、员工后台使用统一组件、间距、状态色 |
| 表格和表单效率 | 后台订单、库存、客户、RMA 以 Table/Form/Drawer 为核心 |
| 可配置主题 | 使用 Design Token 映射 PartsPro 品牌色 |
| 信息分层 | 商品详情、订单详情、RMA详情使用 Tabs/Descriptions/Steps |
| 状态反馈 | 加购、库存不足、审核、发货、RMA都必须有明确反馈 |

---

## 4. 主题 Token

### 4.1 品牌与状态色

| 用途 | Token / 变量 | Hex | 使用场景 |
|---|---|---|---|
| 主操作蓝 | `colorPrimary` | `#2563EB` | 主按钮、链接、搜索焦点、B2B入口 |
| 信息蓝 | `colorInfo` | `#2563EB` | 普通提示、流程进行中 |
| 深蓝黑 | `--pp-header-bg` | `#0F172A` | 顶部导航、页脚、后台侧栏 |
| 页面背景 | `colorBgLayout` | `#F8FAFC` | 前台和后台整体背景 |
| 卡片背景 | `colorBgContainer` | `#FFFFFF` | 商品卡、表单、详情区 |
| 主文字 | `colorText` | `#111827` | 标题、商品名、关键字段 |
| 次文字 | `colorTextSecondary` | `#6B7280` | 说明、备注、辅助字段 |
| 边框线 | `colorBorder` | `#E5E7EB` | 卡片边框、表格线、输入框 |
| 成功/有货 | `colorSuccess` | `#16A34A` | In stock、审核通过、RMA完成 |
| 警告/低库存 | `colorWarning` | `#F97316` | Low stock、安装提醒、资料待补 |
| 错误/缺货 | `colorError` | `#DC2626` | Out of stock、错误、拒绝、风险 |
| 预售/在途 | `--pp-incoming` | `#7C3AED` | Pre-order、Incoming |

### 4.2 建议 ConfigProvider 主题

```ts
export const partsProTheme = {
  token: {
    colorPrimary: '#2563EB',
    colorInfo: '#2563EB',
    colorSuccess: '#16A34A',
    colorWarning: '#F97316',
    colorError: '#DC2626',
    colorBgLayout: '#F8FAFC',
    colorBgContainer: '#FFFFFF',
    colorText: '#111827',
    colorTextSecondary: '#6B7280',
    colorBorder: '#E5E7EB',
    borderRadius: 8,
    fontSize: 14,
    fontFamily:
      'Inter, Roboto, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  components: {
    Button: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Input: {
      controlHeight: 44,
    },
    Select: {
      controlHeight: 44,
    },
    Card: {
      borderRadiusLG: 12,
    },
    Table: {
      headerBg: '#F8FAFC',
    },
    Layout: {
      headerBg: '#0F172A',
      siderBg: '#0F172A',
    },
  },
}
```

### 4.3 字体与数字

| 用途 | 桌面端 | 移动端 |
|---|---:|---:|
| H1 页面标题 | 32-40px | 26-32px |
| H2 模块标题 | 24-28px | 22-24px |
| H3 卡片标题 | 18-20px | 16-18px |
| 正文 | 15-16px | 15-16px |
| 商品参数 | 14px | 13-14px |
| 标签/辅助文字 | 12-13px | 12px |
| 价格 | 20-28px | 20-24px |

数字类信息必须使用等宽数字特性：

```css
.numeric {
  font-variant-numeric: tabular-nums;
}
```

---

## 5. 响应式布局规则

### 5.1 断点

| 设备 | 宽度 | 规则 |
|---|---:|---|
| 小手机 | 360-374px | 不允许横向溢出，按钮最小高度 44px |
| 常规手机 | 375-430px | 首屏固定搜索，商品单列 |
| 大手机 | 431-767px | 商品卡可增加图文密度 |
| 平板 | 768-1023px | 可使用双列布局 |
| 小桌面 | 1024-1279px | 左筛选 + 右商品区 |
| 标准桌面 | 1280-1439px | B2B 采购主体验 |
| 大桌面 | 1440px+ | 内容最大宽度限制，不拉满 |

容器规则：

```text
前台页面容器：1200-1440px
商品详情页：约1280px
后台表格页面：可到1440px
移动端左右边距：16px
平板左右边距：24px
桌面左右边距：32px 或居中容器
```

### 5.2 间距

统一使用 8px 体系：

| 间距 | 用途 |
|---:|---|
| 4px | 标签内部、小图标间距 |
| 8px | 紧密元素 |
| 12px | 商品卡内部 |
| 16px | 表单、卡片、移动端常用 |
| 24px | 页面模块间 |
| 32px | 桌面区块间 |
| 48px | 首页大区块 |
| 64px | 大屏展示区块 |

### 5.3 圆角与阴影

| 元素 | 圆角 | 阴影 |
|---|---:|---|
| 主按钮 | 8px | 无或极轻 |
| 商品卡片 | 12px | hover 轻阴影 |
| 表单区块 | 12px | 轻阴影或边框 |
| 输入框 | 8px | focus 蓝色描边 |
| 标签 | 6px 或 999px | 无 |
| Modal / Drawer | 12-16px | Ant Design 默认阴影 |

---

## 6. 信息架构

### 6.1 前台路由

| 路由 | 页面 | 访问规则 |
|---|---|---|
| `/` | 首页 | 公开 |
| `/products` | 商品目录/搜索结果 | 公开，未登录隐藏价格 |
| `/products/:skuCode` | 商品详情 | 公开，未登录隐藏价格 |
| `/brands/:brand` | 品牌页 | 公开 |
| `/models/:model` | 型号页 | 公开 |
| `/quality-guide` | 质量等级说明 | 公开 |
| `/wholesale` | B2B 批发说明 | 公开 |
| `/b2b/register` | B2B 开户申请 | 公开 |
| `/login` | 登录 | 公开 |
| `/register` | 普通注册 | 公开 |
| `/cart` | 购物车 | 登录客户 |
| `/checkout` | 结账 | 登录客户 |
| `/account` | 客户中心 | 登录客户 |
| `/account/orders` | 我的订单 | 登录客户 |
| `/account/rma` | RMA 申请/状态 | 登录客户 |
| `/legal/terms` | 销售条款 | 公开 |
| `/legal/privacy` | GDPR 隐私政策 | 公开 |
| `/legal/cookies` | Cookie 政策 | 公开 |
| `/legal/shipping` | 配送政策 | 公开 |
| `/legal/returns` | 退货政策 | 公开 |
| `/legal/warranty-rma` | 质保与 RMA | 公开 |
| `/legal/battery-safety` | 电池安全 | 公开 |

### 6.2 后台路由

| 路由 | 页面 | 访问角色 |
|---|---|---|
| `/admin` | 后台首页 | sales / warehouse / purchasing / admin |
| `/admin/orders` | 订单管理 | sales / warehouse / admin |
| `/admin/orders/:id` | 订单详情 | sales / warehouse / admin |
| `/admin/products` | 商品/PIM | purchasing / admin |
| `/admin/inventory` | 实时库存 | warehouse / purchasing / admin |
| `/admin/stock-movements` | 库存流水 | warehouse / purchasing / admin |
| `/admin/batches` | 批次管理 | warehouse / purchasing / admin |
| `/admin/rma` | RMA 管理 | sales / warehouse / admin |
| `/admin/customers` | 客户管理 | sales / admin |
| `/admin/b2b-approvals` | B2B 审核 | sales / admin |
| `/admin/prices` | 价格组/阶梯价 | sales / admin |
| `/admin/invoices` | 发票资料 | sales / admin |
| `/admin/shipments` | 物流与发货 | warehouse / admin |
| `/admin/reports` | 报表 | admin |
| `/admin/settings/users` | 员工和权限 | admin |

---

## 7. 语言与文案

### 7.1 语言优先级

1. 前台默认语言：意大利语。
2. 提供中文切换选项，用于内部运营、中文客户或供应商协同。
3. 英文作为后续欧盟扩展预留，不作为首版强制范围。

### 7.2 关键意大利语文案

| 场景 | 意大利语 | 中文 |
|---|---|---|
| 未登录价格 | Accedi per vedere il prezzo B2B | 登录查看批发价 |
| 未登录加购 | Accedi per aggiungere al carrello | 登录后加入购物车 |
| B2B 申请 | Richiedi account B2B | 申请批发账户 |
| 今日发货 | Ordini pagati entro le 15:00, spedizione oggi dall'Italia | 15:00 前付款，意大利本土当天发货 |
| 搜索提示 | Cerca per modello, SKU o ricambio... es. iPhone 11 schermo, A2221 | 按型号、SKU或配件搜索 |
| 库存有货 | Disponibile | 有货 |
| 库存低 | Scorte limitate | 低库存 |
| 缺货 | Esaurito | 缺货 |
| 预售/在途 | In arrivo | 在途 |
| VAT 未税 | IVA esclusa | 未税 |
| VAT 含税 | IVA inclusa | 含税 |
| 安装前测试 | Testare prima dell'installazione | 安装前测试 |
| RMA 申请 | Richiedi RMA | 申请售后 |

### 7.3 法律与税务文案约束

- 法律页面和 VAT/发票说明必须以意大利语为准。
- 中文翻译只能作为辅助理解，不替代正式法律条款。
- VAT、OSS、电子发票、跨境 B2B 反向征税等内容上线前必须由意大利会计师或法律顾问确认。

---

## 8. 权限与价格视觉规则

### 8.1 访客

访客可以：

- 打开首页、分类、品牌、型号、商品详情。
- 搜索商品。
- 查看图片、SKU、品牌、型号、配件类型、质量等级、颜色、库存状态。
- 进入登录、注册、B2B 申请。

访客不可以：

- 查看 B2B 价格、客户专属价、阶梯价。
- 加入购物车。
- 查看精确库存数量。
- 访问购物车、结账、订单、客户中心、后台。

访客价格区 UI：

```text
[Lock icon] Accedi per vedere il prezzo B2B
```

访客按钮：

```text
Primary/Secondary Button: Accedi per aggiungere al carrello
点击后跳转 /login，并保留 returnUrl。
```

### 8.2 登录客户

登录客户可以看到：

- 自己的 B2B 价格。
- 阶梯价。
- MOQ。
- 购物车和结账。
- 订单状态。
- 发票资料。
- RMA入口。
- 常购清单和重复购买。

价格展示：

```text
€32,00 IVA esclusa
Prezzo B2B
```

如果是 B2C 或未审核客户：

```text
€39,90 IVA inclusa
Account in verifica per prezzi B2B
```

### 8.3 员工

员工后台可见：

- 成本价、默认批发价、客户等级价、客户专属价。
- 精确库存、预留库存、待检库存、RMA库存。
- 批次号、库位、供应商、采购信息。
- 客户资料、B2B审核、发票资料。

后台不得使用前台商品卡展示关键运营数据，必须以 Table、Descriptions、Drawer、Tabs、Steps 承载。

---

## 9. 组件规范

### 9.1 Ant Design Vue 组件映射

| UI 场景 | 组件 |
|---|---|
| 应用外壳 | `Layout`, `Menu`, `Grid`, `Affix` |
| 顶部导航 | `Input.Search`, `AutoComplete`, `Dropdown`, `Badge`, `Button` |
| 分类筛选 | `Form`, `Select`, `Checkbox`, `Radio`, `Slider`, `Drawer`, `Tag` |
| 商品卡片 | `Card`, `Image`, `Tag`, `Badge`, `Button`, `InputNumber` |
| 商品详情 | `Image`, `Descriptions`, `Tabs`, `Collapse`, `Alert`, `Table`, `Steps` |
| 购物车 | `List`, `Table`, `InputNumber`, `Alert`, `Card`, `Button` |
| 结账 | `Steps`, `Form`, `Radio`, `Checkbox`, `Alert`, `Result` |
| B2B 注册 | `Steps`, `Form`, `Input`, `Select`, `Upload`, `Checkbox` |
| RMA | `Steps`, `Form`, `Upload`, `Timeline`, `Alert`, `Result` |
| 后台列表 | `Table`, `Pagination`, `FilterDropdown`, `Segmented`, `Tabs` |
| 后台详情 | `Drawer`, `Modal`, `Descriptions`, `Timeline`, `Steps` |
| 状态反馈 | `Message`, `Notification`, `Alert`, `Result`, `Skeleton`, `Spin`, `Empty` |

### 9.2 按钮

| 类型 | 样式 | 使用场景 |
|---|---|---|
| Primary | 蓝底白字 | 搜索、加购、去结账、提交申请、确认发货 |
| Secondary | 白底蓝边 | 查看详情、继续购物、申请报价 |
| Text / Link | 文本按钮 | 清除筛选、取消、辅助链接 |
| Danger | 红色 | 删除、取消RMA、危险操作 |
| Disabled | 灰色 | 缺货、权限不足、未满足 MOQ |

规则：

- 每个页面最多一个最强主操作。
- 移动端主按钮高度不低于 48px。
- 桌面端普通按钮高度 40-44px，关键按钮 44-48px。

### 9.3 标签

质量等级必须使用固定标签色，颜色只辅助识别，不能替代文字说明。

| 质量等级 | 标签文字 | 颜色 |
|---|---|---|
| Original Pull | Original Pull | 绿色 |
| Refurbished Original | Refurbished Original | 蓝色 |
| Service Pack | Service Pack | 深蓝 |
| Soft OLED | Soft OLED | 紫色 |
| Hard OLED | Hard OLED | 靛蓝 |
| Incell / TFT | TFT / Incell | 橙色 |
| Compatible High Quality | High Quality Compatible | 青色 |
| Clearance | Clearance | 红色或粉红 |

库存标签：

| 状态 | 文案 | 颜色 |
|---|---|---|
| in_stock | Disponibile | 绿色 |
| low_stock | Scorte limitate | 橙色 |
| out_of_stock | Esaurito | 红色 |
| incoming | In arrivo | 紫色 |

### 9.4 表格

桌面端后台和 B2B 批量采购必须优先使用表格。

表格规则：

- 表头固定。
- 库存、订单、RMA、支付状态用 Tag。
- 关键数字右对齐并使用等宽数字。
- 操作列固定在右侧。
- 复杂编辑使用 Drawer，不在表格里堆大表单。
- 移动端主购买流程不得强行缩小大表格，必须转卡片。

---

## 10. 前台页面声明

### 10.1 首页

首页第一屏必须同时传达：

```text
我能快速找配件。
我是专业 B2B 供应商。
我有意大利本地库存并能快速发货。
```

桌面端结构：

```text
顶部通知条：15:00前付款，意大利本土当天发货 / B2B批发开户注册
主导航：Logo + 大搜索框 + 账户 + 语言切换 + 购物车
品类导航：Apple / Samsung / Xiaomi / Screens / Batteries / Charging Ports / Tools
Hero：标题 + 副标题 + 搜索框 + B2B申请按钮
品牌快捷入口：Apple / Samsung / Xiaomi / Oppo / Huawei / Honor
品类快捷入口：屏幕 / 电池 / 尾插 / 后盖 / 摄像头 / 工具
热卖型号：iPhone 11 / iPhone 12 / Galaxy A系列 / Redmi Note系列
质量等级说明：Original / Refurbished / Soft OLED / Hard OLED / TFT
新品到货：New Arrivals
B2B优势：批发价 / 发票 / 快速发货 / RMA售后
配送和售后：安装前测试 / 电池安全 / 24-48小时配送
页脚：公司信息 / 法律页面 / 联系方式
```

移动端结构：

```text
顶部：Logo + 菜单 + 语言 + 购物车
固定搜索框
快捷按钮：按品牌找 / 按型号找 / B2B注册 / WhatsApp
品牌横向滑动卡片
品类两列宫格
热卖产品单列卡片
质量等级折叠说明
配送和售后承诺
简化页脚
```

Hero 文案：

```text
Ricambi per Smartphone per Professionisti della Riparazione
Schermi, batterie, connettori di ricarica e componenti selezionati. Prezzi B2B, spedizione rapida dall'Italia.
```

### 10.2 搜索与分类页

搜索是 PartsPro 的核心功能，必须比 Banner 更重要。

搜索支持：

- 型号：`iPhone 11`, `Galaxy A52`, `Redmi Note 10`
- 型号代码：`A2221`, `SM-G991B`
- SKU
- EAN / OEM 编号
- 配件类型：`schermo`, `battery`, `charging port`, `dock flex`
- 意大利语、英语、中文关键词
- 品牌别名和拼写容错

桌面端分类页：

```text
左侧固定筛选栏：品牌 / 系列 / 型号 / 品类 / 质量等级 / 是否带框 / 颜色 / 库存 / 价格
右侧顶部：面包屑 + 标题 + 产品数量 + 排序 + 网格/列表切换
右侧主体：商品卡片网格或表格列表
底部：分页或加载更多
```

移动端分类页：

```text
顶部搜索栏
当前分类标题 + 产品数量
筛选按钮 + 排序按钮
已选筛选标签横向滑动
商品单列卡片
底部加载更多
```

### 10.3 商品卡片

商品卡片固定结构：

```text
产品图
质量等级标签 + 库存标签
商品名称
SKU
品牌 / 型号 / 兼容型号
配件类型 / 颜色 / 是否带框
价格区
数量选择 + 加入购物车
收藏 / 对比
```

未登录价格区：

```text
Accedi per vedere il prezzo B2B
```

登录客户价格区：

```text
€32,00 IVA esclusa
Prezzo B2B
```

卡片 hover：

- 边框变主蓝。
- 轻微上浮。
- 图片轻微放大。
- 不使用夸张动画。

### 10.4 商品详情页

商品详情页目标：

1. 让客户快速确认是否买对。
2. 让客户快速下单。
3. 提前减少售后纠纷。

桌面端结构：

```text
面包屑
左侧：产品图片图库
右侧：标题 / SKU / 质量标签 / 库存 / 价格 / 阶梯价 / 数量 / 加购 / 收藏
右侧下方：B2B提示 / 发货时间 / VAT说明 / RMA入口
中部：兼容型号表 / 质量说明 / 安装提醒 / 参数表 / 电池安全 / RMA规则
下方：推荐加购 / 替代型号 / 最近浏览 / FAQ
```

移动端结构：

```text
顶部：返回 / 分享 / 购物车
图片轮播
标题 + SKU + 质量标签
价格 + VAT说明
库存 + 发货时间
规格选择 / 数量
安装前测试提醒
兼容型号卡片
质量等级说明折叠
产品参数折叠
RMA和质保折叠
推荐加购
底部固定加购栏
```

必须展示字段：

| 字段 | 说明 |
|---|---|
| 商品名称 | 标准命名：品牌 + 型号 + 配件类型 + 质量等级 + 颜色 + 特征 |
| SKU | 可复制 |
| EAN | 如有 |
| 品牌/型号/型号代码 | 防止买错 |
| 配件类型 | Screen / Battery / Charging Port 等 |
| 质量等级 | 固定标签 + 详情解释 |
| 颜色 | 黑、白、蓝、金等 |
| 是否带框/带胶/带工具 | 对屏幕和套装很关键 |
| 库存状态 | 访客只看状态，员工可看数量 |
| 发货时间 | 今日发货/24-48小时 |
| B2B价格/阶梯价 | 登录客户可见 |
| MOQ | 不满足时禁用加购或提示 |
| VAT | `IVA esclusa` 或 `IVA inclusa` |
| RMA规则 | 按品类展示 |
| 安装前测试 | 屏幕类必须突出 |

安装提醒使用 `Alert`：

```text
Testare prima dell'installazione
Collegare il componente alla scheda madre e verificare display, touch, luminosita, sensori e connettori prima dell'installazione definitiva.
```

电池提醒使用 `Alert`：

```text
Sicurezza batteria
Non piegare, forare, schiacciare, cortocircuitare o riscaldare la batteria. Seguire le regole per trasporto, reso e riciclo delle batterie al litio.
```

### 10.5 B2B 注册

B2B 开户不是普通注册页，必须表现为专业批发账户申请流程。

桌面端：

```text
左侧：B2B优势说明
右侧：开户链接表单
底部：审核流程说明
```

移动端：

```text
Step 1：账户信息
Step 2：公司和VAT信息
Step 3：收货和发票信息
Step 4：业务类型和采购需求
Step 5：提交申请
```

字段：

| 分组 | 字段 |
|---|---|
| 账户信息 | Email、密码、联系人、电话、WhatsApp |
| 公司信息 | 公司名称、P.IVA、Codice Fiscale、公司类型 |
| 发票信息 | SDI、PEC、注册地址、国家 |
| 收货信息 | 收货地址、联系人、电话 |
| 业务信息 | 维修店/批发商/翻新商/电商卖家、月采购额、感兴趣品类 |
| 付款需求 | 银行转账、信用卡、PayPal、是否申请账期 |
| 条款 | 销售条款、隐私政策、营销订阅单独勾选 |

审核状态：

| 状态 | UI |
|---|---|
| submitted | 蓝色 Tag：Richiesta inviata |
| reviewing | 橙色 Tag：In verifica |
| approved | 绿色 Tag：Account B2B attivo |
| rejected | 红色 Tag：Richiesta non approvata |

### 10.6 购物车

桌面端：

```text
左侧：购物车商品表格/列表
右侧：订单摘要固定卡片
```

购物车商品显示：

- 图片
- 商品名称
- SKU
- 质量等级
- 库存状态
- 单价
- 数量
- MOQ提示
- 小计
- 删除/收藏

订单摘要显示：

- 商品金额
- B2B折扣
- VAT
- 运费
- 总金额
- 预计发货时间
- 去结账按钮

移动端：

- 商品单卡片展示。
- 数量选择器必须大。
- 总金额和去结账按钮固定底部。
- 缺货或库存不足在商品卡片内直接提示。

### 10.7 结账

结账分 4 步：

```text
1. Cliente / Login
2. Fatturazione
3. Spedizione
4. Pagamento e conferma
```

支付方式首版 UI：

| 支付方式 | UI 规则 |
|---|---|
| Stripe 信用卡 | 小 B 和 B2C 可选，支持占位 |
| PayPal | 可选 |
| Bonifico Bancario | B2B 推荐，显示银行转账说明 |

必须包含：

- 发票资料自动带出。
- B2B 显示未税价和 VAT。
- B2C 显示含税价。
- 电池运输限制提示。
- 条款勾选。
- 隐私政策勾选。
- 营销订阅单独勾选，不能默认勾选。
- 库存不足或价格变化时阻止提交并说明。

### 10.8 客户中心

桌面端左侧菜单：

```text
Dashboard
Ordini
Riordina veloce
Lista acquisti frequenti
Preventivi
RMA
Fatture
Indirizzi
Dati aziendali
Prezzi dedicati
Impostazioni
```

移动端入口卡片：

```text
[Ordini] [Riordina]
[RMA] [Fatture]
[Lista frequenti] [Indirizzi]
[Dati aziendali] [Assistenza]
```

客户首页展示：

- 最近订单。
- 常购商品。
- 未完成 RMA。
- 未付款订单。
- 客户等级。
- 最近浏览 SKU。
- 补货提醒。

### 10.9 RMA 售后

RMA 申请流程：

```text
1. 选择订单
2. 选择商品
3. 选择问题类型
4. 填写问题描述
5. 上传照片/视频
6. 确认 RMA 规则
7. 提交
```

问题类型：

| 类型 | 示例 |
|---|---|
| Danno all'arrivo | 到货损坏 |
| Difetto funzionale | 触控、显示、充电问题 |
| Modello errato | 型号不符 |
| Articolo mancante/errato | 少发/错发 |
| Danno da installazione | 安装损坏 |
| Danno da trasporto | 运输损坏 |
| Problema di lotto | 批量质量问题 |

状态 Steps：

```text
Inviata -> In attesa di documenti -> Approvata per reso -> In attesa ricezione -> In verifica -> Risolta -> Completata
```

状态颜色：

| 状态 | 颜色 |
|---|---|
| 已完成 | 绿色 |
| 处理中 | 蓝色 |
| 等待客户资料 | 橙色 |
| 已拒绝 | 红色 |
| 已取消 | 灰色 |

屏幕类 RMA 必须提示：

- 安装前必须测试。
- 排线折损、压伤、进液、胶水污染可能不保。
- 需要照片/视频证明。

电池类 RMA 必须提示：

- 鼓包、漏液、发热需停止使用。
- 不要刺穿、挤压、拆解。
- 退回需安全包装。
- 必要时先联系客服确认退回方式。

### 10.10 法律与政策页

页脚必须有这些入口：

| 页面 | 意大利语标题 |
|---|---|
| 销售条款 | Termini e Condizioni |
| 隐私政策 | Privacy Policy |
| Cookie 政策 | Cookie Policy |
| 退货政策 | Politica di Reso |
| 质保与RMA | Garanzia e RMA |
| 配送政策 | Spedizioni |
| 支付说明 | Pagamenti |
| 公司法律信息 | Informazioni Legali |
| 电池安全 | Sicurezza Batterie |
| 质量等级说明 | Qualita dei Ricambi |
| 联系/投诉 | Reclami / Contatti |

页脚还必须显示：

- 公司名称。
- 法定地址。
- 仓库地址，如不同。
- P.IVA。
- Codice Fiscale。
- REA 编号，如适用。
- Email。
- 电话。
- PEC。
- SDI。
- 营业时间。

---

## 11. 员工后台声明

后台是 ERP/WMS 轻量工作台，不是营销站。

### 11.1 后台布局

```text
左侧 Sider：模块导航
顶部 Header：搜索 / 当前用户 / 角色 / 通知
主体 Content：表格、详情、流程处理
```

角色导航：

| 角色 | 默认可见模块 |
|---|---|
| sales | 订单、客户、B2B审核、价格、RMA |
| warehouse | 订单拣货、库存、库位、发货、RMA待检 |
| purchasing | 商品、供应商、采购、批次、导入 |
| admin | 全部模块、员工权限、系统设置 |

### 11.2 订单管理

订单状态：

```text
submitted -> accepted -> picking -> packed -> shipped -> completed
```

页面结构：

- 顶部状态 Tabs。
- 筛选：客户、状态、日期、付款、库存风险、发货方式。
- Table：订单号、客户、金额、VAT、状态、付款、库存、创建时间、操作。
- Drawer：订单详情、商品明细、客户备注、发票资料、状态流。
- 操作：确认订单、开始拣货、打包、发货、取消、部分发货。

发货必须调用后端 RPC，UI 不直接修改库存。

### 11.3 商品/PIM

SKU 字段必须覆盖：

- SKU
- 品牌
- 型号
- 型号代码
- 品类
- 质量等级
- 颜色
- 是否带框
- 成本价
- 零售价
- B2B价格
- 阶梯价
- 库存
- 库位
- 批次号
- 供应商
- 质保期
- 重量
- 是否电池
- 是否危险品
- 文件：MSDS / UN38.3
- SEO 标题与描述
- 兼容型号
- 替代 SKU
- 加购商品

PIM 页面必须提供：

- Table 列表。
- Drawer 编辑。
- 批量导入预留。
- 商品图片管理。
- 质量等级说明。
- 兼容型号表。

### 11.4 库存

库存状态：

| 状态 | 含义 |
|---|---|
| Available | 可售 |
| Reserved | 已被订单占用 |
| Incoming | 在途 |
| QC Pending | 待检测 |
| RMA Pending | 售后待检 |
| Defective | 残次 |
| Quarantine | 隔离 |
| Discontinued | 停售 |

库存 UI 必须区分：

- 实际库存。
- 可售库存。
- 锁定库存。
- 待检库存。
- RMA库存。
- 残次库存。
- 批次。
- 库位。

### 11.5 RMA 管理

RMA 后台必须支持：

- 查看客户上传的照片/视频。
- 记录检测结论。
- 标记通过、拒绝、换货、退款、credit note。
- 跟踪批次异常。
- 将电池问题进入隔离状态。

### 11.6 报表

首版报表以 Ant Design Table + Statistic + 简单图表为主：

- 销售额。
- 订单数。
- 客户复购。
- 缺货 SKU。
- 低库存 SKU。
- RMA率。
- 供应商不良率。

---

## 12. 图片与素材规范

### 12.1 商品图

| 项目 | 要求 |
|---|---|
| 背景 | 白底或浅灰底 |
| 比例 | 1:1 为主，详情图可 4:3 |
| 清晰度 | 重点 SKU 至少 1200px 宽 |
| 格式 | WebP 优先 |
| 角度 | 正面、背面、接口细节、包装 |
| 真实性 | 不建议只用供应商渲染图 |
| 水印 | 不得遮挡细节 |

屏幕类必须拍：

- 正面。
- 背面。
- 排线位置。
- 是否带框。
- 连接器细节。
- 版本对比，如有必要。

尾插类必须拍：

- 正面。
- 背面。
- 接口特写。
- 麦克风/天线位置。
- 颜色版本。

### 12.2 Banner

Banner 不超过必要数量，每个 Banner 只能有一个目标：

- B2B 开户。
- 新品到货。
- 清仓促销。
- 电池安全说明。
- 当天发货截止时间。

Banner 文案不超过两行，只放一个主按钮。

---

## 13. 性能与可访问性

### 13.1 性能目标

| 指标 | 目标 |
|---|---:|
| 首屏主要内容 | 尽量 2 秒内可见 |
| 搜索反馈 | 尽量 1 秒内响应 |
| 商品图 | 响应式尺寸 + 懒加载 + WebP |
| 分类页 | 分页或无限加载，不一次性加载数百 SKU |
| 加购 | 局部反馈，不刷新整页 |
| 筛选 | URL 可分享，已选条件保留 |

### 13.2 可访问性

- 移动端触控区域不低于 44px。
- 表单标签不能只依赖 placeholder。
- 错误提示必须有文字，不只靠红色。
- 商品图必须有 alt。
- 语言切换必须明确当前语言。
- VAT 是否包含必须明确。
- 搜索、表单、后台表格必须支持键盘操作。

---

## 14. 验收标准

### 14.1 完整 MVP 覆盖

必须覆盖：

- 首页。
- 强搜索。
- 商品分类。
- 品牌页。
- 型号页。
- 商品详情。
- B2B注册。
- 登录看价。
- 购物车。
- 结账。
- Stripe / PayPal / 银行转账入口。
- VAT / 发票字段。
- 客户中心。
- 订单查询。
- RMA申请和状态。
- 法律页。
- 员工后台订单。
- 员工后台库存。
- 商品/PIM。

### 14.2 权限视觉状态

| 用户 | 必须看到 | 必须隐藏/禁止 |
|---|---|---|
| 访客 | 商品信息、库存状态、登录看价文案 | 价格、加购、购物车、结账、订单 |
| 登录客户 | B2B价、阶梯价、加购、订单、RMA | 其他客户订单、员工后台数据 |
| 员工 | 后台订单、库存、客户、价格组 | 不属于角色权限的后台模块 |

### 14.3 响应式检查

必须检查：

- 360px：不横向溢出。
- 390px：商品卡、搜索、底部加购栏正常。
- 430px：筛选抽屉和购物车可用。
- 768px：双列或平板布局正常。
- 1280px：桌面采购效率正常。
- 1440px：内容不被拉得过宽。

### 14.4 Ant Design Vue 一致性

必须确认：

- 主题由 ConfigProvider 统一。
- 图标使用 `@ant-design/icons-vue`。
- 页面主结构使用 Ant Design Vue 组件。
- 表格、抽屉、表单、步骤条、标签、提示、空状态样式一致。
- 不再使用 Element Plus 作为实现基准。

---

## 15. 官方参考与资源

### 15.1 官方参考

- [Ant Design 首页](https://ant-design.antgroup.com/index-cn)
- [Ant Design 设计价值观](https://ant-design.antgroup.com/docs/spec/values-cn)
- [Ant Design 色彩](https://ant-design.antgroup.com/docs/spec/colors-cn)
- [Ant Design 布局](https://ant-design.antgroup.com/docs/spec/layout-cn)
- [Ant Design 字体](https://ant-design.antgroup.com/docs/spec/font-cn)
- [Ant Design 导航](https://ant-design.antgroup.com/docs/spec/navigation-cn)
- [Ant Design 按钮](https://ant-design.antgroup.com/docs/spec/buttons-cn)
- [Ant Design 数据列表](https://ant-design.antgroup.com/docs/spec/data-list-cn)
- [Ant Design 详情页](https://ant-design.antgroup.com/docs/spec/detail-page-cn)
- [Ant Design 表单页](https://ant-design.antgroup.com/docs/spec/research-form-cn)
- [Ant Design 资源页](https://ant-design.antgroup.com/docs/resources-cn)
- [Ant Design Vue 介绍](https://www.antdv.com/docs/vue/introduce)
- [Ant Design Vue 组件总览](https://www.antdv.com/components/overview-cn)

### 15.2 官方资源下载项

以下资源来自 Ant Design 官方资源页或官方资源入口，供设计阶段下载使用：

| 资源 | 用途 | 链接 |
|---|---|---|
| Sketch 组件包 | 桌面端组件设计稿 | [Ant Design 资源页](https://ant-design.antgroup.com/docs/resources-cn) |
| Mobile Components | 移动端组件设计稿 | [Ant Design 资源页](https://ant-design.antgroup.com/docs/resources-cn) |
| Ant Design Pro 典型页面模板 | 后台和企业级页面参考 | [Ant Design 资源页](https://ant-design.antgroup.com/docs/resources-cn) |
| Chart 组件包 | 报表和后台数据可视化 | [Ant Design 资源页](https://ant-design.antgroup.com/docs/resources-cn) |
| Kitchen Sketch 工具集 | Sketch 工作流增强 | [Ant Design 资源页](https://ant-design.antgroup.com/docs/resources-cn) |
| Ant Design Landing 首页模板集 | 首页区块参考 | [Ant Design Landing](https://landing.ant.design/docs/download-cn) |

可直接记录的下载链接：

```text
Ant Design Sketch UI Kit:
https://github.com/ant-design/ant-design/releases/download/5.13.3/AntDesign5.0_UI.KIT_202401.sketch

Ant Design Pro 典型页面模板:
https://gw.alipayobjects.com/os/bmw-prod/22208f9d-f8c5-4d7c-b87a-fec290e96527.sketch

Chart 组件包:
https://gw.alipayobjects.com/os/bmw-prod/704968a5-2641-484e-9f65-c2735b2c0287.sketch
```

---

## 16. 首版实现优先级

第一优先级：

1. 首页。
2. 搜索结果页。
3. 分类页。
4. 商品详情页。
5. B2B注册页。
6. 登录页。
7. 购物车。
8. 结账页。
9. 客户中心基础页。
10. RMA申请页。
11. 法律和政策页基础样式。
12. 员工后台订单。
13. 员工后台库存。
14. 商品/PIM 基础管理。

第二优先级：

1. Excel/CSV 批量下单。
2. 高级报价单页面。
3. 复杂客户中心仪表盘。
4. 多语言 SEO 内容页。
5. 高级产品对比页。
6. AI 客服入口。
7. 大客户 API 文档页。

---

## 17. 最终设计原则

PartsPro UI 必须始终坚持：

1. 搜索比营销更重要。
2. 型号、SKU、兼容性、质量等级必须清楚。
3. 访客可浏览但不能看 B2B 价格。
4. 登录客户看到自己的价格、阶梯价和复购入口。
5. 购物车和下单价格必须由后端重新计算，UI 不可信任前端价格。
6. 库存变化必须通过后端 RPC，UI 不直接改库存。
7. RMA、安装提醒、电池安全从首版就进入页面。
8. 意大利 VAT、发票、GDPR、Cookie、退货和电池安全必须有明确入口。
9. 移动端优先快速搜索和下单，桌面端优先筛选、表格和批量采购效率。
10. Ant Design Vue 是唯一 UI 实现基准。
