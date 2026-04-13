export type EntityItem = Record<string, unknown>;

export type ComplexStatus = 'active' | 'inactive';

export type ComplexFormState = {
  name: string;
  status: ComplexStatus;
  description: string;
  address: string;
  colorCode: string;
  phone: string;
  email: string;
  website: string;
  lat: string;
  lng: string;
};

export const ITEMS_PER_PAGE = 30;

export const EMPTY_FORM: ComplexFormState = {
  name: '',
  status: 'active',
  description: '',
  address: '',
  colorCode: '#0ea5e9',
  phone: '',
  email: '',
  website: '',
  lat: '',
  lng: '',
};
