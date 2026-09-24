'use client'

import React, { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, Smartphone, Fingerprint, Zap } from 'lucide-react'

interface LoginFormProps {
  email: string
  onEmailChange: (email: string) => void
  password: string
  onPasswordChange: (password: string) => void
  rememberMe: boolean
  onRememberMeChange: (remember: boolean) => void
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
  onSwitchToSignup: () => void
  onSwitchToMPIN?: () => void
  onSwitchToBiometric?: () => void
  hasSavedMPIN?: boolean
  hasBiometrics?: boolean
}

export const LoginForm: React.FC<LoginFormProps> = ({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  rememberMe,
  onRememberMeChange,
  loading,
  onSubmit,
  onSwitchToSignup,
  onSwitchToMPIN,
  onSwitchToBiometric,
  hasSavedMPIN = false,
  hasBiometrics = false,
}) => {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="space-y-6">
      {/* Quick Login Options (MPIN / Biometric) */}
      {(hasSavedMPIN || hasBiometrics) && (
        <div className="grid grid-cols-2 gap-3 pb-2 border-b border-gray-100">
          {hasSavedMPIN && (
            <button
              type="button"
              onClick={onSwitchToMPIN}
              className="flex items-center justify-center gap-2 p-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-semibold transition-colors"
            >
              <Smartphone className="w-4 h-4" />
              Quick MPIN
            </button>
          )}

          {hasBiometrics && (
            <button
              type="button"
              onClick={onSwitchToBiometric}
              className="flex items-center justify-center gap-2 p-2.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-semibold transition-colors"
            >
              <Fingerprint className="w-4 h-4" />
              Face / Fingerprint
            </button>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              placeholder="landlord@example.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 text-gray-400 hover:text-gray-600 absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => onRememberMeChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Remember on this device
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="text-center pt-2">
        <p className="text-xs text-gray-500">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="font-semibold text-blue-600 hover:underline"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  )
}
