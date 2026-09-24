'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Building2 } from 'lucide-react'

import { LoginForm } from './auth/LoginForm'
import { SignupForm } from './auth/SignupForm'
import { MPINPad } from './auth/MPINPad'
import { BiometricPrompt } from './auth/BiometricPrompt'

type AuthView = 'login' | 'signup' | 'mpin' | 'biometric' | 'setup-mpin'

export default function Auth() {
  const [view, setView] = useState<AuthView>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // MPIN & Biometrics State
  const [mpin, setMpin] = useState('')
  const [hasSavedMPIN, setHasSavedMPIN] = useState(false)
  const [hasBiometrics, setHasBiometrics] = useState(false)

  const { signIn, signUp } = useAuth()

  // Initialize stored credentials & device authentication features
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail')
    const savedMPIN = localStorage.getItem('userMPIN')
    const biometricEnabled = localStorage.getItem('biometricEnabled') === 'true'

    if (savedEmail) {
      setEmail(savedEmail)
    }

    if (savedMPIN) {
      setHasSavedMPIN(true)
      setView('mpin')
    }

    if (biometricEnabled && typeof window !== 'undefined' && window.PublicKeyCredential) {
      setHasBiometrics(true)
    }
  }, [])

  // Email / Password Login Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: authError } = await signIn(email, password)
      if (authError) {
        setError(authError.message || 'Invalid email or password')
        return
      }

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email)
      } else {
        localStorage.removeItem('rememberedEmail')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign in')
    } finally {
      setLoading(false)
    }
  }

  // Signup Handler
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: authError } = await signUp(email, password)
      if (authError) {
        setError(authError.message || 'Failed to create account')
        return
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during signup')
    } finally {
      setLoading(false)
    }
  }

  // MPIN Verification Handler
  const handleMPINSubmit = async (enteredPin: string) => {
    setError('')
    const savedMPIN = localStorage.getItem('userMPIN')
    const savedPassword = localStorage.getItem('rememberedPassword')
    const savedEmail = localStorage.getItem('rememberedEmail') || email

    if (enteredPin === savedMPIN && savedPassword && savedEmail) {
      setLoading(true)
      try {
        const { error: authError } = await signIn(savedEmail, savedPassword)
        if (authError) {
          setError('Session expired. Please log in with password.')
          setView('login')
        }
      } catch (err: unknown) {
        setError('Authentication failed. Please use password.')
        setView('login')
      } finally {
        setLoading(false)
      }
    } else {
      setError('Incorrect MPIN. Please try again.')
      setMpin('')
    }
  }

  // WebAuthn Biometric Trigger
  const handleBiometricTrigger = async () => {
    setError('')
    setLoading(true)

    try {
      const savedEmail = localStorage.getItem('rememberedEmail') || email
      const savedPassword = localStorage.getItem('rememberedPassword')

      if (!savedPassword || !savedEmail) {
        setError('Please log in with password first to enable biometrics.')
        setView('login')
        return
      }

      const { error: authError } = await signIn(savedEmail, savedPassword)
      if (authError) {
        setError(authError.message)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Biometric authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-md w-full p-8 shadow-2xl border border-white/20 space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-500/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">RentNeon</h1>
          <p className="text-xs text-gray-500 mt-1">Smart Rental & Utility Management</p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* Subsystem Views */}
        {view === 'login' && (
          <LoginForm
            email={email}
            onEmailChange={setEmail}
            password={password}
            onPasswordChange={setPassword}
            rememberMe={rememberMe}
            onRememberMeChange={setRememberMe}
            loading={loading}
            onSubmit={handleLoginSubmit}
            onSwitchToSignup={() => {
              setError('')
              setView('signup')
            }}
            onSwitchToMPIN={() => {
              setError('')
              setView('mpin')
            }}
            onSwitchToBiometric={() => {
              setError('')
              setView('biometric')
            }}
            hasSavedMPIN={hasSavedMPIN}
            hasBiometrics={hasBiometrics}
          />
        )}

        {view === 'signup' && (
          <SignupForm
            name={name}
            onNameChange={setName}
            email={email}
            onEmailChange={setEmail}
            password={password}
            onPasswordChange={setPassword}
            loading={loading}
            onSubmit={handleSignupSubmit}
            onSwitchToLogin={() => {
              setError('')
              setView('login')
            }}
          />
        )}

        {view === 'mpin' && (
          <MPINPad
            mpin={mpin}
            onMpinChange={setMpin}
            onSubmit={handleMPINSubmit}
            onBackToPassword={() => {
              setError('')
              setView('login')
            }}
            loading={loading}
            error={error}
          />
        )}

        {view === 'biometric' && (
          <BiometricPrompt
            onTriggerBiometric={handleBiometricTrigger}
            onBackToPassword={() => {
              setError('')
              setView('login')
            }}
            loading={loading}
            error={error}
          />
        )}
      </div>
    </div>
  )
}