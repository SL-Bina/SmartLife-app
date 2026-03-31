import React from 'react';

import { selectAuthUser } from '../../store/auth-slice';
import {
  selectSelectedResidentPropertyId,
  setSelectedResidentPropertyId,
} from '../../store/resident-property-slice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  resolveResidentPropertyOptions,
  type ResidentPropertyOption,
} from './resident-data-utils';

const sameId = (a: string | number | null, b: string | number | null): boolean => {
  if (a === null || b === null) {
    return a === b;
  }

  return String(a) === String(b);
};

export function useResidentPropertySelector() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectAuthUser);
  const selectedPropertyId = useAppSelector(selectSelectedResidentPropertyId);

  const propertyOptions = React.useMemo<ResidentPropertyOption[]>(
    () => resolveResidentPropertyOptions(user),
    [user],
  );

  const effectivePropertyId = React.useMemo(() => {
    const hasSelected =
      selectedPropertyId !== null
      && propertyOptions.some(option => String(option.id) === String(selectedPropertyId));

    if (hasSelected) {
      return selectedPropertyId;
    }

    return propertyOptions[0]?.id ?? null;
  }, [propertyOptions, selectedPropertyId]);

  React.useEffect(() => {
    if (!sameId(effectivePropertyId, selectedPropertyId)) {
      dispatch(setSelectedResidentPropertyId(effectivePropertyId));
    }
  }, [dispatch, effectivePropertyId, selectedPropertyId]);

  const selectedPropertyOption = React.useMemo(
    () =>
      propertyOptions.find(option =>
        effectivePropertyId !== null && String(option.id) === String(effectivePropertyId),
      ) ?? null,
    [effectivePropertyId, propertyOptions],
  );

  const onPropertyChange = React.useCallback(
    (propertyName: string) => {
      const matched = propertyOptions.find(option => option.name === propertyName);
      const nextPropertyId = matched?.id ?? null;
      const changed = !sameId(nextPropertyId, effectivePropertyId);

      dispatch(setSelectedResidentPropertyId(nextPropertyId));

      return {
        changed,
        propertyId: nextPropertyId,
      };
    },
    [dispatch, effectivePropertyId, propertyOptions],
  );

  return {
    propertyId: effectivePropertyId,
    propertyOptions,
    selectedPropertyName: selectedPropertyOption?.name,
    onPropertyChange,
  };
}
