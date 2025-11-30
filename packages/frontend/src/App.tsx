import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import MainPage from './components/MainPage';

import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

function App() {
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg] = useState('');
  const [snackSeverity] = useState<'success' | 'error' | 'info' | 'warning'>(
    'info'
  );

  const handleCloseSnack = (_?: any, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackOpen(false);
  };

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<MainPage />} />
      </Routes>

      <Snackbar
        open={snackOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnack}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnack}
          severity={snackSeverity}
          sx={{ width: '100%' }}
        >
          {snackMsg}
        </Alert>
      </Snackbar>
    </>
  );
}

export default App;
