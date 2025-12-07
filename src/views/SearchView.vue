<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import TopNav from '../components/TopNav.vue'
import { clearSession, getSession, getStoredUser } from '../utils/auth'

const router = useRouter()
const session = computed(() => getSession())

const filters = reactive({
  query: '',
  genre: '',
  year: '',
  country: '',
  certification: '',
  sort: 'popularity.desc',
})

const genres = ref([])
const yearOptions = computed(() => {
  const current = new Date().getFullYear()
  return Array.from({ length: 30 }, (_, i) => current - i)
})
const countries = [
  { code: 'KR', label: '한국' },
  { code: 'US', label: '미국' },
  { code: 'JP', label: '일본' },
  { code: 'GB', label: '영국' },
  { code: 'FR', label: '프랑스' },
]
const certifications = [
  { value: '', label: '관람가' },
  { value: 'All', label: '전체관람가' },
  { value: '12', label: '12세 관람가' },
  { value: '15', label: '15세 관람가' },
]
const countryLanguageMap = {
  KR: 'ko',
  US: 'en',
  JP: 'ja',
  GB: 'en',
  FR: 'fr',
}
const certCache = {}
const state = reactive({
  loading: true,
  error: '',
  items: [],
  page: 1,
  totalPages: 1,
})

const imageUrl = (path) => (path ? `https://image.tmdb.org/t/p/w300${path}` : '')

const handleLogout = () => {
  clearSession()
  router.push('/signin')
}

const fetchJson = async (path, apiKey) => {
  const separator = path.includes('?') ? '&' : '?'
  const url = `https://api.themoviedb.org/3${path}${separator}api_key=${apiKey}&language=ko-KR&include_adult=false`
  const res = await fetch(url)
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const reason = json?.status_message ?? 'TMDB API 호출에 실패했습니다.'
    throw new Error(reason)
  }
  return json
}

const getApiKey = () => getStoredUser()?.password

const loadGenres = async () => {
  try {
    const apiKey = getApiKey()
    if (!apiKey) {
      router.push('/signin')
      return
    }
    const data = await fetchJson('/genre/movie/list', apiKey)
    genres.value = data?.genres || []
  } catch (error) {
    console.warn('장르 로드 실패', error)
  }
}

const applyClientFilters = (list) =>
  (list || []).filter((movie) => {
    const query = filters.query?.toLowerCase().trim()
    const matchesGenre = !filters.genre || movie.genre_ids?.includes(Number(filters.genre))
    const matchesYear = !filters.year || (movie.release_date || '').startsWith(String(filters.year))
    const languageForCountry = filters.country ? countryLanguageMap[filters.country] : ''
    const matchesCountry = !languageForCountry || movie.original_language === languageForCountry
    const certificationKR = movie.certificationKR || movie.certification || ''
    const matchesCert = (() => {
      if (!filters.certification) return true // 관람가 전체
      if (filters.certification === 'All') {
        return ['All', '전체관람가', '전체', 'G', '전체 관람가'].includes(certificationKR)
      }
      return certificationKR === filters.certification
    })()
    const matchesTitle =
      !query || (movie.title || movie.name || movie.original_title || '').toLowerCase().includes(query)

    return matchesGenre && matchesYear && matchesCountry && matchesCert && matchesTitle
  })

const sortMovies = (list) => {
  const sorted = [...list]
  switch (filters.sort) {
    case 'vote_average.desc':
      sorted.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
      break
    case 'release_date.desc':
      sorted.sort(
        (a, b) =>
          new Date(b.release_date || '1900-01-01') - new Date(a.release_date || '1900-01-01'),
      )
      break
    default:
      sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
  }
  return sorted
}

