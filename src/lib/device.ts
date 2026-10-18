/**
 * Tiện ích nhận diện thiết bị người dùng (Mobile / Tablet vs Laptop / Desktop)
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }

  // 1. Kiểm tra User-Agent
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || ''
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i
  if (mobileRegex.test(userAgent)) {
    return true
  }

  // 2. Kiểm tra cảm ứng và kích thước màn hình
  const hasTouchScreen =
    navigator.maxTouchPoints > 0 ||
    window.matchMedia?.('(pointer: coarse)')?.matches ||
    'ontouchstart' in window

  const isSmallScreen = window.innerWidth <= 768

  return hasTouchScreen && isSmallScreen
}
