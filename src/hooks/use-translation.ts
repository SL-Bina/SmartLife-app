import { useAppSelector } from '../store/hooks';
import { getTranslation, Translation } from '../i18n/translations';

export function useTranslation(): Translation {
  const language = useAppSelector(state => state.locale.language);
  return getTranslation(language);
}
