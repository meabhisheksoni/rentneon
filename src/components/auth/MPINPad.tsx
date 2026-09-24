'use client'

import React from 'react'
import { Delete, Lock, ArrowLeft } from 'lucide-react'

interface MPINPadProps {
  mpin: string
  onMpinChange: (pin: string) => void
  onSubmit: (pin: string) => void
  onBackToPassword: () => void
  loading?: boolean
  error?: string
  title?: string
  subtitle?: string
}

export const MPINPad: React.FC<MPINPadProps> = ({
  mpin,
  onMpinChange,
  onSubmit,
  onBackToPassword,
  loading = false,
  error,
  title = 'Enter 4-Digit MPIN',
  subtitle = 'Fast & secure unlock for this device',
}) => {
  const handleDigit = (digit: string) => {
    if (mpin.length < 4) {
      const newPin = mpin + digit
      onMpinChange(newPin)
      if (newPin.length === 4) {
        onSubmit(newPin)
      }
    }
  }

  const handleDelete = () => {
    onMpinChange(mpin.slice(0, -1))
  }

  return (
    <div className="space-y-6 text-center">
      <div>
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      </div>

      {/* 4-Dot PIN Indicator */}
      <div className="flex justify-center gap-4 py-2">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              mpin.length > idx
                ? 'bg-blue-600 border-blue-600 scale-110'
                : 'bg-gray-100 border-gray-300'
            }`}
          />
        ))}
      </div>

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

      {/* Number Keypad */}
      <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            disabled={loading}
            onClick={() => handleDigit(digit)}
            className="w-16 h-16 rounded-2xl bg-gray-50 hover:bg-gray-100 active:bg-blue-50 text-gray-900 text-xl font-bold transition-all shadow-sm flex items-center justify-center mx-auto"
          >
            {digit}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onMpinChange('')}
          className="w-16 h-16 rounded-2xl text-xs font-semibold text-gray-400 hover:text-gray-700 flex items-center justify-center mx-auto"
        >
          Clear
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => handleDigit('0')}
          className="w-16 h-16 rounded-2xl bg-gray-50 hover:bg-gray-100 active:bg-blue-50 text-gray-900 text-xl font-bold transition-all shadow-sm flex items-center justify-center mx-auto"
        >
          0
        </button>

        <button
          type="button"
          onClick={handleDelete}
          className="w-16 h-16 rounded-2xl text-gray-500 hover:bg-gray-100 flex items-center justify-center mx-auto"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onBackToPassword}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Login with Email & Password
        </button>
      </div>
    </div>
  )
}
