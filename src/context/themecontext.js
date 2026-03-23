'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const ThemeConfigContext = createContext();

export const useThemeConfig = () => useContext(ThemeConfigContext);

export const ThemeConfigProvider = ({ children }) => {
  const [mode, setMode] = useState('light');

  const primary = '#ff6b2b';
  const secondary = '#ff8c52';

  const toggleMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const isDark = mode === 'dark';

  // ─── Palette ────────────────────────────────────────────────────
  const bgDefault = isDark ? '#0a0a0b' : '#f5f5f7';
  const bgPaper = isDark ? '#111113' : '#f5f5f7';
  const bgElevated = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const borderSubtle = isDark ? '#1e1e21' : '#f0f0f2';
  const textPrimary = isDark ? '#fafafa' : '#18181b';
  const textSecondary = isDark ? '#a1a1aa' : '#71717a';
  const textMuted = isDark ? '#52525b' : '#a1a1aa';

  // Accent glow for focus/active states
  const accentGlow = isDark
    ? '0 0 0 3px rgba(255, 107, 43, 0.15)'
    : '0 0 0 3px rgba(255, 107, 43, 0.1)';

  const theme = useMemo(() =>
    createTheme({
      typography: {
        fontSize: 13,
        fontFamily: '"DM Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        h5: {
          fontWeight: 700,
          letterSpacing: '-0.025em',
          fontSize: '1.35rem',
        },
        h6: {
          fontWeight: 650,
          letterSpacing: '-0.02em',
          fontSize: '1.1rem',
        },
        subtitle1: {
          fontWeight: 600,
          letterSpacing: '-0.01em',
        },
        subtitle2: {
          fontWeight: 600,
          fontSize: '0.8rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: textSecondary,
        },
        body2: {
          fontSize: '0.82rem',
          color: textSecondary,
        },
        caption: {
          fontSize: '0.72rem',
          letterSpacing: '0.02em',
        },
      },
      shape: {
        borderRadius: 10,
      },
      palette: {
        mode,
        primary: { main: primary },
        secondary: { main: secondary },
        background: {
          default: bgDefault,
          paper: bgPaper,
        },
        text: {
          primary: textPrimary,
          secondary: textSecondary,
        },
        divider: borderColor,
      },
      components: {
        // ─── Global ─────────────────────────────────────────
        MuiCssBaseline: {
          styleOverrides: {
            '*': {
              scrollbarWidth: 'thin',
              scrollbarColor: isDark
                ? '#333 transparent'
                : '#ccc transparent',
            },
            '*::-webkit-scrollbar': {
              width: 6,
              height: 6,
            },
            '*::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '*::-webkit-scrollbar-thumb': {
              background: isDark ? '#333' : '#ccc',
              borderRadius: 3,
            },
            body: {
              backgroundImage: isDark
                ? 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,107,43,0.04), transparent)'
                : 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,107,43,0.03), transparent)',
            },
          },
        },

        // ─── Paper ──────────────────────────────────────────
        MuiPaper: {
          defaultProps: { elevation: 0 },
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              border: `1px solid ${borderColor}`,
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            },
            outlined: {
              border: `1px solid ${borderColor}`,
              '&:hover': {
                borderColor: isDark ? '#3f3f46' : '#d4d4d8',
              },
            },
          },
        },

        // ─── Buttons ────────────────────────────────────────
        MuiButton: {
          defaultProps: { disableElevation: true },
          styleOverrides: {
            root: {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              borderRadius: 8,
              padding: '6px 16px',
              transition: 'all 0.15s ease',
            },
            containedPrimary: {
              color: '#fff',
              background: `linear-gradient(135deg, ${primary} 0%, #e85d1e 100%)`,
              boxShadow: isDark
                ? '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
                : '0 1px 3px rgba(255,107,43,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
              '&:hover': {
                background: `linear-gradient(135deg, #ff7a3f 0%, ${primary} 100%)`,
                boxShadow: isDark
                  ? '0 4px 12px rgba(255,107,43,0.3)'
                  : '0 4px 12px rgba(255,107,43,0.25)',
                transform: 'translateY(-1px)',
              },
              '&:active': {
                transform: 'translateY(0px)',
              },
            },
            outlinedPrimary: {
              color: isDark ? '#fafafa' : textPrimary,
              borderColor: borderColor,
              backgroundColor: 'transparent',
              '&:hover': {
                borderColor: primary,
                backgroundColor: isDark
                  ? 'rgba(255,107,43,0.08)'
                  : 'rgba(255,107,43,0.05)',
                color: primary,
              },
            },
            outlinedError: {
              borderColor: borderColor,
              '&:hover': {
                borderColor: '#ef4444',
                backgroundColor: isDark
                  ? 'rgba(239,68,68,0.08)'
                  : 'rgba(239,68,68,0.05)',
              },
            },
          },
        },

        // ─── Tabs ───────────────────────────────────────────
        MuiTabs: {
          styleOverrides: {
            root: {
              minHeight: 36,
              borderBottom: `1px solid ${borderColor}`,
            },
            indicator: {
              height: 2.5,
              borderRadius: '2px 2px 0 0',
              background: `linear-gradient(90deg, ${primary}, ${secondary})`,
            },
          },
        },
        MuiTab: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.82rem',
              minHeight: 36,
              padding: '6px 16px',
              color: textMuted,
              transition: 'color 0.15s ease',
              '&.Mui-selected': {
                color: isDark ? '#fafafa' : textPrimary,
                fontWeight: 600,
              },
              '&:hover': {
                color: isDark ? '#fafafa' : textPrimary,
              },
            },
          },
        },

        // ─── TextFields ─────────────────────────────────────
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              borderRadius: 8,
              fontSize: '0.85rem',
              backgroundColor: isDark ? '#0f0f11' : '#fafafa',
              transition: 'all 0.15s ease',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: borderColor,
                transition: 'border-color 0.15s ease',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: isDark ? '#52525b' : '#a1a1aa',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: primary,
                borderWidth: 1.5,
              },
              '&.Mui-focused': {
                boxShadow: accentGlow,
              },
            },
          },
        },
        MuiInputLabel: {
          styleOverrides: {
            root: {
              fontSize: '0.85rem',
              color: textMuted,
              '&.Mui-focused': {
                color: primary,
              },
            },
          },
        },

        // ─── Select ─────────────────────────────────────────
        MuiSelect: {
          styleOverrides: {
            root: {
              borderRadius: 8,
            },
          },
        },
        MuiMenuItem: {
          styleOverrides: {
            root: {
              fontSize: '0.85rem',
              borderRadius: 6,
              margin: '2px 6px',
              padding: '6px 12px',
              '&.Mui-selected': {
                backgroundColor: isDark
                  ? 'rgba(255,107,43,0.12)'
                  : 'rgba(255,107,43,0.08)',
                '&:hover': {
                  backgroundColor: isDark
                    ? 'rgba(255,107,43,0.18)'
                    : 'rgba(255,107,43,0.12)',
                },
              },
            },
          },
        },

        // ─── DataGrid ───────────────────────────────────────
        MuiDataGrid: {
          styleOverrides: {
            root: {
              border: `1px solid ${borderColor}`,
              borderRadius: 10,
              fontSize: '0.82rem',
              backgroundColor: bgPaper,
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: isDark ? '#141416' : '#fafafa',
                borderBottom: `1px solid ${borderColor}`,
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: textSecondary,
                minHeight: '40px !important',
                maxHeight: '40px !important',
              },
              '& .MuiDataGrid-columnHeader': {
                '&:focus, &:focus-within': {
                  outline: 'none',
                },
              },
              '& .MuiDataGrid-cell': {
                borderBottom: `1px solid ${borderSubtle}`,
                padding: '0 16px',
                '&:focus, &:focus-within': {
                  outline: 'none',
                },
              },
              '& .MuiDataGrid-row': {
                transition: 'background-color 0.1s ease',
                '&:hover': {
                  backgroundColor: isDark
                    ? 'rgba(255,107,43,0.04)'
                    : 'rgba(255,107,43,0.03)',
                },
                '&.Mui-selected': {
                  backgroundColor: isDark
                    ? 'rgba(255,107,43,0.08)'
                    : 'rgba(255,107,43,0.06)',
                  '&:hover': {
                    backgroundColor: isDark
                      ? 'rgba(255,107,43,0.12)'
                      : 'rgba(255,107,43,0.08)',
                  },
                },
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: `1px solid ${borderColor}`,
                backgroundColor: isDark ? '#141416' : '#fafafa',
                minHeight: '44px',
              },
              '& .MuiDataGrid-overlay': {
                backgroundColor: 'transparent',
              },
              '& .MuiCheckbox-root': {
                color: textMuted,
                '&.Mui-checked': {
                  color: primary,
                },
              },
            },
          },
        },

        // ─── Table ──────────────────────────────────────────
        MuiTableHead: {
          styleOverrides: {
            root: {
              '& .MuiTableCell-head': {
                backgroundColor: isDark ? '#141416' : '#fafafa',
                fontWeight: 600,
                fontSize: '0.73rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: textSecondary,
                borderBottom: `1px solid ${borderColor}`,
                padding: '8px 16px',
              },
            },
          },
        },
        MuiTableBody: {
          styleOverrides: {
            root: {
              '& .MuiTableRow-root': {
                transition: 'background-color 0.1s ease',
                '&:hover': {
                  backgroundColor: isDark
                    ? 'rgba(255,107,43,0.04)'
                    : 'rgba(255,107,43,0.02)',
                },
              },
              '& .MuiTableCell-root': {
                borderBottom: `1px solid ${borderSubtle}`,
                padding: '8px 16px',
                fontSize: '0.82rem',
              },
            },
          },
        },
        MuiTableSortLabel: {
          styleOverrides: {
            root: {
              '&.Mui-active': {
                color: primary,
                '& .MuiTableSortLabel-icon': {
                  color: primary,
                },
              },
            },
          },
        },

        // ─── Tooltip ────────────────────────────────────────
        MuiTooltip: {
          styleOverrides: {
            tooltip: {
              backgroundColor: isDark ? '#27272a' : '#18181b',
              color: '#fafafa',
              fontSize: '0.75rem',
              fontWeight: 500,
              borderRadius: 6,
              padding: '6px 10px',
            },
            arrow: {
              color: isDark ? '#27272a' : '#18181b',
            },
          },
        },

        // ─── Divider ────────────────────────────────────────
        MuiDivider: {
          styleOverrides: {
            root: {
              borderColor: borderColor,
            },
          },
        },

        // ─── Snackbar / Alert ───────────────────────────────
        MuiAlert: {
          styleOverrides: {
            root: {
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 500,
            },
            filledSuccess: {
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
            },
            filledError: {
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            },
            filledInfo: {
              background: `linear-gradient(135deg, ${primary} 0%, #e85d1e 100%)`,
            },
          },
        },

        // ─── AppBar ─────────────────────────────────────────
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: isDark ? '#0a0a0b' : '#ffffff',
              borderBottom: `1px solid ${borderColor}`,
              backgroundImage: 'none',
              boxShadow: 'none',
            },
          },
        },

        // ─── Sidebar nav ────────────────────────────────────
        MuiListItemButton: {
          styleOverrides: {
            root: {
              borderRadius: 8,
              padding: '8px 14px',
              margin: '2px 8px',
              transition: 'all 0.15s ease',
              '&:hover': {
                backgroundColor: isDark
                  ? 'rgba(255,107,43,0.08)'
                  : 'rgba(255,107,43,0.06)',
              },
              '&.Mui-selected': {
                backgroundColor: isDark
                  ? 'rgba(255,107,43,0.12)'
                  : 'rgba(255,107,43,0.08)',
                color: primary,
                '& .MuiListItemIcon-root': {
                  color: primary,
                },
                '& .MuiListItemText-primary': {
                  color: primary,
                  fontWeight: 600,
                },
                '&:hover': {
                  backgroundColor: isDark
                    ? 'rgba(255,107,43,0.16)'
                    : 'rgba(255,107,43,0.1)',
                },
              },
            },
          },
        },
        MuiListItemIcon: {
          styleOverrides: {
            root: {
              minWidth: 34,
              color: textMuted,
            },
          },
        },
        MuiListItemText: {
          styleOverrides: {
            primary: {
              fontWeight: 500,
              fontSize: '0.85rem',
              color: isDark ? '#d4d4d8' : '#52525b',
            },
          },
        },

        // ─── Chip ───────────────────────────────────────────
        MuiChip: {
          styleOverrides: {
            root: {
              fontWeight: 500,
              fontSize: '0.75rem',
              borderRadius: 6,
            },
          },
        },

        // ─── IconButton ─────────────────────────────────────
        MuiIconButton: {
          styleOverrides: {
            root: {
              transition: 'all 0.15s ease',
              '&:hover': {
                backgroundColor: isDark
                  ? 'rgba(255,107,43,0.08)'
                  : 'rgba(255,107,43,0.06)',
              },
            },
          },
        },

        // ─── FormControl / InputLabel ───────────────────────
        MuiFormControl: {
          styleOverrides: {
            root: {
              '& .MuiFormLabel-root': {
                fontSize: '0.85rem',
              },
            },
          },
        },

        // ─── Circular Progress ──────────────────────────────
        MuiCircularProgress: {
          defaultProps: {
            thickness: 4,
          },
          styleOverrides: {
            colorPrimary: {
              color: primary,
            },
          },
        },
      },
    }),
  [mode, primary, secondary, isDark, bgDefault, bgPaper, bgElevated, borderColor, borderSubtle, textPrimary, textSecondary, textMuted, accentGlow]);

  return (
    <ThemeConfigContext.Provider value={{ mode, toggleMode, primary, secondary }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeConfigContext.Provider>
  );
};