# PartsPro - DESIGN_TOKENS.md

## 1. Token 目标

本文件定义 PartsPro 的视觉设计 token，供 TailwindCSS、shadcn/ui 和 Codex 开发使用。

设计目标：

```txt
Modern SaaS
高密度 B2B 采购
移动端优先
扁平化
轻渐变
微交互
```

---

## 2. Colors

### Primary

| Token | HEX | 用途 |
|---|---|---|
| primary | #6366F1 | 主按钮、active、重点 CTA |
| primary-hover | #4F46E5 | hover |
| primary-soft | #EEF2FF | 浅背景 |
| primary-border | #C7D2FE | focus / active border |

### Accent

| Token | HEX | 用途 |
|---|---|---|
| purple | #8B5CF6 | 渐变强调 |
| blue | #3B82F6 | 信息 |
| cyan | #06B6D4 | 图表辅助 |
| emerald | #22C55E | 成功 |
| amber | #F59E0B | 警告 |
| red | #EF4444 | 错误 |

### Neutral

| Token | HEX | 用途 |
|---|---|---|
| background | #F8FAFC | 页面背景 |
| surface | #FFFFFF | 卡片/面板 |
| surface-muted | #F1F5F9 | 次级背景 |
| border | #E5E7EB | 边框 |
| divider | #EEF2F7 | 分割线 |
| text | #111827 | 主文字 |
| text-muted | #6B7280 | 次文字 |
| text-light | #9CA3AF | 说明文字 |

---

## 3. Gradients

```css
--gradient-primary: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
--gradient-blue: linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%);
--gradient-success: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
--gradient-warning: linear-gradient(135deg, #F59E0B 0%, #FB923C 100%);
--gradient-danger: linear-gradient(135deg, #EF4444 0%, #F87171 100%);
```

---

## 4. Typography

```css
font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

| Token | Size | Weight | Line Height |
|---|---:|---:|---:|
| display | 32px | 700 | 40px |
| h1 | 28px | 700 | 36px |
| h2 | 24px | 600 | 32px |
| h3 | 20px | 600 | 28px |
| body | 14px | 400 | 22px |
| small | 12px | 500 | 18px |
| caption | 11px | 500 | 16px |

移动端建议：

| Token | Size |
|---|---:|
| mobile-title | 18px |
| mobile-body | 13px |
| mobile-caption | 11px |

---

## 5. Spacing

采用 4pt + 8pt Hybrid Grid。

| Token | px |
|---|---:|
| 0 | 0 |
| 1 | 4 |
| 2 | 8 |
| 3 | 12 |
| 4 | 16 |
| 5 | 20 |
| 6 | 24 |
| 8 | 32 |
| 10 | 40 |
| 12 | 48 |

---

## 6. Radius

| Token | px | 用途 |
|---|---:|---|
| xs | 2 | 表格细节 |
| sm | 4 | 小 Badge |
| md | 6 | 小按钮 |
| lg | 8 | Input / Button |
| xl | 12 | Card |
| 2xl | 16 | Modal / Drawer |
| full | 999 | Pill Badge |

---

## 7. Shadow

| Token | CSS |
|---|---|
| xs | `0 1px 2px rgba(0,0,0,0.03)` |
| sm | `0 2px 6px rgba(0,0,0,0.05)` |
| md | `0 4px 12px rgba(0,0,0,0.06)` |
| modal | `0 8px 24px rgba(0,0,0,0.08)` |

规则：

```txt
默认少用阴影
优先 border
hover 才加轻阴影
```

---

## 8. Motion

| Token | Duration | 用途 |
|---|---:|---|
| fast | 120ms | hover |
| normal | 180ms | button / input |
| slow | 240ms | drawer / modal |
| page | 300ms | 页面切换 |

Easing：

```css
cubic-bezier(0.22, 1, 0.36, 1)
```

---

## 9. Breakpoints

| Token | px |
|---|---:|
| xs | 360 |
| sm | 640 |
| md | 768 |
| lg | 1024 |
| xl | 1280 |
| 2xl | 1440 |

---

## 10. Density

### Mobile Dense Card

```txt
image: 64-72px
card height: 112-140px
padding: 8-12px
title: 13px
sku: 11px
price: 14px semibold
```

### Admin Dense Table

```txt
row height: 40-44px
cell padding: 8px 12px
font: 13px
header: 12px semibold uppercase
```

---

## 11. Z-Index

| Token | Value |
|---|---:|
| header | 40 |
| bottom-nav | 45 |
| drawer | 50 |
| modal | 60 |
| toast | 80 |
| tooltip | 90 |
