<script setup>
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['dismiss'])

const label = (type) => {
  if (type === 'success') return '성공'
  if (type === 'error') return '에러'
  return '알림'
}
</script>

<template>
  <Teleport to="body">
    <div class="toast-layer" aria-live="polite" aria-atomic="true">
      <TransitionGroup name="toast">
        <article
          v-for="toast in props.items"
          :key="toast.id"
          class="toast"
          :data-tone="toast.type"
        >
          <div class="status" />
          <div class="copy">
            <p class="kicker">{{ label(toast.type) }}</p>
            <p class="message">{{ toast.message }}</p>
          </div>
          <button type="button" class="close" @click="emit('dismiss', toast.id)" aria-label="닫기">
            ×
          </button>
        </article>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-layer {
  position: fixed;
  inset: 0 0 auto auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.65rem;
  padding: 1rem;
  pointer-events: none;
  z-index: 30;
}

.toast {
  width: min(420px, 90vw);
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.75rem;
  background: rgba(11, 16, 32, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 0.9rem 1rem;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.35);
  pointer-events: all;
  backdrop-filter: blur(6px);
}

.toast[data-tone='success'] {
  border-color: rgba(34, 197, 94, 0.5);
}

.toast[data-tone='error'] {
  border-color: rgba(248, 113, 113, 0.7);
}

.status {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, #38bdf8, #7c3aed);
  box-shadow: 0 0 0 5px rgba(124, 58, 237, 0.12);
}

.toast[data-tone='success'] .status {
  background: linear-gradient(135deg, #22c55e, #38bdf8);
}

.toast[data-tone='error'] .status {
  background: linear-gradient(135deg, #ef4444, #f97316);
}

.copy {
  color: #e2e8f0;
}

.kicker {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(148, 163, 184, 0.9);
}

.message {
  line-height: 1.5;
}

.close {
  background: transparent;
  border: none;
  color: rgba(226, 232, 240, 0.8);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease, opacity 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
