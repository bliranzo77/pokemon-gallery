// Loading, empty and error messages share one look.
function StatusMessage({ title, children, action, live = false }) {
  return (
    <div className="status-box" role={live ? 'status' : undefined}>
      <p className="status-title">{title}</p>
      {children}
      {action}
    </div>
  );
}

// An ApiError as a message with a retry button.
export function ErrorMessage({ error, onRetry, title = 'Something went wrong' }) {
  const heading = {
    network: "The data didn't load",
    database: "The data didn't load",
    'not-found': 'Not found',
    'bad-request': "That request isn't valid",
  }[error?.kind] ?? title;
  return (
    <StatusMessage
      title={heading}
      action={onRetry && error?.kind !== 'not-found' && (
        <button className="outline-button" onClick={onRetry}>Try again</button>
      )}
    >
      <p>{error?.message ?? 'Please try again.'}</p>
    </StatusMessage>
  );
}

export default StatusMessage;
