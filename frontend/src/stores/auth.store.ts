import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'SENIOR_LAWYER' | 'ASSOCIATE' | 'CLERK' | 'CLIENT'
  organizationId: string
  organization: { id: string; name: string; slug: string; logoUrl?: string }
  avatarUrl?: string
  barNumber?: string
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  updateUser: (user: Partial<AuthUser>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: 'litigation-os-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)

// Selectors
export const useUser = () => useAuthStore((s) => s.user)
export const useIsAdmin = () => useAuthStore((s) => s.user?.role === 'ADMIN')
export const useIsSeniorLawyer = () =>
  useAuthStore((s) => ['ADMIN', 'SENIOR_LAWYER'].includes(s.user?.role || ''))
export const useIsClient = () => useAuthStore((s) => s.user?.role === 'CLIENT')
