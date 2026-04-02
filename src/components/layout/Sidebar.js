'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '@mui/material/styles';
import { useThemeConfig } from '../../context/themecontext';
import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  IconButton, Box, Tooltip, Typography, Divider
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Image from 'next/image';
import Link from 'next/link';
import navConfig from '../../config/navconfig';

export default function Sidebar() {
  const theme = useTheme();
  const pathname = usePathname();
  const { primary } = useThemeConfig();
  const [collapsed, setCollapsed] = useState(false);

  const width = collapsed ? 72 : 220;

  const systemSection = navConfig.find(s => s.section === 'System');
  const mainSections = navConfig.filter(s => s.section !== 'System');

  const renderItem = (item) => {
    const isActive = item.path === '/'
      ? pathname === '/'
      : pathname.startsWith(item.path);

    const button = (
      <ListItemButton
        key={item.label}
        component={Link}
        href={item.path}
        selected={isActive}
        sx={{
          borderRadius: '8px',
          mb: 0.25,
          px: collapsed ? 1.25 : 1.5,
          py: 0.75,
          minHeight: 38,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 1.5, justifyContent: 'center' }}>
          {item.icon}
        </ListItemIcon>
        {!collapsed && (
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: isActive ? 600 : 500 }}
          />
        )}
      </ListItemButton>
    );

    return collapsed ? (
      <Tooltip title={item.label} placement="right" key={item.label}>
        {button}
      </Tooltip>
    ) : button;
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          bgcolor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
          transition: 'width 0.2s ease',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', px: 1, pt: 1.5 }}>

        {/* Collapse toggle */}
        <Box sx={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end', mb: 1 }}>
          <IconButton onClick={() => setCollapsed(p => !p)} size="small" sx={{ color: 'text.secondary' }}>
            {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </IconButton>
        </Box>

        {/* Logo */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
          <Image
            src="/assets/sctt.PNG"
            alt="SCTT"
            width={collapsed ? 80 : 80}
            height={collapsed ? 80 : 80}
            style={{ objectFit: 'contain' }}
            priority
          />
        </Box>

        {/* Main nav sections */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {mainSections.map((section, idx) => (
            <Box key={section.section} sx={{ mb: 1.5 }}>
              {!collapsed && (
                <Typography sx={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'text.secondary',
                  px: 1.5,
                  mb: 0.5,
                  opacity: 0.6,
                }}>
                  {section.section}
                </Typography>
              )}
              {collapsed && idx > 0 && (
                <Divider sx={{ mx: 1, mb: 0.5 }} />
              )}
              <List disablePadding>
                {section.items.map(renderItem)}
              </List>
            </Box>
          ))}
        </Box>

        {/* System section pinned to bottom */}
        {systemSection && (
          <Box sx={{ pb: 1.5 }}>
            <Divider sx={{ mx: 0.5, mb: 1 }} />
            <List disablePadding>
              {systemSection.items.map(renderItem)}
            </List>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}