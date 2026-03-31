import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import {
  loginService,
  logoutService,
  refreshUserService,
} from '../services/auth-service';
import type { ApiError } from '../services/api';
import { getRoleName, type AuthUser, type LoginRequest } from '../utils/auth';
import type { RootState } from './index';

type AuthStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

type AuthThunkError = {
  message: string;
  status?: number;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  isResident: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isInitializing: boolean;
  status: AuthStatus;
  error: string | null;
};

const initialState: AuthState = {
  token: null,
  user: null,
  isResident: false,
  isAuthenticated: false,
  isInitialized: false,
  isInitializing: false,
  status: 'idle',
  error: null,
};

const toErrorMessage = (error: unknown, fallback: string): string => {
  if (!error) {
    return fallback;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  const apiError = error as ApiError;
  if (typeof apiError.message === 'string' && apiError.message.length > 0) {
    return apiError.message;
  }

  return fallback;
};

const toAuthThunkError = (error: unknown, fallback: string): AuthThunkError => {
  const apiError = error as ApiError;
  return {
    message: toErrorMessage(error, fallback),
    status: typeof apiError?.status === 'number' ? apiError.status : undefined,
  };
};

const clearAuthState = (state: AuthState, preserveInitialization = true) => {
  state.token = null;
  state.user = null;
  state.isResident = false;
  state.isAuthenticated = false;
  state.status = 'idle';
  state.error = null;
  state.isInitializing = false;
  state.isInitialized = preserveInitialization ? state.isInitialized : false;
};

export const initializeAuthThunk = createAsyncThunk(
  'auth/initialize',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const token = state.auth.token;

    if (!token) {
      return {
        user: null,
        isResident: false,
        isAuthenticated: false,
      };
    }

    try {
      const user = await refreshUserService({
        preferResident: state.auth.isResident,
      });

      return {
        user,
        isResident: user.is_resident === true,
        isAuthenticated: true,
      };
    } catch (error) {
      const errorPayload = toAuthThunkError(error, 'Sessiya yenilenmedi');

      // Keep current persisted session on temporary/network/server errors.
      if (errorPayload.status !== 401 && errorPayload.status !== 403) {
        return {
          user: state.auth.user,
          isResident: state.auth.isResident,
          isAuthenticated: true,
        };
      }

      return rejectWithValue(errorPayload);
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as RootState;
      return !state.auth.isInitializing;
    },
  },
);

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (payload: LoginRequest, { rejectWithValue }) => {
    try {
      return await loginService(payload);
    } catch (error) {
      const message = toErrorMessage(error, 'Login ugursuz oldu');
      return rejectWithValue(message);
    }
  }
);

export const refreshAuthThunk = createAsyncThunk(
  'auth/refresh',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const token = state.auth.token;

    if (!token) {
      return {
        user: null,
        isResident: false,
        isAuthenticated: false,
      };
    }

    try {
      const user = await refreshUserService({
        preferResident: state.auth.isResident,
      });

      return {
        user,
        isResident: user.is_resident === true,
        isAuthenticated: true,
      };
    } catch (error) {
      const errorPayload = toAuthThunkError(error, 'Istifadeci melumati yenilenmedi');

      // Do not drop active session for non-auth failures.
      if (errorPayload.status !== 401 && errorPayload.status !== 403) {
        return {
          user: state.auth.user,
          isResident: state.auth.isResident,
          isAuthenticated: true,
        };
      }

      return rejectWithValue(errorPayload);
    }
  }
);

export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const token = state.auth.token;

    if (!token) {
      return { skipped: true };
    }

    try {
      await logoutService(token);
      return { skipped: false };
    } catch (error) {
      const message = toErrorMessage(error, 'Logout ugursuz oldu');
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    forceLogout(state) {
      clearAuthState(state);
      state.isInitialized = true;
    },
    setAuthInitialized(state, action: { payload: boolean }) {
      state.isInitialized = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(initializeAuthThunk.pending, state => {
        state.isInitializing = true;
        state.error = null;
      })
      .addCase(initializeAuthThunk.fulfilled, (state, action) => {
        state.isInitializing = false;
        state.isInitialized = true;
        state.user = action.payload.user;
        state.isResident = action.payload.isResident;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.status = 'idle';
      })
      .addCase(initializeAuthThunk.rejected, (state, action) => {
        const payload = action.payload as AuthThunkError | undefined;
        clearAuthState(state);
        state.isInitialized = true;
        state.error = payload?.message || 'Sessiya yenilenmedi';
      })
      .addCase(loginThunk.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isResident = action.payload.user.is_resident;
        state.isAuthenticated = true;
        state.isInitialized = true;
        state.isInitializing = false;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Login ugursuz oldu';
        state.isInitialized = true;
        state.isInitializing = false;
      })
      .addCase(refreshAuthThunk.pending, state => {
        state.isInitializing = true;
      })
      .addCase(refreshAuthThunk.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isResident = action.payload.isResident;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.isInitialized = true;
        state.isInitializing = false;
        state.error = null;
      })
      .addCase(refreshAuthThunk.rejected, (state, action) => {
        const payload = action.payload as AuthThunkError | undefined;
        clearAuthState(state);
        state.isInitialized = true;
        state.error = payload?.message || 'Istifadeci melumati yenilenmedi';
      })
      .addCase(logoutThunk.pending, state => {
        state.status = 'loading';
      })
      .addCase(logoutThunk.fulfilled, state => {
        clearAuthState(state);
        state.isInitialized = true;
      })
      .addCase(logoutThunk.rejected, (state, action) => {
        clearAuthState(state);
        state.isInitialized = true;
        state.error = (action.payload as string) || null;
      });
  },
});

export const { clearAuthError, forceLogout, setAuthInitialized } = authSlice.actions;

export const selectAuthState = (state: RootState) => state.auth;
export const selectAuthUser = (state: RootState) => state.auth.user;
export const selectAuthToken = (state: RootState) => state.auth.token;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectIsResident = (state: RootState) => state.auth.isResident;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectIsAuthInitialized = (state: RootState) => state.auth.isInitialized;
export const selectIsAuthInitializing = (state: RootState) => state.auth.isInitializing;
export const selectAuthRoleName = (state: RootState) => getRoleName(state.auth.user);

export default authSlice.reducer;
