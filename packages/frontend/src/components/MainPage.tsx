import UsersTable from './UsersTable';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

type User = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
};

type Props = {
  users: User[];
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
  setEmail: (v: string) => void;
  setPhone: (v: string) => void;
  onFormSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  editingEmail: string | null;
  editFirstName: string;
  editLastName: string;
  editPhone: string;
  setEditFirstName: (v: string) => void;
  setEditLastName: (v: string) => void;
  setEditPhone: (v: string) => void;
  startEdit: (email: string) => void;
  cancelEdit: () => void;
  saveEdit: (email: string) => Promise<void>;
  subject: string | null;
};

export default function MainPage({
  users,
  firstName,
  lastName,
  email,
  phone,
  setFirstName,
  setLastName,
  setEmail,
  setPhone,
  onFormSubmit,
  editingEmail,
  editFirstName,
  editLastName,
  editPhone,
  setEditFirstName,
  setEditLastName,
  setEditPhone,
  startEdit,
  cancelEdit,
  saveEdit,
  subject,
}: Props) {
  return (
    <Box>
      <Typography variant="h4">Users</Typography>
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
        <TextField
          label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Button type="submit" variant="contained">
          Submit
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
        subject={subject}
      />
    </Box>
  );
}
