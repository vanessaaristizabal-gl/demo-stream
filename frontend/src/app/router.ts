import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/features/auth/store'
import type { RouteLocationRaw, RouteRecordRaw } from 'vue-router'
import type { Role } from '@/shared/api/types'

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    /** Label in the breadcrumb trail. Pages without one (login) show no trail. */
    crumb?: string
    /** Name of the parent route, for the trail and as the fallback target of Back. */
    parent?: string
    /** Only these roles may open the page; anyone else is sent to the start page. */
    roles?: Role[]
  }
}

// These operations run on a mock served by `vite dev` (mock-backend/), so their pages exist only there.
const previewRoutes: RouteRecordRaw[] = [
  {
    path: '/campaigns/bulk',
    name: 'campaign-bulk',
    component: () => import('@/features/campaigns/bulk/BulkBudgetView.vue'),
    meta: { crumb: 'Bulk budget change', parent: 'campaigns' },
  },
  {
    path: '/campaigns/copy',
    name: 'campaign-copy',
    component: () => import('@/features/campaigns/copy/AdCopyView.vue'),
    meta: { crumb: 'Ad copy', parent: 'campaigns' },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/features/auth/views/LoginView.vue'), meta: { public: true } },
    { path: '/', redirect: { name: 'campaigns' } },
    {
      path: '/campaigns',
      name: 'campaigns',
      component: () => import('@/features/campaigns/views/CampaignsView.vue'),
      meta: { crumb: 'Campaigns' },
    },
    {
      path: '/campaigns/new',
      name: 'campaign-new',
      component: () => import('@/features/campaigns/simulated/views/NewSimulatedCampaignView.vue'),
      meta: { crumb: 'New simulated campaign', parent: 'campaigns' },
    },
    {
      path: '/campaigns/simulated/:id(\\d+)',
      name: 'campaign-simulated',
      component: () => import('@/features/campaigns/simulated/views/SimulatedCampaignView.vue'),
      props: (route) => ({ id: Number(route.params.id) }),
      meta: { crumb: 'Simulated campaign', parent: 'campaigns' },
    },
    {
      path: '/campaigns/:id(\\d+)',
      name: 'campaign',
      component: () => import('@/features/campaigns/views/CampaignDetailView.vue'),
      props: (route) => ({ id: Number(route.params.id) }),
      meta: { crumb: 'Campaign', parent: 'campaigns' },
    },
    // Approvals are a tab of Campaigns: a change request is a change to a campaign.
    { path: '/approvals', redirect: { name: 'campaigns', query: { tab: 'approvals' } } },
    {
      path: '/accounts',
      name: 'accounts',
      component: () => import('@/features/accounts/views/AccountsView.vue'),
      meta: { crumb: 'Accounts' },
    },
    {
      path: '/accounts/:id(\\d+)',
      name: 'account',
      component: () => import('@/features/accounts/views/AccountView.vue'),
      props: (route) => ({ id: Number(route.params.id) }),
      meta: { crumb: 'Account', parent: 'accounts' },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/features/system/views/AdminView.vue'),
      meta: { crumb: 'Admin', roles: ['admin'] },
    },
    {
      path: '/changelog',
      name: 'changelog',
      component: () => import('@/features/changelog/views/ChangelogView.vue'),
      meta: { crumb: 'Changelog' },
    },
    // The sandbox became part of Campaigns (simulated campaigns sit beside live ones); old links still work.
    { path: '/sandbox', redirect: { name: 'campaigns' } },
    { path: '/sandbox/:id(\\d+)', redirect: (to) => ({ name: 'campaign-simulated', params: { id: to.params.id } }) },
    // The practice-lab addresses of earlier versions still land somewhere sensible.
    { path: '/lab', redirect: { name: 'campaigns' } },
    { path: '/playbooks', redirect: { name: 'campaigns' } },
    { path: '/lab/deploy', redirect: { name: 'accounts' } },
    { path: '/lab/bulk', redirect: { name: 'campaigns' } },
    { path: '/lab/template', redirect: { name: 'campaigns' } },
    { path: '/lab/rows', redirect: { name: 'campaigns' } },
    ...(import.meta.env.DEV ? previewRoutes : []),
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/app/views/NotFoundView.vue'),
      meta: { crumb: 'Not found' },
    },
  ],
})

/** Send people to sign in and remember where they were going (see safeRedirect for how it is read back). */
const toLogin = (target: string): RouteLocationRaw => ({ name: 'login', query: target === '/' ? {} : { redirect: target } })

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!to.meta.public && !auth.isAuthenticated) return toLogin(to.fullPath)
  if (to.name === 'login' && auth.isAuthenticated) return { name: 'campaigns' }

  if (auth.isAuthenticated && !auth.user) {
    try {
      await auth.fetchMe()
    } catch {
      auth.clear()
      return toLogin(to.fullPath)
    }
  }

  // A page for some roles only (Admin): everyone else lands on the start page instead of a screen they cannot use.
  const roles = to.meta.roles
  if (roles && !(auth.user && roles.includes(auth.user.role))) return { name: 'campaigns' }
})
