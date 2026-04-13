export type EntityItem = Record<string, unknown>;

export type MtkStatus = 'active' | 'inactive';

export type MtkFormState = {
  name: string;
  status: MtkStatus;
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

export const EMPTY_FORM: MtkFormState = {
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
