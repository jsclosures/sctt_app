// components/ThemeToggle.js
'use client';

import { useState } from 'react';
import {
  Box,
  IconButton,
  Popover,
  Typography,
  Switch,
  Tooltip
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { useThemeConfig } from '../../context/themecontext'; // Adjust path if needed

export default function ThemeToggleButton() {
  const [anchorEl, setAnchorEl] = useState(null);
  const { mode, toggleMode } = useThemeConfig();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 1300,
      }}
    >
      <Tooltip title="Settings">
        <IconButton
          onClick={handleClick}
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 3,
            '&:hover': {
              bgcolor: 'background.default',
            },
          }}
        >
          <SettingsIcon />
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        PaperProps={{
          sx: {
            p: 2,
            bgcolor: 'background.paper',
            boxShadow: 3,
            borderRadius: 1,
            minWidth: 200,
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography>Dark Mode</Typography>
          <Switch
            checked={mode === 'dark'}
            onChange={toggleMode}
            size="small"
          />
        </Box>
      </Popover>
    </Box>
  );
}
