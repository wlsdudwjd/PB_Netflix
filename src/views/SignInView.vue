<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import ToastStack from '../components/ToastStack.vue'
import {
  clearRememberedUser,
  getRememberedUser,
  getStoredUser,
  rememberUser,
  saveSession,
  saveUser,
} from '../utils/auth'

const router = useRouter()

const activeTab = ref('login')
const loading = reactive({ login: false, signup: false })
const errors = reactive({ login: '', signup: '' })
const loginForm = reactive({ email: '', password: '', remember: false, autoLogin: false })
const signupForm = reactive({ email: '', password: '', confirm: '', agree: false })
const toasts = ref([])

const emailRegex = /^[^\s@]+@[^\s@]+$/
const validateEmail = (email) => emailRegex.test(email)

const loginEmailInvalid = computed(
  () => !!loginForm.email && !validateEmail(loginForm.email),
)
const signupEmailInvalid = computed(
  () => !!signupForm.email && !validateEmail(signupForm.email),
)
const passwordMismatch = computed(
  () =>
    !!signupForm.password &&
    !!signupForm.confirm &&
    signupForm.password !== signupForm.confirm,
)

const addToast = (message, type = 'info') => {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => removeToast(id), 4500)
}

const removeToast = (id) => {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

const switchTab = (tab) => {
  activeTab.value = tab
}

const verifyApiKey = async (apiKey) => {
  if (!apiKey) throw new Error('TMDB API 키(비밀번호)를 입력하세요.')

  const endpoint = `https://api.themoviedb.org/3/configuration?api_key=${apiKey}`

  try {
    const response = await fetch(endpoint)
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      const reason = payload?.status_message ?? 'TMDB API 키가 유효하지 않습니다.'
      throw new Error(reason)
    }

    return payload
  } catch (error) {
    if (error?.name === 'TypeError') {
      throw new Error('TMDB API 호출에 실패했습니다. 네트워크 상태와 API 키를 확인해주세요.')
    }
    throw error
  }
}

const handleLogin = async (isAuto = false) => {
  errors.login = ''

  if (!validateEmail(loginForm.email)) {
    errors.login = '이메일 형식의 아이디를 입력해주세요.'
    addToast(errors.login, 'error')
    return
  }

  if (!loginForm.password) {
    errors.login = 'TMDB API 키를 입력해주세요.'
    addToast(errors.login, 'error')
    return
  }

  const storedUser = getStoredUser()

  if (!storedUser) {
    errors.login = '회원가입 후 로그인 해주세요.'
    addToast(errors.login, 'error')
    return
  }

  if (storedUser.email !== loginForm.email) {
    errors.login = '저장된 아이디와 일치하지 않습니다.'
    addToast(errors.login, 'error')
    return
  }

  if (storedUser.password !== loginForm.password) {
    errors.login = '비밀번호(TMDB API 키)가 일치하지 않습니다.'
    addToast(errors.login, 'error')
    return
  }

  loading.login = true

  try {
    await verifyApiKey(loginForm.password)

    saveSession({ email: loginForm.email })
    saveUser(storedUser)

    if (loginForm.remember) {
      rememberUser({
        email: loginForm.email,
        password: loginForm.password,
        autoLogin: loginForm.autoLogin,
      })
    } else {
      clearRememberedUser()
    }

    addToast('로그인 성공! 메인 페이지로 이동합니다.', 'success')
    alert('로그인에 성공했습니다.')
    router.push('/')
  } catch (error) {
    const message = error?.message || '로그인 중 문제가 발생했습니다.'
    errors.login = message
    addToast(message, 'error')

    if (isAuto) {
      loginForm.remember = false
    }
  } finally {
    loading.login = false
  }
}

const handleSignup = async () => {
  errors.signup = ''

  if (!validateEmail(signupForm.email)) {
    errors.signup = '이메일 형식의 아이디를 입력해주세요.'
    addToast(errors.signup, 'error')
    return
  }

  if (!signupForm.password) {
    errors.signup = 'TMDB API 키를 비밀번호로 입력해주세요.'
    addToast(errors.signup, 'error')
    return
  }

  if (signupForm.password !== signupForm.confirm) {
    errors.signup = '비밀번호와 확인이 일치하지 않습니다.'
    addToast(errors.signup, 'error')
    return
  }

  if (!signupForm.agree) {
    errors.signup = '필수 약관에 동의해주세요.'
    addToast(errors.signup, 'error')
    return
  }

  loading.signup = true

  try {
    await verifyApiKey(signupForm.password)

    saveUser({ email: signupForm.email, password: signupForm.password })

    addToast('회원가입 성공! 로그인으로 이동합니다.', 'success')
    alert('회원가입을 완료했습니다. 로그인 탭으로 이동합니다.')

    activeTab.value = 'login'
    loginForm.email = signupForm.email
    loginForm.password = signupForm.password
    loginForm.remember = false
    loginForm.autoLogin = false
    signupForm.password = ''
    signupForm.confirm = ''
    signupForm.agree = false

    router.push('/signin')
  } catch (error) {
    const message = error?.message || '회원가입 처리 중 오류가 발생했습니다.'
    errors.signup = message
    addToast(message, 'error')
  } finally {
    loading.signup = false
  }
}

