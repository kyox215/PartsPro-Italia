export const locales = ["it", "zh"] as const;

export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const defaultLocale: Locale = "it";

export const dictionaries = {
  it: {
    brand: "PartsPro Italia",
    languageName: "Italiano",
    nav: {
      products: "Catalogo",
      account: "Account",
      admin: "Admin",
      cart: "Carrello",
    },
    common: {
      inStock: "Disponibile",
      lowStock: "Scorte basse",
      outOfStock: "Esaurito",
      preorder: "In arrivo",
      retail: "Prezzo retail",
      b2b: "Prezzo wholesale",
      vat: "IVA esclusa",
      moq: "MOQ",
      search: "Cerca modello, SKU o ricambio",
      viewProduct: "Apri scheda",
      addToCart: "Aggiungi",
      accountProfile: "Completa profilo account",
      startOrder: "Inizia ordine",
      submit: "Invia",
    },
    home: {
      eyebrow: "Ricambi per riparatori in Italia",
      title: "Ricambi smartphone pronti per ordini wholesale rapidi",
      subtitle:
        "Cerca per brand, modello, qualita e SKU. Gestisci prezzi wholesale, stock, ordini e fatturazione con una piattaforma pensata per negozi di riparazione.",
      primaryCta: "Sfoglia catalogo",
      secondaryCta: "Login / registrazione",
      stockPromise: "24/48h spedizione Italia",
      searchTitle: "Trova il ricambio corretto",
      categoriesTitle: "Categorie operative",
      featuredTitle: "SKU pronti per MVP",
      trustTitle: "Flusso pensato per grossisti",
    },
    products: {
      title: "Catalogo ricambi",
      subtitle:
        "Filtra per brand, modello, categoria, qualita e disponibilita. I dati sono pronti per essere collegati a Supabase.",
      allBrands: "Tutti i brand",
      allCategories: "Tutte le categorie",
      allModels: "Tutti i modelli",
    },
    product: {
      compatibility: "Compatibilita",
      quality: "Qualita",
      tiers: "Prezzi a scalare",
      installationNotice: "Testare prima dell'installazione",
      installationCopy:
        "Collegare il ricambio alla scheda madre e verificare display, touch, carica o funzioni specifiche prima di incollare o chiudere il dispositivo.",
    },
    checkout: {
      title: "Checkout MVP",
      subtitle:
        "Questo flusso crea ordini con carta Stripe, contanti o bonifico. Le chiavi reali vanno impostate su Vercel.",
      customer: "Dati cliente",
      company: "Dati fattura",
      payment: "Pagamento",
      stripe: "Carta con Stripe",
      bank: "Bonifico bancario",
    },
    account: {
      title: "Area cliente",
      subtitle:
        "Ordini, fatture, riordino e indirizzi. L'accesso reale e gestito da Supabase Auth.",
    },
    admin: {
      title: "Pannello operativo",
      subtitle:
        "Console interna per prodotti, stock, ordini e clienti wholesale. L'accesso e limitato agli admin.",
      warning:
        "Collegare Supabase e impostare ADMIN_EMAIL prima di usare dati reali.",
    },
    legal: {
      title: "Pagine legali e operative",
      privacy: "Privacy policy",
      cookies: "Cookie policy",
      terms: "Condizioni di vendita",
      returns: "Resi e garanzia",
      battery: "Sicurezza batterie",
      quality: "Guida qualita",
    },
  },
  zh: {
    brand: "PartsPro Italia",
    languageName: "中文",
    nav: {
      products: "商品目录",
      account: "账户中心",
      admin: "后台",
      cart: "购物车",
    },
    common: {
      inStock: "有现货",
      lowStock: "低库存",
      outOfStock: "缺货",
      preorder: "在途",
      retail: "零售价",
      b2b: "批发价",
      vat: "未税",
      moq: "起订量",
      search: "搜索型号、SKU 或配件",
      viewProduct: "查看商品",
      addToCart: "加入购物车",
      accountProfile: "完善账户资料",
      startOrder: "开始下单",
      submit: "提交",
    },
    home: {
      eyebrow: "面向意大利维修店的配件平台",
      title: "为批发采购设计的手机维修配件网站",
      subtitle:
        "按品牌、型号、质量等级和 SKU 快速找货。首版支持批发价格、库存、订单和发票资料流程。",
      primaryCta: "查看商品目录",
      secondaryCta: "登录 / 注册",
      stockPromise: "意大利 24/48 小时发货",
      searchTitle: "快速找到正确配件",
      categoriesTitle: "核心品类",
      featuredTitle: "MVP 首批 SKU",
      trustTitle: "批发业务流程",
    },
    products: {
      title: "维修配件目录",
      subtitle:
        "支持按品牌、型号、品类、质量等级和库存筛选。数据结构已经为 Supabase 接入准备好。",
      allBrands: "全部品牌",
      allCategories: "全部品类",
      allModels: "全部型号",
    },
    product: {
      compatibility: "兼容型号",
      quality: "质量等级",
      tiers: "阶梯价格",
      installationNotice: "安装前测试提醒",
      installationCopy:
        "正式安装前请先连接主板测试显示、触控、充电或对应功能，确认无误后再粘胶和装机。",
    },
    checkout: {
      title: "MVP 结账流程",
      subtitle:
        "此流程用于创建订单，支持 Stripe 银行卡、现金和银行转账。真实密钥需要在 Vercel 环境变量中配置。",
      customer: "客户资料",
      company: "发票资料",
      payment: "付款方式",
      stripe: "Stripe 银行卡",
      bank: "银行转账",
    },
    account: {
      title: "客户账户中心",
      subtitle:
        "订单、发票、重复购买和地址。真实登录由 Supabase Auth 管理。",
    },
    admin: {
      title: "运营后台",
      subtitle:
        "内部管理商品、库存、订单和批发客户。只有管理员角色可以访问。",
      warning: "使用真实数据前，请先配置 Supabase 和 ADMIN_EMAIL。",
    },
    legal: {
      title: "法律与运营页面",
      privacy: "隐私政策",
      cookies: "Cookie 政策",
      terms: "销售条款",
      returns: "质保说明",
      battery: "电池安全说明",
      quality: "质量等级说明",
    },
  },
} satisfies Record<Locale, Record<string, unknown>>;

export type Dictionary = (typeof dictionaries)[Locale];

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}

export function localizePath(locale: Locale, path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${cleanPath === "/" ? "" : cleanPath}`;
}
