/**
 * Font Awesome Icon Components
 * 
 * Pre-wrapped icon components using Font Awesome icons that can be used
 * as drop-in replacements for MUI icons.
 */

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { SxProps, Theme, useTheme, Box } from '@mui/material';
import { IconDefinition, SizeProp } from '@fortawesome/fontawesome-svg-core';

// Regular icons (outlined style)
import {
    faCircleCheck as farCircleCheck,
    faCircleXmark as farCircleXmark,
    faClock as farClock,
    faComment as farComment,
    faComments as farComments,
    faCopy as farCopy,
    faEye as farEye,
    faEyeSlash as farEyeSlash,
    faFile as farFile,
    faFileLines as farFileLines,
    faFolderOpen as farFolderOpen,
    faHourglass as farHourglass,
    faMessage as farMessage,
    faPenToSquare as farPenToSquare,
    faSquare as farSquare,
    faSquareCheck as farSquareCheck,
    faStar as farStar,
    faTrashCan as farTrashCan,
    faUser as farUser,
    faCircleQuestion as farCircleQuestion,
    faBell as farBell,
    faBookmark as farBookmark,
    faCalendar as farCalendar,
    faChartBar as farChartBar,
    faFloppyDisk as farFloppyDisk,
    faHeart as farHeart,
    faPaperPlane as farPaperPlane,
    faThumbsUp as farThumbsUp,
    faThumbsDown as farThumbsDown,
    faCircleDot as farCircleDot,
    faCircle as farCircle,
    faImage as farImage,
    faLightbulb as farLightbulb,
    faObjectGroup as farObjectGroup,
    faRectangleList as farRectangleList,
    faWindowMaximize as farWindowMaximize,
    faKeyboard as farKeyboard,
    faMap as farMap,
    faCompass as farCompass,
    faNewspaper as farNewspaper,
    faNoteSticky as farNoteSticky,
    faAddressCard as farAddressCard,
    faIdBadge as farIdBadge,
    faClipboard as farClipboard,
    faHandshake as farHandshake,
    faGem as farGem,
    faBuilding as farBuilding,
    faCircleUser as farCircleUser,
    faFolder as farFolder,
} from '@fortawesome/free-regular-svg-icons';

// Solid icons (for icons not available in regular or need filled style)
import {
    faAngleDown,
    faAngleRight,
    faAngleUp,
    faArrowDown,
    faArrowLeft,
    faArrowRight,
    faArrowRightFromBracket,
    faArrowUp,
    faArrowsRotate,
    faBan,
    faBars,
    faBolt,
    faBook,
    faBoxOpen,
    faBuilding,
    faChartLine,
    faChartPie,
    faCheck,
    faCheckDouble,
    faChevronDown,
    faChevronLeft,
    faChevronRight,
    faChevronUp,
    faCircleExclamation,
    faCircleInfo,
    faCircleNotch,
    faCirclePlus,
    faCloudArrowDown,
    faCloudArrowUp,
    faCode,
    faCog,
    faCogs,
    faCubes,
    faDatabase,
    faDownload,
    faEllipsisVertical,
    faEllipsis,
    faTriangleExclamation,
    faExpand,
    faFileExport,
    faFileImport,
    faFilter,
    faVideo,
    faGauge,
    faGear,
    faGears,
    faGlobe,
    faGripVertical,
    faHammer,
    faHouse,
    faCircleInfo as fasCircleInfo,
    faKey,
    faLayerGroup,
    faLink,
    faList,
    faListCheck,
    faLock,
    faMagnifyingGlass,
    faMinus,
    faPalette,
    faPause,
    faPlay,
    faPlus,
    faPuzzlePiece,
    faQuestion,
    faRotate,
    faRocket,
    faServer,
    faShield,
    faShieldHalved,
    faArrowRightFromBracket as fasLogout,
    faSliders,
    faSort,
    faSortDown,
    faSortUp,
    faSpinner,
    faSync,
    faTable,
    faTag,
    faTags,
    faTerminal,
    faToggleOff,
    faToggleOn,
    faScrewdriverWrench,
    faTrash,
    faRotateLeft,
    faUpload,
    faUser as fasUser,
    faUserGear,
    faUserPlus,
    faUsers,
    faUserShield,
    faWandMagicSparkles,
    faXmark,
    faSitemap,
    faNetworkWired,
    faCodeBranch,
    faClipboardCheck,
    faClipboardList,
    faFolderTree,
    faFileCode,
    faFlask,
    faVial,
    faCircleCheck as fasCircleCheck,
    faCircleXmark as fasCircleXmark,
    faPaperPlane as fasPaperPlane,
    faArrowUpRightFromSquare,
    faShareNodes,
    faCopy as fasCopy,
    faCaretDown,
    faCaretUp,
    faCaretLeft,
    faCaretRight,
    faLightbulb as fasLightbulb,
    faAward,
    faCertificate,
    faClockRotateLeft,
    faBarsProgress,
    faDiagramProject,
    faBoxArchive,
    faInbox,
    faFolderPlus,
    faFileCirclePlus,
    faBug,
    faWrench,
    faFlag,
    faIdCard,
    // Additional icons
    faChevronUp as fasChevronUp,
    faRobot,
    faBrain,
    faMemory,
    faCircleStop,
    faVideoCamera,
    faScaleBalanced,
    faTextHeight,
    faCirclePlay,
    faBan as fasBlock,
    faHourglass as fasHourglass,
    faTimeline,
    faCodeFork,
    faTrashCan as fasTrashCan,
    faFont,
    faUserCircle,
    faCircleUser,
    faUnlockKeyhole,
    faPaintBrush,
    faWandSparkles,
    faLockOpen,
    faBox,
    faMobileScreen,
} from '@fortawesome/free-solid-svg-icons';

