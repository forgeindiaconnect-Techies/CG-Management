import { Link } from 'react-router-dom';

// Reusable stat card component
export default function StatCard({ label, value, icon: Icon, color = 'teal', trend, to }) {
  const colors = {
    teal: 'from-[#0F766E] to-[#14B8A6]',
    cyan: 'from-[#06B6D4] to-[#0EA5E9]',
    amber: 'from-[#F59E0B] to-[#FBBF24]',
    red: 'from-[#EF4444] to-[#F87171]',
    purple: 'from-[#8B5CF6] to-[#A78BFA]',
    green: 'from-[#10B981] to-[#34D399]',
    blue: 'from-[#3B82F6] to-[#60A5FA]',
    indigo: 'from-[#4F46E5] to-[#818CF8]',
    yellow: 'from-[#EAB308] to-[#FDE047]',
  };

  const cardContent = (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border transition-all duration-200 h-full ${to ? 'border-gray-100 hover:shadow-md hover:border-[#14B8A6] cursor-pointer' : 'border-gray-100 hover:shadow-md'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
          {trend !== undefined && (
            <p className={`text-xs mt-1 font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs last month
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-md`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );

  if (to) {
    return <Link to={to} className="block h-full">{cardContent}</Link>;
  }

  return cardContent;
}
