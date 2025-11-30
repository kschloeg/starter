import React, { useEffect } from 'react';
import UsersTable from './UsersTable';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Layout from './Layout';
import useAuth from '../hooks/useAuth';

type User = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
};

type Props = {
  showSnackbar?: (
    message: string,
    severity?: 'success' | 'error' | 'info' | 'warning'
  ) => void;
};

export default function MainPage({ showSnackbar }: Props) {
  const [users, setUsers] = React.useState<User[]>([]);
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [savingEmail, setSavingEmail] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [editingEmail, setEditingEmail] = React.useState<string | null>(null);
  const [editFirstName, setEditFirstName] = React.useState('');
  const [editLastName, setEditLastName] = React.useState('');
  const [editPhone, setEditPhone] = React.useState('');
  const { subject } = useAuth();

  console.log('Rendering MainPage with users:', { users, loading, subject });
  const syncUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
        credentials: 'include',
      });
      const body = await res.json();
      setUsers(body || []);
    } catch (e) {
      showSnackbar?.('Failed to load users', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    void syncUsers();
  }, []);

  const onFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const sanitizedFirstName = firstName;
    const sanitizedLastName = lastName;
    const sanitizedEmail = email;
    setSubmitting(true);
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/users`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: sanitizedFirstName,
          lastName: sanitizedLastName,
          email: sanitizedEmail,
        }),
      });
      setFirstName('');
      setLastName('');
      setEmail('');
      await syncUsers();
      showSnackbar?.('Created', 'success');
    } catch (e) {
      showSnackbar?.('Create failed', 'error');
    }
    setSubmitting(false);
  };

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

  const saveEdit = async (emailArg: string) => {
    try {
      setSavingEmail(emailArg);
      const body: any = { email: emailArg };
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
        showSnackbar?.('Update failed', 'error');
        setSavingEmail(null);
        return;
      }
      setEditingEmail(null);
      setSavingEmail(null);
      await syncUsers();
      showSnackbar?.('Updated', 'success');
    } catch (e) {
      setSavingEmail(null);
      showSnackbar?.('Network error', 'error');
    }
  };

  return (
    <Layout>
      <Box>
        <Typography variant="h4">Users</Typography>
        {loading || !subject ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : null}
        <Box
          component="form"
          onSubmit={onFormSubmit}
          sx={{ display: 'flex', gap: 1, mt: 2 }}
        >
          <TextField
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <TextField
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </Box>

        <UsersTable
          users={users}
          editingEmail={editingEmail}
          editFirstName={editFirstName}
          editLastName={editLastName}
          editPhone={editPhone}
          setEditFirstName={setEditFirstName}
          setEditLastName={setEditLastName}
          setEditPhone={setEditPhone}
          startEdit={startEdit}
          cancelEdit={cancelEdit}
          saveEdit={saveEdit}
          savingEmail={savingEmail}
          subject={null}
        />
      </Box>
    </Layout>
  );
}
