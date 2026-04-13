export type EntityItem = Record<string, unknown>;

export type BlockStatus = 'active' | 'inactive';

export type BlockFormState = {
  name: string;
  buildingId: string;
  description: string;
  status: BlockStatus;
};

export const ITEMS_PER_PAGE = 30;

export const EMPTY_FORM: BlockFormState = {
  name: '',
  buildingId: '',
  description: '',
  status: 'active',
};
