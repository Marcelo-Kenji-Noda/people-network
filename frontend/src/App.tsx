import './App.css'

import { NavLink, Route, Routes } from 'react-router-dom'
import { AppBar, Box, Container, IconButton, Stack, Toolbar, Typography, Button } from '@mui/material'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
/* no local state needed */
import { useContext } from 'react'
import { ColorModeContext } from './theme'

import Groups from './pages/Groups'
import Home from './pages/Home'
import People from './pages/People'
import Stats from './pages/Stats'

function App() {
  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'People', to: '/people' },
    { label: 'Groups', to: '/groups' },
    { label: 'Statistics', to: '/stats' },
  ]

  const colorMode = useContext(ColorModeContext)
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Full-width top bar */}
      <AppBar position="static" color="primary">
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            People Network
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mr: 2 }}>
            {navItems.map((n) => (
              <Button key={n.to} color="inherit" component={NavLink} to={n.to}>
                {n.label}
              </Button>
            ))}
          </Stack>
          <IconButton onClick={() => colorMode.toggleColorMode()} aria-label="toggle theme" color="inherit">
            {colorMode.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main content centered below the top bar */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container maxWidth={false}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/people" element={<People />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/groups" element={<Groups />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  )
}

export default App
