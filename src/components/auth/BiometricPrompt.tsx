'use client'

import React from 'react'
import { Fingerprint, ArrowLeft } from 'lucide-react'

interface BiometricPromptProps {
  onTriggerBiometric: () => void
  onBackToPassword: () => void
  loading?: boolean
  error?: string
}

export const BiometricPrompt: React.FC<BiometricPromptProps> = ({
  onTriggerBiometric,
  onBackToPassword,
  loading = false,
  error,
}) => {
  return (
    <div className="space-y-6 text-center py-4">
      <div>
        <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Fingerprint className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Biometric Authentication</h3>
        <p className="text-xs text-gray-500 mt-1">
          Touch fingerprint sensor or look at camera to verify identity
        </p>
      </div>

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

      <div className="space-y-3 max-w-[260px] mx-auto">
        <button
          type="button"
          onClick={onTriggerBiometric}
          disabled={loading}
          className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Fingerprint className="w-5 h-5" />
          {loading ? 'Verifying...' : 'Authenticate Now'}
        </button>

        <button
          type="button"
          onClick={onBackToPassword}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 hover:underline pt-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Use Email & Password instead
        </button>
      </div>
    </div>
  )
}
