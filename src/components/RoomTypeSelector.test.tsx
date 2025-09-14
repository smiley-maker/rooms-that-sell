import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RoomTypeSelector, RoomTypeTag } from './RoomTypeSelector';

// Mock the room type detection module
vi.mock('../lib/roomTypeDetection', () => ({
  detectRoomType: vi.fn((filename) => ({
    roomType: filename.includes('kitchen') ? 'kitchen' : 'unknown',
    confidence: filename.includes('kitchen') ? 0.9 : 0.1,
    suggestions: filename.includes('kitchen') ? [
      { roomType: 'kitchen', confidence: 0.9, reason: 'Detected from filename' }
    ] : [],
    detectedFeatures: filename.includes('kitchen') ? ['appliances'] : []
  })),
  getFallbackSuggestions: vi.fn(() => [
    { roomType: 'living_room', reason: 'Most common room in listings' },
    { roomType: 'bedroom', reason: 'Common room type' }
  ]),
  getRoomTypeOptions: vi.fn(() => [
    { value: 'kitchen', label: 'Kitchen' },
    { value: 'living_room', label: 'Living Room' },
    { value: 'bedroom', label: 'Bedroom' },
    { value: 'unknown', label: 'Unknown' }
  ]),
  getRoomTypeDisplayName: vi.fn((roomType) => {
    const names: Record<string, string> = {
      kitchen: 'Kitchen',
      living_room: 'Living Room',
      bedroom: 'Bedroom',
      unknown: 'Unknown'
    };
    return names[roomType] || 'Unknown';
  }),
  isValidRoomType: vi.fn((roomType) => ['kitchen', 'living_room', 'bedroom', 'unknown'].includes(roomType))
}));

describe('RoomTypeSelector', () => {
  const mockOnRoomTypeChange = vi.fn();

  beforeEach(() => {
    mockOnRoomTypeChange.mockClear();
  });

  it('renders with filename and shows room type selector', () => {
    render(
      <RoomTypeSelector
        filename="kitchen_photo.jpg"
        onRoomTypeChange={mockOnRoomTypeChange}
      />
    );

    expect(screen.getByText('Room Type:')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('shows analyzing state initially', () => {
    render(
      <RoomTypeSelector
        filename="kitchen_photo.jpg"
        onRoomTypeChange={mockOnRoomTypeChange}
      />
    );

    expect(screen.getByText('Analyzing room type...')).toBeInTheDocument();
  });

  it('shows auto-detection results after analysis', async () => {
    render(
      <RoomTypeSelector
        filename="kitchen_photo.jpg"
        onRoomTypeChange={mockOnRoomTypeChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Auto-detected:')).toBeInTheDocument();
      expect(screen.getAllByText('Kitchen').length).toBeGreaterThan(0);
      expect(screen.getByText('(90% confidence)')).toBeInTheDocument();
    });
  });

  it('shows suggestions button when suggestions are available', async () => {
    render(
      <RoomTypeSelector
        filename="kitchen_photo.jpg"
        onRoomTypeChange={mockOnRoomTypeChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Suggestions')).toBeInTheDocument();
    });
  });

  it('calls onRoomTypeChange when room type is selected', async () => {
    render(
      <RoomTypeSelector
        filename="kitchen_photo.jpg"
        currentRoomType="unknown"
        onRoomTypeChange={mockOnRoomTypeChange}
      />
    );

    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.queryByText('Analyzing room type...')).not.toBeInTheDocument();
    });

    // Click on the select trigger
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);

    // Select kitchen option from the dropdown
    await waitFor(() => {
      const kitchenOptions = screen.getAllByText('Kitchen');
      // Find the option in the dropdown (not the badge)
      const dropdownOption = kitchenOptions.find(option => 
        option.closest('[role="option"]') !== null
      );
      if (dropdownOption) {
        fireEvent.click(dropdownOption);
      }
    });

    expect(mockOnRoomTypeChange).toHaveBeenCalledWith('kitchen');
  });

  it('shows detected features when available', async () => {
    render(
      <RoomTypeSelector
        filename="kitchen_photo.jpg"
        onRoomTypeChange={mockOnRoomTypeChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Detected features:')).toBeInTheDocument();
      expect(screen.getByText('appliances')).toBeInTheDocument();
    });
  });

  it('opens suggestions dialog when suggestions button is clicked', async () => {
    render(
      <RoomTypeSelector
        filename="kitchen_photo.jpg"
        onRoomTypeChange={mockOnRoomTypeChange}
      />
    );

    await waitFor(() => {
      const suggestionsButton = screen.getByText('Suggestions');
      fireEvent.click(suggestionsButton);
    });

    expect(screen.getByText('Room Type Suggestions')).toBeInTheDocument();
  });
});

describe('RoomTypeTag', () => {
  it('renders room type with display name', () => {
    render(
      <RoomTypeTag roomType="kitchen" />
    );

    expect(screen.getByText('Kitchen')).toBeInTheDocument();
  });

  it('shows confidence percentage when provided', () => {
    render(
      <RoomTypeTag roomType="kitchen" confidence={0.85} />
    );

    expect(screen.getByText('Kitchen')).toBeInTheDocument();
    expect(screen.getByText('(85%)')).toBeInTheDocument();
  });

  it('calls onEdit when clicked', () => {
    const mockOnEdit = vi.fn();
    render(
      <RoomTypeTag roomType="kitchen" onEdit={mockOnEdit} />
    );

    const badge = screen.getByText('Kitchen').closest('[data-slot="badge"]');
    fireEvent.click(badge!);

    expect(mockOnEdit).toHaveBeenCalled();
  });

  it('applies correct color classes for different room types', () => {
    const { rerender } = render(
      <RoomTypeTag roomType="kitchen" />
    );

    let badge = screen.getByText('Kitchen').closest('[data-slot="badge"]');
    expect(badge).toHaveClass('bg-orange-100', 'text-orange-800');

    rerender(<RoomTypeTag roomType="living_room" />);
    badge = screen.getByText('Living Room').closest('[data-slot="badge"]');
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');

    rerender(<RoomTypeTag roomType="bedroom" />);
    badge = screen.getByText('Bedroom').closest('[data-slot="badge"]');
    expect(badge).toHaveClass('bg-purple-100', 'text-purple-800');
  });
});