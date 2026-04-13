export type EntityItem = Record<string, unknown>;

export type PropertyStatus = 'active' | 'inactive';

export type PropertyFormState = {
  name: string;
  blockId: string;
  apartmentNumber: string;
  area: string;
  status: PropertyStatus;
};

export const ITEMS_PER_PAGE = 30;

export const EMPTY_FORM: PropertyFormState = {
  name: '',
  blockId: '',
  apartmentNumber: '',
  area: '',
  status: 'active',
};
