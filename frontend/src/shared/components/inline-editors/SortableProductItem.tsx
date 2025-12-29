import {
    ListItem,
    ListItemText,
    IconButton,
    Box,
    Typography,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    DragIndicator,
} from '@shared/components/FAIcon';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface ProductData {
    id: string;
    name: string;
}

interface SortableProductItemProps {
    product: ProductData;
    index: number;
    onRemove: () => void;
}

export function SortableProductItem({
    product,
    index,
    onRemove,
}: SortableProductItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: product.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <ListItem
            ref={setNodeRef}
            style={style}
            sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                mb: 1,
                bgcolor: isDragging ? 'rgba(25, 118, 210, 0.08)' : 'background.paper',
                '&:hover': {
                    backgroundColor: '#f5f5f5',
                },
            }}
            secondaryAction={
                <IconButton edge="end" onClick={onRemove} color="error" size="small">
                    <DeleteIcon fontSize="small" />
                </IconButton>
            }
        >
            <Box
                {...attributes}
                {...listeners}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    pr: 1.5,
                    cursor: 'grab',
                    color: 'text.secondary',
                    opacity: 0.7,
                    touchAction: 'none',
                    '&:hover': { opacity: 1, color: 'text.primary' },
                }}
            >
                <DragIndicator fontSize="small" />
            </Box>

            <ListItemText
                primary={
                    <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                        {index + 1}. {product.name}
                    </Typography>
                }
            />
        </ListItem>
    );
}
