export type CategoryType = 'income' | 'expense'

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

export type CreateCategoryInput = Omit<Category, 'id'> & { type: CategoryType }
export type UpdateCategoryInput = Partial<Omit<Category, 'id'>>