const hydrateCertifications = async (items, apiKey) => {
  if (!filters.certification) return items
  const jobs = items.map(async (movie) => {
    if (certCache[movie.id]) {
      movie.certificationKR = certCache[movie.id]
      return
    }
    try {
      const data = await fetchJson(`/movie/${movie.id}/release_dates`, apiKey)
      const kr = data?.results?.find((r) => r.iso_3166_1 === 'KR')
      const cert = kr?.release_dates?.find((d) => d.certification)?.certification || ''
      certCache[movie.id] = cert
      movie.certificationKR = cert
    } catch (error) {
      certCache[movie.id] = ''
    }
  })
  await Promise.all(jobs)
  return items
}

const loadMovies = async (page = 1) => {
  const apiKey = getApiKey()
  if (!apiKey) {
    router.push('/signin')
    return
  }

  state.loading = true
  state.error = ''

  const isSearch = Boolean(filters.query)
  const params = new URLSearchParams({
    page: page.toString(),
    include_adult: 'false',
  })

  if (isSearch) {
    params.set('query', filters.query)
  } else {
    params.set('sort_by', filters.sort)
    if (filters.genre) params.set('with_genres', filters.genre)
    if (filters.year) params.set('primary_release_year', filters.year)
  if (filters.country) params.set('with_origin_country', filters.country)
  params.set('certification_country', 'KR')
  if (filters.certification) {
    params.set('certification', filters.certification)
  }
  }

  try {
    const endpoint = isSearch ? '/search/movie' : '/discover/movie'
    const data = await fetchJson(`${endpoint}?${params.toString()}`, apiKey)
    const enriched = await hydrateCertifications(data?.results || [], apiKey)
    const filtered = applyClientFilters(enriched)
    const sorted = sortMovies(filtered)
    state.items = sorted
    state.page = page
    state.totalPages = data?.total_pages || 1
  } catch (error) {
    state.error = error?.message || '검색 결과를 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

const resetFilters = () => {
  filters.query = ''
  filters.genre = ''
  filters.year = ''
  filters.country = ''
  filters.certification = ''
  filters.sort = 'popularity.desc'
  loadMovies(1)
}

const applyFilters = () => {
  loadMovies(1)
}

const handleSubmit = () => {
  applyFilters()
}

watch(
  () => [filters.genre, filters.year, filters.country, filters.certification],
  () => applyFilters(),
)

watch(
  () => filters.sort,
  () => applyFilters(),
)

onMounted(() => {
  loadGenres()
  loadMovies(1)
})
</script>

<template>
  <main class="search-shell">
    <TopNav :active="'search'" :email="session?.email" @logout="handleLogout" />

    <form class="filter-bar" @submit.prevent="handleSubmit">
      <input
        v-model.trim="filters.query"
        type="search"
        placeholder="제목"
        aria-label="검색어"
        class="wide"
      />
      <select v-model="filters.genre" aria-label="장르 선택">
        <option value="">전체 장르</option>
        <option v-for="genre in genres" :key="genre.id" :value="genre.id">{{ genre.name }}</option>
      </select>
      <select v-model="filters.year" aria-label="개봉 연도">
        <option value="">전체 연도</option>
        <option v-for="yearOption in yearOptions" :key="yearOption" :value="yearOption">
          {{ yearOption }}
        </option>
      </select>
      <select v-model="filters.country" aria-label="국가 선택">
        <option value="">전체 국가</option>
        <option v-for="country in countries" :key="country.code" :value="country.code">
          {{ country.label }}
        </option>
      </select>
      <select v-model="filters.certification" aria-label="관람 등급">
        <option v-for="cert in certifications" :key="cert.value || 'all'" :value="cert.value">
          {{ cert.label }}
        </option>
      </select>
      <div class="actions">
        <button type="submit" class="primary">필터 적용</button>
        <button type="button" class="ghost" @click="resetFilters">초기화</button>
      </div>
    </form>

    <div class="sort-bar">
      <span>정렬:</span>
      <button
        v-for="option in [
          { label: '인기순', value: 'popularity.desc' },
          { label: '평점순', value: 'vote_average.desc' },
          { label: '개봉일순', value: 'release_date.desc' },
        ]"
        :key="option.value"
        :class="{ active: filters.sort === option.value }"
        type="button"
        @click="() => { filters.sort = option.value; loadMovies(1) }"
      >
        {{ option.label }}
      </button>
    </div>

    <section v-if="error" class="error">
      <p>{{ error }}</p>
    </section>

    <section class="results">
      <div v-if="state.loading" class="loading">검색 중...</div>
      <div v-else class="grid">
        <article v-for="movie in state.items" :key="movie.id" class="card">
          <div class="poster">
            <img :src="imageUrl(movie.poster_path)" :alt="movie.title || movie.name" loading="lazy" />
            <span class="badge" v-if="movie.vote_average">★ {{ movie.vote_average.toFixed(1) }}</span>
          </div>
          <div class="body">
            <h3>{{ movie.title || movie.name }}</h3>
            <p class="meta">
              <span v-if="movie.release_date">{{ movie.release_date }}</span>
              <span v-if="movie.vote_count">리뷰 {{ movie.vote_count }}</span>
            </p>
            <p class="overview">{{ movie.overview || '줄거리가 제공되지 않았습니다.' }}</p>
          </div>
        </article>
      </div>
      <div class="pager">
        <button type="button" :disabled="state.page <= 1 || state.loading" @click="loadMovies(state.page - 1)">
          이전
        </button>
        <span>{{ state.page }} / {{ state.totalPages }}</span>
        <button
          type="button"
          :disabled="state.page >= state.totalPages || state.loading"
          @click="loadMovies(state.page + 1)"
        >
          다음
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.search-shell {
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

.filter-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.6rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 0.75rem;
}

.filter-bar input,
.filter-bar select {
  width: 100%;
  padding: 0.55rem 0.65rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #0f0f14;
  color: var(--text-primary);
  min-height: 42px;
}

.filter-bar .wide {
  grid-column: 1 / -1;
}

.actions {
  display: flex;
  gap: 0.5rem;
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

.ghost {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 0.6rem 0.9rem;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 160ms var(--ease-smooth), box-shadow 160ms var(--ease-smooth), border-color 160ms var(--ease-smooth);
  will-change: transform;
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

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 260px));
  justify-content: center;
  gap: 0.8rem;
}

