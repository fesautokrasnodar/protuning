import type { PhotosProvider } from '@/services/module'
import { DomainError } from '@/services/module'

export const MAX_PHOTO_WIDTH = 1200
export const MAX_PHOTO_HEIGHT = 760
export const PHOTO_QUALITY = 0.82
export const MAX_PHOTO_INPUT_BYTES = 8 * 1024 * 1024

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Сжать изображение в dataURL (canvas), как в прототипе:
 * вписываем в 1200x760, фон белый, JPEG q=0.82.
 */
export function compressImageFile(
  file: File,
  maxW = MAX_PHOTO_WIDTH,
  maxH = MAX_PHOTO_HEIGHT,
  quality = PHOTO_QUALITY,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      reject(new DomainError('Недопустимый формат изображения. Используйте JPG, PNG или WebP', 'BAD_TYPE'))
      return
    }
    if (file.size > MAX_PHOTO_INPUT_BYTES) {
      reject(new DomainError('Файл слишком большой (максимум 8 МБ)', 'TOO_LARGE'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new DomainError('Не удалось прочитать файл', 'READ_FAILED'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new DomainError('Не удалось обработать изображение', 'DECODE_FAILED'))
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width, maxH / img.height)
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new DomainError('Графика недоступна', 'NO_CTX'))
          return
        }
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

export const mockPhotosProvider: PhotosProvider = {
  async upload(file) {
    return compressImageFile(file)
  },
  async remove() {
    /* mock: ссылка живёт в cars.photoUrl; удаление — установка photoUrl = null */
  },
}