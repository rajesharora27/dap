-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  must_change_password BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles table (predefined: ADMIN, SME, CS)
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT OR IGNORE INTO roles (id, name, description) VALUES
  ('admin_role', 'ADMIN', 'Full system access'),
  ('sme_role', 'SME', 'Subject Matter Expert - Product/Solution access'),
  ('cs_role', 'CS', 'Customer Success - Customer access');

-- User-Role junction table
CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE(user_id, role_id)
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK(resource_type IN ('product', 'solution', 'customer', 'system')),
  resource_id TEXT,  -- NULL for system-wide permissions
  permission_level TEXT NOT NULL CHECK(permission_level IN ('view', 'edit', 'manage')),
  granted_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id),
  UNIQUE(user_id, resource_type, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_permissions_user ON permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details TEXT,
  ip_address TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);

-- Create default admin user (password: Admin@123)
-- Password hash for Admin@123: $2b$10$K3mhJ5xYqP8JzQYMzCvYZOxGxYxJ9QzJzQYMzCvYZOxGxYxJ9QzJz
INSERT OR IGNORE INTO users (id, username, email, password_hash, full_name, is_admin, is_active, must_change_password)
VALUES (
  'admin_user_default',
  'admin',
  'admin@dynamicadoptionplans.com',
  '$2b$10$K3mhJ5xYqP8JzQYMzCvYZOxGxYxJ9QzJzQYMzCvYZOxGxYxJ9QzJz',
  'System Administrator',
  TRUE,
  TRUE,
  FALSE
);

-- Assign admin role to default admin user
INSERT OR IGNORE INTO user_roles (user_id, role_id)
VALUES ('admin_user_default', 'admin_role');

-- Grant system-wide admin permission
INSERT OR IGNORE INTO permissions (user_id, resource_type, permission_level, granted_by)
VALUES ('admin_user_default', 'system', 'manage', 'admin_user_default');

