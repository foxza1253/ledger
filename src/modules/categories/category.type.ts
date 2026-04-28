export interface Category {
  id: string
  name: string
  icon: string
  color: string
}

export interface Categories {
  income: Category[]
  expense: Category[]
}
