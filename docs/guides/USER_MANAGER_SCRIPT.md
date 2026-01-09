
# User Management Script

This project includes a utility script to manage user credentials and data independently from the main application seed process. This is useful for resetting passwords, restoring default users, or cleaning up user data without affecting other system data.

## Location
`backend/scripts/user-manager.ts`

## Usage

Run the script using `npm run` from the `backend` directory:

```bash
npm run manage:users -- <command> [username]
```

### Available Commands

| Command | Description | Example |
|---------|-------------|---------|
| `seed` | Creates default `admin` and `user` accounts if they do not exist. Does not modify existing users. | `npm run manage:users -- seed` |
| `reset-all` | **DESTRUCTIVE:** Deletes ALL users, sessions, and related user data. Then recreates the default `admin` and `user` accounts. | `npm run manage:users -- reset-all` |
| `reset-user` | Resets the password for a specific user to the default value. <br> - For admins: `DAP123!!!`<br> - For regular users: `user` | `npm run manage:users -- reset-user admin` |
| `reset-admin` | Shortcut to reset the `admin` user's password to `DAP123!!!`. | `npm run manage:users -- reset-admin` |

## Default Credentials

The script uses the following default credentials:

- **Admin User**:
  - Username: `admin`
  - Password: `DAP123!!!`
  - Email: `admin@dynamicadoptionplans.com`

- **Standard User**:
  - Username: `user`
  - Password: `user`
  - Email: `user@example.com`

## Troubleshooting

If you encounter foreign key constraint errors during `reset-all`, ensure that there are no orphaned records in other tables that strictly require a user ID. The script attempts to clean up `Permission`, `UserRole`, `Session`, and `AuditLog` entries before deleting users.
