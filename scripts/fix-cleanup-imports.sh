#!/bin/bash

# AI Assistant
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { AIChat } from \x27../components/AIChat\x27|import { AIChat } from \x27@features/ai-assistant\x27|g'
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { AIChat } from \x27@/components/AIChat\x27|import { AIChat } from \x27@features/ai-assistant\x27|g'

# Backups
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { BackupManagementPanel } from \x27../components/BackupManagementPanel\x27|import { BackupManagementPanel } from \x27@features/backups\x27|g'

# Telemetry
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { TelemetryPanel } from \x27../components/TelemetryPanel\x27|import { TelemetryPanel } from \x27@features/telemetry\x27|g'
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { TelemetryDatabasePanel } from \x27../components/TelemetryDatabasePanel\x27|import { TelemetryDatabasePanel } from \x27@features/telemetry\x27|g'
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { EntitySummary } from \x27../components/EntitySummary\x27|import { EntitySummary } from \x27@features/telemetry\x27|g'

# Audit
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { AuditPanel } from \x27../components/AuditPanel\x27|import { AuditPanel } from \x27@features/audit\x27|g'
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { ChangeSetsPanel } from \x27../components/ChangeSetsPanel\x27|import { ChangeSetsPanel } from \x27@features/audit\x27|g'

# Search
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { SearchPanel } from \x27../components/SearchPanel\x27|import { SearchPanel } from \x27@features/search\x27|g'

# Data Management
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { DataManager } from \x27../components/DataManager\x27|import { DataManager } from \x27@features/data-management\x27|g'
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { CsvPanel } from \x27../components/CsvPanel\x27|import { CsvPanel } from \x27@features/data-management\x27|g'
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { SampleDataSeeder } from \x27../components/SampleDataSeeder\x27|import { SampleDataSeeder } from \x27@features/data-management\x27|g'

# Tasks (DependenciesPanel)
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { DependenciesPanel } from \x27../components/DependenciesPanel\x27|import { DependenciesPanel } from \x27@features/tasks\x27|g'

# Providers
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { ApolloClientProvider } from \x27./components/ApolloClientProvider\x27|import { ApolloClientProvider } from \x27@/providers/ApolloClientProvider\x27|g'

# Shared Components
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { HelpDialog } from \x27@/components/HelpDialog\x27|import { HelpDialog } from \x27@shared/components/HelpDialog\x27|g'
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { HelpDialog } from \x27../components/HelpDialog\x27|import { HelpDialog } from \x27@shared/components/HelpDialog\x27|g'
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { AboutPage } from \x27../components/AboutPage\x27|import { AboutPage } from \x27@/pages/AboutPage\x27|g'

# Dev Tools
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { APITestingPanel } from \x27../components/dev/APITestingPanel\x27|import { APITestingPanel } from \x27@features/dev-tools\x27|g'

# Fix internal imports in moved files (common patterns)
# ../components/FAIcon -> @shared/components/FAIcon
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { .* } from \x27../components/FAIcon\x27|import { & } from \x27@shared/components/FAIcon\x27|g' # This regex might need care
# Use explicit replacement for FAIcon
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|from \x27../components/FAIcon\x27|from \x27@shared/components/FAIcon\x27|g'
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|from \x27../../components/FAIcon\x27|from \x27@shared/components/FAIcon\x27|g'
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|from \x27@/components/common/FAIcon\x27|from \x27@shared/components/FAIcon\x27|g'

# Fix imports for shared types
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|from \x27../types/shared\x27|from \x27@shared/types\x27|g'
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|from \x27../../types/shared\x27|from \x27@shared/types\x27|g'
