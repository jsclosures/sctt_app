'use client';

//import { UserProvider } from '@auth0/nextjs-auth0/client';
import { CssBaseline, Box } from '@mui/material';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import ThemeToggleButton from '../components/layout/ThemeSettings';
import { ThemeConfigProvider } from '../context/themecontext';
import { AppProvider } from '../../context/AppContext';
import SetupGuard from '../../components/SetupGuard';
import LogPanel from '../components/LogPanel';

export default function ProtectedLayout({ children }) {
  return (
    <html lang="en">
      <body>
          <ThemeConfigProvider>
            <AppProvider>
              <SetupGuard>
                <CssBaseline />
                <Box sx={{ display: 'flex' }}>
                  <Sidebar />
                  <Box component="main" sx={{ flexGrow: 1, minHeight: '100vh', p: 3 }}>
                    <Topbar />
                    {children}
                  </Box>
                  {/* <ThemeToggleButton /> */}
                  <LogPanel />
                </Box>
              </SetupGuard>
            </AppProvider>
          </ThemeConfigProvider>
      </body>
    </html>
  );
}