// Brand icons
import { faGithub } from '@fortawesome/free-brands-svg-icons';

// Type for icon size
export type IconSize = 'inherit' | 'small' | 'medium' | 'large';

interface IconProps {
    fontSize?: IconSize | number;
    color?: 'inherit' | 'action' | 'disabled' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | string;
    sx?: SxProps<Theme>;
    className?: string;
    style?: React.CSSProperties;
}

// Size mapping to match MUI icon sizes
const sizeMap: Record<string, string> = {
    inherit: 'inherit',
    small: '1.25rem',
    medium: '1.5rem',
    large: '2.1875rem',
};

// Create icon component factory
function createIcon(icon: IconDefinition, displayName: string) {
    const IconComponent = React.forwardRef<HTMLSpanElement, IconProps & React.HTMLAttributes<HTMLSpanElement>>(
        ({ fontSize = 'medium', color = 'inherit', sx, className, style, ...rest }, ref) => {
            const theme = useTheme();

            const size = typeof fontSize === 'number'
                ? `${fontSize}px`
                : sizeMap[fontSize] || sizeMap.medium;

            // Get color value from theme or use directly
            let colorValue = 'inherit';
            if (color === 'primary') colorValue = theme.palette.primary.main;
            else if (color === 'secondary') colorValue = theme.palette.secondary.main;
            else if (color === 'error') colorValue = theme.palette.error.main;
            else if (color === 'warning') colorValue = theme.palette.warning.main;
            else if (color === 'info') colorValue = theme.palette.info.main;
            else if (color === 'success') colorValue = theme.palette.success.main;
            else if (color === 'disabled') colorValue = theme.palette.action.disabled;
            else if (color === 'action') colorValue = theme.palette.action.active;
            else if (color !== 'inherit') colorValue = color;

            return (
                <Box
                    ref={ref}
                    component="span"
                    className={className}
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: size,
                        color: colorValue,
                        lineHeight: 1,
                        ...sx,
                    }}
                    style={style}
                    {...rest}
                >
                    <FontAwesomeIcon icon={icon} style={{ fontSize: 'inherit' }} />
                </Box>
            );
        }
    );
    IconComponent.displayName = displayName;
    return IconComponent;
}

// ==========================================
// Action Icons
// ==========================================
export const Add = createIcon(faPlus, 'Add');
export const Delete = createIcon(farTrashCan, 'Delete');
export const Edit = createIcon(farPenToSquare, 'Edit');
export const Save = createIcon(farFloppyDisk, 'Save');
export const Cancel = createIcon(faXmark, 'Cancel');
export const Close = createIcon(faXmark, 'Close');
export const Refresh = createIcon(faArrowsRotate, 'Refresh');
export const Sync = createIcon(faSync, 'Sync');
export const Undo = createIcon(faRotateLeft, 'Undo');
export const Clear = createIcon(faXmark, 'Clear');

