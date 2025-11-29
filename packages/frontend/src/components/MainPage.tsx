import React from 'react';
import UsersTable from './UsersTable';

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
    </div>
  );
}
