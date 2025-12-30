/**
 * Tests for ConfirmDialog component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ConfirmDialog from '../../../shared/components/ConfirmDialog';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dialog with title and message', () => {
    renderWithTheme(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('renders confirm and cancel buttons', () => {
    renderWithTheme(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    renderWithTheme(<ConfirmDialog {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    renderWithTheme(<ConfirmDialog {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not render when open is false', () => {
    renderWithTheme(<ConfirmDialog {...defaultProps} open={false} />);

    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });

  it('uses custom confirm text when provided', () => {
    renderWithTheme(
      <ConfirmDialog {...defaultProps} confirmText="Delete" />
    );

    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('uses custom cancel text when provided', () => {
    renderWithTheme(
      <ConfirmDialog {...defaultProps} cancelText="Go Back" />
    );

    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
  });

  it('applies danger color for destructive actions', () => {
    renderWithTheme(
      <ConfirmDialog {...defaultProps} confirmColor="error" />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    expect(confirmButton).toHaveClass('MuiButton-containedError');
  });
});