// ==========================================
// Navigation Icons
// ==========================================
export const Home = createIcon(faHouse, 'Home');
export const Menu = createIcon(faBars, 'Menu');
export const ArrowBack = createIcon(faArrowLeft, 'ArrowBack');
export const ArrowForward = createIcon(faArrowRight, 'ArrowForward');
export const ExpandMore = createIcon(faChevronDown, 'ExpandMore');
export const ExpandLess = createIcon(faChevronUp, 'ExpandLess');
export const ChevronLeft = createIcon(faChevronLeft, 'ChevronLeft');
export const ChevronRight = createIcon(faChevronRight, 'ChevronRight');
export const ArrowUpward = createIcon(faArrowUp, 'ArrowUpward');
export const ArrowDownward = createIcon(faArrowDown, 'ArrowDownward');
export const MoreVert = createIcon(faEllipsisVertical, 'MoreVert');
export const MoreHoriz = createIcon(faEllipsis, 'MoreHoriz');

// ==========================================
// Status Icons
// ==========================================
export const Check = createIcon(faCheck, 'Check');
export const CheckCircle = createIcon(farCircleCheck, 'CheckCircle');
export const CheckCircleOutline = createIcon(farCircleCheck, 'CheckCircleOutline');
export const Error = createIcon(faCircleExclamation, 'Error');
export const Warning = createIcon(faTriangleExclamation, 'Warning');
export const Info = createIcon(faCircleInfo, 'Info');
export const Help = createIcon(farCircleQuestion, 'Help');
export const HelpOutline = createIcon(farCircleQuestion, 'HelpOutline');

// ==========================================
// Entity/Business Icons
// ==========================================
export const Inventory2 = createIcon(faCubes, 'Inventory2');
export const Lightbulb = createIcon(farLightbulb, 'Lightbulb');
export const LightbulbOutlined = createIcon(farLightbulb, 'LightbulbOutlined');
export const People = createIcon(faUsers, 'People');
export const Person = createIcon(farUser, 'Person');
export const PersonOutline = createIcon(farUser, 'PersonOutline');
export const Business = createIcon(faBuilding, 'Business');
export const Task = createIcon(farRectangleList, 'Task');
export const Assignment = createIcon(faClipboardList, 'Assignment');
export const Extension = createIcon(farObjectGroup, 'Extension');
export const ExtensionSolid = createIcon(faPuzzlePiece, 'ExtensionSolid');
export const Category = createIcon(faSitemap, 'Category');
export const Book = createIcon(faBook, 'Book');
export const PlaylistAddCheck = createIcon(faListCheck, 'PlaylistAddCheck');

// ==========================================
// Data & Content Icons
// ==========================================
export const Description = createIcon(farFileLines, 'Description');
export const Article = createIcon(farFileLines, 'Article');
export const InsertDriveFile = createIcon(farFile, 'InsertDriveFile');
export const Folder = createIcon(farFolderOpen, 'Folder');
export const FolderOpen = createIcon(farFolderOpen, 'FolderOpen');
export const Storage = createIcon(faDatabase, 'Storage');
export const TableChart = createIcon(faTable, 'TableChart');
export const List = createIcon(faList, 'List');
export const ViewList = createIcon(faList, 'ViewList');
export const Layers = createIcon(faLayerGroup, 'Layers');
export const DataObject = createIcon(faCode, 'DataObject');

// ==========================================
// Feature Icons
// ==========================================
export const Label = createIcon(faTag, 'Label');
export const LocalOffer = createIcon(faTag, 'LocalOffer');
export const FilterList = createIcon(faFilter, 'FilterList');
export const Search = createIcon(faMagnifyingGlass, 'Search');
export const Sort = createIcon(faSort, 'Sort');
export const Settings = createIcon(faGear, 'Settings');
export const SettingsApplications = createIcon(faCogs, 'SettingsApplications');
export const Lock = createIcon(faLock, 'Lock');
export const LockOpen = createIcon(faLockOpen, 'LockOpen');
export const VpnKey = createIcon(faKey, 'VpnKey');
export const Security = createIcon(faShieldHalved, 'Security');
export const Shield = createIcon(faShield, 'Shield');
export const VerifiedUser = createIcon(faUserShield, 'VerifiedUser');

// ==========================================
// Import/Export Icons
// ==========================================
export const FileDownload = createIcon(faDownload, 'FileDownload');
export const FileUpload = createIcon(faUpload, 'FileUpload');
export const Download = createIcon(faDownload, 'Download');
export const Upload = createIcon(faUpload, 'Upload');
export const ImportExport = createIcon(faArrowsRotate, 'ImportExport');
export const CloudDownload = createIcon(faCloudArrowDown, 'CloudDownload');
export const CloudUpload = createIcon(faCloudArrowUp, 'CloudUpload');
export const GetApp = createIcon(faDownload, 'GetApp');
export const Publish = createIcon(faUpload, 'Publish');

