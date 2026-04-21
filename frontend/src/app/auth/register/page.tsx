'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Scale, Loader2 } from 'lucide-react'
import { apiPost } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'At least 8 characters'),
  phone: z.string().optional(),
  organizationName: z.string().min(2, 'Firm name is required'),
  organizationSlug: z
    .string()
    .min(3, 'Min 3 chars')
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, hyphens only'),
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      const res = await apiPost<any>('/auth/register', data)
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken)
      toast.success('Account created! Welcome to Litigation OS.')
      router.push('/dashboard')
    } catch (e: any) {
      toast.error(e.message || 'Registration failed')
    }
  }

  const handleOrgNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 40)
    setValue('organizationSlug', slug)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-xl">Litigation OS</p>
            <p className="text-blue-300 text-xs">Indian Legal Practice Management</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">
          <h1 className="text-white text-2xl font-bold mb-1">Create your account</h1>
          <p className="text-blue-300 text-sm mb-6">Set up your firm on Litigation OS</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">First name</label>
                <input
                  {...register('firstName')}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                  placeholder="Rajiv"
                />
                {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Last name</label>
                <input
                  {...register('lastName')}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                  placeholder="Sharma"
                />
                {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                {...register('email')}
                type="email"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                placeholder="advocate@firm.in"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input
                {...register('password')}
                type="password"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                placeholder="Min 8 characters"
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone (optional)</label>
              <input
                {...register('phone')}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider mb-3">Law Firm Details</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Firm / Organization Name</label>
                  <input
                    {...register('organizationName')}
                    onChange={(e) => {
                      register('organizationName').onChange(e)
                      handleOrgNameChange(e)
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                    placeholder="Sharma & Associates"
                  />
                  {errors.organizationName && (
                    <p className="text-red-400 text-xs mt-1">{errors.organizationName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Slug <span className="text-slate-500">(unique URL identifier)</span>
                  </label>
                  <div className="flex items-center">
                    <span className="bg-white/5 border border-r-0 border-white/10 rounded-l-lg px-3 py-2.5 text-slate-400 text-sm">
                      litigationos.in/
                    </span>
                    <input
                      {...register('organizationSlug')}
                      className="flex-1 bg-white/5 border border-white/10 rounded-r-lg px-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                      placeholder="sharma-associates"
                    />
                  </div>
                  {errors.organizationSlug && (
                    <p className="text-red-400 text-xs mt-1">{errors.organizationSlug.message}</p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Account
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
