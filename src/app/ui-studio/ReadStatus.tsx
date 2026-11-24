import { useStore } from '../store'

export function ReadStatus({ subject, failed, retry }: { subject: string; failed: boolean; retry: () => void }) {
  const { t } = useStore()
  if (!failed) return <p role="status">{t.studioRead.loading(subject)}</p>
  return <div className="card sync-error" role="alert"><span>{t.studioRead.error(subject)}</span>
    <button type="button" className="ap-btn ap-btn--sm" onClick={retry}>{t.priorities.retry}</button></div>
}
