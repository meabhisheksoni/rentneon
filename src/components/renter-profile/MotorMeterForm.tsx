'use client'

import React from 'react'
import { format } from 'date-fns'
import { Droplets } from 'lucide-react'
import { formatIndianCurrency, formatInputValue, handleIndianNumberInput } from '@/utils/formatters'
import { calculateMotor } from '@/utils/billingCalculations'

interface MotorData {
  initialReading: number
  finalReading: number
  multiplier: number
  numberOfPeople: number
  readingDate: Date
}

interface MotorMeterFormProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  data: MotorData
  onChange: (data: MotorData) => void
}

export const MotorMeterForm: React.FC<MotorMeterFormProps> = ({
  enabled,
  onToggle,
  data,
  onChange,
}) => {
  const { totalUnits, amount } = calculateMotor({
    initialReading: data.initialReading,
    finalReading: data.finalReading,
    multiplier: data.multiplier,
    numberOfPeople: data.numberOfPeople,
    enabled,
  })

  return (
    <div className="bg-white rounded-3xl shadow-xs border border-gray-200/80 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-50 rounded-2xl text-cyan-600">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">Shared Water Pump / Motor</h3>
            <p className="text-xs text-gray-500">Submeter split proportionally across households</p>
          </div>
        </div>

        {/* Toggle Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-12 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
        </label>
      </div>

      {enabled && (
        <div className="pt-3 border-t border-gray-100 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                Previous Reading
              </label>
              <input
                type="text"
                value={formatInputValue(data.initialReading)}
                onChange={(e) =>
                  onChange({
                    ...data,
                    initialReading: handleIndianNumberInput(e.target.value),
                  })
                }
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-hidden focus:border-cyan-500 focus:ring-3 focus:ring-cyan-100 focus:bg-white transition-all"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                Current Reading
              </label>
              <input
                type="text"
                value={formatInputValue(data.finalReading)}
                onChange={(e) =>
                  onChange({
                    ...data,
                    finalReading: handleIndianNumberInput(e.target.value),
                  })
                }
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-hidden focus:border-cyan-500 focus:ring-3 focus:ring-cyan-100 focus:bg-white transition-all"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                Rate / Unit (₹)
              </label>
              <input
                type="text"
                value={formatInputValue(data.multiplier)}
                onChange={(e) =>
                  onChange({
                    ...data,
                    multiplier: handleIndianNumberInput(e.target.value),
                  })
                }
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-hidden focus:border-cyan-500 focus:ring-3 focus:ring-cyan-100 focus:bg-white transition-all"
                placeholder="9"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                Split Count (People)
              </label>
              <input
                type="text"
                value={formatInputValue(data.numberOfPeople)}
                onChange={(e) =>
                  onChange({
                    ...data,
                    numberOfPeople: Math.max(1, handleIndianNumberInput(e.target.value)),
                  })
                }
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-hidden focus:border-cyan-500 focus:ring-3 focus:ring-cyan-100 focus:bg-white transition-all"
                placeholder="2"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                Reading Date
              </label>
              <input
                type="date"
                value={format(data.readingDate, 'yyyy-MM-dd')}
                onChange={(e) =>
                  onChange({
                    ...data,
                    readingDate: new Date(e.target.value || Date.now()),
                  })
                }
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-hidden focus:border-cyan-500 focus:ring-3 focus:ring-cyan-100 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="bg-cyan-50/70 border border-cyan-200/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
            <span className="text-cyan-900 font-medium">
              Total Pump Units: <strong className="font-extrabold text-cyan-950">{totalUnits}</strong> kWh (Split among {data.numberOfPeople} people)
            </span>
            <span className="text-cyan-950 font-black text-base">
              Renter Share: {formatIndianCurrency(amount)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
