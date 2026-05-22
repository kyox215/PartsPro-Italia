export type AdminListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminMutationError = {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type AdminMutationResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: AdminMutationError };

export function adminOk<T>(data: T): AdminMutationResponse<T> {
  return { ok: true, data };
}

export function adminError<T = never>(error: AdminMutationError): AdminMutationResponse<T> {
  return { ok: false, error };
}
