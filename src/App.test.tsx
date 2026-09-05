import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the RETUNE shell', () => {
    render(<App />);
    expect(screen.getByText('RETUNE')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'FREE' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'SCALE' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'RANDOM' })).toBeInTheDocument();
  });
});
