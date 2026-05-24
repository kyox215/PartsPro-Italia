export type Locale = "it" | "en" | "zh";

export type CartLabels = {
  cart: string;
  empty: string;
  subtotal: string;
  checkout: string;
  clear: string;
  increase: string;
  decrease: string;
  remove: string;
};

export type Dictionary = {
  app: {
    name: string;
    tagline: string;
    description: string;
    status: string;
  };
  auth: {
    login: {
      title: string;
      description: string;
      submit: string;
      submitting: string;
      switchText: string;
      switchAction: string;
    };
    register: {
      title: string;
      description: string;
      submit: string;
      submitting: string;
      switchText: string;
      switchAction: string;
    };
    fields: {
      fullName: string;
      fullNamePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      password: string;
      passwordPlaceholder: string;
      showPassword: string;
      hidePassword: string;
    };
    validation: {
      email: string;
      password: string;
      fullName: string;
    };
    toast: {
      signedIn: {
        title: string;
        description: string;
      };
      registered: {
        title: string;
        description: string;
      };
      checkEmail: {
        title: string;
        description: string;
      };
      invalidFields: {
        title: string;
        description: string;
      };
      invalidCredentials: {
        title: string;
        description: string;
      };
      authFailed: {
        title: string;
        description: string;
      };
      profileFailed: {
        title: string;
        description: string;
      };
    };
    account: {
      title: string;
      description: string;
      email: string;
      role: string;
      signOut: string;
    };
    admin: {
      title: string;
      description: string;
      roleLabel: string;
    };
    forbidden: {
      title: string;
      description: string;
      action: string;
    };
  };
  home: {
    header: {
      categories: string;
      search: string;
      cart: string;
      account: string;
    };
    cart: CartLabels;
    hero: {
      eyebrow: string;
      title: string;
      description: string;
      primary: string;
      secondary: string;
    };
    search: {
      placeholder: string;
      button: string;
      camera: string;
      clear: string;
      toastTitle: string;
      toastDescription: string;
    };
    categories: {
      title: string;
      viewAll: string;
    };
    products: {
      title: string;
      description: string;
      viewAll: string;
      stock: string;
      add: string;
      toastTitle: string;
      toastDescription: string;
    };
    b2b: {
      title: string;
      description: string;
      primary: string;
      secondary: string;
      benefits: string[];
    };
    brands: {
      title: string;
      description: string;
      viewAll: string;
    };
    mobileNav: {
      home: string;
      categories: string;
      cart: string;
      favorites: string;
      account: string;
    };
  };
  catalog: {
    header: Dictionary["home"]["header"];
    cart: CartLabels;
    mobileNav: Dictionary["home"]["mobileNav"];
    search: {
      placeholder: string;
      submit: string;
    };
    products: {
      title: string;
      description: string;
    };
    searchPage: {
      title: string;
      description: string;
    };
    brand: {
      description: string;
    };
    filters: {
      filters: string;
      categories: string;
      brands: string;
      quality: string;
      all: string;
    };
    results: {
      count: string;
    };
    productCard: {
      empty: string;
      stock: string;
      model: string;
      add: string;
      addedTitle: string;
      addedDescription: string;
      inStock: string;
      lowStock: string;
      outOfStock: string;
    };
    detail: {
      back: string;
      skuList: string;
      models: string;
      category: string;
      brand: string;
      stock: string;
      quality: string;
      price: string;
      moq: string;
      add: string;
      addedTitle: string;
      addedDescription: string;
      related: string;
      inStock: string;
      lowStock: string;
      outOfStock: string;
    };
  };
  admin: {
    sidebar: {
      dashboard: string;
      products: string;
      orders: string;
      customers: string;
      inventory: string;
      storefront: string;
      role: string;
    };
    topbar: {
      search: string;
      export: string;
      create: string;
      sync: string;
    };
    dashboard: {
      title: string;
      description: string;
      salesTrend: string;
      orderStatus: string;
      inventoryStatus: string;
      recentOrders: string;
      metrics: Record<string, string>;
    };
    pages: {
      products: {
        title: string;
        description: string;
      };
      orders: {
        title: string;
        description: string;
      };
      customers: {
        title: string;
        description: string;
      };
      inventory: {
        title: string;
        description: string;
      };
    };
    table: {
      search: string;
      empty: string;
      rows: string;
      selected: string;
      previousPage: string;
      nextPage: string;
      bulkExport: string;
      bulkStatus: string;
      view: string;
      edit: string;
      confirm: string;
      cancel: string;
      confirmTitle: string;
      confirmDescription: string;
      toastTitle: string;
      toastDescription: string;
      columns: Record<string, string>;
    };
    status: Record<string, string>;
  };
  stack: {
    items: string[];
  };
};

export type {
  AppRole,
  CustomerStatus,
  CustomerType,
  Database,
  InventoryRow,
  InventoryStatus,
  Json,
  OrderPaymentStatus,
  OrderRow,
  OrderStatus,
  PriceGroup,
  ProductRow,
  ProductSkuRow,
  ProductStatus,
  ProductType,
  QualityGrade,
} from "./database";
