import { createRouter, createWebHistory } from 'vue-router'
import StorefrontLayout from '@/layouts/StorefrontLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import { useAuthStore } from '@/stores/auth.store'
import type { RouteAccess } from '@/types/auth'

const HomePage = () => import('@/pages/storefront/HomePage.vue')
const ProductsPage = () => import('@/pages/storefront/ProductsPage.vue')
const ProductDetailPage = () => import('@/pages/storefront/ProductDetailPage.vue')
const LoginPage = () => import('@/pages/storefront/LoginPage.vue')
const B2BRegisterPage = () => import('@/pages/storefront/B2BRegisterPage.vue')
const AccountPage = () => import('@/pages/storefront/AccountPage.vue')
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
          path: 'products/:skuCode',
          name: 'product-detail',
          component: ProductDetailPage,
          meta: {
            title: 'Dettaglio prodotto',
            description: 'Immagini, SKU, compatibilita, qualita, stock, prezzo e RMA.',
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
          component: PlaceholderPage,
          meta: {
            title: 'I miei ordini',
            description: 'Storico ordini e stati di spedizione.',
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
            title: 'Dashboard',
            access: 'staff',
          },
        },
        {
          path: 'orders',
          name: 'admin-orders',
          component: AdminOrdersPage,
          meta: {
            title: 'Ordini',
            description: 'Gestione submitted, accepted, picking, packed, shipped, completed.',
            access: 'staff',
          },
        },
        {
          path: 'orders/:id',
          name: 'admin-order-detail',
          component: AdminOrderDetailPage,
          meta: {
            title: 'Dettaglio ordine',
            description: 'Cliente, articoli, note, fattura, stock e timeline.',
            access: 'staff',
          },
        },
        {
          path: 'products',
          name: 'admin-products',
          component: AdminProductsPage,
          meta: {
            title: 'Prodotti / PIM',
            description: 'SKU, brand, modelli, qualita, compatibilita e media.',
            access: 'staff',
          },
        },
        {
          path: 'inventory',
          name: 'admin-inventory',
          component: AdminInventoryPage,
          meta: {
            title: 'Inventario',
            description: 'Stock reale, bloccato, disponibile, QC, RMA, difettosi e ubicazioni.',
            access: 'staff',
          },
        },
        {
          path: 'stock-movements',
          name: 'admin-stock-movements',
          component: AdminStockMovementsPage,
          meta: {
            title: 'Movimenti stock',
            description: 'Entrate, uscite, blocchi, spedizioni, RMA e rettifiche.',
            access: 'staff',
          },
        },
        {
          path: 'batches',
          name: 'admin-batches',
          component: AdminBatchesPage,
          meta: {
            title: 'Lotti',
            description: 'Batch, fornitori, QC, sicurezza batterie e tracciabilita.',
            access: 'staff',
          },
        },
        {
          path: 'customers',
          name: 'admin-customers',
          component: AdminCustomersPage,
          meta: {
            title: 'Clienti',
            description: 'Clienti, aziende, P.IVA, SDI, PEC, livelli e indirizzi.',
            access: 'staff',
          },
        },
        {
          path: 'b2b-approvals',
          name: 'admin-b2b-approvals',
          component: AdminB2BApprovalsPage,
          meta: {
            title: 'Approvazioni B2B',
            description: 'Revisione richieste account, livelli cliente e gruppi prezzo.',
            access: 'staff',
          },
        },
        {
          path: 'prices',
          name: 'admin-prices',
          component: AdminPricesPage,
          meta: {
            title: 'Prezzi',
            description: 'Prezzi B2B, fasce quantita e prezzi dedicati.',
            access: 'staff',
          },
        },
        {
          path: 'rma',
          name: 'admin-rma',
          component: AdminPlaceholderPage,
          meta: {
            title: 'RMA',
            description: 'Gestione assistenza, prove, decisioni, sostituzioni e credit note.',
            access: 'staff',
          },
        },
        {
          path: 'settings/users',
          name: 'admin-users',
          component: AdminPlaceholderPage,
          meta: {
            title: 'Utenti staff',
            description: 'Ruoli sales, warehouse, purchasing e admin.',
            access: 'admin',
          },
        },
      ],
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
    return { name: 'products' }
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