// ==========================================
// Communication Icons
// ==========================================
export const Send = createIcon(fasPaperPlane, 'Send');
export const Message = createIcon(farMessage, 'Message');
export const Comment = createIcon(farComment, 'Comment');
export const Chat = createIcon(farComments, 'Chat');
export const Notifications = createIcon(farBell, 'Notifications');
export const NotificationsNone = createIcon(farBell, 'NotificationsNone');

// ==========================================
// UI/Interaction Icons
// ==========================================
export const DragIndicator = createIcon(faGripVertical, 'DragIndicator');
export const DragHandle = createIcon(faGripVertical, 'DragHandle');
export const Visibility = createIcon(farEye, 'Visibility');
export const VisibilityOff = createIcon(farEyeSlash, 'VisibilityOff');
export const ContentCopy = createIcon(farCopy, 'ContentCopy');
export const FileCopy = createIcon(farCopy, 'FileCopy');
export const Link = createIcon(faLink, 'Link');
export const OpenInNew = createIcon(faArrowUpRightFromSquare, 'OpenInNew');
export const Share = createIcon(faShareNodes, 'Share');
export const RemoveCircleOutline = createIcon(faMinus, 'RemoveCircleOutline');
export const AddCircleOutline = createIcon(faCirclePlus, 'AddCircleOutline');

// ==========================================
// Progress/Status Icons
// ==========================================
export const HourglassEmpty = createIcon(farHourglass, 'HourglassEmpty');
export const AccessTime = createIcon(farClock, 'AccessTime');
export const Schedule = createIcon(farClock, 'Schedule');
export const History = createIcon(faClockRotateLeft, 'History');
export const Autorenew = createIcon(faSync, 'Autorenew');

// ==========================================
// Development Icons
// ==========================================
export const Code = createIcon(faCode, 'Code');
export const Terminal = createIcon(faTerminal, 'Terminal');
export const BugReport = createIcon(faBug, 'BugReport');
export const Build = createIcon(faHammer, 'Build');
export const Handyman = createIcon(faScrewdriverWrench, 'Handyman');
export const Api = createIcon(faCode, 'Api');
export const DeveloperMode = createIcon(faCode, 'DeveloperMode');
export const GitHub = createIcon(faGithub, 'GitHub');
export const Science = createIcon(faFlask, 'Science');
export const PlaylistPlay = createIcon(faPlay, 'PlaylistPlay');

// ==========================================
// Business/Analytics Icons
// ==========================================
export const Dashboard = createIcon(faChartPie, 'Dashboard');
export const Assessment = createIcon(farChartBar, 'Assessment');
export const BarChart = createIcon(farChartBar, 'BarChart');
export const TrendingUp = createIcon(faChartLine, 'TrendingUp');
export const Speed = createIcon(faGauge, 'Speed');
export const Rocket = createIcon(faRocket, 'Rocket');
export const NewReleases = createIcon(faRocket, 'NewReleases');
export const EmojiEvents = createIcon(faAward, 'EmojiEvents');
export const WorkspacePremium = createIcon(faCertificate, 'WorkspacePremium');
export const BoxIcon = createIcon(faBox, 'BoxIcon');

// ==========================================
// Theme/Style Icons
// ==========================================
export const Palette = createIcon(faPalette, 'Palette');
export const Brightness4 = createIcon(fasLightbulb, 'Brightness4');
export const Brightness7 = createIcon(fasLightbulb, 'Brightness7');
export const Star = createIcon(farStar, 'Star');
export const StarBorder = createIcon(farStar, 'StarBorder');
export const Favorite = createIcon(farHeart, 'Favorite');
export const FavoriteBorder = createIcon(farHeart, 'FavoriteBorder');
export const Bookmark = createIcon(farBookmark, 'Bookmark');
export const BookmarkBorder = createIcon(farBookmark, 'BookmarkBorder');
export const ThumbUp = createIcon(farThumbsUp, 'ThumbUp');
export const ThumbDown = createIcon(farThumbsDown, 'ThumbDown');

