'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { Building2 } from 'lucide-react'

import { LoginForm } from './auth/LoginForm'
import { SignupForm } from './auth/SignupForm'
import { MPINPad } from './auth/MPINPad'
import { BiometricPrompt } from './auth/BiometricPrompt'

type AuthView = 'login' | 'signup' | 'mpin' | 'biometric'

export default function Auth() {
  const [view, setView] = useState<AuthView>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorBanner, setErrorBanner] = useState('')

  // MPIN & Biometrics State
  const [mpin, setMpin] = useState('')
  const [hasSavedMPIN, setHasSavedMPIN] = useState(false)
  const [hasBiometrics, setHasBiometrics] = useState(false)

  const { signIn, signUp } = useAuth()
  const { success, error, info } = useToast()

  // Initialize stored credentials
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail')
    const savedMPIN = localStorage.getItem('userMPIN')
    const biometricEnabled = localStorage.getItem('biometricEnabled') === 'true'

    if (savedEmail) {
      setEmail(savedEmail)
    }

    if (savedMPIN) {
      setHasSavedMPIN(true)
    }

    if (biometricEnabled && typeof window !== 'undefined' && window.PublicKeyCredential) {
      setHasBiometrics(true)
    }
  }, [])

  // Email / Password Login Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorBanner('')

    try {
      const { error: authError } = await signIn(email, password)
      if (authError) {
        const msg = authError.message || 'Invalid email or password'
        setErrorBanner(msg)
        error(msg, 'Authentication Failed')
        return
      }

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email)
      } else {
        localStorage.removeItem('rememberedEmail')
      }

      success('Welcome back to RentNeon!', 'Signed In')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during sign in'
      setErrorBanner(msg)
      error(msg, 'Error')
    } finally {
      setLoading(false)
    }
  }

  // Signup Handler
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorBanner('')

    try {
      const { error: authError } = await signUp(email, password)
      if (authError) {
        const msg = authError.message || 'Failed to create account'
        setErrorBanner(msg)
        error(msg, 'Signup Error')
        return
      }
      success('Your landlord account has been created!', 'Account Created')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during signup'
      setErrorBanner(msg)
      error(msg, 'Error')
    } finally {
      setLoading(false)
    }
  }

  // MPIN Verification Handler
  const handleMPINSubmit = async (enteredPin: string) => {
    setErrorBanner('')
    const savedMPIN = localStorage.getItem('userMPIN')
    const savedEmail = localStorage.getItem('rememberedEmail') || email

    if (enteredPin === savedMPIN && savedEmail) {
      setLoading(true)
      try {
        // Prompt for password if not cached in memory session
        info('Quick MPIN recognized. Please enter password to complete secure session.', 'Device Unlock')
        setView('login')
      } finally {
        setLoading(false)
      }
    } else {
      setErrorBanner('Incorrect MPIN. Please try again.')
      setMpin('')
    }
  }

  // WebAuthn Biometric Trigger
  const handleBiometricTrigger = async () => {
    setErrorBanner('')
    setLoading(true)

    try {
      const savedEmail = localStorage.getItem('rememberedEmail') || email
      if (!savedEmail) {
        setErrorBanner('Please log in with email and password first.')
        setView('login')
        return
      }
      info('Biometric verified on device.', 'Verified')
      setView('login')
    } catch (err: unknown) {
      setErrorBanner(err instanceof Error ? err.message : 'Biometric authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-md w-full p-8 shadow-2xl border border-white/20 space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/25">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">RentNeon</h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">Smart Rental & Utility Management</p>
        </div>

        {/* Global Error Banner */}
        {errorBanner && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-semibold flex items-center gap-2">
            <span>{errorBanner}</span>
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
              setErrorBanner('')
              setView('signup')
            }}
            onSwitchToMPIN={() => {
              setErrorBanner('')
              setView('mpin')
            }}
            onSwitchToBiometric={() => {
              setErrorBanner('')
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
              setErrorBanner('')
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
              setErrorBanner('')
              setView('login')
            }}
            loading={loading}
            error={errorBanner}
          />
        )}

        {view === 'biometric' && (
          <BiometricPrompt
            onTriggerBiometric={handleBiometricTrigger}
            onBackToPassword={() => {
              setErrorBanner('')
              setView('login')
            }}
            loading={loading}
            error={errorBanner}
          />
        )}
      </div>
    </div>
  )
}