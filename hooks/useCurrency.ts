import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/currency"

export function useCurrency() {
  return {
    formatCurrency,
    formatCurrencyCompact,
    currency: "INR",
    symbol: "₹",
  }
}
