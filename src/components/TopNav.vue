<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  active: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['logout'])

const router = useRouter()

const go = (name) => {
  if (name === props.active) return
  router.push({ name })
}
</script>

<template>
  <header class="topbar">
    <div class="left">
      <button class="logo" type="button" @click="go('home')">JINFLIX</button>
      <nav class="nav-links">
        <button :class="{ active: active === 'home' }" @click="go('home')">홈</button>
        <button :class="{ active: active === 'popular' }" @click="go('popular')">대세 콘텐츠</button>
        <button :class="{ active: active === 'search' }" @click="go('search')">검색</button>
        <button :class="{ active: active === 'wishlist' }" @click="go('wishlist')">찜한 리스트</button>
      </nav>
    </div>
    <div class="right">
      <div class="user">
        <span class="badge">추천</span>
        <span class="email">Hi, {{ email || 'Guest' }}</span>
        <button type="button" class="ghost" @click="emit('logout')">로그아웃</button>
      </div>
      <slot name="controls" />
    </div>
  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.logo {
  font-weight: 900;
  font-size: clamp(1.5rem, 3vw, 1.9rem);
  letter-spacing: 0.12em;
  color: var(--accent);
  background: transparent;
  border: none;
  cursor: pointer;
}

.nav-links {
  display: inline-flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.nav-links button {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
  padding: 0.5rem 0.8rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  transition: transform 180ms var(--ease-smooth), box-shadow 180ms var(--ease-smooth), border-color 180ms var(--ease-smooth);
  will-change: transform;
}

.nav-links button.active {
  background: linear-gradient(120deg, #e50914, #b81d24);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 10px 24px rgba(229, 9, 20, 0.35);
}

.nav-links button:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.22);
}

.right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.4rem;
}

.user {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: flex-end;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: rgba(229, 9, 20, 0.14);
  color: #ffb3b8;
  font-size: 0.85rem;
  letter-spacing: 0.04em;
}

.email {
  color: var(--text-muted);
  font-weight: 600;
}

.ghost {
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: transparent;
  color: #fff;
  padding: 0.5rem 0.9rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ghost:hover {
  background: rgba(255, 255, 255, 0.08);
}
</style>
