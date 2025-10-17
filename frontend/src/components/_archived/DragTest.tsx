import React, { useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';

const DragTest = () => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [items, setItems] = useState(['Item 1', 'Item 2', 'Item 3']);

  const handleDragStart = (e: React.DragEvent, item: string) => {
    console.log('🟢 Drag started:', item);
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    console.log('🟡 Drag over');
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetItem: string) => {
    console.log('🔴 Drop:', { from: draggedItem, to: targetItem });
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetItem) return;
    
    const newItems = [...items];
    const draggedIndex = newItems.indexOf(draggedItem);
    const targetIndex = newItems.indexOf(targetItem);
    
    newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);
    
    setItems(newItems);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    console.log('⚪ Drag ended');
    setDraggedItem(null);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Drag Test Component
      </Typography>
      {items.map((item, index) => (
        <Paper
          key={item}
          draggable
          onDragStart={(e) => handleDragStart(e, item)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, item)}
          onDragEnd={handleDragEnd}
          sx={{
            p: 2,
            mb: 1,
            cursor: 'grab',
            opacity: draggedItem === item ? 0.5 : 1,
            '&:active': { cursor: 'grabbing' },
            '&:hover': { backgroundColor: 'action.hover' }
          }}
        >
          {item} (Index: {index})
        </Paper>
      ))}
    </Box>
  );
};

export default DragTest;
