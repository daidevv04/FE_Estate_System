/** Shape chung của Spring Data Page — mọi API danh sách đều trả về dạng này. */
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export type UUID = string
