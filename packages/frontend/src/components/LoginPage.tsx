import React from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Layout from './Layout';

type Props = {
  showSnackbar?: (
    message: string,
    severity?: 'success' | 'error' | 'info' | 'warning'
  ) => void;
};

export default function LoginPage({ showSnackbar }: Props) {
  const [authEmail, setAuthEmail] = React.useState('');
  const [otpCode, setOtpCode] = React.useState('');
  const [requestingOtp, setRequestingOtp] = React.useState(false);
  const [verifyingOtp, setVerifyingOtp] = React.useState(false);

  const requestOtp = async () => {
    try {
      setRequestingOtp(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/request-otp`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail }),
        }
      );
      setRequestingOtp(false);
      if (!res.ok) {
        const txt = await res.text();
        showSnackbar?.(`Request failed: ${res.status} ${txt}`, 'error');
        return;
      }
      showSnackbar?.('OTP requested — check your email', 'success');
    } catch (e) {
      setRequestingOtp(false);
      showSnackbar?.('Network error', 'error');
    }
  };

  const verifyOtp = async () => {
    try {
      setVerifyingOtp(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/verify-otp`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail, code: otpCode }),
        }
      );
      setVerifyingOtp(false);
      if (!res.ok) {
        const txt = await res.text();
        showSnackbar?.(`Verify failed: ${res.status} ${txt}`, 'error');
        return;
      }
      showSnackbar?.('Verified — please wait', 'success');
    } catch (e) {
      setVerifyingOtp(false);
      showSnackbar?.('Network error', 'error');
    }
  };

  return (
    <Layout>
      <Box sx={{ maxWidth: 600 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Login
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">By Email</Typography>
          <TextField
            fullWidth
            type="email"
            placeholder="you@example.com"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            sx={{ mb: 1 }}
          />
          <Button
            variant="outlined"
            onClick={() => void requestOtp()}
            disabled={!!requestingOtp}
          >
            {requestingOtp ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} /> Requesting...
              </>
            ) : (
              'Request OTP via Email'
            )}
          </Button>
        </Box>

        <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            placeholder="123456"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={() => void verifyOtp()}
            disabled={!!verifyingOtp}
          >
            {verifyingOtp ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} /> Verifying...
              </>
            ) : (
              'Verify OTP'
            )}
          </Button>
        </Box>

        <Box />
      </Box>
    </Layout>
  );
}
