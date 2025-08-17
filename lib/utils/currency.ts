export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPrice(price: number): string {
  return formatCurrency(price)
}

// For display purposes where we want to show decimal places
export function formatCurrencyWithDecimals(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Currency symbol constant
export const CURRENCY_SYMBOL = "₹"
export const CURRENCY_CODE = "INR"