// ==========================================
// Admin/Auth Icons
// ==========================================
export const Backup = createIcon(faBoxArchive, 'Backup');
export const Restore = createIcon(faRotate, 'Restore');
export const AdminPanelSettings = createIcon(faUserShield, 'AdminPanelSettings');
export const ManageAccounts = createIcon(faUserGear, 'ManageAccounts');
export const PersonAdd = createIcon(faUserPlus, 'PersonAdd');
export const Group = createIcon(faUsers, 'Group');
export const Logout = createIcon(fasLogout, 'Logout');
export const Login = createIcon(faArrowRightFromBracket, 'Login');

// ==========================================
// Misc Icons
// ==========================================
export const PlayArrow = createIcon(faPlay, 'PlayArrow');
export const Pause = createIcon(faPause, 'Pause');
export const Stop = createIcon(faBan, 'Stop');
export const Flag = createIcon(faFlag, 'Flag');
export const Badge = createIcon(faIdCard, 'Badge');
export const Remove = createIcon(faMinus, 'Remove');
export const Event = createIcon(farCalendar, 'Event');
export const CalendarToday = createIcon(farCalendar, 'CalendarToday');
export const Language = createIcon(faGlobe, 'Language');
export const Public = createIcon(faGlobe, 'Public');
export const AccountTree = createIcon(faDiagramProject, 'AccountTree');
export const Archive = createIcon(faBoxArchive, 'Archive');
export const Inbox = createIcon(faInbox, 'Inbox');

// Toggle Icons
export const ToggleOn = createIcon(faToggleOn, 'ToggleOn');
export const ToggleOff = createIcon(faToggleOff, 'ToggleOff');

// Checkbox/Radio Icons
export const CheckBox = createIcon(farSquareCheck, 'CheckBox');
export const CheckBoxOutlineBlank = createIcon(farSquare, 'CheckBoxOutlineBlank');
export const RadioButtonChecked = createIcon(farCircleDot, 'RadioButtonChecked');
export const RadioButtonUnchecked = createIcon(farCircle, 'RadioButtonUnchecked');

// ==========================================
// Additional Missing Icons
// ==========================================
export const KeyboardArrowUp = createIcon(faChevronUp, 'KeyboardArrowUp');
export const KeyboardArrowDown = createIcon(faChevronDown, 'KeyboardArrowDown');
export const TextFields = createIcon(faFont, 'TextFields');
export const AutoAwesome = createIcon(faWandSparkles, 'AutoAwesome');
export const SmartToy = createIcon(faRobot, 'SmartToy');
export const Psychology = createIcon(faBrain, 'Psychology');
export const Cached = createIcon(faSync, 'Cached');
export const DeleteOutline = createIcon(farTrashCan, 'DeleteOutline');
export const AccountCircle = createIcon(faCircleUser, 'AccountCircle');
export const TrendingDown = createIcon(faChartLine, 'TrendingDown'); // Uses same icon, styled differently
export const NotInterested = createIcon(faBan, 'NotInterested');
export const OndemandVideo = createIcon(faVideo, 'OndemandVideo');
export const AssignmentTurnedIn = createIcon(faClipboardCheck, 'AssignmentTurnedIn');
export const Memory = createIcon(faMemory, 'Memory');
export const Commit = createIcon(faCodeBranch, 'Commit');
export const Web = createIcon(faGlobe, 'Web');
export const DeleteForever = createIcon(fasTrashCan, 'DeleteForever');
export const Pending = createIcon(fasHourglass, 'Pending');
export const Timeline = createIcon(faTimeline, 'Timeline');
export const CreateNewFolder = createIcon(faFolderPlus, 'CreateNewFolder');
export const CallSplit = createIcon(faCodeFork, 'CallSplit');
export const NotStarted = createIcon(faCirclePlay, 'NotStarted');
export const Block = createIcon(faBan, 'Block');
export const Inventory = createIcon(farFolder, 'Inventory');
export const InventorySolid = createIcon(faCubes, 'InventorySolid');
export const Scale = createIcon(faScaleBalanced, 'Scale');
export const ErrorOutline = createIcon(faCircleExclamation, 'ErrorOutline');
export const ColorLens = createIcon(faPaintBrush, 'ColorLens');
export const LockReset = createIcon(faUnlockKeyhole, 'LockReset');
export const Update = createIcon(faSync, 'Update');

// ==========================================
export const Mobile = createIcon(faMobileScreen, 'Mobile');

