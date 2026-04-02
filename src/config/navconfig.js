import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';
import TerminalRoundedIcon from '@mui/icons-material/TerminalRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import AnalyticsRoundedIcon from '@mui/icons-material/AnalyticsRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';

const navConfig = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', icon: <DashboardRoundedIcon />, path: '/' },
    ],
  },
  {
    section: 'Workspace',
    items: [
      { label: 'Assets', icon: <ViewListRoundedIcon />, path: '/assets' },
      { label: 'Tests', icon: <ScienceRoundedIcon />, path: '/tests' },
    ],
  },
  {
    section: 'Execution',
    items: [
      { label: 'Script Runner', icon: <TerminalRoundedIcon />, path: '/script-runner' },
      { label: 'Test Results', icon: <AssessmentRoundedIcon />, path: '/test-results' },
      { label: 'Analyze', icon: <AnalyticsRoundedIcon />, path: '/analyze' },
    ],
  },
  {
    section: 'System',
    items: [
      { label: 'Settings', icon: <SettingsRoundedIcon />, path: '/settings' },
    ],
  },
];

export default navConfig;