onMounted(() => {
  const remembered = getRememberedUser()
  const storedUser = getStoredUser()

  if (remembered) {
    loginForm.email = remembered.email || ''
    loginForm.password = remembered.password || ''
    loginForm.remember = true
    loginForm.autoLogin = Boolean(remembered.autoLogin)
    activeTab.value = 'login'

    if (
      storedUser &&
      remembered.email === storedUser.email &&
      remembered.password === storedUser.password &&
      remembered.autoLogin
    ) {
      setTimeout(() => handleLogin(true), 550)
    }
  }
})
</script>

<template>
  <main class="auth-shell">
    <span class="brand">JINFLIX</span>
    <div class="glow glow-1" />
    <div class="glow glow-2" />

    <section class="card solo">
      <div class="tab-bar">
        <button
          type="button"
          :class="{ active: activeTab === 'login' }"
          @click="switchTab('login')"
        >
          로그인
        </button>
        <button
          type="button"
          :class="{ active: activeTab === 'signup' }"
          @click="switchTab('signup')"
        >
          회원가입
        </button>
      </div>

      <Transition name="swap" mode="out-in">
        <form
          v-if="activeTab === 'login'"
          key="login"
          class="form"
          autocomplete="on"
          @submit.prevent="handleLogin()"
        >
          <div class="field">
            <label for="login-email">아이디 (이메일)</label>
            <div class="input" :data-invalid="loginEmailInvalid">
              <input
                id="login-email"
                v-model.trim="loginForm.email"
                name="email"
                type="email"
                placeholder="you@example.com"
                :pattern="emailRegex.source"
                required
              />
            </div>
            <p v-if="loginEmailInvalid" class="hint error">올바른 이메일 형식이어야 합니다.</p>
          </div>

          <div class="field">
            <label for="login-password">비밀번호 (TMDB API 키)</label>
            <div class="input">
              <input
                id="login-password"
                v-model.trim="loginForm.password"
                name="password"
                type="password"
                placeholder="발급받은 TMDB API 키를 입력"
                required
              />
            </div>
            <p class="hint">TMDB API 호출로 비밀번호의 유효성을 검사합니다.</p>
          </div>

          <div class="options">
            <label class="checkbox">
              <input v-model="loginForm.remember" type="checkbox" />
              <span>아이디 저장</span>
            </label>
            <label class="checkbox">
              <input v-model="loginForm.autoLogin" type="checkbox" />
              <span>자동 로그인</span>
            </label>
            <span class="inline-hint">아이디 저장 시 자동 로그인을 함께 사용할 수 있습니다.</span>
          </div>

          <p v-if="errors.login" class="hint error">{{ errors.login }}</p>

          <button type="submit" class="primary" :disabled="loading.login">
            {{ loading.login ? 'TMDB 확인 중...' : '로그인' }}
          </button>
        </form>

        <form
          v-else
          key="signup"
          class="form"
          autocomplete="on"
          @submit.prevent="handleSignup()"
        >
          <div class="field">
            <label for="signup-email">아이디 (이메일)</label>
            <div class="input" :data-invalid="signupEmailInvalid">
              <input
                id="signup-email"
                v-model.trim="signupForm.email"
                name="email"
                type="email"
                placeholder="signup@example.com"
                :pattern="emailRegex.source"
                required
              />
            </div>
            <p v-if="signupEmailInvalid" class="hint error">이메일 형식을 확인해주세요.</p>
          </div>

          <div class="field">
            <label for="signup-password">비밀번호 (TMDB API 키)</label>
            <div class="input">
              <input
                id="signup-password"
                v-model.trim="signupForm.password"
                name="password"
                type="password"
                placeholder="TMDB API 키를 입력"
                required
              />
            </div>
            <p class="hint">입력한 키로 TMDB API를 호출해 유효성을 확인합니다.</p>
          </div>

          <div class="field">
            <label for="signup-confirm">비밀번호 확인</label>
            <div class="input" :data-invalid="passwordMismatch">
              <input
                id="signup-confirm"
                v-model.trim="signupForm.confirm"
                name="confirm"
                type="password"
                placeholder="비밀번호를 다시 입력"
                required
              />
            </div>
            <p v-if="passwordMismatch" class="hint error">비밀번호가 일치하지 않습니다.</p>
          </div>

          <div class="options">
            <label class="checkbox">
              <input v-model="signupForm.agree" type="checkbox" />
              <span>필수 약관에 동의합니다.</span>
            </label>
          </div>

          <p v-if="errors.signup" class="hint error">{{ errors.signup }}</p>

          <button type="submit" class="primary" :disabled="loading.signup">
            {{ loading.signup ? 'TMDB 키 확인 중...' : '회원가입' }}
          </button>
        </form>
      </Transition>
    </section>

    <ToastStack :items="toasts" @dismiss="removeToast" />
  </main>
