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
    <div>
      <h1>Login</h1>
      <div>
        <h3>By Phone</h3>
        <input
          type="text"
          placeholder="+15551234567"
          value={authPhone}
          onChange={(e) => setAuthPhone(e.target.value)}
        />
        <button onClick={() => void requestOtp()}>Request OTP</button>
      </div>
      <div>
        <h3>By Email</h3>
        <input
          type="email"
          placeholder="you@example.com"
          value={authEmail}
          onChange={(e) => setAuthEmail(e.target.value)}
        />
        <button onClick={() => void requestOtp({ email: authEmail })}>
          Request OTP via Email
        </button>
      </div>
      <div>
        <input
          type="text"
          placeholder="123456"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value)}
        />
        <button onClick={verifyOtp}>Verify OTP</button>
      </div>
      <div>{authMessage}</div>
    </div>
  );
}
