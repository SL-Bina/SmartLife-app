import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './index';

type ManagementFilterState = {
  selectedMtkId: string | number | null;
  selectedComplexId: string | number | null;
  selectedBuildingId: string | number | null;
  selectedBlockId: string | number | null;
};

const initialState: ManagementFilterState = {
  selectedMtkId: null,
  selectedComplexId: null,
  selectedBuildingId: null,
  selectedBlockId: null,
};

const managementFilterSlice = createSlice({
  name: 'managementFilter',
  initialState,
  reducers: {
    setSelectedManagementMtkId(state, action: PayloadAction<string | number | null>) {
      state.selectedMtkId = action.payload;
    },
    clearSelectedManagementMtkId(state) {
      state.selectedMtkId = null;
    },
    setSelectedManagementComplexId(state, action: PayloadAction<string | number | null>) {
      state.selectedComplexId = action.payload;
    },
    clearSelectedManagementComplexId(state) {
      state.selectedComplexId = null;
    },
    setSelectedManagementBuildingId(state, action: PayloadAction<string | number | null>) {
      state.selectedBuildingId = action.payload;
    },
    clearSelectedManagementBuildingId(state) {
      state.selectedBuildingId = null;
    },
    setSelectedManagementBlockId(state, action: PayloadAction<string | number | null>) {
      state.selectedBlockId = action.payload;
    },
    clearSelectedManagementBlockId(state) {
      state.selectedBlockId = null;
    },
    
  },
});

export const {
  setSelectedManagementMtkId,
  clearSelectedManagementMtkId,
  setSelectedManagementComplexId,
  clearSelectedManagementComplexId,
  setSelectedManagementBuildingId,
  clearSelectedManagementBuildingId,
  setSelectedManagementBlockId,
  clearSelectedManagementBlockId,
} = managementFilterSlice.actions;

export const selectSelectedManagementMtkId = (state: RootState) =>
  state.managementFilter.selectedMtkId;

export const selectSelectedManagementComplexId = (state: RootState) =>
  state.managementFilter.selectedComplexId;

export const selectSelectedManagementBuildingId = (state: RootState) =>
  state.managementFilter.selectedBuildingId;

export const selectSelectedManagementBlockId = (state: RootState) =>
  state.managementFilter.selectedBlockId;

export default managementFilterSlice.reducer;
