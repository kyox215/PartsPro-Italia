# PartsPro - SECURITY.md

## 1. 环境变量

禁止提交：

```txt
.env.local
.env
SUPABASE_SERVICE_ROLE_KEY
```

必须提交：

```txt
.env.example
```

---

## 2. Supabase 安全规则

- 所有业务表必须启用 RLS。
- service role 只允许 server side 使用。
- browser client 只使用 publishable key。
- Admin 页面必须校验 role。
- 用户只能访问自己的订单和资料。

---

## 3. Storage 安全

Buckets：

```txt
product-images
brand-logos
category-icons
rma-uploads
```

规则：

- 商品图公开读。
- 上传仅 admin/staff。
- RMA 上传仅登录用户。
- 限制文件类型和大小。

---

## 4. 前端安全

- 不在前端暴露 service role。
- 不在组件中硬编码密钥。
- 所有表单使用 Zod 验证。
- 所有用户输入需要转义/清洗。
- 删除操作必须 Confirm Dialog。

---

## 5. 后台安全

- `/admin/*` 全部保护。
- 非 admin/staff 不可访问后台。
- 删除数据限制 admin。
- 批量操作需要二次确认。

---

## 6. 上线前检查

- [ ] 修改本地 admin 密码。
- [ ] 关闭 debug 日志。
- [ ] 检查 RLS。
- [ ] 检查 Vercel ENV。
- [ ] 检查 Storage Policy。
- [ ] 检查 no secret in git。
