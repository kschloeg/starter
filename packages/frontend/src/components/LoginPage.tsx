import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

type Props = {
  authPhone: string;
  authEmail: string;
  otpCode: string;
  authMessage: string;
  setAuthPhone: (v: string) => void;
  setAuthEmail: (v: string) => void;
  setOtpCode: (v: string) => void;
  requestOtp: (opts?: { email?: string }) => Promise<void>;
  verifyOtp: () => Promise<void>;
};

export default function LoginPage({
  authPhone,
  authEmail,
  otpCode,
  authMessage,
  setAuthPhone,
  setAuthEmail,
  setOtpCode,
  requestOtp,
  verifyOtp,
}: Props) {
  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Login
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1">By Phone</Typography>
        <TextField
          fullWidth
          placeholder="+15551234567"
          value={authPhone}
          onChange={(e) => setAuthPhone(e.target.value)}
          sx={{ mb: 1 }}
        />
        <Button variant="contained" onClick={() => void requestOtp()}>
          Request OTP
        </Button>
      </Box>

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
          onClick={() => void requestOtp({ email: authEmail })}
        >
          Request OTP via Email
        </Button>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
        <TextField
          placeholder="123456"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value)}
        />
        <Button variant="contained" onClick={verifyOtp}>
          Verify OTP
        </Button>
      </Box>

      <Box>{authMessage}</Box>
    </Box>
  );
}
