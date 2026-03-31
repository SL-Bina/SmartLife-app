export type QueryParams = Record<string, unknown>;
export type EntityItem = Record<string, unknown>;
export type MtkOption = { id: string | number; name: string };

export type CrudFieldOption = {
  label: string;
  value: string;
};

export type CrudApi = {
  getAll: (params?: QueryParams) => Promise<unknown>;
  search?: (params?: QueryParams) => Promise<unknown>;
  add?: (payload: Record<string, unknown>) => Promise<unknown>;
  update?: (id: string | number, payload: Record<string, unknown>) => Promise<unknown>;
  delete?: (id: string | number) => Promise<unknown>;
  getById?: (id: string | number) => Promise<unknown>;
  bindProperty?: (residentId: string | number, payload: Record<string, unknown>) => Promise<unknown>;
  unbindProperty?: (residentId: string | number, payload: Record<string, unknown>) => Promise<unknown>;
};

export type CrudField = {
  key: string;
  label: string;
  required?: boolean;
  type?: 'text' | 'number' | 'email' | 'phone' | 'select' | 'color';
  multiline?: boolean;
  placeholder?: string;
  options?: CrudFieldOption[];
  defaultValue?: string;
};

export type DetailRow = {
  key: string;
  path: string;
  label: string;
  value: string;
  depth: number;
};

export type ManagementEntityScreenProps = {
  title: string;
  entityLabel: string;
  api: CrudApi;
  fields: CrudField[];
  searchKey?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  enablePropertyBinding?: boolean;
  enableFieldReset?: boolean;
};
