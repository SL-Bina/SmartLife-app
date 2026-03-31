import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from './index';

type ResidentPropertyState = {
  selectedPropertyId: string | number | null;
};

const initialState: ResidentPropertyState = {
  selectedPropertyId: null,
};

const residentPropertySlice = createSlice({
  name: 'residentProperty',
  initialState,
  reducers: {
    setSelectedResidentPropertyId(state, action: PayloadAction<string | number | null>) {
      state.selectedPropertyId = action.payload;
    },
    clearSelectedResidentPropertyId(state) {
      state.selectedPropertyId = null;
    },
  },
});

export const {
  setSelectedResidentPropertyId,
  clearSelectedResidentPropertyId,
} = residentPropertySlice.actions;

export const selectSelectedResidentPropertyId = (state: RootState) =>
  state.residentProperty.selectedPropertyId;

export default residentPropertySlice.reducer;
