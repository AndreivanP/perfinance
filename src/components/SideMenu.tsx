import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  useTheme,
  Toolbar,
  IconButton,
  Tooltip
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuIcon from '@mui/icons-material/Menu';

const expandedDrawerWidth = 240;
const collapsedDrawerWidth = 72;

interface SideMenuProps {
  onLogout: () => void;
  isExpanded: boolean;
  onToggleDrawer: () => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ onLogout, isExpanded, onToggleDrawer }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/dashboard',
      onClick: () => navigate('/dashboard')
    },
    { 
      text: 'Ativos', 
      icon: <AssessmentIcon />, 
      path: '/ativos',
      onClick: () => navigate('/ativos')
    },
    { 
      text: 'Assessor Virtual', 
      icon: <SmartToyIcon />, 
      path: '/assessor',
      onClick: () => navigate('/assessor')
    },
    {
      text: 'Configurações',
      icon: <SettingsIcon />,
      path: '/configuracoes',
      onClick: () => navigate('/configuracoes'),
    }
  ];

  const renderListItem = (item: typeof menuItems[number]) => {
    const button = (
      <ListItemButton
        selected={location.pathname === item.path}
        onClick={item.onClick}
        sx={{
          justifyContent: isExpanded ? 'flex-start' : 'center',
          px: isExpanded ? 2 : 1,
          '&.Mui-selected': {
            backgroundColor: theme.palette.action.selected,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          },
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <ListItemIcon
          sx={{
            color: 'inherit',
            minWidth: 0,
            mr: isExpanded ? 2 : 0,
            justifyContent: 'center',
          }}
        >
          {item.icon}
        </ListItemIcon>
        <ListItemText
          primary={item.text}
          sx={{
            opacity: isExpanded ? 1 : 0,
            maxWidth: isExpanded ? '100%' : 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            transition: theme.transitions.create('opacity', {
              duration: theme.transitions.duration.shorter,
            }),
          }}
        />
      </ListItemButton>
    );

    if (isExpanded) {
      return button;
    }

    return <Tooltip title={item.text} placement="right">{button}</Tooltip>;
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: isExpanded ? expandedDrawerWidth : collapsedDrawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: isExpanded ? expandedDrawerWidth : collapsedDrawerWidth,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
          overflowX: 'hidden',
          transition: theme.transitions.create('width', {
            duration: theme.transitions.duration.standard,
          }),
        },
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: isExpanded ? 'flex-end' : 'center',
          alignItems: 'center',
          px: 1,
        }}
      >
        <IconButton onClick={onToggleDrawer} size="small">
          {isExpanded ? <MenuOpenIcon /> : <MenuIcon />}
        </IconButton>
      </Toolbar>
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
              {renderListItem(item)}
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          <ListItem disablePadding>
            {isExpanded ? (
              <ListItemButton onClick={onLogout}>
                <ListItemIcon sx={{ color: 'inherit' }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Sair" />
              </ListItemButton>
            ) : (
              <Tooltip title="Sair" placement="right">
                <ListItemButton onClick={onLogout} sx={{ justifyContent: 'center' }}>
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 0 }}>
                    <LogoutIcon />
                  </ListItemIcon>
                </ListItemButton>
              </Tooltip>
            )}
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};

export default SideMenu;
