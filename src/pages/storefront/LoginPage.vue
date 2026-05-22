<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GoogleOutlined, LockOutlined, UserOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { hasSupabaseConfig } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import type { UserRole } from '@/types/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const formState = reactive({
  email: '',
  password: '',
})

const returnUrl = computed(() => String(route.query.returnUrl || '/products'))

async function finishLogin() {
  await router.replace(returnUrl.value)
}

async function handleEmailLogin() {
  try {
    await authStore.loginWithEmail(formState.email, formState.password)
    message.success('Accesso effettuato')
    await finishLogin()
  } catch {
    message.error(authStore.authError || 'Login non riuscito')
  }
}

async function handleGoogleLogin() {
  try {
    await authStore.loginWithGoogle()
  } catch {
    message.error(authStore.authError || 'Login Google non riuscito')
  }
}

async function handleDemoLogin(role: Exclude<UserRole, 'guest'>) {
  authStore.loginAsDemo(role)
  message.success(`Demo ${role} attiva`)
  await finishLogin()
}
</script>

<template>
  <main class="login-page">
    <section class="login-card">
      <div class="login-intro">
        <a-tag color="blue">Accesso PartsPro</a-tag>
        <h1>Accedi per vedere prezzi B2B e ordinare ricambi</h1>
        <p>
          I visitatori possono consultare il catalogo. I clienti approvati vedono prezzi,
          carrello, ordini, fatture e RMA.
        </p>
        <a-alert
          v-if="!hasSupabaseConfig"
          type="warning"
          show-icon
          message="Supabase non configurato"
          description="Compila VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY per usare login reale. Per ora puoi usare gli accessi demo."
        />
      </div>

      <a-card title="Login">
        <a-form layout="vertical" :model="formState" @finish="handleEmailLogin">
          <a-form-item
            label="Email"
            name="email"
            :rules="[{ required: true, type: 'email', message: 'Inserisci una email valida' }]"
          >
            <a-input v-model:value="formState.email" autocomplete="email">
              <template #prefix>
                <UserOutlined />
              </template>
            </a-input>
          </a-form-item>
          <a-form-item
            label="Password"
            name="password"
            :rules="[{ required: true, message: 'Inserisci la password' }]"
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
              Accedi con email
            </a-button>
            <a-button block :loading="authStore.isLoading" @click="handleGoogleLogin">
              <GoogleOutlined />
              Continua con Google
            </a-button>
          </a-space>
        </a-form>

        <a-divider>Demo locale</a-divider>
        <a-space direction="vertical" class="full-width" :size="8">
          <a-button block @click="handleDemoLogin('customer')">
            Demo customer - mostra prezzi B2B
          </a-button>
          <a-button block @click="handleDemoLogin('sales')">Demo sales - staff</a-button>
          <a-button block @click="handleDemoLogin('warehouse')">
            Demo warehouse - staff
          </a-button>
          <a-button block @click="handleDemoLogin('admin')">Demo admin</a-button>
        </a-space>
      </a-card>
    </section>
  </main>
</template>
