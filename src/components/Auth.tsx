'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeOff, Mail, Lock, User, Building2, Smartphone, Shield, Fingerprint, Zap } from 'lucide-react'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  
  // MPIN functionality
  const [showMPIN, setShowMPIN] = useState(false)
  const [mpin, setMpin] = useState('')
  const [isSettingMPIN, setIsSettingMPIN] = useState(false)
  const [confirmMpin, setConfirmMpin] = useState('')
  
  // Biometric functionality
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [showBiometricSetup, setShowBiometricSetup] = useState(false)
  
  // Auto-login functionality
  const [autoLoginEnabled, setAutoLoginEnabled] = useState(false)
  // const [deviceTrusted, setDeviceTrusted] = useState(false)

  const { signIn, signUp } = useAuth()

  // Check for saved credentials and device capabilities on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail')
    const savedMPIN = localStorage.getItem('userMPIN')
    const biometricSetup = localStorage.getItem('biometricEnabled')
    const autoLogin = localStorage.getItem('autoLoginEnabled')
    const trustedDevice = localStorage.getItem('deviceTrusted')
    
    if (savedEmail) {
      setEmail(savedEmail)
    }
    
    if (savedMPIN) {
      setShowMPIN(true)
    }
    
    setBiometricEnabled(biometricSetup === 'true')
    setAutoLoginEnabled(autoLogin === 'true')
    
    // Check if biometric authentication is available
    checkBiometricAvailability()
    
    // Auto-login if enabled and device is trusted
    if (autoLogin === 'true' && trustedDevice === 'true' && savedEmail) {
      handleAutoLogin()
    }
  }, [])

  const checkBiometricAvailability = async () => {
    try {
      if (window.PublicKeyCredential && 
          await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()) {
        setBiometricAvailable(true)
      }
    } catch (error) {
      console.log('Biometric authentication not available')
    }
  }

  const handleAutoLogin = async () => {
    try {
      const savedEmail = localStorage.getItem('rememberedEmail')
      const savedPassword = localStorage.getItem('rememberedPassword')
      const lastLoginTime = localStorage.getItem('lastLoginTime')
      
      // Auto-login only if last login was within 7 days
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      
      if (savedEmail && savedPassword && lastLoginTime && parseInt(lastLoginTime) > sevenDaysAgo) {
        setLoading(true)
        const { error } = await signIn(savedEmail, savedPassword)
        if (error) {
          console.log('Auto-login failed:', error.message)
          setLoading(false)
        }
      }
    } catch (error) {
      console.log('Auto-login failed')
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = isLogin 
        ? await signIn(email, password)
        : await signUp(email, password)

      if (error) {
        setError(error.message)
      } else if (!isLogin) {
        setError('Check your email for the confirmation link!')
      } else {
        // Save email and password if remember me is checked
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email)
          localStorage.setItem('rememberedPassword', password) // In production, encrypt this
          localStorage.setItem('rememberMe', 'true')
          localStorage.setItem('lastLoginTime', Date.now().toString())
        }
        
        // Prompt to set MPIN after successful login
        if (!localStorage.getItem('userMPIN')) {
          setIsSettingMPIN(true)
        }
        
        // Prompt for biometric setup if available and not set up
        if (biometricAvailable && !biometricEnabled && !localStorage.getItem('biometricEnabled')) {
          setTimeout(() => setShowBiometricSetup(true), 1000)
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleMPINLogin = async () => {
    setLoading(true)
    setError('')

    try {
      const savedMPIN = localStorage.getItem('userMPIN')
      const savedEmail = localStorage.getItem('rememberedEmail')
      const savedPassword = localStorage.getItem('rememberedPassword') // Encrypted in real app
      
      if (mpin === savedMPIN && savedEmail && savedPassword) {
        const { error } = await signIn(savedEmail, savedPassword)
        if (error) {
          setError('MPIN authentication failed')
        }
      } else {
        setError('Invalid MPIN')
      }
    } catch (err) {
      setError('MPIN authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSetMPIN = () => {
    if (mpin.length !== 4 || confirmMpin.length !== 4) {
      setError('MPIN must be 4 digits')
      return
    }
    
    if (mpin !== confirmMpin) {
      setError('MPIN does not match')
      return
    }

    // Save MPIN and password (in real app, encrypt these)
    localStorage.setItem('userMPIN', mpin)
    localStorage.setItem('rememberedPassword', password)
    localStorage.setItem('mpinEnabled', 'true')
    
    setIsSettingMPIN(false)
    setError('')
    alert('MPIN set successfully! You can now use MPIN for quick login.')
  }

  const setupBiometric = async () => {
    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: { name: "Rental Manager" },
          user: {
            id: new TextEncoder().encode(email),
            name: email,
            displayName: email,
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000,
          attestation: "direct"
        }
      })

      if (credential) {
        localStorage.setItem('biometricEnabled', 'true')
        localStorage.setItem('biometricCredentialId', credential.id)
        setBiometricEnabled(true)
        setShowBiometricSetup(false)
        alert('Biometric authentication set up successfully!')
      }
    } catch (error) {
      setError('Failed to set up biometric authentication')
    }
  }

  const handleBiometricLogin = async () => {
    try {
      setLoading(true)
      const credentialId = localStorage.getItem('biometricCredentialId')
      
      if (!credentialId) {
        setError('Biometric authentication not set up')
        return
      }

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          allowCredentials: [{
            id: new TextEncoder().encode(credentialId),
            type: 'public-key'
          }],
          userVerification: 'required',
          timeout: 60000
        }
      })

      if (credential) {
        const savedEmail = localStorage.getItem('rememberedEmail')
        const savedPassword = localStorage.getItem('rememberedPassword')
        
        if (savedEmail && savedPassword) {
          const { error } = await signIn(savedEmail, savedPassword)
          if (error) {
            setError('Biometric authentication failed')
          } else {
            localStorage.setItem('lastLoginTime', Date.now().toString())
          }
        }
      }
    } catch (error) {
      setError('Biometric authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const enableAutoLogin = () => {
    localStorage.setItem('autoLoginEnabled', 'true')
    localStorage.setItem('deviceTrusted', 'true')
    localStorage.setItem('lastLoginTime', Date.now().toString())
    setAutoLoginEnabled(true)
    alert('Auto-login enabled for this device!')
  }

  const clearRememberedData = () => {
    localStorage.removeItem('rememberedEmail')
    localStorage.removeItem('rememberedPassword')
    localStorage.removeItem('userMPIN')
    localStorage.removeItem('rememberMe')
    localStorage.removeItem('mpinEnabled')
    localStorage.removeItem('biometricEnabled')
    localStorage.removeItem('biometricCredentialId')
    localStorage.removeItem('autoLoginEnabled')
    localStorage.removeItem('deviceTrusted')
    localStorage.removeItem('lastLoginTime')
    setShowMPIN(false)
    setBiometricEnabled(false)
    setAutoLoginEnabled(false)
    setEmail('')
    setMpin('')
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rental Manager</h1>
          <p className="text-gray-600">Manage your rental properties with ease</p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-gray-600">
              {isLogin ? 'Sign in to your account' : 'Sign up to get started'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me and Quick Access Options */}
            {isLogin && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">Remember me</span>
                  </label>
                  {localStorage.getItem('userMPIN') && (
                    <button
                      type="button"
                      onClick={() => setShowMPIN(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Use MPIN
                    </button>
                  )}
                </div>

                {/* Quick Access Options */}
                <div className="flex items-center justify-between text-xs">
                  {biometricAvailable && biometricEnabled && (
                    <button
                      type="button"
                      onClick={handleBiometricLogin}
                      className="flex items-center space-x-1 text-green-600 hover:text-green-700"
                    >
                      <Fingerprint className="h-3 w-3" />
                      <span>Biometric</span>
                    </button>
                  )}
                  
                  {rememberMe && !autoLoginEnabled && (
                    <button
                      type="button"
                      onClick={enableAutoLogin}
                      className="flex items-center space-x-1 text-purple-600 hover:text-purple-700"
                    >
                      <Zap className="h-3 w-3" />
                      <span>Enable Auto-login</span>
                    </button>
                  )}
                  
                  {autoLoginEnabled && (
                    <span className="flex items-center space-x-1 text-purple-600">
                      <Zap className="h-3 w-3" />
                      <span>Auto-login enabled</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <User className="h-5 w-5" />
                  <span>{isLogin ? 'Sign In' : 'Sign Up'}</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                }}
                className="ml-2 text-blue-600 hover:text-blue-700 font-semibold"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Secure authentication powered by Supabase</p>
        </div>
      </div>

      {/* MPIN Setup Modal */}
      {isSettingMPIN && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Set Up MPIN</h3>
              <p className="text-gray-600">Create a 4-digit PIN for quick access</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 4-digit MPIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={mpin}
                  onChange={(e) => setMpin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 text-center text-2xl font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm MPIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={confirmMpin}
                  onChange={(e) => setConfirmMpin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 text-center text-2xl font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setIsSettingMPIN(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
                >
                  Skip
                </button>
                <button
                  onClick={handleSetMPIN}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                  Set MPIN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Biometric Setup Modal */}
      {showBiometricSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-4">
                <Fingerprint className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Set Up Biometric Login</h3>
              <p className="text-gray-600">Use your fingerprint or face ID for secure, quick access</p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Enhanced Security</p>
                    <p className="text-xs text-blue-700">Your biometric data stays on your device</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowBiometricSetup(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
                >
                  Skip
                </button>
                <button
                  onClick={setupBiometric}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
                >
                  Set Up
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MPIN Login Screen */}
      {showMPIN && !isSettingMPIN && (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 z-40">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
              <p className="text-gray-600">Enter your MPIN to continue</p>
              <p className="text-sm text-gray-500 mt-2">{email}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                  Enter your 4-digit MPIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={mpin}
                  onChange={(e) => setMpin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-4 text-center text-3xl font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none tracking-widest"
                  placeholder="••••"
                  autoFocus
                />
              </div>

              <button
                onClick={handleMPINLogin}
                disabled={loading || mpin.length !== 4}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2 mb-4"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Shield className="h-5 w-5" />
                    <span>Login with MPIN</span>
                  </>
                )}
              </button>

              {/* Biometric Login Button */}
              {biometricEnabled && (
                <button
                  onClick={handleBiometricLogin}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2 mb-4"
                >
                  <Fingerprint className="h-5 w-5" />
                  <span>Use Biometric</span>
                </button>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowMPIN(false)}
                  className="flex-1 px-4 py-2 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 text-sm font-medium"
                >
                  Use Password
                </button>
                <button
                  onClick={clearRememberedData}
                  className="flex-1 px-4 py-2 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 text-sm font-medium"
                >
                  Clear Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}