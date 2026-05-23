<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GoogleOutlined, LockOutlined, UserOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { fetchSupabaseAuthSettings, hasSupabaseConfig } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { staffRoles, type UserRole } from '@/types/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()

const formState = reactive({
  email: '',
  password: '',
})
const isCheckingAuthSettings = ref(false)
const isGoogleProviderEnabled = ref<boolean | null>(hasSupabaseConfig ? null : false)

const returnUrl = computed(() => {
  const rawReturnUrl = String(route.query.returnUrl || '/products')
  return rawReturnUrl.startsWith('/') && !rawReturnUrl.startsWith('//') ? rawReturnUrl : '/products'
})
const copy = computed(() => {
  if (uiStore.language === 'zh') {
    return {
      tag: 'PartsPro 登录',
      title: '登录后查看 B2B 批发价并下单',
      intro: '访客可以浏览公开目录。已审核客户可查看价格、购物车、订单、发票和 RMA。',
      supabaseTitle: 'Supabase 未配置',
      supabaseDescription: '填写 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后即可使用真实登录。当前可使用演示账号。',
      login: '登录',
      google: '使用 Google 登录',
      googleHint: '通过 Supabase Auth 启用 Google OAuth',
      googleNotReady: 'Google OAuth 尚未在 Supabase 后台启用。启用后此按钮会自动可用。',
      emailDivider: '或使用邮箱',
      emailError: '请输入有效邮箱',
      password: '密码',
      passwordError: '请输入密码',
      emailLogin: '邮箱登录',
      demo: '本地演示',
      customerDemo: '演示客户 - 查看 B2B 价格',
      salesDemo: '演示销售 - 员工权限',
      warehouseDemo: '演示仓库 - 员工权限',
      adminDemo: '演示管理员',
      loginSuccess: '登录成功',
      loginFailed: '登录失败',
      googleFailed: 'Google 登录失败',
      demoActive: '演示账号已启用',
    }
  }

  return {
    tag: 'Accesso PartsPro',
    title: 'Accedi per vedere prezzi B2B e ordinare ricambi',
    intro: 'I visitatori possono consultare il catalogo. I clienti approvati vedono prezzi, carrello, ordini, fatture e RMA.',
    supabaseTitle: 'Supabase non configurato',
    supabaseDescription: 'Compila VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY per usare login reale. Per ora puoi usare gli accessi demo.',
    login: 'Login',
    google: 'Continua con Google',
    googleHint: 'OAuth Google tramite Supabase Auth',
    googleNotReady: 'OAuth Google non e ancora attivo in Supabase. Il pulsante sara disponibile dopo la configurazione.',
    emailDivider: 'Oppure email',
    emailError: 'Inserisci una email valida',
    password: 'Password',
    passwordError: 'Inserisci la password',
    emailLogin: 'Accedi con email',
    demo: 'Demo locale',
    customerDemo: 'Demo customer - mostra prezzi B2B',
    salesDemo: 'Demo sales - staff',
    warehouseDemo: 'Demo warehouse - staff',
    adminDemo: 'Demo admin',
    loginSuccess: 'Accesso effettuato',
    loginFailed: 'Login non riuscito',
    googleFailed: 'Login Google non riuscito',
    demoActive: 'Demo attiva',
  }
})

async function finishLogin() {
  await router.replace(returnUrl.value)
}

function getDemoReturnUrl(role: Exclude<UserRole, 'guest'>) {
  const rawReturnUrl = Array.isArray(route.query.returnUrl)
    ? route.query.returnUrl[0]
    : route.query.returnUrl

  if (rawReturnUrl) {
    return returnUrl.value
  }

  return staffRoles.includes(role) ? '/admin' : returnUrl.value
}

function buildGoogleRedirectUrl() {
  const redirectUrl = new URL('/login', window.location.origin)
  redirectUrl.searchParams.set('returnUrl', returnUrl.value)
  return redirectUrl.toString()
}

