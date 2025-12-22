#!/bin/bash

# Fix AuthContext imports
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { AuthProvider } from \x27./components/AuthContext\x27|import { AuthProvider } from \x27@features/auth\x27|g'
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { AuthProvider } from \x27../../components/AuthContext\x27|import { AuthProvider } from \x27@features/auth\x27|g'
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { useAuth } from \x27../components/AuthContext\x27|import { useAuth } from \x27@features/auth\x27|g'
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { useAuth } from \x27../../components/AuthContext\x27|import { useAuth } from \x27@features/auth\x27|g'

# Fix LoginPage imports
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { LoginPage } from \x27../components/LoginPage\x27|import { LoginPage } from \x27@features/auth\x27|g'

# Fix UserProfileDialog imports
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { UserProfileDialog } from \x27../components/UserProfileDialog\x27|import { UserProfileDialog } from \x27@features/auth\x27|g'

# Fix AuthBar imports
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { AuthBar } from \x27../components/AuthBar\x27|import { AuthBar } from \x27@features/auth\x27|g'

# Fix UserManagement imports
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { UserManagement } from \x27../components/UserManagement\x27|import { UserManagement } from \x27@features/admin\x27|g'

# Fix RoleManagement imports
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { RoleManagement } from \x27../components/RoleManagement\x27|import { RoleManagement } from \x27@features/admin\x27|g'
