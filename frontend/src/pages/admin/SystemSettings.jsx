export default function SystemSettings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">System Settings</h2>
          <p className="text-gray-500 text-sm mt-0.5">Configure application behavior</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Theme Settings</h3>
          <p className="text-sm text-gray-500">Custom branding, colors, logos.</p>
        </div>
      </div>
    </div>
  );
}
