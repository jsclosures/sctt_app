'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { getConfig, saveConfig, isSetupComplete } from '@/lib/config';

const AppContext = createContext(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function useNotify() {
  const { notify } = useApp();
  return notify;
}

export function AppProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [setupDone, setSetupDone] = useState(true);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    setConfig(getConfig());
    setSetupDone(isSetupComplete());
  }, []);

  const updateAppConfig = useCallback((newConfig) => {
    saveConfig(newConfig);
    setConfig(newConfig);
  }, []);

  const notify = useCallback((message, severity = 'info') => {
    setSnack({ open: true, message, severity });
  }, []);

  const closeSnack = useCallback(() => {
    setSnack(prev => ({ ...prev, open: false }));
  }, []);

  const refreshSetupStatus = useCallback(() => {
    setSetupDone(isSetupComplete());
  }, []);

  if (!config) return null;

  return (
    <AppContext.Provider value={{ config, updateAppConfig, setupDone, refreshSetupStatus, notify }}>
      {children}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeSnack} severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </AppContext.Provider>
  );
}