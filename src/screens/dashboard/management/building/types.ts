export type EntityItem = Record<string, unknown>;

export type BuildingStatus = 'active' | 'inactive';

export type BuildingFormState = {
  name: string;
  complexId: string;
  address: string;
  status: BuildingStatus;
};

export const ITEMS_PER_PAGE = 30;

export const EMPTY_FORM: BuildingFormState = {
  name: '',
  complexId: '',
  address: '',
  status: 'active',
};
