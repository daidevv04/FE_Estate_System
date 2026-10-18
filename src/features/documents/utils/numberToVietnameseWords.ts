const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']

function readThreeDigits(threeDigits: number, showZeroHundred: boolean): string {
  const hundreds = Math.floor(threeDigits / 100)
  const remainder = threeDigits % 100
  const tens = Math.floor(remainder / 10)
  const units = remainder % 10

  let result = ''

  if (hundreds > 0 || showZeroHundred) {
    result += `${DIGITS[hundreds]} trăm `
  }

  if (tens > 1) {
    result += `${DIGITS[tens]} mươi `
    if (units === 1) result += 'mốt '
    else if (units === 4) result += 'tư '
    else if (units === 5) result += 'lăm '
    else if (units > 0) result += `${DIGITS[units]} `
  } else if (tens === 1) {
    result += 'mười '
    if (units === 5) result += 'lăm '
    else if (units > 0) result += `${DIGITS[units]} `
  } else if (tens === 0 && units > 0) {
    if (hundreds > 0 || showZeroHundred) result += 'lẻ '
    result += `${DIGITS[units]} `
  }

  return result.trim()
}

/**
 * Chuyển số nguyên thành chữ tiếng Việt chuẩn văn bản hành chính BĐS
 * Ví dụ:
 * - 100000000 -> "Một trăm triệu đồng chẵn"
 * - 3500000000 -> "Ba tỷ năm trăm triệu đồng chẵn"
 * - 525000000 -> "Năm trăm hai mươi lăm triệu đồng chẵn"
 */
export function numberToVietnameseWords(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return 'Không đồng'
  const num = typeof amount === 'string' ? Math.round(Number(amount)) : Math.round(amount)

  if (isNaN(num) || num === 0) return 'Không đồng'
  if (num < 0) return `Âm ${numberToVietnameseWords(Math.abs(num))}`

  const UNITS = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ']
  let remaining = num
  const groups: number[] = []

  while (remaining > 0) {
    groups.push(remaining % 1000)
    remaining = Math.floor(remaining / 1000)
  }

  const words: string[] = []
  for (let i = groups.length - 1; i >= 0; i--) {
    const groupVal = groups[i]
    if (groupVal === 0) continue

    const isHighest = i === groups.length - 1
    const groupText = readThreeDigits(groupVal, !isHighest)
    const unitName = UNITS[i]

    words.push(`${groupText} ${unitName}`.trim())
  }

  const rawText = words.join(' ').replace(/\s+/g, ' ').trim()
  if (!rawText) return 'Không đồng'

  // Viết hoa chữ cái đầu và thêm đuôi "đồng chẵn"
  const capitalized = rawText.charAt(0).toUpperCase() + rawText.slice(1)
  return `${capitalized} đồng chẵn`
}
