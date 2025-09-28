// Indian number formatting utilities

export const formatIndianNumber = (num: number): string => {
  if (num === 0) return '0'
  
  const numStr = Math.abs(num).toString()
  const isNegative = num < 0
  
  // Handle decimal places
  const parts = numStr.split('.')
  const integerPart = parts[0]
  const decimalPart = parts[1] ? '.' + parts[1] : ''
  
  // Indian numbering system: 12,34,56,789
  if (integerPart.length <= 3) {
    return (isNegative ? '-' : '') + integerPart + decimalPart
  }
  
  // Reverse the string to work from right to left
  const reversed = integerPart.split('').reverse()
  const formatted = []
  
  // First group of 3 digits
  for (let i = 0; i < 3 && i < reversed.length; i++) {
    formatted.push(reversed[i])
  }
  
  // Add comma after first 3 digits
  if (reversed.length > 3) {
    formatted.push(',')
  }
  
  // Remaining digits in groups of 2
  for (let i = 3; i < reversed.length; i += 2) {
    formatted.push(reversed[i])
    if (i + 1 < reversed.length) {
      formatted.push(reversed[i + 1])
    }
    
    // Add comma if there are more digits
    if (i + 2 < reversed.length) {
      formatted.push(',')
    }
  }
  
  const result = formatted.reverse().join('')
  return (isNegative ? '-' : '') + result + decimalPart
}

export const formatIndianCurrency = (num: number): string => {
  return '₹' + formatIndianNumber(num)
}

export const parseIndianNumber = (str: string): number => {
  // Remove all commas and currency symbols
  const cleaned = str.replace(/[₹,\s]/g, '')
  return parseFloat(cleaned) || 0
}

// Format for display in input fields (no leading zeros, with commas)
export const formatInputValue = (value: number): string => {
  if (value === 0) return ''
  return formatIndianNumber(value)
}

// Handle input change with Indian formatting
export const handleIndianNumberInput = (
  value: string,
  onChange: (num: number) => void
) => {
  // Remove all non-numeric characters except decimal point
  const cleaned = value.replace(/[^0-9.]/g, '')
  
  // Prevent multiple decimal points
  const parts = cleaned.split('.')
  const formatted = parts[0] + (parts.length > 1 ? '.' + parts[1] : '')
  
  const numValue = parseFloat(formatted) || 0
  onChange(numValue)
}

// Format input value with commas as user types (for display only)
export const formatInputDisplay = (value: string): string => {
  // Remove all non-numeric characters except decimal point
  const cleaned = value.replace(/[^0-9.]/g, '')
  
  if (!cleaned) return ''
  
  // Handle decimal point
  const parts = cleaned.split('.')
  const integerPart = parts[0]
  const decimalPart = parts[1] ? '.' + parts[1] : ''
  
  // Format integer part with Indian commas
  const num = parseInt(integerPart) || 0
  if (num === 0 && cleaned !== '0') return ''
  
  return formatIndianNumber(num) + decimalPart
}

// Format numbers in different Indian units
export const formatIndianUnits = (num: number): string => {
  if (num >= 10000000) { // 1 crore
    return `₹${(num / 10000000).toFixed(2)} Cr`
  } else if (num >= 100000) { // 1 lakh
    return `₹${(num / 100000).toFixed(2)} L`
  } else if (num >= 1000) { // 1 thousand
    return `₹${(num / 1000).toFixed(1)} K`
  } else {
    return formatIndianCurrency(num)
  }
}