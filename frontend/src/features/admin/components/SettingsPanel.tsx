import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    TextField,
    FormControlLabel,
    Switch,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    IconButton,
    Tooltip,
    Divider,
    Card,
    CardContent,
    CardActions
} from '@mui/material';
import {
    Settings as SettingsIcon,
    Security as SecurityIcon,
    Speed as PerformanceIcon,
    SmartToy as AIIcon,
    Palette as UIIcon,
    Refresh as RefreshIcon,
    Save as SaveIcon,
    RestartAlt as ResetIcon
} from '@mui/icons-material';
import { useQuery, useMutation, gql } from '@apollo/client';

// ===== GraphQL Queries =====

const GET_SETTINGS = gql`
    query AppSettings($category: String) {
        appSettings(category: $category) {
            id
            key
            value
            dataType
            category
            label
            description
            isSecret
            updatedAt
            updatedBy
        }
    }
`;

const UPDATE_SETTING = gql`
    mutation UpdateSetting($input: UpdateSettingInput!) {
        updateSetting(input: $input) {
            id
            key
            value
            updatedAt
        }
    }
`;

const RESET_SETTING = gql`
    mutation ResetSetting($key: String!) {
        resetSetting(key: $key) {
            id
            key
            value
            updatedAt
        }
    }
`;

// ===== Types =====

interface AppSetting {
    id: string;
    key: string;
    value: string;
    dataType: string;
    category: string;
    label: string;
    description?: string;
    isSecret: boolean;
    updatedAt: string;
    updatedBy?: string;
}

interface SettingCardProps {
    setting: AppSetting;
    onSave: (key: string, value: string) => void;
    onReset: (key: string) => void;
    saving: boolean;
}

// ===== Category Config =====

const CATEGORIES = [
    { id: 'security', label: 'Security', icon: <SecurityIcon /> },
    { id: 'ai', label: 'AI Agent', icon: <AIIcon /> },
    { id: 'performance', label: 'Performance', icon: <PerformanceIcon /> },
    { id: 'ui', label: 'UI', icon: <UIIcon /> }
];

// Options for select-type settings
const SELECT_OPTIONS: Record<string, { value: string; label: string }[]> = {
    'ai.provider': [
        { value: 'mock', label: 'Mock (Testing)' },
        { value: 'cisco', label: 'Cisco AI' },
        { value: 'openai', label: 'OpenAI' },
        { value: 'gemini', label: 'Google Gemini' },
        { value: 'anthropic', label: 'Anthropic Claude' }
    ]
};

// ===== Setting Card Component =====

const SettingCard: React.FC<SettingCardProps> = ({ setting, onSave, onReset, saving }) => {
    const [localValue, setLocalValue] = useState(setting.value);
    const [isDirty, setIsDirty] = useState(false);

    const handleChange = (newValue: string) => {
        setLocalValue(newValue);
        setIsDirty(newValue !== setting.value);
    };

    const handleSave = () => {
        onSave(setting.key, localValue);
        setIsDirty(false);
    };

    const handleReset = () => {
        onReset(setting.key);
        setIsDirty(false);
    };

    const renderInput = () => {
        switch (setting.dataType) {
            case 'boolean':
                return (
                    <FormControlLabel
                        control={
                            <Switch
                                checked={localValue === 'true'}
                                onChange={(e) => handleChange(e.target.checked ? 'true' : 'false')}
                                color="primary"
                            />
                        }
                        label={localValue === 'true' ? 'Enabled' : 'Disabled'}
                    />
                );

            case 'number':
                return (
                    <TextField
                        type="number"
                        value={localValue}
                        onChange={(e) => handleChange(e.target.value)}
                        size="small"
                        fullWidth
                        sx={{ maxWidth: 200 }}
                    />
                );

            case 'select':
                const options = SELECT_OPTIONS[setting.key] || [];
                return (
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <Select
                            value={localValue}
                            onChange={(e) => handleChange(e.target.value)}
                        >
                            {options.map(opt => (
                                <MenuItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                );

            default:
                return (
                    <TextField
                        value={setting.isSecret ? '********' : localValue}
                        onChange={(e) => handleChange(e.target.value)}
                        size="small"
                        fullWidth
                        disabled={setting.isSecret}
                        sx={{ maxWidth: 300 }}
                    />
                );
        }
    };

    return (
        <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent sx={{ pb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                    {setting.label}
                </Typography>
                {setting.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {setting.description}
                    </Typography>
                )}
                <Box sx={{ mt: 1 }}>
                    {renderInput()}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Key: <code>{setting.key}</code>
                </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                <Tooltip title="Reset to default">
                    <IconButton size="small" onClick={handleReset} disabled={saving}>
                        <ResetIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Button
                    size="small"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={!isDirty || saving}
                >
                    Save
                </Button>
            </CardActions>
        </Card>
    );
};

// ===== Main Component =====

const SettingsPanel: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState('security');
    const [savingKey, setSavingKey] = useState<string | null>(null);

    const { data, loading, error, refetch } = useQuery<{ appSettings: AppSetting[] }>(GET_SETTINGS, {
        variables: { category: activeCategory },
        fetchPolicy: 'cache-and-network'
    });

    const [updateSetting] = useMutation(UPDATE_SETTING, {
        onCompleted: () => {
            setSavingKey(null);
            refetch();
        },
        onError: () => setSavingKey(null)
    });

    const [resetSetting] = useMutation(RESET_SETTING, {
        onCompleted: () => {
            setSavingKey(null);
            refetch();
        },
        onError: () => setSavingKey(null)
    });

    const handleSave = (key: string, value: string) => {
        setSavingKey(key);
        updateSetting({ variables: { input: { key, value } } });
    };

    const handleReset = (key: string) => {
        setSavingKey(key);
        resetSetting({ variables: { key } });
    };

    const settings = data?.appSettings || [];

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon color="primary" />
                    <Typography variant="h5">Application Settings</Typography>
                </Box>
                <Tooltip title="Refresh">
                    <IconButton onClick={() => refetch()}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={activeCategory}
                    onChange={(_, v) => setActiveCategory(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {CATEGORIES.map(cat => (
                        <Tab
                            key={cat.id}
                            value={cat.id}
                            icon={cat.icon}
                            label={cat.label}
                            iconPosition="start"
                        />
                    ))}
                </Tabs>
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    Failed to load settings: {error.message}
                </Alert>
            )}

            {loading && !data ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : settings.length === 0 ? (
                <Alert severity="info">
                    No settings found for this category.
                </Alert>
            ) : (
                <Box>
                    {settings.map(setting => (
                        <SettingCard
                            key={setting.id}
                            setting={setting}
                            onSave={handleSave}
                            onReset={handleReset}
                            saving={savingKey === setting.key}
                        />
                    ))}
                </Box>
            )}

            <Divider sx={{ my: 3 }} />

            <Alert severity="info" icon={<SecurityIcon />}>
                <Typography variant="body2">
                    <strong>Note:</strong> Settings changes take effect immediately. Some settings (like session timeout)
                    will apply to new sessions only. API keys and sensitive credentials should be configured via environment
                    variables, not through this UI.
                </Typography>
            </Alert>
        </Box>
    );
};

export default SettingsPanel;
