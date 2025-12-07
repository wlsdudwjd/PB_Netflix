<script setup>
const props = defineProps({
  movie: {
    type: Object,
    required: true,
  },
  posterUrl: {
    type: String,
    default: '',
  },
  inWishlist: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle', 'view', 'detail'])
</script>

<template>
  <article class="card" :data-wishlist="inWishlist">
    <div class="poster" @click="emit('view', movie)">
      <img :src="posterUrl" :alt="movie.title || movie.name || '포스터'" loading="lazy" />
      <span class="badge" v-if="movie.vote_average">★ {{ movie.vote_average.toFixed?.(1) || movie.vote_average }}</span>
      <span v-if="inWishlist" class="bookmark">★</span>
      <div class="overlay">
        <h3>{{ movie.title || movie.name || '제목 없음' }}</h3>
        <p class="meta">
          <span v-if="movie.release_date">{{ movie.release_date }}</span>
          <span v-if="movie.vote_count">리뷰 {{ movie.vote_count }}</span>
        </p>
        <p class="overview">{{ movie.overview || '설명이 없습니다.' }}</p>
        <div class="actions">
          <button type="button" class="wish-btn" @click.stop="emit('toggle', movie)">
            {{ inWishlist ? '★ 찜 해제' : '★ 찜하기' }}
          </button>
        </div>
      </div>
    </div>
    <div class="body" @click="emit('view', movie)">
      <h3>{{ movie.title || movie.name || '제목 없음' }}</h3>
      <p class="meta">
        <span v-if="movie.release_date">{{ movie.release_date }}</span>
        <span v-if="movie.vote_count">리뷰 {{ movie.vote_count }}</span>
      </p>
      <p class="overview">{{ movie.overview || '설명이 없습니다.' }}</p>
    </div>
  </article>
</template>

<style scoped>
.card {
  background: #101018;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  transition: transform 200ms var(--ease-smooth), box-shadow 200ms var(--ease-smooth), border-color 200ms var(--ease-smooth);
  will-change: transform;
  cursor: pointer;
}

.card[data-wishlist='true'] {
  box-shadow: 0 12px 28px rgba(255, 209, 102, 0.2);
}

.poster {
  position: relative;
  aspect-ratio: 2 / 3;
  background: #15151b;
  overflow: hidden;
}

.poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 220ms var(--ease-smooth), filter 220ms var(--ease-smooth);
}

.bookmark {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.65);
  color: #ffd166;
  padding: 0.25rem 0.45rem;
  border-radius: 8px;
  font-weight: 900;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.4);
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
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.45);
}

.card:hover .poster img {
  transform: scale(1.12);
  filter: brightness(1.05);
}

.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.85));
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 180ms var(--ease-smooth), transform 180ms var(--ease-smooth);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.card:hover .overlay {
  opacity: 1;
  transform: translateY(0);
}

.wish-btn {
  margin-top: auto;
  align-self: flex-start;
  padding: 0.48rem 0.78rem;
  border-radius: 999px;
  border: none;
  background: linear-gradient(120deg, #e50914, #ff6a00);
  color: #fff;
  cursor: pointer;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 14px 30px rgba(229, 9, 20, 0.3);
  transition: transform 150ms var(--ease-smooth), box-shadow 150ms var(--ease-smooth), filter 150ms var(--ease-smooth);
}

.wish-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 36px rgba(229, 9, 20, 0.4);
  filter: brightness(1.05);
}

.actions {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .card {
    max-width: none;
  }

  .poster .badge {
    font-size: 0.8rem;
    padding: 0.25rem 0.4rem;
  }

  .body h3 {
    font-size: 0.95rem;
  }

  .overview {
    -webkit-line-clamp: 2;
    font-size: 0.85rem;
  }

  .actions {
    gap: 0.35rem;
  }

  .wish-btn {
    font-size: 0.9rem;
    padding: 0.4rem 0.65rem;
  }
}
</style>
