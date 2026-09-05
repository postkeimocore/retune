import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => localStorage.clear());

describe('RETUNE training screen', () => {
  it('shows the tuning hierarchy and primary controls', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'RETUNE' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'FREE' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'SCALE' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'RANDOM' })).toBeInTheDocument();
    expect(screen.getByText('C4')).toBeInTheDocument();
    expect(screen.getByText('261.6 Hz')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '基準音を聴く' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'トレーニングを開始' })).toBeInTheDocument();
    expect(screen.getByText('現在のずれ')).toBeInTheDocument();
    expect(screen.getByText('キープ進捗')).toBeInTheDocument();
  });

  it('switches mode from the persistent mode selector', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'SCALE' }));
    expect(screen.getByRole('button', { name: 'SCALE' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('スケール')).toBeInTheDocument();
  });

  it('opens an in-context settings sheet with core training controls', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '設定を開く' }));

    expect(screen.getByRole('dialog', { name: 'トレーニング設定' })).toBeInTheDocument();
    expect(screen.getByText('BPM')).toBeInTheDocument();
    expect(screen.getByText('判定時間')).toBeInTheDocument();
    expect(screen.getByText('判定精度')).toBeInTheDocument();
    expect(screen.getByText('音域')).toBeInTheDocument();
    expect(screen.getByText('基準音を鳴らし続ける')).toBeInTheDocument();
  });
});
