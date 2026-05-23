import { createRouter, createWebHistory } from 'vue-router'
import StorefrontLayout from '@/layouts/StorefrontLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useCustomerStore } from '@/stores/customer.store'
import type { RouteAccess } from '@/types/auth'

const HomePage = () => import('@/pages/storefront/HomePage.vue')
const ProductsPage = () => import('@/pages/storefront/ProductsPage.vue')
const ProductDetailPage = () => import('@/pages/storefront/ProductDetailPage.vue')
const LoginPage = () => import('@/pages/storefront/LoginPage.vue')
const B2BRegisterPage = () => import('@/pages/storefront/B2BRegisterPage.vue')
const AccountPage = () => import('@/pages/storefront/AccountPage.vue')
const AccountOrdersPage = () => import('@/pages/storefront/AccountOrdersPage.vue')
const AccountCompanyPage = () => import('@/pages/storefront/AccountCompanyPage.vue')
const FrequentProductsPage = () => import('@/pages/storefront/FrequentProductsPage.vue')
const CartPage = () => import('@/pages/storefront/CartPage.vue')
const CheckoutPage = () => import('@/pages/storefront/CheckoutPage.vue')
const RmaPage = () => import('@/pages/storefront/RmaPage.vue')
const LegalPage = () => import('@/pages/storefront/LegalPage.vue')
const PlaceholderPage = () => import('@/pages/storefront/PlaceholderPage.vue')
const AdminB2BApprovalsPage = () => import('@/pages/admin/AdminB2BApprovalsPage.vue')
const AdminBatchesPage = () => import('@/pages/admin/AdminBatchesPage.vue')
const AdminCustomersPage = () => import('@/pages/admin/AdminCustomersPage.vue')
const AdminDashboardPage = () => import('@/pages/admin/AdminDashboardPage.vue')
const AdminInventoryPage = () => import('@/pages/admin/AdminInventoryPage.vue')
const AdminOrderDetailPage = () => import('@/pages/admin/AdminOrderDetailPage.vue')
const AdminOrdersPage = () => import('@/pages/admin/AdminOrdersPage.vue')
const AdminPlaceholderPage = () => import('@/pages/admin/AdminPlaceholderPage.vue')
const AdminPricesPage = () => import('@/pages/admin/AdminPricesPage.vue')
const AdminProductsPage = () => import('@/pages/admin/AdminProductsPage.vue')
const AdminStockMovementsPage = () => import('@/pages/admin/AdminStockMovementsPage.vue')

