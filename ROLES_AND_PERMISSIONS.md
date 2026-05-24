# PartsPro - ROLES_AND_PERMISSIONS.md

## 1. 角色设计

| Role | 说明 |
|---|---|
| admin | 系统最高权限 |
| manager | 运营管理 |
| staff | 普通后台员工 |
| warehouse | 仓库员工 |
| customer | 普通客户 |
| b2b_customer | 已审核 B2B 客户 |

---

## 2. 权限矩阵

| 功能 | admin | manager | staff | warehouse | customer | b2b_customer |
|---|---|---|---|---|---|---|
| 访问后台 | yes | yes | yes | limited | no | no |
| 商品管理 | yes | yes | yes | no | no | no |
| 库存管理 | yes | yes | read | yes | no | no |
| 订单管理 | yes | yes | yes | limited | own | own |
| 客户管理 | yes | yes | read | no | own | own |
| B2B审核 | yes | yes | no | no | no | no |
| 价格管理 | yes | yes | no | no | no | no |
| 删除数据 | yes | limited | no | no | no | no |
| 查看B2B价格 | yes | yes | yes | no | no | yes |

---

## 3. 本地测试管理员

```txt
email: kyox120@gmail.com
password: admin
role: admin
```

注意：仅本地开发使用，上线必须更改。

---

## 4. 后台路由保护

需要保护：

```txt
/admin
/admin/products
/admin/orders
/admin/customers
/admin/inventory
/admin/analytics
```

规则：

```txt
未登录 → redirect /login
无权限 → redirect /account 或 /403
```

---

## 5. B2B 状态

```txt
pending
approved
rejected
suspended
```

显示逻辑：

- `pending`：显示“审核中”
- `approved`：显示 B2B 价格
- `rejected`：显示联系客服
- `suspended`：隐藏 B2B 价格