// ==========================================
// Outlined Icons (Regular style - flat/simple)
// ==========================================
export const RectangleList = createIcon(farRectangleList, 'RectangleList');
export const WindowMaximize = createIcon(farWindowMaximize, 'WindowMaximize');
export const Compass = createIcon(farCompass, 'Compass');
export const Newspaper = createIcon(farNewspaper, 'Newspaper');
export const NoteSticky = createIcon(farNoteSticky, 'NoteSticky');
export const AddressCard = createIcon(farAddressCard, 'AddressCard');
export const IdBadge = createIcon(farIdBadge, 'IdBadge');
export const ClipboardOutlined = createIcon(farClipboard, 'ClipboardOutlined');
export const Handshake = createIcon(farHandshake, 'Handshake');
export const Gem = createIcon(farGem, 'Gem');
export const BuildingOutlined = createIcon(farBuilding, 'BuildingOutlined');
export const CircleUserOutlined = createIcon(farCircleUser, 'CircleUserOutlined');
export const FileOutlined = createIcon(farFile, 'FileOutlined');
export const CommentOutlined = createIcon(farComment, 'CommentOutlined');
export const BellOutlined = createIcon(farBell, 'BellOutlined');
export const ClockOutlined = createIcon(farClock, 'ClockOutlined');
export const StarOutlined = createIcon(farStar, 'StarOutlined');
export const UserOutlined = createIcon(farUser, 'UserOutlined');
export const ObjectGroupOutlined = createIcon(farObjectGroup, 'ObjectGroupOutlined');
export const ImageOutlined = createIcon(farImage, 'ImageOutlined');

// ==========================================
// Custom SVG Icons
// ==========================================

/**
 * AI Sparkle Icon - A modern icon with sparkles inside a chat bubble
 * Designed for AI Assistant buttons and features
 */
interface AISparkleIconProps {
    sx?: SxProps<Theme>;
    fontSize?: 'inherit' | 'small' | 'medium' | 'large' | number;
    className?: string;
}

export const AISparkle = React.forwardRef<SVGSVGElement, AISparkleIconProps>(
    ({ sx, fontSize = 'medium', className }, ref) => {
        const theme = useTheme();

        // Determine the size based on fontSize prop
        const getSize = () => {
            if (typeof fontSize === 'number') return fontSize;
            switch (fontSize) {
                case 'small': return 20;
                case 'large': return 35;
                case 'inherit': return 'inherit';
                case 'medium':
                default: return 24;
            }
        };

        const size = getSize();

        return (
            <Box
                ref={ref as any}
                component="span"
                className={className}
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: size === 'inherit' ? '1em' : size,
                    height: size === 'inherit' ? '1em' : size,
                    ...sx,
                }}
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="100%"
                    height="100%"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Chat bubble outline */}
                    <path
                        d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z"
                        fillOpacity="0.9"
                    />
                    {/* Large 4-point sparkle/star - center */}
                    <path
                        d="M12 6L13.09 9.26L16 10L13.09 10.74L12 14L10.91 10.74L8 10L10.91 9.26L12 6Z"
                    />
                    {/* Small 4-point sparkle - top right */}
                    <path
                        d="M17 5L17.5 6.5L19 7L17.5 7.5L17 9L16.5 7.5L15 7L16.5 6.5L17 5Z"
                        fillOpacity="0.7"
                    />
                    {/* Small 4-point sparkle - bottom left */}
                    <path
                        d="M7 11L7.5 12.5L9 13L7.5 13.5L7 15L6.5 13.5L5 13L6.5 12.5L7 11Z"
                        fillOpacity="0.7"
                    />
                </svg>
            </Box>
        );
    }
);
AISparkle.displayName = 'AISparkle';

// Export all as namespace for easy access
export const Icons = {
    Add,
    Delete,
    Edit,
    Save,
    Cancel,
    Close,
    Refresh,
    Sync,
    Undo,
    Home,
    Menu,
    ExpandMore,
    ExpandLess,
    ChevronLeft,
    ChevronRight,
    Check,
    CheckCircle,
    Error,
    Warning,
    Info,
    Help,
    Inventory2,
    Lightbulb,
    People,
    Person,
    Business,
    Task,
    Description,
    Folder,
    Storage,
    FilterList,
    Search,
    Settings,
    Lock,
    Security,
    FileDownload,
    FileUpload,
    Send,
    DragIndicator,
    Visibility,
    VisibilityOff,
    Code,
    Terminal,
    BugReport,
    Build,
    Dashboard,
    Assessment,
    Speed,
    Rocket,
    BoxIcon,
    Palette,
    Star,
    Backup,
    AdminPanelSettings,
    Logout,
    AISparkle,
    Book,
    PlaylistAddCheck,
};

export default Icons;
