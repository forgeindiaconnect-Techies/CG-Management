export default function BackupRestore() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Backup & Restore</h2>
          <p className="text-gray-500 text-sm mt-0.5">Manage database backups</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Database Backup</h3>
          <p className="text-sm text-gray-500 mb-4">Create a new manual backup of the system database.</p>
          <button className="px-4 py-2 bg-[#0F766E] text-white text-sm font-semibold rounded-xl hover:bg-[#14B8A6] transition-colors shadow-sm">
            Create Backup
          </button>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">System Restore</h3>
          <p className="text-sm text-gray-500 mb-4">Restore the database from a backup file.</p>
          <button className="px-4 py-2 border border-gray-200 bg-white text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
            Restore System
          </button>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">Download Backups</h3>
        <div className="text-center py-10 text-gray-400">
          <p>List of previous backups to download will appear here.</p>
        </div>
      </div>
    </div>
  );
}