.card {
  background: #101018;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 260px;
  transition: transform 200ms var(--ease-smooth), box-shadow 200ms var(--ease-smooth), border-color 200ms var(--ease-smooth);
  will-change: transform;
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
  transition: transform 200ms var(--ease-smooth), filter 200ms var(--ease-smooth);
}

.poster .badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: #ffd166;
  padding: 0.35rem 0.55rem;
  border-radius: 8px;
  font-weight: 800;
}

.body {
  padding: 0.65rem 0.75rem 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.45);
}

.card:hover .poster img {
  transform: scale(1.03);
  filter: brightness(1.05);
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

.helper {
  color: #ff9da8;
  font-size: 0.95rem;
  font-weight: 700;
  background: rgba(229, 9, 20, 0.08);
  border: 1px solid rgba(229, 9, 20, 0.3);
  padding: 0.6rem 0.75rem;
  border-radius: 10px;
}

.sort-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.sort-bar button {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  padding: 0.45rem 0.7rem;
  border-radius: 8px;
  cursor: pointer;
}

.sort-bar button.active {
  background: linear-gradient(120deg, #e50914, #b81d24);
  border-color: transparent;
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

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
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

.loading,
.error {
  text-align: center;
  color: var(--text-muted);
}

@media (max-width: 820px) {
  .search-shell {
    width: calc(100% - 1rem);
    padding: 0.6rem;
    gap: 0.75rem;
  }

  .filter-bar {
    grid-template-columns: 1fr;
  }

  .sort-bar {
    flex-wrap: wrap;
  }

  .grid {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }

  .results {
    padding: 0.6rem;
  }
}
</style>
