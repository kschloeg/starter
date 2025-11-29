type User = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
};

type Props = {
  users: User[];
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

export default function UsersTable({
  users,
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
                    <button onClick={() => void saveEdit(email)}>Save</button>
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
  );
}
