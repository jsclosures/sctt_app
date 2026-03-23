'use client';

import StorageIcon from '@mui/icons-material/Storage';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TerminalIcon from '@mui/icons-material/Terminal';
import TableChartIcon from '@mui/icons-material/TableChart';
import InsightsIcon from '@mui/icons-material/Insights';

const navConfig = [
  {
    label: 'System',
    path: '/',
    icon: <StorageIcon fontSize="small" />
  },
  {
    label: 'Tests',
    path: '/tests',
    icon: <AssignmentIcon fontSize="small" />
  },
  {
    label: 'Script Runner',
    path: '/script-runner',
    icon: <TerminalIcon fontSize="small" />
  },
  {
    label: 'Test Results',
    path: '/test-results',
    icon: <TableChartIcon fontSize="small" />
  },
  {
    label: 'Analyze',
    path: '/analyze',
    icon: <InsightsIcon fontSize="small" />
  }
];

export default navConfig;
