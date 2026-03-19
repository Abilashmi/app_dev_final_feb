/**
 * Shared currency utilities (works on both client and server)
 * Used for formatting and currency operations
 */

/**
 * Get currency symbol from code
 * @param {string} currencyCode - ISO 4217 currency code
 * @returns {string} Currency symbol
 */
export function getCurrencySymbol(currencyCode = "USD") {
  const symbolMap = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    INR: "₹",
    AUD: "A$",
    CAD: "C$",
    CHF: "CHF",
    CNY: "¥",
    SEK: "kr",
    NZD: "NZ$",
    MXN: "$",
    SGD: "S$",
    HKD: "HK$",
    NOK: "kr",
    KRW: "₩",
    TRY: "₺",
    RUB: "₽",
    BRL: "R$",
    ZAR: "R",
    THB: "฿",
    MYR: "RM",
    PHP: "₱",
    IDR: "Rp",
    VND: "₫",
    KES: "KSh",
    NGN: "₦",
    PKR: "₨",
    BDT: "৳",
    AED: "د.إ",
    SAR: "﷼",
    QAR: "﷼",
  };

  return symbolMap[currencyCode] || currencyCode;
}

/**
 * Format amount with dynamic currency
 * @param {number} value - Amount to format
 * @param {string} currencySymbol - Currency symbol (e.g., "₹", "$")
 * @param {string} currencyCode - ISO currency code for locale formatting
 * @param {string} locale - Locale for number formatting
 * @returns {string} Formatted amount
 */
export function formatAmount(value, currencySymbol = "$", currencyCode = "USD", locale = "en-US") {
  const amount = parseFloat(value) || 0;

  // Locales for specific currencies
  const localeMap = {
    USD: "en-US",
    EUR: "en-EN",
    GBP: "en-GB",
    INR: "en-IN",
    JPY: "ja-JP",
    AUD: "en-AU",
    CAD: "en-CA",
    CHF: "de-CH",
    CNY: "zh-CN",
    KRW: "ko-KR",
    THB: "th-TH",
  };

  const effectiveLocale = localeMap[currencyCode] || locale;

  // For currencies with no decimal places
  if (currencyCode === "JPY" || currencyCode === "KRW") {
    return `${currencySymbol}${amount.toLocaleString(effectiveLocale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }

  // Default formatting with 2 decimal places
  return `${currencySymbol}${amount.toLocaleString(effectiveLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Parse currency-formatted string back to number
 * @param {string} formatted - Currency formatted string (e.g., "₹1,000.00", "$99.99")
 * @returns {number} Numeric value
 */
export function parseCurrencyToNumber(formatted) {
  if (typeof formatted !== "string") {
    return typeof formatted === "number" ? formatted : 0;
  }
  // Remove currency symbols and spaces, keep numbers and decimal point
  const cleaned = formatted.replace(/[^0-9.-]/g, "");
  return parseFloat(cleaned) || 0;
}

/**
 * Convert number to locale-specific amount string
 * @param {number} value - Numeric value
 * @param {string} locale - Locale code
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted amount
 */
export function toLocaleAmount(value, locale = "en-US", decimals = 2) {
  const amount = parseFloat(value) || 0;
  return amount.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Get locale for currency code
 * @param {string} currencyCode - ISO currency code
 * @returns {string} Locale string
 */
export function getLocaleForCurrency(currencyCode) {
  const localeMap = {
    USD: "en-US",
    EUR: "en-EN",
    GBP: "en-GB",
    INR: "en-IN",
    JPY: "ja-JP",
    AUD: "en-AU",
    CAD: "en-CA",
    CHF: "de-CH",
    CNY: "zh-CN",
    KRW: "ko-KR",
    THB: "th-TH",
    BRL: "pt-BR",
    MXN: "es-MX",
    ZAR: "en-ZA",
  };

  return localeMap[currencyCode] || "en-US";
}
