import { useEffect, useState } from 'react';

const sanitizeInput = (input: string) => {
  const element = document.createElement('div');
  element.innerText = input;
  return element.innerHTML;
};

function App() {
  const [users, setUsers] = useState<
    {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      kirk?: string;
    }[]
  >([]);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [authPhone, setAuthPhone] = useState<string>('');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [authMessage, setAuthMessage] = useState<string>('');
  const [token, setToken] = useState<string | null>(null);

  const syncUsers = async () => {
    console.log('KIRK fetching from: ', { url: import.meta.env.VITE_API_URL });
    const res = await fetch(`${import.meta.env.VITE_API_URL}/users`);
    console.log('KIRK res: ', { res });
    const body = (await res.json()) as {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      kirk: string;
    }[];

    setUsers(body);
  };

  useEffect(() => {
    void syncUsers();
  }, []);

  const onFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const sanitizedFirstName = sanitizeInput(firstName);
    const sanitizedLastName = sanitizeInput(lastName);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPhone = sanitizeInput(phone);

    await fetch(`${import.meta.env.VITE_API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
      }),
    });
    setUsers([
      ...users,
      {
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
      },
    ]);
    await syncUsers();
  };

  const requestOtp = async (opts?: { email?: string }) => {
    setAuthMessage('');
    try {
      const body =
        opts && opts.email ? { email: opts.email } : { phone: authPhone };
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/request-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        setAuthMessage(`Request failed: ${res.status} ${text}`);
        return;
      }
      setAuthMessage(
        opts && opts.email
          ? 'OTP requested — check your email'
          : 'OTP requested — check your phone'
      );
    } catch (err) {
      setAuthMessage('Network error');
    }
  };

  const verifyOtp = async () => {
    setAuthMessage('');
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/verify-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: authPhone, code: otpCode }),
        }
      );
      if (!res.ok) {
        const txt = await res.text();
        setAuthMessage(`Verify failed: ${res.status} ${txt}`);
        return;
      }
      const body = await res.json();
      setToken(body.token || null);
      setAuthMessage('Verified — token received');
    } catch (err) {
      setAuthMessage('Network error');
    }
  };

  return (
    <div>
      <div>
        <h1>Users</h1>
        <form onSubmit={onFormSubmit}>
          <input
            type="text"
            name="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First Name"
          />
          <input
            type="text"
            name="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last Name"
          />
          <input
            type="text"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
          />
          <input
            type="text"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
          />
          <button type="submit">Submit</button>
        </form>
      </div>
      <table>
        <thead>
          <tr>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email Address</th>
            <th>Phone</th>
            <th>NEW</th>
          </tr>
        </thead>
        <tbody>
          {users.map(({ email, firstName, lastName, phone, kirk }) => (
            <tr key={email}>
              <td>{firstName}</td>
              <td>{lastName}</td>
              <td>{email}</td>
              <td>{phone}</td>
              <td>{kirk}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <h2>Passwordless Login</h2>
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
        {token && (
          <div>
            <h4>Token</h4>
            <pre>{token}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
