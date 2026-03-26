import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminContext, SimpleForm } from 'react-admin';

import { GeolocationInput } from '../src/GeolocationInput.tsx';

// Mock @vis.gl/react-google-maps to avoid requiring a real API key
vi.mock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Map: ({ children }: { children: React.ReactNode }) => <div data-testid="map">{children}</div>,
  AdvancedMarker: () => <div data-testid="marker" />,
  useMap: () => null,
  useMapsLibrary: () => null,
}));

const dataProvider = {
  getList: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  getOne: vi.fn().mockResolvedValue({ data: {} }),
  getMany: vi.fn().mockResolvedValue({ data: [] }),
  getManyReference: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  update: vi.fn(),
  updateMany: vi.fn(),
  create: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
};

function createTestWrapper(defaultValues: Record<string, unknown> = {}) {
  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <AdminContext dataProvider={dataProvider}>
        <SimpleForm defaultValues={defaultValues} toolbar={false}>
          {children}
        </SimpleForm>
      </AdminContext>
    );
  };
}

describe('GeolocationInput', () => {
  it('renders warning when no API key is set', () => {
    const Wrapper = createTestWrapper({ location: {} });

    render(
      <Wrapper>
        <GeolocationInput source="location" label="Location" />
      </Wrapper>,
    );

    expect(
      screen.getByText(/VITE_GOOGLE_MAPS_API_KEY/),
    ).toBeDefined();
  });

  it('renders with label', () => {
    const Wrapper = createTestWrapper({ location: {} });

    render(
      <Wrapper>
        <GeolocationInput source="location" label="Venue Location" />
      </Wrapper>,
    );

    expect(screen.getByText('Venue Location')).toBeDefined();
  });
});
