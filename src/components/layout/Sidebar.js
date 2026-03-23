'use client';

import { useThemeConfig } from '../../context/themecontext';
import { usePathname } from 'next/navigation';
import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  IconButton, Box, Tooltip
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import navConfig from '@/config/navconfig';
import { useTheme } from '@mui/material/styles';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function Sidebar() {
  const theme = useTheme();
  const pathname = usePathname();
  const { primary } = useThemeConfig();

  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => {
    setCollapsed(prev => !prev);
  };

  const drawerContent = (
    <Box
      sx={{
        width: collapsed ? 72 : 240,
        transition: 'width 0.25s ease-in-out',
        height: '100%',
        backgroundColor: theme.palette.background.paper,
        borderRight: '1px solid #30363d',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: 1,
        pt: 2
      }}
    >
      {/* Collapse Toggle */}
      <IconButton
        onClick={toggleCollapse}
        sx={{
          color: theme.palette.text.secondary,
          mb: 2
        }}
      >
        {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
      </IconButton>

      {/* Logo */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', width: '100%' }}>
        {collapsed ? (
          <Image
            src="/assets/sctt.png"
            alt="SCTT Icon"
            width={80}
            height={80}
            priority
          />
        ) : (
          <Image
            src="/assets/sctt.PNG"
            alt="SCTT Logo"
            width={120}
            height={120}
            style={{ objectFit: 'contain' }}
            priority
          />
        )}
      </Box>

      {/* Navigation */}
      <List disablePadding sx={{ width: '100%' }}>
        {navConfig.map((item) => {
          const isActive = pathname.startsWith(item.path);
          const button = (
            <ListItemButton
              key={item.label}
              component={Link}
              href={item.path}
              selected={isActive}
              sx={{
                borderRadius: '8px',
                mb: 1,
                px: collapsed ? 1 : 2,
                py: 1.1,
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: isActive ? primary : theme.palette.text.secondary,
                backgroundColor: isActive
                ? theme.palette.action.selected
                : 'transparent',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                color: primary,
                transform: 'scale(1.02)'
              }
              }}
            >
              <ListItemIcon
                sx={{
                  color: primary,
                  minWidth: 0,
                  justifyContent: 'center',
                  mr: collapsed ? 0 : 2
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: 500
                  }}
                />
              )}
            </ListItemButton>
          );

          return collapsed ? (
            <Tooltip title={item.label} placement="right" key={item.label}>
              {button}
            </Tooltip>
          ) : (
            button
          );
        })}
      </List>
    </Box>
  );

  return (
    <Drawer
      variant="permanent"
      open
      sx={{
        width: collapsed ? 72 : 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: collapsed ? 72 : 240,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          transition: 'width 0.25s ease-in-out'
        }
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
