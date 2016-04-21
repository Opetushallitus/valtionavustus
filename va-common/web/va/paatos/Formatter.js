export const formatNumber = num => num.toString().replace(',0', '').replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1\u00A0")

export const formatPrice = num => formatNumber(num) + '\u00A0€'
