<script setup>
import { computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import TopNav from '../components/TopNav.vue'
import { clearSession, getSession } from '../utils/auth'

const router = useRouter()
const session = computed(() => getSession())

const STORAGE_KEY = 'pb-wishlist'
const state = reactive({
  items: [],
})

const handleLogout = () => {
  clearSession()
  router.push('/signin')
}

const loadWishlist = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    state.items = Array.isArray(parsed) ? parsed : []
  } catch (error) {
    state.items = []
  }
}

onMounted(() => {
  loadWishlist()
})
</script>

<template>
  <main class="wishlist-shell">
    <TopNav :active="'wishlist'" :email="session?.email" @logout="handleLogout" />

    <section class="results">
      <header class="row-head">
        <h2>내가 찜한 리스트</h2>
        <span class="pill">{{ state.items.length }}편</span>
      </header>

      <div v-if="!state.items.length" class="empty">
        <p>찜한 영화가 없습니다.</p>
        <button type="button" class="primary" @click="router.push('/popular')">대세 콘텐츠 보러가기</button>
      </div>

      <div v-else class="grid">
        <article v-for="movie in state.items" :key="movie.id || movie.title" class="card">
          <div class="poster">
            <img :src="movie.poster || movie.poster_path" :alt="movie.title || '포스터'" loading="lazy" />
          </div>
          <div class="body">
            <h3>{{ movie.title || '제목 없음' }}</h3>
            <p class="meta">
              <span v-if="movie.release_date">개봉 {{ movie.release_date }}</span>
              <span v-if="movie.vote_average">★ {{ movie.vote_average }}</span>
            </p>
            <p class="overview">{{ movie.overview || '설명이 없습니다.' }}</p>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.wishlist-shell {
  min-height: 100vh;
  padding: 0.75rem;
  color: var(--text-primary);
  background: linear-gradient(180deg, rgba(11, 11, 16, 0.97), rgba(12, 12, 18, 0.98));
  width: min(1200px, calc(100% - 1.5rem));
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.results {
  background: rgba(15, 15, 20, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 0.75rem;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.row-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pill {
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-muted);
  font-size: 0.85rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.card {
  background: #101018;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.poster {
  position: relative;
  aspect-ratio: 2 / 3;
  background: #15151b;
}

.poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.body {
  padding: 0.65rem 0.75rem 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.meta {
  color: var(--text-muted);
  font-size: 0.9rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.overview {
  color: var(--text-muted);
  font-size: 0.92rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.empty {
  padding: 1.25rem;
  text-align: center;
  color: var(--text-muted);
  display: grid;
  gap: 0.75rem;
  place-items: center;
}

.primary {
  background: linear-gradient(120deg, #e50914, #b81d24);
  border: none;
  color: #fff;
  padding: 0.6rem 0.9rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 800;
}
</style>
