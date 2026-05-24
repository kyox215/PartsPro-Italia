# PartsPro - UI_ACCEPTANCE_CHECKLIST.md

## 1. 全局 UI 验收

- [ ] 页面使用现代 SaaS 风格。
- [ ] 不使用大面积深色背景。
- [ ] 不使用未批准的重型 UI 框架。
- [ ] 使用 TailwindCSS + shadcn/ui。
- [ ] 使用 Lucide React 图标。
- [ ] 所有关键操作有 Toast。
- [ ] 所有加载状态有 Skeleton。
- [ ] 所有删除操作有 Confirm Dialog。
- [ ] 所有表单有 Zod 验证。
- [ ] 所有页面支持 it/en/zh 结构。

---

## 2. 移动端验收

- [ ] 360px 宽度不横向溢出。
- [ ] 商品卡一屏至少显示 3 个左右。
- [ ] 商品卡显示 SKU、价格、库存、质量等级。
- [ ] 搜索框 sticky 或首屏可见。
- [ ] 底部导航不遮挡内容。
- [ ] Drawer 可正常打开/关闭。
- [ ] 加购按钮可单手点击。
- [ ] Toast 不遮挡底部导航。
- [ ] 图片不加载桌面大图。
- [ ] 列表滚动流畅。

---

## 3. 前台商城验收

- [ ] 首页有搜索入口。
- [ ] 分类入口清楚。
- [ ] 品牌入口清楚。
- [ ] 商品列表支持筛选。
- [ ] 商品详情显示 SKU。
- [ ] 商品详情显示库存。
- [ ] 商品详情显示质量等级。
- [ ] 快速加购触发 Toast。
- [ ] 购物车数量可修改。
- [ ] 空购物车有 Empty State。

---

## 4. 后台验收

- [ ] Sidebar 现代 SaaS 风格。
- [ ] Table 高密度。
- [ ] Table 支持分页。
- [ ] Table 支持排序。
- [ ] Table 支持筛选。
- [ ] Table 支持批量操作。
- [ ] Dashboard KPI 卡片清楚。
- [ ] 删除操作二次确认。
- [ ] 保存操作有 Toast。
- [ ] 无权限无法进入后台。

---

## 5. 性能验收

- [ ] `npm run build` 通过。
- [ ] `npm run lint` 通过。
- [ ] Lighthouse Performance > 85。
- [ ] 首页主要内容 2 秒内可见。
- [ ] 图片使用 next/image。
- [ ] 列表使用分页或加载更多。

---

## 6. 本轮验收记录

2026-05-24 TASK 10 本地验证：

- [x] `npm run lint` 通过。
- [x] `npm run build` 通过。
- [x] 360px 下 `/it`、`/it/products`、`/it/search`、`/it/product/iphone-11-display`、`/en/products`、`/zh/products` 无横向溢出。
- [x] 360px 下商品列表首屏可见 3 张左右商品卡。
- [x] 商品卡保留 SKU、价格、库存、质量等级。
- [x] 加购触发 Toast。
- [x] Toast 不再遮挡移动端购物车按钮或底部导航。
- [x] 购物车 Drawer 可正常打开。
- [x] 未授权访问 `/it/admin` 会跳转 `/it/login?next=%2Fit%2Fadmin`。
- [x] Lighthouse Performance > 85：`/it` 本地生产预览得分 90。
- [ ] 连接真实 Supabase 环境后需复验登录、角色和后台真实数据流。
