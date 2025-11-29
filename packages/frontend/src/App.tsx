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
  const [view, setView] = useState<'login' | 'users'>('login');
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editFirstName, setEditFirstName] = useState<string>('');
  const [editLastName, setEditLastName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');

  const syncUsers = async () => {
    console.log('KIRK fetching from: ', { url: import.meta.env.VITE_API_URL });
    const res = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
      credentials: 'include',
    });
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
    if (view === 'users') void syncUsers();
  }, [view]);

  const onFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const sanitizedFirstName = sanitizeInput(firstName);
    const sanitizedLastName = sanitizeInput(lastName);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPhone = sanitizeInput(phone);

    await fetch(`${import.meta.env.VITE_API_URL}/users`, {
      method: 'POST',
      credentials: 'include',
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
          credentials: 'include',
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
      const verifyOtpBody = {
        code: otpCode,
        ...(authEmail ? { email: authEmail } : { phone: authPhone }),
      };
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/verify-otp`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(verifyOtpBody),
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
      setView('users');
    } catch (err) {
      setAuthMessage('Network error');
    }
  };

  const getSubFromToken = (t: string | null) => {
    if (!t) return null;
    try {
      const parts = t.split('.');
      if (parts.length < 2) return null;
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
      );
      return payload.sub as string | null;
    } catch (e) {
      return null;
    }
  };

  const subject = getSubFromToken(token);

  const startEdit = (email: string) => {
    const row = users.find((u) => u.email === email);
    if (!row) return;
    setEditingEmail(email);
    setEditFirstName(row.firstName);
    setEditLastName(row.lastName);
    setEditPhone(row.phone || '');
  };

  const cancelEdit = () => {
    setEditingEmail(null);
  };

  const saveEdit = async (email: string) => {
    try {
      const body: any = { email };
      if (editFirstName) body.firstName = editFirstName;
      if (editLastName) body.lastName = editLastName;
      if (editPhone) body.phone = editPhone;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text();
        setAuthMessage(`Update failed: ${res.status} ${txt}`);
        return;
      }
      setAuthMessage('Updated');
      setEditingEmail(null);
      await syncUsers();
    } catch (err) {
      setAuthMessage('Network error');
    }
  };

  return (
    <div>
      {view === 'login' ? (
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
      ) : (
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

          <table>
            <thead>
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email Address</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(({ email, firstName, lastName, phone }) => (
                <tr key={email}>
                  <td>
                    {editingEmail === email ? (
                      <input
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                      />
                    ) : (
                      firstName
                    )}
                  </td>
                  <td>
                    {editingEmail === email ? (
                      <input
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                      />
                    ) : (
                      lastName
                    )}
                  </td>
                  <td>{email}</td>
                  <td>
                    {editingEmail === email ? (
                      <input
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                      />
                    ) : (
                      phone
                    )}
                  </td>
                  <td>
                    {subject === email ? (
                      editingEmail === email ? (
                        <>
                          <button onClick={() => void saveEdit(email)}>
                            Save
                          </button>
                          <button onClick={cancelEdit}>Cancel</button>
                        </>
                      ) : (
                        <button onClick={() => startEdit(email)}>Edit</button>
                      )
                    ) : (
                      <em>read-only</em>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>{authMessage}</div>
        </div>
      )}
    </div>
  );
}

export default App;
