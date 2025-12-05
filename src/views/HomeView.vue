<script setup>
import { computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import TopNav from '../components/TopNav.vue'
import { clearSession, getSession, getStoredUser } from '../utils/auth'

const router = useRouter()
const session = computed(() => getSession())

const state = reactive({
  loading: true,
  error: '',
  hero: null,
  genres: {},
  sections: [],
})

const sectionsConfig = [
  { key: 'trending', title: '오늘의 트렌딩', path: '/trending/movie/day' },
  { key: 'now', title: '지금 상영 중', path: '/movie/now_playing' },
  { key: 'popular', title: '인기 급상승', path: '/movie/popular' },
  { key: 'top', title: '평점 TOP', path: '/movie/top_rated' },
  { key: 'upcoming', title: '개봉 예정', path: '/movie/upcoming' },
]

const imageUrl = (path) => (path ? `https://image.tmdb.org/t/p/w500${path}` : '')

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

const loadMovies = async () => {
  state.loading = true
  state.error = ''

  const storedUser = getStoredUser()
  const apiKey = storedUser?.password

  if (!apiKey) {
    state.error = 'TMDB API 키를 찾을 수 없습니다. 다시 로그인 해주세요.'
    router.push('/signin')
    return
  }

  try {
    const genreData = await fetchJson('/genre/movie/list', apiKey)
    state.genres = (genreData?.genres || []).reduce((acc, genre) => {
      acc[genre.id] = genre.name
      return acc
    }, {})

    const sectionPromises = sectionsConfig.map(async (section) => {
      const data = await fetchJson(section.path, apiKey)
      const items = (data?.results || []).slice(0, 12)
      return { ...section, items }
    })

    const results = await Promise.all(sectionPromises)
    state.sections = results
    const heroSource = results.find((s) => s.items?.length)?.items?.[0]
    state.hero = heroSource || null
  } catch (error) {
    state.error = error?.message || '영화 정보를 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

const genreNames = (genreIds) =>
  (genreIds || [])
    .map((id) => state.genres[id])
    .filter(Boolean)
    .slice(0, 3)
    .join(' · ')

onMounted(() => {
  loadMovies()
})
</script>

<template>
  <main class="home-shell">
    <TopNav :active="'home'" :email="session?.email" @logout="handleLogout" />

    <section v-if="state.hero" class="hero">
      <div class="hero-copy">
        <p class="eyebrow">추천</p>
        <h1>{{ state.hero.title || state.hero.name }}</h1>
        <p class="desc">
          {{ state.hero.overview || '설명이 제공되지 않았습니다.' }}
        </p>
        <div class="meta">
          <span v-if="state.hero.vote_average">★ {{ state.hero.vote_average.toFixed(1) }}</span>
          <span v-if="state.hero.release_date">개봉: {{ state.hero.release_date }}</span>
          <span v-if="state.hero.genre_ids?.length">{{ genreNames(state.hero.genre_ids) }}</span>
        </div>
      </div>
      <div class="hero-poster" v-if="imageUrl(state.hero.poster_path)">
        <img :src="imageUrl(state.hero.poster_path)" :alt="state.hero.title || '포스터'" />
      </div>
    </section>

    <section v-if="state.error" class="error">
      <p>{{ state.error }}</p>
    </section>

    <section v-if="state.loading" class="loading">
      <div class="shimmer" />
      <p>영화 추천을 불러오는 중...</p>
    </section>

    <section v-else class="rows">
      <article v-for="section in state.sections" :key="section.key" class="row">
        <header class="row-head">
          <h2>{{ section.title }}</h2>
          <span class="pill">TMDB</span>
        </header>
        <div class="cards">
          <div v-for="movie in section.items" :key="movie.id" class="card">
            <div class="poster">
              <img
                :src="imageUrl(movie.poster_path)"
                :alt="movie.title || movie.name"
                loading="lazy"
              />
              <span class="rating" v-if="movie.vote_average">★ {{ movie.vote_average.toFixed(1) }}</span>
            </div>
            <div class="copy">
              <h3>{{ movie.title || movie.name }}</h3>
              <p class="meta-line">
                <span v-if="movie.release_date">개봉 {{ movie.release_date }}</span>
                <span v-if="movie.genre_ids?.length">{{ genreNames(movie.genre_ids) }}</span>
              </p>
              <p class="overview">
                {{ movie.overview || '줄거리가 제공되지 않았습니다.' }}
              </p>
            </div>
          </div>
        </div>
      </article>
    </section>
  </main>
</template>

<style scoped>
.home-shell {
  min-height: 100vh;
  background: linear-gradient(180deg, rgba(11, 11, 16, 0.95), rgba(12, 12, 18, 0.98)),
    radial-gradient(circle at 20% 20%, rgba(229, 9, 20, 0.18), transparent 30%),
    radial-gradient(circle at 80% 0%, rgba(184, 29, 36, 0.14), transparent 30%),
    var(--bg);
  color: var(--text-primary);
  padding: clamp(1.5rem, 3vw, 2.5rem);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: min(1200px, calc(100% - 2.5rem));
  margin: 0 auto;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-weight: 900;
  font-size: clamp(1.5rem, 3vw, 1.9rem);
  letter-spacing: 0.12em;
  color: var(--accent);
}

.user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
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

.hero {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.04), rgba(0, 0, 0, 0.25));
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: clamp(1.2rem, 3vw, 1.75rem);
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.45);
}

.hero-copy h1 {
  font-size: clamp(2rem, 4vw, 2.6rem);
  margin-bottom: 0.5rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #ff9da8;
  font-weight: 700;
  margin-bottom: 0.4rem;
}

.desc {
  color: var(--text-muted);
  line-height: 1.6;
  margin: 0.5rem 0 0.75rem;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  color: #ffd1d6;
  font-weight: 700;
}

.hero-poster img {
  width: 100%;
  border-radius: 14px;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.5);
  object-fit: cover;
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
}

.row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  margin-bottom: 0.8rem;
}

.row-head h2 {
  font-size: 1.25rem;
}

.pill {
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-muted);
  font-size: 0.85rem;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.card {
  background: #0f0f14;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  min-height: 100%;
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

.rating {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.72);
  color: #ffd166;
  padding: 0.35rem 0.55rem;
  border-radius: 8px;
  font-weight: 800;
  font-size: 0.9rem;
}

.copy {
  padding: 0.75rem 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.copy h3 {
  font-size: 1.05rem;
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
  font-size: 0.95rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.loading,
.error {
  display: grid;
  place-items: center;
  text-align: center;
  padding: 1rem;
}

.shimmer {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.04));
  animation: shimmer 1.2s infinite;
  margin-bottom: 0.6rem;
}

@keyframes shimmer {
  0% {
    background-position: -100px 0;
  }
  100% {
    background-position: 100px 0;
  }
}

@media (max-width: 760px) {
  .topbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .user {
    width: 100%;
    justify-content: space-between;
  }

  .home-shell {
    width: 100%;
  }
}
</style>
