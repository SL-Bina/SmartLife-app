import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LanguageCode } from '../i18n/translations';

type LocaleState = {
  language: LanguageCode;
};

const initialState: LocaleState = {
  language: 'en',
};

const localeSlice = createSlice({
  name: 'locale',
  initialState,
  reducers: {
    setLanguage(state, action: PayloadAction<LanguageCode>) {
      state.language = action.payload;
    },
  },
});

export const { setLanguage } = localeSlice.actions;
export default localeSlice.reducer;
