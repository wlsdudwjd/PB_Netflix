<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
  nextTick,
} from 'vue'
import { useRouter } from 'vue-router'
import TopNav from '../components/TopNav.vue'
import MovieCard from '../components/MovieCard.vue'
import ToastStack from '../components/ToastStack.vue'
import { clearSession, getSession, getStoredUser } from '../utils/auth'
import { getWishlist, toggleWishlist } from '../utils/wishlist'

const router = useRouter()
const session = computed(() => getSession())

const mode = ref('table') // 'table' | 'infinite'
const error = ref('')
const toasts = ref([])

const tablePageSize = 10
const tableState = reactive({ page: 1, totalPages: 1, loading: false, items: [] })
const feedState = reactive({ page: 0, totalPages: 1, loading: false, items: [] })
const wishlist = ref([])

const sentinel = ref(null)
let observer = null

const imageUrl = (path) => (path ? `https://image.tmdb.org/t/p/w300${path}` : '')

const handleLogout = () => {
  clearSession()
  router.push('/signin')
}

const fetchJson = async (path, apiKey) => {
  const separator = path.includes('?') ? '&' : '?'
  const url = `https://api.themoviedb.org/3${path}${separator}api_key=${apiKey}&language=ko-KR`
  const res = await fetch(url)
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const reason = json?.status_message ?? 'TMDB API 호출에 실패했습니다.'
    throw new Error(reason)
  }
  return json
}

const getApiKey = () => getStoredUser()?.password

const loadTablePage = async (page = 1) => {
  const apiKey = getApiKey()
  if (!apiKey) {
    router.push('/signin')
    return
  }

  tableState.loading = true
  error.value = ''

  try {
    const data = await fetchJson(`/movie/popular?page=${page}`, apiKey)
    tableState.items = (data?.results || []).slice(0, tablePageSize)
    tableState.page = page
    tableState.totalPages = data?.total_pages || 1
  } catch (err) {
    error.value = err?.message || '인기 콘텐츠를 불러오지 못했습니다.'
  } finally {
    tableState.loading = false
  }
}

const loadMoreFeed = async () => {
  if (feedState.loading) return
  const apiKey = getApiKey()
  if (!apiKey) {
    router.push('/signin')
    return
  }

  const nextPage = feedState.page + 1
  if (feedState.totalPages && nextPage > feedState.totalPages) return

  feedState.loading = true
  error.value = ''

  try {
    const data = await fetchJson(`/movie/popular?page=${nextPage}`, apiKey)
    const nextItems = data?.results || []
    feedState.items.push(...nextItems)
    feedState.page = nextPage
    feedState.totalPages = data?.total_pages || 1
  } catch (err) {
    error.value = err?.message || '인기 콘텐츠를 불러오지 못했습니다.'
  } finally {
    feedState.loading = false
  }
}

const switchMode = async (value) => {
  mode.value = value
  error.value = ''

  await nextTick()

  if (value === 'table') {
    document.body.style.overflow = 'hidden'
    if (!tableState.items.length) loadTablePage(1)
  } else {
    document.body.style.overflow = ''
    if (!feedState.items.length) loadMoreFeed()
  }
}

const backToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const setupObserver = () => {
  if (observer) observer.disconnect()
  if (!sentinel.value) return

  observer = new IntersectionObserver((entries) => {
    const entry = entries[0]
    if (entry.isIntersecting && mode.value === 'infinite') {
      loadMoreFeed()
    }
  })

  observer.observe(sentinel.value)
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
    poster: movie.poster_path ? imageUrl(movie.poster_path) : '',
    overview: movie.overview,
    release_date: movie.release_date,
    vote_average: movie.vote_average,
  }
  const before = wishlist.value.some((m) => m.id === movie.id)
  wishlist.value = toggleWishlist(normalized)
  addToast(before ? '찜 목록에서 제거되었습니다.' : '찜한 리스트에 추가되었습니다.', before ? 'info' : 'success')
}

const goDetail = (movie) => {
  router.push({ name: 'detail', params: { id: movie.id } })
}

onMounted(() => {
  wishlist.value = getWishlist()
  switchMode('table')
  setupObserver()
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  if (observer) observer.disconnect()
})

watch(sentinel, () => setupObserver())
</script>

