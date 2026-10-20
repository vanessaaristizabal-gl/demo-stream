import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/features/auth/store'
import type { RouteLocationRaw, RouteRecordRaw } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    /** Label in the breadcrumb trail. Pages without one (login) show no trail. */
    crumb?: string
    /** Name of the parent route, for the trail and as the fallback target of Back. */
    parent?: string
  }
}

const labRoutes: RouteRecordRaw[] = [
  { path: '/lab', name: 'lab', component: () => import('@/features/lab/views/LabView.vue'), meta: { crumb: 'Lab' } },
  {
    path: '/lab/bulk',
    name: 'lab-bulk',
    component: () => import('@/features/lab/views/BulkApprovalView.vue'),
    meta: { crumb: 'Bulk approval', parent: 'lab' },
  },
  {
    path: '/lab/template',
    name: 'lab-template',
    component: () => import('@/features/lab/views/TemplateFieldView.vue'),
    meta: { crumb: 'Template field', parent: 'lab' },
  },
  {
    path: '/lab/rows',
    name: 'lab-rows',
    component: () => import('@/features/lab/views/DenseListView.vue'),
    meta: { crumb: 'Dense list', parent: 'lab' },
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
      path: '/campaigns/:id(\\d+)',
      name: 'campaign',
      component: () => import('@/features/campaigns/views/CampaignDetailView.vue'),
      props: (route) => ({ id: Number(route.params.id) }),
      meta: { crumb: 'Campaign', parent: 'campaigns' },
    },
    {
      path: '/approvals',
      name: 'approvals',
      component: () => import('@/features/approvals/views/ApprovalsView.vue'),
      meta: { crumb: 'Approvals' },
    },
    {
      path: '/changelog',
      name: 'changelog',
      component: () => import('@/features/changelog/views/ChangelogView.vue'),
      meta: { crumb: 'Changelog' },
    },
    {
      path: '/sandbox',
      name: 'sandbox',
      component: () => import('@/features/sandbox/views/SandboxView.vue'),
      meta: { crumb: 'Sandbox' },
    },
    {
      path: '/sandbox/:id(\\d+)',
      name: 'sandbox-campaign',
      component: () => import('@/features/sandbox/views/SandboxCampaignView.vue'),
      props: (route) => ({ id: Number(route.params.id) }),
      meta: { crumb: 'Simulated campaign', parent: 'sandbox' },
    },
    // The practice lab runs on a mock served by `vite dev` (lab-api/), so it exists only there.
    ...(import.meta.env.DEV ? labRoutes : []),
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
})
