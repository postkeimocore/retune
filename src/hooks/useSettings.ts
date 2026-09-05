import { useCallback, useState } from 'react';
import {
  DEFAULT_SETTINGS,
  type AppSettings,
  loadSettings,
  normalizeSettings,
  saveSettings,
} from '../settings/storage';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((current) => {
      const next = normalizeSettings({ ...current, ...patch });
      saveSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    const next = saveSettings(DEFAULT_SETTINGS);
    setSettings(next);
  }, []);

  return { settings, updateSettings, resetSettings };
}
