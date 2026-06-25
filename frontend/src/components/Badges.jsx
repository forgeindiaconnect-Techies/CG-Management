const STATUS_CONFIG = {
  New: { bg: 'bg-blue-100', text: 'text-blue-700' },
  Assigned: { bg: 'bg-purple-100', text: 'text-purple-700' },
  'In Progress': { bg: 'bg-amber-100', text: 'text-amber-700' },
  'Pending Review': { bg: 'bg-orange-100', text: 'text-orange-700' },
  Resolved: { bg: 'bg-green-100', text: 'text-green-700' },
  Closed: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

const PRIORITY_CONFIG = {
  Low: { bg: 'bg-green-100', text: 'text-green-700' },
  Medium: { bg: 'bg-amber-100', text: 'text-amber-700' },
  High: { bg: 'bg-red-100', text: 'text-red-700' },
};

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      {priority}
    </span>
  );
}