function getSafeReturnUrl(value: unknown) {
  const returnUrl = Array.isArray(value) ? value[0] : value

  if (typeof returnUrl !== 'string' || !returnUrl.startsWith('/') || returnUrl.startsWith('//')) {
    return ''
  }

  return returnUrl
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: StorefrontLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: HomePage,
          meta: {
            title: 'Home',
            access: 'public',
          },
        },
        {
          path: 'products',
          name: 'products',
          component: ProductsPage,
          meta: {
            title: 'Catalogo prodotti',
            description: 'Ricerca, filtri, griglia/lista prodotti e prezzi B2B dopo login.',
            access: 'public',
          },
        },
        {
          path: 'products/:productRef',
          name: 'product-detail',
          component: ProductDetailPage,
          meta: {
            title: 'Dettaglio prodotto',
            description: 'Immagini, compatibilita, qualita, stock, prezzo e RMA.',
            access: 'public',
          },
        },
        {
          path: 'brands/:brand',
          name: 'brand',
          component: PlaceholderPage,
          meta: {
            title: 'Pagina brand',
            description: 'Ingresso per ricambi filtrati per brand.',
            access: 'public',
          },
        },
        {
          path: 'models/:model',
          name: 'model',
          component: PlaceholderPage,
          meta: {
            title: 'Pagina modello',
            description: 'Tutti i ricambi disponibili per uno specifico modello.',
            access: 'public',
          },
        },
        {
          path: 'quality-guide',
          name: 'quality-guide',
          component: PlaceholderPage,
          meta: {
            title: 'Qualita dei ricambi',
            description: 'Original Pull, Refurbished, Soft OLED, Hard OLED, TFT e compatibili.',
            access: 'public',
          },
        },
        {
          path: 'wholesale',
          name: 'wholesale',
          component: PlaceholderPage,
          meta: {
            title: 'Wholesale / B2B',
            description: 'Prezzi B2B, MOQ, fasce quantita, fattura e supporto dedicato.',
            access: 'public',
          },
        },
        {
          path: 'b2b/register',
          name: 'b2b-register',
          component: B2BRegisterPage,
          meta: {
            title: 'Richiedi account B2B',
            description: 'P.IVA, Codice Fiscale, SDI, PEC e dati aziendali.',
            access: 'public',
          },
        },
        {
          path: 'login',
          name: 'login',
          component: LoginPage,
          meta: {
            title: 'Login',
            description: 'Accesso email e Google per clienti e staff.',
            access: 'public',
          },
        },
        {
          path: 'cart',
          name: 'cart',
          component: CartPage,
          meta: {
            title: 'Carrello',
            description: 'Quantita, MOQ, stock, riepilogo e prezzo ricalcolato dal backend.',
            access: 'customer',
          },
        },
        {
          path: 'checkout',
          name: 'checkout',
          component: CheckoutPage,
          meta: {
            title: 'Checkout',
            description: 'Cliente, fatturazione, spedizione, pagamento e conferma.',
            access: 'customer',
          },
        },
        {
          path: 'account',
          name: 'account',
          component: AccountPage,
          meta: {
            title: 'Area cliente',
            description: 'Ordini, riordino veloce, RMA, fatture, indirizzi e dati aziendali.',
            access: 'customer',
          },
        },
        {
          path: 'account/orders',
          name: 'account-orders',
          component: AccountOrdersPage,
          meta: {
            title: 'I miei ordini',
            description: 'Storico ordini e stati di spedizione.',
            access: 'customer',
          },
        },
        {
          path: 'account/orders/:id',
          name: 'account-order-detail',
          component: AccountOrdersPage,
          meta: {
            title: 'Dettaglio ordine',
            description: 'Dettaglio ordine, pagamento, spedizione e RMA.',
            access: 'customer',
          },
        },
        {
          path: 'account/invoices',
          name: 'account-invoices',
          component: PlaceholderPage,
          meta: {
            title: 'Fatture',
            description: 'Download fatture, note credito e dati fiscali cliente.',
            access: 'customer',
          },
        },
        {
          path: 'account/frequent',
          name: 'account-frequent',
          component: FrequentProductsPage,
          meta: {
            title: 'Lista frequenti',
            description: 'Ricambi acquistati spesso e riordino rapido.',
            access: 'customer',
          },
        },
        {
          path: 'account/addresses',
          name: 'account-addresses',
          component: AccountCompanyPage,
          meta: {
            title: 'Indirizzi',
            description: 'Sedi operative, indirizzi di fatturazione e consegna.',
            access: 'customer',
          },
        },
        {
          path: 'account/company',
          name: 'account-company',
          component: AccountCompanyPage,
          meta: {
            title: 'Dati aziendali',
            description: 'P.IVA, SDI, PEC, referente e profilo B2B.',
            access: 'customer',
          },
        },
        {
          path: 'account/prices',
          name: 'account-prices',
          component: PlaceholderPage,
          meta: {
            title: 'Prezzi dedicati',
            description: 'Gruppo prezzo, condizioni B2B e fasce quantita.',
            access: 'customer',
          },
        },
        {
          path: 'account/rma',
          name: 'account-rma',
          component: RmaPage,
          meta: {
            title: 'RMA',
            description: 'Richiesta assistenza, caricamento foto/video e stato pratica.',
            access: 'customer',
          },
        },
        {
          path: 'legal/:page',
          name: 'legal',
          component: LegalPage,
          meta: {
            title: 'Pagine legali',
            description: 'Termini, Privacy, Cookie, Resi, Garanzia, Spedizioni e Batterie.',
            access: 'public',
          },
        },
      ],
    },
    {
      path: '/admin',
      component: AdminLayout,
      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: AdminDashboardPage,
          meta: {
            title: '仪表盘',
            access: 'staff',
          },
        },
        {
          path: 'orders',
          name: 'admin-orders',
          component: AdminOrdersPage,
          meta: {
            title: '订单',
            description: '管理已提交、已受理、拣货中、已打包、已发货、已完成订单。',
            access: 'staff',
          },
        },
        {
          path: 'orders/:id',
          name: 'admin-order-detail',
          component: AdminOrderDetailPage,
          meta: {
            title: '订单详情',
            description: '客户、商品、备注、发票、库存和时间线。',
            access: 'staff',
          },
        },
        {
          path: 'products',
          name: 'admin-products',
          component: AdminProductsPage,
          meta: {
            title: '商品 / PIM',
            description: 'SKU、品牌、机型、品质、兼容型号和媒体资料。',
            access: 'staff',
          },
        },
        {
          path: 'inventory',
          name: 'admin-inventory',
          component: AdminInventoryPage,
          meta: {
            title: '库存',
            description: '实际库存、锁定库存、可用库存、QC、RMA、瑕疵和库位。',
            access: 'staff',
          },
        },
        {
          path: 'stock-movements',
          name: 'admin-stock-movements',
          component: AdminStockMovementsPage,
          meta: {
            title: '库存流水',
            description: '入库、出库、锁定、发货、RMA 和库存调整。',
            access: 'staff',
          },
        },
        {
          path: 'batches',
          name: 'admin-batches',
          component: AdminBatchesPage,
          meta: {
            title: '批次',
            description: '批次、供应商、QC、电池安全和追踪。',
            access: 'staff',
          },
        },
        {
          path: 'customers',
          name: 'admin-customers',
          component: AdminCustomersPage,
          meta: {
            title: '客户',
            description: '客户、公司、P.IVA、SDI、PEC、等级和地址。',
            access: 'staff',
          },
        },
        {
          path: 'b2b-approvals',
          name: 'admin-b2b-approvals',
          component: AdminB2BApprovalsPage,
          meta: {
            title: 'B2B 审核',
            description: '审核开户申请、客户等级和价格组。',
            access: 'staff',
          },
        },
        {
          path: 'prices',
          name: 'admin-prices',
          component: AdminPricesPage,
          meta: {
            title: '价格组',
            description: 'B2B 价格、数量阶梯和专属价格。',
            access: 'staff',
          },
        },
        {
          path: 'rma',
          name: 'admin-rma',
          component: AdminPlaceholderPage,
          meta: {
            title: 'RMA',
            description: '管理售后申请、证据、处理决定、换货和信用单。',
            access: 'staff',
          },
        },
        {
          path: 'settings/users',
          name: 'admin-users',
          component: AdminPlaceholderPage,
          meta: {
            title: '员工设置',
            description: '销售、仓库、采购和管理员角色。',
            access: 'admin',
          },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: {
        name: 'home',
      },
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  await authStore.initializeAuth()

  const access = (to.meta.access as RouteAccess | undefined) || 'public'

  if (to.name === 'login' && authStore.isAuthenticated) {
    const returnUrl = getSafeReturnUrl(to.query.returnUrl)

    if (returnUrl && returnUrl !== '/login') {
      const resolvedReturnRoute = router.resolve(returnUrl)
      const returnAccess = (resolvedReturnRoute.meta.access as RouteAccess | undefined) || 'public'

      if (authStore.canAccess(returnAccess)) {
        return returnUrl
      }
    }

    return authStore.isStaff ? { name: 'admin-dashboard' } : { name: 'products' }
  }

  if (authStore.canAccess(access) && to.name === 'checkout') {
    const customerStore = useCustomerStore()

    try {
      await customerStore.ensureLoaded(authStore.profile?.email || '')
    } catch {
      return {
        name: 'account-company',
        query: {
          returnUrl: to.fullPath,
        },
      }
    }

    if (!customerStore.isComplete) {
      return {
        name: 'account-company',
        query: {
          returnUrl: to.fullPath,
        },
      }
    }
  }

  if (authStore.canAccess(access)) {
    return true
  }

  if (access === 'customer') {
    return {
      name: 'login',
      query: {
        returnUrl: to.fullPath,
      },
    }
  }

  return {
    name: 'login',
    query: {
      returnUrl: to.fullPath,
    },
  }
})
