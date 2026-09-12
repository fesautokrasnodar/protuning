import { describe, expect, it } from 'vitest'
import { formatPhoneMask, parsePhone, phoneDigits } from './phone'

describe('phoneDigits', () => {
  it('выделяет цифры и нормализует 8 → 7', () => {
    expect(phoneDigits('8 900 000-00-00')).toBe('9000000000')
    expect(phoneDigits('+7 (921) 123-45-67')).toBe('9211234567')
  })

  it('обрезает до 10 цифр и отбрасывает лишнее', () => {
    expect(phoneDigits('+79999999999999')).toBe('9999999999')
    expect(phoneDigits('abc123')).toBe('123')
    expect(phoneDigits('')).toBe('')
  })
})

describe('formatPhoneMask', () => {
  it('форматирует по маске +7 (XXX) XXX-XX-XX', () => {
    expect(formatPhoneMask('+79000000000')).toBe('+7 (900) 000-00-00')
  })

  it('поддерживает неполные номера и пустую строку', () => {
    expect(formatPhoneMask('8 900 123')).toBe('+7 (900) 123')
    expect(formatPhoneMask('')).toBe('')
  })
})

describe('parsePhone', () => {
  it('возвращает канонический формат для полного номера', () => {
    expect(parsePhone('+7 (900) 000-00-00')).toBe('+79000000000')
    expect(parsePhone('8 900 000-00-00')).toBe('+79000000000')
  })

  it('возвращает null для неполного номера', () => {
    expect(parsePhone('+7 900')).toBeNull()
    expect(parsePhone('')).toBeNull()
  })
})