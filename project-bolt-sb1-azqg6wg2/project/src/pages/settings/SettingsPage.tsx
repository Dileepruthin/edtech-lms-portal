import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Input, Badge } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  User,
  Mail,
  Lock,
  Bell,
  Palette,
  Shield,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  Moon,
  Sun
} from 'lucide-react';

export default function SettingsPage() {
  const { profile } = useAuth();
  const [activeNav, setActiveNav] = useState('settings');
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    avatar_url: '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [notifications, setNotifications] = useState({
    email_notifications: true,
    push_notifications: true,
    assignment_reminders: true,
    payment_reminders: true,
    announcements: true,
    weekly_digest: false,
  });

  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        avatar_url: profile.avatar_url || '',
      });
    }
  }, [profile]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
          avatar_url: profileData.avatar_url,
        })
        .eq('id', profile?.id);

      if (!error) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password,
      });

      if (!error) {
        setSaved(true);
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error updating password:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-5 h-5" /> },
  ];

  return (
    <DashboardLayout activeItem={activeNav} onItemClick={setActiveNav}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-gray-400 mt-1">Manage your account preferences</p>
          </div>
          {saved && (
            <Badge variant="success" className="animate-in fade-in">
              <CheckCircle className="w-4 h-4 mr-1" />
              Saved successfully
            </Badge>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Tabs Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <Card padding="none" className="!overflow-hidden">
              <div className="p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                      activeTab === tab.id
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    {tab.icon}
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <Card>
                <h2 className="text-lg font-semibold text-white mb-6">Profile Information</h2>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
                      {profileData.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <Button type="button" variant="outline" size="sm">
                        Change Avatar
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">JPG, PNG. Max 2MB</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                      icon={<User className="w-5 h-5" />}
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={profileData.email}
                      disabled
                      icon={<Mail className="w-5 h-5" />}
                    />
                    <Input
                      label="Phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" isLoading={loading}>
                      <Save className="w-5 h-5 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <Card>
                <h2 className="text-lg font-semibold text-white mb-6">Change Password</h2>
                <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
                  <Input
                    label="Current Password"
                    type="password"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    icon={<Lock className="w-5 h-5" />}
                  />
                  <Input
                    label="New Password"
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    icon={<Lock className="w-5 h-5" />}
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    icon={<Lock className="w-5 h-5" />}
                  />

                  <div className="flex justify-end pt-4">
                    <Button type="submit" isLoading={loading}>
                      Update Password
                    </Button>
                  </div>
                </form>

                <div className="mt-8 pt-8 border-t border-gray-700">
                  <h3 className="font-semibold text-white mb-4">Two-Factor Authentication</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Add an extra layer of security to your account by enabling two-factor authentication.
                  </p>
                  <Button variant="outline">Enable 2FA</Button>
                </div>
              </Card>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <Card>
                <h2 className="text-lg font-semibold text-white mb-6">Notification Preferences</h2>
                <div className="space-y-4">
                  {[
                    { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                    { key: 'push_notifications', label: 'Push Notifications', desc: 'Receive browser push notifications' },
                    { key: 'assignment_reminders', label: 'Assignment Reminders', desc: 'Get notified about upcoming assignments' },
                    { key: 'payment_reminders', label: 'Payment Reminders', desc: 'Get notified about due payments' },
                    { key: 'announcements', label: 'Announcements', desc: 'Receive platform announcements' },
                    { key: 'weekly_digest', label: 'Weekly Digest', desc: 'Receive weekly progress summary' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-white">{item.label}</p>
                        <p className="text-sm text-gray-400">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications[item.key as keyof typeof notifications]}
                          onChange={(e) =>
                            setNotifications({ ...notifications, [item.key]: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <Card>
                <h2 className="text-lg font-semibold text-white mb-6">Appearance Settings</h2>
                <div className="space-y-6">
                  <div>
                    <p className="font-medium text-white mb-4">Theme</p>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setTheme('dark')}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          theme === 'dark'
                            ? 'border-cyan-500 bg-cyan-500/10'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <Moon className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                        <p className="font-medium text-white">Dark Mode</p>
                        <p className="text-sm text-gray-400">Default theme</p>
                      </button>
                      <button
                        onClick={() => setTheme('light')}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          theme === 'light'
                            ? 'border-cyan-500 bg-cyan-500/10'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <Sun className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                        <p className="font-medium text-white">Light Mode</p>
                        <p className="text-sm text-gray-400">Coming soon</p>
                      </button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-700">
                    <p className="font-medium text-white mb-4">Accent Color</p>
                    <div className="flex gap-3">
                      {['cyan', 'blue', 'purple', 'pink', 'emerald'].map((color) => (
                        <button
                          key={color}
                          className={`w-10 h-10 rounded-full bg-${color}-500 ring-2 ring-offset-2 ring-offset-gray-900 ring-transparent hover:ring-${color}-500 transition-all`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
