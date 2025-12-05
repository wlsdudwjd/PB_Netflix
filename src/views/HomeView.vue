<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { clearSession, getSession } from '../utils/auth'

const router = useRouter()
const session = computed(() => getSession())

const handleLogout = () => {
  clearSession()
  router.push('/signin')
}
</script>

<template>
  <main class="home">
    <div class="hero">
      <p class="eyebrow">TMDB Auth Demo</p>
      <h1>환영합니다!</h1>
      <p class="sub">
        로그인에 성공했습니다. 이제 보호된 메인 페이지(/)에 접근할 수 있습니다.
      </p>
      <p class="session">현재 로그인: <strong>{{ session?.email || '알 수 없음' }}</strong></p>
      <button type="button" class="ghost" @click="handleLogout">로그아웃</button>
    </div>
  </main>
</template>

<style scoped>
.home {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 30% 20%, #dfe9ff, transparent 35%),
    radial-gradient(circle at 70% 80%, #d6f5ff, transparent 30%),
    linear-gradient(145deg, #0f172a, #0b1020);
  color: #e8f1ff;
  text-align: center;
  padding: 3rem 1.5rem;
}

.hero {
  max-width: 520px;
  backdrop-filter: blur(14px);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}

.eyebrow {
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #8ad8ff;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

h1 {
  font-size: clamp(2rem, 4vw, 2.5rem);
  margin-bottom: 0.75rem;
}

.sub {
  color: rgba(232, 241, 255, 0.78);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.ghost {
  border: 1px solid rgba(138, 216, 255, 0.5);
  background: rgba(138, 216, 255, 0.1);
  color: #e8f1ff;
  padding: 0.85rem 1.25rem;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.ghost:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  background: rgba(138, 216, 255, 0.18);
}
</style>
