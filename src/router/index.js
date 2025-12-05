import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PopularView from '../views/PopularView.vue'
import SignInView from '../views/SignInView.vue'
import SearchView from '../views/SearchView.vue'
import WishlistView from '../views/WishlistView.vue'
import { isAuthenticated } from '../utils/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: '/popular',
      name: 'popular',
      component: PopularView,
      meta: { requiresAuth: true },
    },
    {
      path: '/search',
      name: 'search',
      component: SearchView,
      meta: { requiresAuth: true },
    },
    {
      path: '/wishlist',
      name: 'wishlist',
      component: WishlistView,
      meta: { requiresAuth: true },
    },
      {
          path: '/wishlist',
          name: 'wishlist',
          component: WishlistView,
          meta: { requiresAuth: true },
      },
    {
      path: '/signin',
      name: 'signin',
      component: SignInView,
    },
  ],
})

router.beforeEach((to) => {
  const authed = isAuthenticated()

  if (to.meta.requiresAuth && !authed) {
    return { name: 'signin' }
  }

  if (to.name === 'signin' && authed) {
    return { name: 'home' }
  }

  return true
})

export default router
