export type EntityItem = Record<string, unknown>;

export type ResidentStatus = 'active' | 'inactive';
export type ResidentType = 'owner' | 'tenant';
export type ResidentGender = '' | 'male' | 'female';

export type ResidentFormState = {
  name: string;
  surname: string;
  type: ResidentType;
  email: string;
  phone: string;
  fatherName: string;
  personalCode: string;
  birthDate: string;
  gender: ResidentGender;
  status: ResidentStatus;
};

export const ITEMS_PER_PAGE = 30;

export const EMPTY_FORM: ResidentFormState = {
  name: '',
  surname: '',
  type: 'owner',
  email: '',
  phone: '',
  fatherName: '',
  personalCode: '',
  birthDate: '',
  gender: '',
  status: 'active',
};
