<script setup>
import { computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TopNav from '../components/TopNav.vue'
import ToastStack from '../components/ToastStack.vue'
import MovieCard from '../components/MovieCard.vue'
import { clearSession, getSession, getStoredUser } from '../utils/auth'
import { getWishlist, toggleWishlist } from '../utils/wishlist'

const route = useRoute()
const router = useRouter()
const session = computed(() => getSession())
const movieId = route.params.id

const state = reactive({
  loading: true,
  error: '',
  movie: null,
  cast: [],
  crew: [],
  recommendations: [],
  wishlist: getWishlist(),
})
const toasts = reactive([])
const isWished = computed(() =>
  state.movie ? state.wishlist.some((m) => m.id === state.movie.id) : false,
)

const imageUrl = (path) => (path ? `https://image.tmdb.org/t/p/w500${path}` : '')

const handleLogout = () => {
  clearSession()
  router.push('/signin')
}

const fetchJson = async (path, apiKey) => {
  const separator = path.includes('?') ? '&' : '?'
  const url = `https://api.themoviedb.org/3${path}${separator}api_key=${apiKey}&language=ko-KR&append_to_response=videos,credits`
  const res = await fetch(url)
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const reason = json?.status_message ?? 'TMDB API 호출에 실패했습니다.'
    throw new Error(reason)
  }
  return json
}

