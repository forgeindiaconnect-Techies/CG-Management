import { useState, useEffect } from 'react';
import { Bell, Moon, Sun, Globe, CheckCircle2, Save } from 'lucide-react';

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Marathi'];

const defaultSettings = {
  notif_status_update: true,
  notif_resolution: true,
  notif_dept_response: true,
  notif_email: false,
  theme: 'light',
  language: 'English',
};

export default function Settings() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem('userSettings');
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch { return defaultSettings; }
  });
  const [saved, setSaved] = useState(false);

  const toggle = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  const set = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  const handleSave = () => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-500 text-sm mt-1">Manage your notification preferences and display options.</p>
      </div>

      {saved && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 text-sm font-medium">
          <CheckCircle2 size={16} /> Settings saved successfully!
        </div>
      )}

      {/* Notification Preferences */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
          <Bell size={16} className="text-[#0F766E]" /> Notification Preferences
        </h3>
        <div className="space-y-4">
          {[
            { key: 'notif_status_update', label: 'Complaint Status Updates', desc: 'Notify when your complaint status changes' },
            { key: 'notif_resolution', label: 'Resolution Alerts', desc: 'Notify when your complaint is resolved' },
            { key: 'notif_dept_response', label: 'Department Responses', desc: 'Notify when a department responds to your complaint' },
            { key: 'notif_email', label: 'Email Notifications', desc: 'Also receive notifications via email' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
              <button onClick={() => toggle(key)}
                className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${settings[key] ? 'bg-[#0F766E]' : 'bg-gray-200'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${settings[key] ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
          <Sun size={16} className="text-[#0F766E]" /> Display Theme
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'light', icon: Sun, label: 'Light Mode', desc: 'Default light interface' },
            { value: 'dark', icon: Moon, label: 'Dark Mode', desc: 'Easier on the eyes at night' },
          ].map(({ value, icon: Icon, label, desc }) => (
            <button key={value} onClick={() => set('theme', value)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                settings.theme === value ? 'border-[#0F766E] bg-teal-50/50' : 'border-gray-100 hover:border-gray-200'
              }`}>
              <Icon size={20} className={settings.theme === value ? 'text-[#0F766E] mb-2' : 'text-gray-400 mb-2'} />
              <p className="text-sm font-bold text-gray-900">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </button>
          ))}
        </div>
        {settings.theme === 'dark' && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            ℹ️ Dark mode is a preference setting. Full dark mode implementation requires additional theming support.
          </p>
        )}
      </div>

      {/* Language */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
          <Globe size={16} className="text-[#0F766E]" /> Language
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {LANGUAGES.map(lang => (
            <button key={lang} onClick={() => set('language', lang)}
              className={`py-2.5 text-sm font-semibold rounded-xl border-2 transition-all ${
                settings.language === lang ? 'border-[#0F766E] bg-teal-50 text-[#0F766E]' : 'border-gray-100 text-gray-600 hover:border-gray-200'
              }`}>
              {lang}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400">Note: Full translations will be available in a future update.</p>
      </div>

      <button onClick={handleSave}
        className="w-full py-3 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20">
        <Save size={16} /> Save Settings
      </button>
    </div>
  );
}
