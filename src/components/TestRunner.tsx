'use client'

import { useState } from 'react'
import { runAllTests, runTestSuite } from '@/tests'

/**
 * Test Runner Component
 * Provides UI to run database performance optimization tests
 */
export default function TestRunner() {
  const [isRunning, setIsRunning] = useState(false)
  const [selectedSuite, setSelectedSuite] = useState<string>('all')

  const testSuites = [
    { id: 'all', name: 'All Tests', description: 'Run complete test suite' },
    { id: 'rpc', name: 'RPC Functions', description: 'Test database RPC functions' },
    { id: 'cache', name: 'Cache Behavior', description: 'Test caching functionality' },
    { id: 'error', name: 'Error Handling', description: 'Test error handling and retry logic' },
    { id: 'performance', name: 'Performance', description: 'Benchmark performance metrics' },
    { id: 'scalability', name: 'Scalability', description: 'Test with multiple renters' }
  ]

  const handleRunTests = async () => {
    setIsRunning(true)

    try {
      console.clear()
      console.log('🚀 Starting tests...\n')

      if (selectedSuite === 'all') {
        await runAllTests()
      } else {
        await runTestSuite(selectedSuite)
      }

      console.log('\n✅ Tests completed! Check the console for detailed results.')
    } catch (error) {
      console.error('❌ Test execution failed:', error)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Database Performance Test Suite
          </h1>
          <p className="text-gray-600 mb-8">
            Run comprehensive tests for database performance optimization
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Test Suite
            </label>
            <div className="space-y-2">
              {testSuites.map(suite => (
                <label
                  key={suite.id}
                  className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedSuite === suite.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="testSuite"
                    value={suite.id}
                    checked={selectedSuite === suite.id}
                    onChange={(e) => setSelectedSuite(e.target.value)}
                    className="mt-1 mr-3"
                    disabled={isRunning}
                  />
                  <div>
                    <div className="font-medium text-gray-900">{suite.name}</div>
                    <div className="text-sm text-gray-600">{suite.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleRunTests}
            disabled={isRunning}
            className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-colors ${
              isRunning
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isRunning ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Running Tests...
              </span>
            ) : (
              'Run Tests'
            )}
          </button>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Select a test suite from the options above</li>
              <li>Click &quot;Run Tests&quot; to start the test execution</li>
              <li>Open the browser console (F12) to see detailed test results</li>
              <li>Tests will validate RPC functions, caching, error handling, and performance</li>
            </ol>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">📊 What Gets Tested:</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>✓ RPC functions with various data scenarios</li>
              <li>✓ Cache hits, misses, invalidation, and preloading</li>
              <li>✓ Error handling, retry logic, and timeouts</li>
              <li>✓ Performance benchmarks (targets: &lt;200ms navigation, &lt;300ms save, &lt;400ms dashboard)</li>
              <li>✓ Scalability with multiple renters and large datasets</li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-2">⚠️ Prerequisites:</h3>
            <ul className="space-y-1 text-sm text-yellow-800">
              <li>• You must be logged in with an authenticated user</li>
              <li>• At least one active renter should exist in the database</li>
              <li>• Database RPC functions must be deployed (run database-performance-optimization.sql)</li>
              <li>• Tests will create and modify bill data for testing purposes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
