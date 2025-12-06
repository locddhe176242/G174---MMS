/**
 * Format number as Vietnamese currency (VND)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted string (e.g., "10.450.000 ₫")
 */
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

/**
 * Format number with thousand separators for display in input
 * @param {number} value - Number to format
 * @returns {string} Formatted string (e.g., "10.450.000")
 */
export const formatNumberInput = (value) => {
  if (!value && value !== 0) return '';
  return new Intl.NumberFormat('vi-VN').format(value);
};

/**
 * Parse formatted number string to number
 * @param {string} formattedValue - Formatted string (e.g., "10.450.000")
 * @returns {number} Parsed number (e.g., 10450000)
 */
export const parseNumberInput = (formattedValue) => {
  if (!formattedValue) return 0;
  const cleaned = formattedValue.replace(/\./g, '');
  return parseInt(cleaned) || 0;
};

/**
 * Format date to Vietnamese format
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date (e.g., "01/12/2025")
 */
export const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("vi-VN");
  } catch {
    return dateString;
  }
};

/**
 * Format datetime to Vietnamese format
 * @param {string|Date} dateString - DateTime to format
 * @returns {string} Formatted datetime (e.g., "01/12/2025, 14:30:25")
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleString("vi-VN");
  } catch {
    return dateString;
  }
};

/**
 * Round number to 2 decimal places (for financial calculations)
 * @param {number} value - Number to round
 * @returns {number} Rounded number
 */
export const roundMoney = (value) => {
  return Math.round(value * 100) / 100;
};

/**
 * Calculate item line total with standardized rounding
 * @param {object} item - Item with quantity, unitPrice, discountPercent, taxRate
 * @returns {object} Calculation breakdown
 */
export const calculateItemTotal = (item) => {
  const qty = Number(item.quantity || 0);
  const price = Number(item.unitPrice || item.unit_price || 0);
  const discountPercent = Number(item.discountPercent || item.discount_percent || 0) / 100;
  const taxRate = Number(item.taxRate || item.tax_rate || 0) / 100;

  // 1. Subtotal
  const subtotal = roundMoney(qty * price);

  // 2. Discount
  const discountAmount = roundMoney(subtotal * discountPercent);
  const amountAfterDiscount = roundMoney(subtotal - discountAmount);

  // 3. Tax (Exclusive VAT)
  const tax = roundMoney(amountAfterDiscount * taxRate);

  // 4. Total
  const lineTotal = roundMoney(amountAfterDiscount + tax);

  return {
    subtotal,
    discountAmount,
    amountAfterDiscount,
    tax,
    total: lineTotal
  };
};

/**
 * Create a formatted number input component props
 * @param {number} value - Current value
 * @param {function} onChange - Change handler that receives number
 * @returns {object} Props for input element
 */
export const createNumberInputProps = (value, onChange) => ({
  type: "text",
  value: formatNumberInput(value),
  onChange: (e) => {
    const numValue = parseNumberInput(e.target.value);
    onChange(numValue);
  },
  className: "text-right",
  placeholder: "0"
});
