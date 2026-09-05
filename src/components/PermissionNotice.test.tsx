import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PermissionNotice } from './PermissionNotice';

describe('PermissionNotice', () => {
  it('explains how to recover from denied microphone permission while keeping reference playback available', () => {
    const retry = vi.fn();
    const playReference = vi.fn();
    render(
      <PermissionNotice
        permission="denied"
        onRetry={retry}
        onPlayReference={playReference}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('マイクの許可が必要です');
    expect(screen.getByRole('alert')).toHaveTextContent('Safariのサイト設定');
    fireEvent.click(screen.getByRole('button', { name: 'マイクを再試行' }));
    fireEvent.click(screen.getByRole('button', { name: '基準音を聴く' }));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(playReference).toHaveBeenCalledTimes(1);
  });

  it('renders a distinct unavailable state', () => {
    render(<PermissionNotice permission="unavailable" />);
    expect(screen.getByRole('alert')).toHaveTextContent('マイクを利用できません');
  });

  it('renders nothing while permission is unknown or granted', () => {
    const { rerender } = render(<PermissionNotice permission="unknown" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    rerender(<PermissionNotice permission="granted" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
