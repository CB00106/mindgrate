export interface ApiResponse<T = any> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortOptions {
  orderBy?: string;
  ascending?: boolean;
}

export interface QueryOptions extends PaginationOptions, SortOptions {
  select?: string;
  filters?: Record<string, any>;
}