<template>
  <main class="popular-shell" :class="{ 'table-mode': mode === 'table' }">
    <TopNav :active="'popular'" :email="session?.email" @logout="handleLogout">
      <template #controls>
        <nav class="tabs">
          <button
            :class="{ active: mode === 'table' }"
            aria-label="Table view"
            @click="switchMode('table')"
          >
            📋
          </button>
          <button
            :class="{ active: mode === 'infinite' }"
            aria-label="Infinite scroll view"
            @click="switchMode('infinite')"
          >
            ∞
          </button>
        </nav>
      </template>
    </TopNav>

    <section v-if="error" class="error">
      <p>{{ error }}</p>
    </section>

    <section v-if="mode === 'table'" class="table-wrap">
      <div class="row-head">
        <h2>대세 콘텐츠 (Table)</h2>
      </div>
      <div class="table-grid">
        <MovieCard
          v-for="movie in tableState.items"
          :key="movie.id"
          :movie="movie"
          :poster-url="imageUrl(movie.poster_path)"
          :in-wishlist="wishlist.some((m) => m.id === movie.id)"
          @toggle="toggleWish"
          @view="goDetail"
          @detail="goDetail"
        />
      </div>
      <div class="pager bottom">
        <button type="button" :disabled="tableState.page <= 1 || tableState.loading" @click="loadTablePage(tableState.page - 1)">
          이전
        </button>
        <span>{{ tableState.page }} / {{ tableState.totalPages }}</span>
        <button
          type="button"
          :disabled="tableState.page >= tableState.totalPages || tableState.loading"
          @click="loadTablePage(tableState.page + 1)"
        >
          다음
        </button>
      </div>
      <p v-if="tableState.loading" class="loading-text">불러오는 중...</p>
    </section>

    <section v-else class="infinite-wrap">
      <div class="row-head">
        <h2>대세 콘텐츠 (Infinite)</h2>
        <span class="pill">자동 로드</span>
      </div>
      <div class="feed">
        <MovieCard
          v-for="movie in feedState.items"
          :key="movie.id"
          :movie="movie"
          :poster-url="imageUrl(movie.poster_path)"
          :in-wishlist="wishlist.some((m) => m.id === movie.id)"
          @toggle="toggleWish"
          @view="goDetail"
          @detail="goDetail"
        />
        <div ref="sentinel" class="sentinel" />
        <div v-if="feedState.loading" class="spinner">Loading...</div>
      </div>
    </section>

    <button v-if="mode === 'infinite'" class="top" type="button" @click="backToTop">Top</button>
    <ToastStack :items="toasts" @dismiss="removeToast" />
  </main>
</template>

<style scoped>
.popular-shell {
  min-height: 100vh;
  background: linear-gradient(180deg, rgba(11, 11, 16, 0.97), rgba(12, 12, 18, 0.98)), var(--bg);
  color: var(--text-primary);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: min(1200px, calc(100% - 1.5rem));
  margin: 0 auto;
}

.popular-shell.table-mode {
  min-height: 100vh;
  height: 100vh;
  overflow: hidden;
}

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
}

.nav-links {
  display: inline-flex;
  gap: 0.4rem;
}

.nav-links button {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
  padding: 0.5rem 0.8rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
}

.nav-links button.active {
  background: linear-gradient(120deg, #e50914, #b81d24);
  color: #fff;
  border-color: transparent;
}

.right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.4rem;
}

.tabs {
  display: inline-flex;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 0.25rem;
}

.tabs button {
  border: none;
  background: transparent;
  color: var(--text-muted);
  padding: 0.65rem 0.9rem;
  border-radius: 10px;
  font-weight: 800;
  cursor: pointer;
}

.tabs button.active {
  background: linear-gradient(120deg, #e50914, #b81d24);
  color: #fff;
  box-shadow: 0 10px 24px rgba(229, 9, 20, 0.35);
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


.row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  margin-bottom: 0.6rem;
}

.pill {
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-muted);
  font-size: 0.85rem;
}

.table-wrap {
  background: rgba(15, 15, 20, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 0.65rem;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.pager {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--text-muted);
}

.pager button {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  border-radius: 10px;
  padding: 0.35rem 0.65rem;
  cursor: pointer;
}

.pager button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pager.bottom {
  justify-content: center;
  margin-top: 0.6rem;
}

.table-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.75rem;
  align-content: start;
  grid-auto-rows: auto;
}

.tile {
  background: #101018;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.tile .poster {
  background: #15151b;
  flex: 0 0 auto;
  aspect-ratio: 2 / 3;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.tile .poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.copy {
  padding: 0.7rem 0.8rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
}

.copy h3 {
  font-size: 1rem;
  font-weight: 800;
}

.meta-line {
  color: var(--text-muted);
  font-size: 0.9rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.overview {
  color: var(--text-muted);
  font-size: 0.92rem;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.loading-text {
  margin-top: 0.6rem;
  color: var(--text-muted);
}

.infinite-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  width: 100%;
}

.feed {
  display: grid;
  gap: 0.9rem;
}

.tile.wide {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 0.75rem;
  padding: 0.6rem;
}

.tile.wide .poster {
  position: relative;
}

.tile.wide .poster {
  aspect-ratio: 2 / 3;
  border-radius: 10px;
  overflow: hidden;
}

.rating {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.72);
  color: #ffd166;
  padding: 0.3rem 0.5rem;
  border-radius: 8px;
  font-weight: 800;
  font-size: 0.85rem;
}

.sentinel {
  height: 1px;
}

.spinner {
  text-align: center;
  color: var(--text-muted);
}

.error {
  color: #ff9da8;
}

.top {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: linear-gradient(120deg, #e50914, #b81d24);
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  cursor: pointer;
  box-shadow: 0 15px 40px rgba(229, 9, 20, 0.35);
}

@media (max-width: 860px) {
  .topbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.7rem;
  }

  .popular-shell {
    width: 100%;
  }

  .table-grid {
    max-height: none;
    overflow: visible;
  }

  .popular-shell.no-scroll {
    height: auto;
  }

  .tile.wide {
    grid-template-columns: 1fr;
  }
}
</style>