async function handleEmailLogin() {
  try {
    await authStore.loginWithEmail(formState.email, formState.password)
    message.success(copy.value.loginSuccess)
    await finishLogin()
  } catch {
    message.error(authStore.authError || copy.value.loginFailed)
  }
}

async function handleGoogleLogin() {
  try {
    await authStore.loginWithGoogle(buildGoogleRedirectUrl())
  } catch {
    message.error(authStore.authError || copy.value.googleFailed)
  }
}

async function handleDemoLogin(role: Exclude<UserRole, 'guest'>) {
  authStore.loginAsDemo(role)
  message.success(`${copy.value.demoActive}: ${role}`)
  await router.replace(getDemoReturnUrl(role))
}

onMounted(async () => {
  if (!hasSupabaseConfig) {
    isGoogleProviderEnabled.value = false
    return
  }

  isCheckingAuthSettings.value = true

  try {
    const settings = await fetchSupabaseAuthSettings()
    isGoogleProviderEnabled.value = Boolean(settings?.external?.google)
  } catch {
    isGoogleProviderEnabled.value = null
  } finally {
    isCheckingAuthSettings.value = false
  }
})
</script>

<template>
  <main class="login-page">
    <section class="login-card">
      <div class="login-intro">
        <a-tag color="blue">{{ copy.tag }}</a-tag>
        <h1>{{ copy.title }}</h1>
        <p>{{ copy.intro }}</p>
        <a-alert
          v-if="!hasSupabaseConfig"
          type="warning"
          show-icon
          :message="copy.supabaseTitle"
          :description="copy.supabaseDescription"
        />
      </div>

      <a-card :title="copy.login" class="login-form-card">
        <div class="login-oauth-panel">
          <a-button
            class="google-login-button"
            block
            size="large"
            :disabled="!hasSupabaseConfig || isGoogleProviderEnabled === false"
            :loading="authStore.isLoading || isCheckingAuthSettings"
            @click="handleGoogleLogin"
          >
            <GoogleOutlined />
            {{ copy.google }}
          </a-button>
          <span>{{ copy.googleHint }}</span>
          <a-alert
            v-if="hasSupabaseConfig && isGoogleProviderEnabled === false"
            type="warning"
            show-icon
            :message="copy.googleNotReady"
          />
        </div>

        <a-divider>{{ copy.emailDivider }}</a-divider>

        <a-form layout="vertical" :model="formState" @finish="handleEmailLogin">
          <a-form-item
            label="Email"
            name="email"
            :rules="[{ required: true, type: 'email', message: copy.emailError }]"
          >
            <a-input v-model:value="formState.email" autocomplete="email">
              <template #prefix>
                <UserOutlined />
              </template>
            </a-input>
          </a-form-item>
          <a-form-item
            :label="copy.password"
            name="password"
            :rules="[{ required: true, message: copy.passwordError }]"
          >
            <a-input-password
              v-model:value="formState.password"
              autocomplete="current-password"
            >
              <template #prefix>
                <LockOutlined />
              </template>
            </a-input-password>
          </a-form-item>
          <a-space direction="vertical" class="full-width" :size="12">
            <a-button
              html-type="submit"
              type="primary"
              block
              :loading="authStore.isLoading"
            >
              {{ copy.emailLogin }}
            </a-button>
          </a-space>
        </a-form>

        <a-divider>{{ copy.demo }}</a-divider>
        <a-space direction="vertical" class="full-width" :size="8">
          <a-button block @click="handleDemoLogin('customer')">
            {{ copy.customerDemo }}
          </a-button>
          <a-button block @click="handleDemoLogin('sales')">{{ copy.salesDemo }}</a-button>
          <a-button block @click="handleDemoLogin('warehouse')">
            {{ copy.warehouseDemo }}
          </a-button>
          <a-button block @click="handleDemoLogin('admin')">{{ copy.adminDemo }}</a-button>
        </a-space>
      </a-card>
    </section>
  </main>
</template>
