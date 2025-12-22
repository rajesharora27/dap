#!/bin/bash

# Fix TelemetryConfiguration export
sed -i '' 's|const TelemetryConfiguration:|export const TelemetryConfiguration:|g' frontend/src/features/telemetry/components/TelemetryConfiguration.tsx
sed -i '' 's|export default TelemetryConfiguration;||g' frontend/src/features/telemetry/components/TelemetryConfiguration.tsx

# Fix Dev Tools config imports
find frontend/src/features/dev-tools/components -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { getDevApiBaseUrl } from \x27../../config/frontend.config\x27|import { getDevApiBaseUrl } from \x27@/config/frontend.config\x27|g'

# Fix AIChat useAIAssistant import
# Since we moved useAIAssistant.ts to features/ai-assistant/hooks/, the relative import in AIChat.tsx (features/ai-assistant/components/AIChat.tsx) should be '../hooks/useAIAssistant' which is correct relative to the component file.
# But previously it was importing '../hooks/useAIAssistant' from 'src/components/AIChat.tsx' which meant 'src/hooks/useAIAssistant'.
# Now 'src/features/ai-assistant/components/AIChat.tsx' importing '../hooks/useAIAssistant' means 'src/features/ai-assistant/hooks/useAIAssistant'.
# So if I moved the hook, the import path is actually coincidingly correct!
# But let's verify if the file content of AIChat.tsx actually has that import.