const loadMovie = async () => {
  const apiKey = getStoredUser()?.password
  if (!apiKey) {
    router.push('/signin')
    return
  }
  state.loading = true
  state.error = ''
  try {
    const data = await fetchJson(`/movie/${movieId}`, apiKey)
    state.movie = data
    state.cast = (data?.credits?.cast || []).slice(0, 10)
    state.crew = (data?.credits?.crew || []).filter((c) =>
      ['Director', 'Screenplay', 'Writer', 'Story', 'Characters'].includes(c.job),
    )
    const rec = await fetchJson(`/movie/${movieId}/recommendations`, apiKey)
    state.recommendations = (rec?.results || []).slice(0, 3)
  } catch (error) {
    state.error = error?.message || '영화 정보를 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

const addToast = (message, type = 'info') => {
  const id = crypto.randomUUID ? crypto.randomUUID() : Date.now()
  toasts.push({ id, message, type })
  setTimeout(() => removeToast(id), 3500)
}

const removeToast = (id) => {
  const idx = toasts.findIndex((t) => t.id === id)
  if (idx >= 0) toasts.splice(idx, 1)
}

const toggleWish = (target = null) => {
  const movie = target || state.movie
  if (!movie) return
  const normalized = {
    id: movie.id,
    title: movie.title || movie.name || movie.original_title,
    poster: imageUrl(movie.poster_path),
    overview: movie.overview,
    release_date: movie.release_date,
    vote_average: movie.vote_average,
  }
  const before = state.wishlist.some((m) => m.id === movie.id)
  state.wishlist = toggleWishlist(normalized)
  addToast(before ? '찜 목록에서 제거되었습니다.' : '찜한 리스트에 추가되었습니다.', before ? 'info' : 'success')
}

onMounted(() => {
  loadMovie()
})
</script>

<template>
  <main class="detail-shell">
    <TopNav :active="''" :email="session?.email" @logout="handleLogout" />

    <section v-if="state.loading" class="loading">
      <div class="shimmer" />
      <p>영화 정보를 불러오는 중...</p>
    </section>

    <section v-else-if="state.error" class="error">
      <p>{{ state.error }}</p>
    </section>

    <section v-else class="content">
      <div class="poster">
        <img :src="imageUrl(state.movie.poster_path)" :alt="state.movie.title || '포스터'" />
        <button type="button" class="primary" @click="toggleWish">
          {{ isWished ? '찜 해제' : '찜하기' }}
        </button>
      </div>
      <div class="info">
        <p class="pill">상세 정보</p>
        <h1>{{ state.movie.title || state.movie.name }}</h1>
        <p class="meta">
          <span v-if="state.movie.release_date">개봉 {{ state.movie.release_date }}</span>
          <span v-if="state.movie.runtime">{{ state.movie.runtime }}분</span>
          <span v-if="state.movie.vote_average">평점 {{ state.movie.vote_average.toFixed?.(1) || state.movie.vote_average }}</span>
        </p>
        <p class="overview">{{ state.movie.overview || '설명이 없습니다.' }}</p>
        <div class="tags">
          <span v-for="genre in state.movie.genres" :key="genre.id">{{ genre.name }}</span>
        </div>
        <div class="crew" v-if="state.crew.length">
          <p class="section-title">제작진</p>
          <ul>
            <li v-for="member in state.crew" :key="member.credit_id">
              <strong>{{ member.job }}</strong> · {{ member.name }}
            </li>
          </ul>
        </div>
        <div class="cast" v-if="state.cast.length">
          <p class="section-title">주요 출연진</p>
          <div class="cast-grid">
            <div v-for="actor in state.cast" :key="actor.cast_id || actor.credit_id" class="cast-card">
              <div class="avatar">
                <img
                  v-if="actor.profile_path"
                  :src="imageUrl(actor.profile_path)"
                  :alt="actor.name || '캐스트'"
                  loading="lazy"
                />
              </div>
              <div>
                <p class="name">{{ actor.name }}</p>
                <p class="role">{{ actor.character }}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="recommend" v-if="state.recommendations.length">
          <p class="section-title">추천 영화</p>
          <div class="recommend-grid">
            <MovieCard
              v-for="movie in state.recommendations"
              :key="movie.id"
              :movie="movie"
              :poster-url="imageUrl(movie.poster_path)"
              :in-wishlist="state.wishlist.some((m) => m.id === movie.id)"
              @toggle="toggleWish"
              @view="(m) => router.push({ name: 'detail', params: { id: m.id } })"
              @detail="(m) => router.push({ name: 'detail', params: { id: m.id } })"
            />
          </div>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <ToastStack :items="toasts" @dismiss="removeToast" />
    </Teleport>
  </main>
</template>

<style scoped>
.detail-shell {
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

.content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1rem;
  background: rgba(15, 15, 20, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 1rem;
}

.poster img {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.5);
  transition: transform 220ms var(--ease-smooth), box-shadow 220ms var(--ease-smooth);
}

.poster img:hover {
  transform: scale(1.02);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
}

.primary {
  margin-top: 0.6rem;
  width: 100%;
  background: linear-gradient(120deg, #e50914, #b81d24);
  border: none;
  color: #fff;
  padding: 0.6rem 0.9rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 800;
  transition: transform 160ms var(--ease-smooth), box-shadow 160ms var(--ease-smooth);
}

.info h1 {
  margin: 0.3rem 0 0.5rem;
}

.meta {
  display: flex;
  gap: 0.6rem;
  color: var(--text-muted);
  flex-wrap: wrap;
}

.overview {
  color: var(--text-muted);
  margin: 0.6rem 0;
  line-height: 1.6;
}

.tags {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.tags span {
  padding: 0.35rem 0.6rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.crew {
  margin-top: 0.8rem;
  color: var(--text-muted);
}

.crew ul {
  list-style: none;
  padding: 0;
  margin: 0.35rem 0 0;
  display: grid;
  gap: 0.35rem;
}

.cast {
  margin-top: 1rem;
}

.cast-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.6rem;
}

.cast-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 0.5rem 0.6rem;
}

.cast-card .avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: grid;
  place-items: center;
  color: #fff;
  overflow: hidden;
}

.cast-card .avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cast-card .name {
  font-weight: 700;
}

.cast-card .role {
  color: var(--text-muted);
}

.section-title {
  font-weight: 800;
  margin-top: 0.6rem;
}

.recommend {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.recommend-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.6rem;
}

.loading {
  display: grid;
  place-items: center;
  gap: 0.6rem;
}

.shimmer {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.04));
  animation: shimmer 1.2s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -100px 0;
  }
  100% {
    background-position: 100px 0;
  }
}

@media (max-width: 820px) {
  .content {
    grid-template-columns: 1fr;
  }
}
</style>
