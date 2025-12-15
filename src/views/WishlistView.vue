<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import TopNav from '../components/TopNav.vue'
import MovieCard from '../components/MovieCard.vue'
import ToastStack from '../components/ToastStack.vue'
import { clearSession, getSession } from '../utils/auth'
import { getWishlist, toggleWishlist } from '../utils/wishlist'

const router = useRouter()
const session = computed(() => getSession())

const STORAGE_KEY = 'pb-wishlist'
const state = reactive({
  items: [],
})
const toasts = ref([])

const handleLogout = () => {
  clearSession()
  router.push('/signin')
}

const loadWishlist = () => {
  state.items = getWishlist()
}

const goDetail = (movie) => {
  router.push({ name: 'detail', params: { id: movie.id } })
}

const addToast = (message, type = 'info') => {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => removeToast(id), 3500)
}

const removeToast = (id) => {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

const toggleWish = (movie) => {
  const normalized = {
    id: movie.id,
    title: movie.title || movie.name || movie.original_title,
    poster: movie.poster || movie.poster_path || '',
    overview: movie.overview,
    release_date: movie.release_date,
    vote_average: movie.vote_average,
  }
  const before = state.items.some((m) => m.id === movie.id)
  state.items = toggleWishlist(normalized)
  addToast(before ? '찜 목록에서 제거되었습니다.' : '찜한 리스트에 추가되었습니다.', before ? 'info' : 'success')
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
        <MovieCard
          v-for="movie in state.items"
          :key="movie.id || movie.title"
          :movie="movie"
          :poster-url="movie.poster || movie.poster_path"
          :in-wishlist="state.items.some((m) => m.id === movie.id)"
          @toggle="toggleWish"
          @view="goDetail"
          @detail="goDetail"
        />
      </div>
    </section>
    <ToastStack :items="toasts" @dismiss="removeToast" />
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
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 0.6rem;
  justify-content: start;
  width: fit-content;
  max-width: 100%;
}

:deep(.card) {
  max-width: 220px;
  margin: 0;
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
  transition: transform 160ms var(--ease-smooth), box-shadow 160ms var(--ease-smooth);
  will-change: transform;
}

.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 26px rgba(229, 9, 20, 0.35);
}

@media (max-width: 768px) {
  .wishlist-shell {
    width: calc(100% - 1rem);
    padding: 0.6rem;
    gap: 0.75rem;
  }

  .grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    width: 100%;
    gap: 0.5rem;
  }

  .results {
    padding: 0.6rem;
  }

  :deep(.card) {
    max-width: 190px;
  }
}
</style>
