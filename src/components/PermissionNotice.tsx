import type { MicrophonePermissionState } from '../hooks/usePitchEngine';

export interface PermissionNoticeProps {
  permission: MicrophonePermissionState;
  message?: string | null;
  onRetry?: () => void;
  onPlayReference?: () => void;
}

export function PermissionNotice({
  permission,
  message,
  onRetry,
  onPlayReference,
}: PermissionNoticeProps) {
  if (permission !== 'denied' && permission !== 'unavailable') return null;

  const denied = permission === 'denied';
  return (
    <section className="permission-notice" role="alert">
      <div>
        <strong>{denied ? 'マイクの許可が必要です' : 'マイクを利用できません'}</strong>
        <p>
          {message ?? (denied
            ? 'Safariのサイト設定でこのページの「マイク」を許可してから、もう一度開始してください。'
            : '入力デバイスとブラウザ設定を確認してください。')}
        </p>
      </div>
      <div className="permission-actions">
        {onRetry && <button type="button" onClick={onRetry}>マイクを再試行</button>}
        {onPlayReference && <button type="button" onClick={onPlayReference}>基準音を聴く</button>}
      </div>
    </section>
  );
}
