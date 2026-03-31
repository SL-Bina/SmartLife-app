import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './index';

type GlobalMtkOption = {
  id: string | number;
  name: string;
};

type GlobalMtkState = {
  selectedMtkId: string | number | null;
  options: GlobalMtkOption[];
  isLoading: boolean;
  hasLoaded: boolean;
};

const initialState: GlobalMtkState = {
  selectedMtkId: null,
  options: [],
  isLoading: false,
  hasLoaded: false,
};

const globalMtkSlice = createSlice({
  name: 'globalMtk',
  initialState,
  reducers: {
    setSelectedGlobalMtkId(state, action: PayloadAction<string | number | null>) {
      state.selectedMtkId = action.payload;
    },
    setGlobalMtkOptions(state, action: PayloadAction<GlobalMtkOption[]>) {
      state.options = action.payload;
      state.hasLoaded = true;
    },
    setGlobalMtkLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    clearSelectedGlobalMtkId(state) {
      state.selectedMtkId = null;
    },
    clearGlobalMtkState(state) {
      state.selectedMtkId = null;
      state.options = [];
      state.isLoading = false;
      state.hasLoaded = false;
    },
  },
});

export const {
  setSelectedGlobalMtkId,
  setGlobalMtkOptions,
  setGlobalMtkLoading,
  clearSelectedGlobalMtkId,
  clearGlobalMtkState,
} = globalMtkSlice.actions;

const selectGlobalMtkState = (state: RootState) => state.globalMtk ?? initialState;

export const selectSelectedGlobalMtkId = (state: RootState) => {
  const selectedMtkId = selectGlobalMtkState(state).selectedMtkId;
  return selectedMtkId ?? null;
};

export const selectGlobalMtkOptions = (state: RootState) => {
  const options = selectGlobalMtkState(state).options;
  return Array.isArray(options) ? options : [];
};

export const selectGlobalMtkIsLoading = (state: RootState) => {
  const isLoading = selectGlobalMtkState(state).isLoading;
  return typeof isLoading === 'boolean' ? isLoading : false;
};

export const selectGlobalMtkHasLoaded = (state: RootState) => {
  const hasLoaded = selectGlobalMtkState(state).hasLoaded;
  return typeof hasLoaded === 'boolean' ? hasLoaded : false;
};

export default globalMtkSlice.reducer;
