export interface StoreCategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateStoreCategoryDto {
  name: string;
  description?: string;
  iconUrl?: string;
  isActive?: boolean;
}

export interface ProductCategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
}

export interface CreateProductCategoryDto {
  name: string;
  description?: string;
}

export type UpdateStoreCategoryDto = Partial<CreateStoreCategoryDto>;
export type UpdateProductCategoryDto = Partial<CreateProductCategoryDto>;