</template>

<style scoped>
.auth-shell {
  position: relative;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: clamp(2rem, 4vw, 3.5rem);
  background: radial-gradient(circle at 10% 10%, rgba(229, 9, 20, 0.26), transparent 28%),
    radial-gradient(circle at 80% 20%, rgba(184, 29, 36, 0.32), transparent 25%),
    linear-gradient(135deg, #0b0b10, #0f0f13 45%, #0b0b10);
  overflow: hidden;
}

.brand {
  position: absolute;
  top: 1.6rem;
  left: clamp(1.5rem, 5vw, 4rem);
  font-weight: 900;
  letter-spacing: 0.14em;
  color: var(--accent);
  font-size: clamp(1.6rem, 3vw, 2rem);
  text-transform: uppercase;
}

.glow {
  position: absolute;
  filter: blur(70px);
  opacity: 0.6;
  pointer-events: none;
}

.glow-1 {
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(229, 9, 20, 0.3), transparent 55%);
  top: -40px;
  right: 10%;
}

.glow-2 {
  width: 380px;
  height: 380px;
  background: radial-gradient(circle, rgba(184, 29, 36, 0.26), transparent 60%);
  bottom: -120px;
  left: 5%;
}

.card {
  position: relative;
  background: linear-gradient(160deg, rgba(19, 19, 22, 0.92), rgba(15, 15, 18, 0.96));
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.55);
  padding: 1.1rem;
  backdrop-filter: blur(8px);
  overflow: hidden;
}

.card.solo {
  width: min(640px, 100%);
}

.card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(229, 9, 20, 0.2), transparent 55%);
  pointer-events: none;
}

.tab-bar {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 0.25rem;
}

.tab-bar button {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-weight: 800;
  padding: 0.9rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-bar button.active {
  background: linear-gradient(120deg, #e50914, #b81d24);
  color: #ffffff;
  box-shadow: 0 10px 26px rgba(229, 9, 20, 0.35);
}

.form {
  padding: 1.35rem 0.75rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  z-index: 1;
}

.field label {
  display: block;
  color: var(--text-primary);
  margin-bottom: 0.35rem;
  font-weight: 700;
}

.input {
  background: #0d0d0f;
  border: 1px solid #1f1f23;
  border-radius: 12px;
  padding: 0.1rem 0.85rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input[data-invalid='true'] {
  border-color: rgba(229, 9, 20, 0.65);
  box-shadow: 0 12px 28px rgba(229, 9, 20, 0.18);
}

.input:focus-within {
  border-color: var(--accent);
  box-shadow: 0 12px 32px rgba(229, 9, 20, 0.24);
}

input {
  width: 100%;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 1rem;
  padding: 0.85rem 0.1rem;
  outline: none;
}

.hint {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

.hint.error {
  color: #ff9da8;
}

.options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  align-items: center;
  gap: 0.65rem;
}

.checkbox {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-primary);
  font-weight: 600;
}

.checkbox input {
  width: auto;
  accent-color: var(--accent);
  transform: scale(1.05);
}

.inline-hint {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.primary {
  width: 100%;
  padding: 0.95rem 1rem;
  border-radius: 12px;
  border: none;
  font-weight: 800;
  letter-spacing: 0.02em;
  cursor: pointer;
  color: #ffffff;
  background: linear-gradient(120deg, #e50914, #b81d24);
  box-shadow: 0 15px 40px rgba(229, 9, 20, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
}

.primary:disabled {
  filter: grayscale(0.6);
  cursor: not-allowed;
  opacity: 0.65;
  box-shadow: none;
}

.primary:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 48px rgba(229, 9, 20, 0.4);
}

.swap-enter-active,
.swap-leave-active {
  transition: all 0.28s ease;
}

.swap-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.swap-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 860px) {
  .options {
    flex-direction: column;
    align-items: flex-start;
  }

  .auth-shell {
    padding: 1.25rem;
  }

  .brand {
    left: 1.25rem;
  }
}
</style>
