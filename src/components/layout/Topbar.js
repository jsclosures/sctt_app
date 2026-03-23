'use client';

import { useTheme } from '@mui/material/styles';
import { AppBar, Box, Toolbar, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import AccountMenu from './AccountMenu';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function Topbar({ collapsed }) {
  const theme = useTheme();
  const { user } = useUser();

  return (
    <AppBar
      position="static"
      elevation={0}
      color="transparent"
      sx={{
        backgroundColor: theme.palette.background.default,
        borderBottom: '1px solid #eaeaea',
        px: 2
      }}
    >
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: 64,
          px: 2
        }}
      >
        {/* Left Section - Logo Animation */}
        <Box sx={{ minWidth: collapsed ? 160 : 0 }}>
          <AnimatePresence>
            {collapsed && (
              <motion.div
                key="sctt-logo"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                <Image
                  src="/assets/SCTT.PNG"
                  alt="SCTT Logo"
                  width={160}
                  height={60}
                  style={{ objectFit: 'contain' }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        {/* Right Section - User info & menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {user && (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 500
              }}
            >
              {user.name}
            </Typography>
          )}
          <AccountMenu />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
