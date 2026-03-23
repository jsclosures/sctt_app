'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Typography
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';

export default function AccountMenu() {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const router = useRouter();

  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const goToSettings = () => {
    router.push('/settings');
    handleClose();
  };

  const logout = () => {
    window.location.href = '/auth/auth0/sign-out';
  };

  return (
    <>
      <IconButton onClick={handleOpen} size="small">
        <Avatar sx={{ width: 32, height: 32 }}>A</Avatar>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 4,
          sx: {
            mt: 1.5,
            minWidth: 160
          }
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
      >
        <MenuItem onClick={() => {}}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem onClick={logout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Log out
        </MenuItem>
      </Menu>
    </>
  );
}
