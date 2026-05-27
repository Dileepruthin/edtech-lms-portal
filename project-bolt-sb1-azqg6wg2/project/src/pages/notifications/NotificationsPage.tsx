import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Badge, Button } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Bell,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  ClipboardList,
  CreditCard,
  Megaphone,
  Trash2,
  Check
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  action_url: string;
  created_at: string;
}

export default function NotificationsPage() {
  const { profile } = useAuth();
  const [activeNav, setActiveNav] = useState('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchNotifications();
    }
  }, [profile]);

  const fetchNotifications = async () => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false });

      if (data) {
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);

    await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = async (id: string) => {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      info: <Info className="w-5 h-5 text-cyan-400" />,
      warning: <AlertCircle className="w-5 h-5 text-amber-400" />,
      success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
      error: <XCircle className="w-5 h-5 text-red-400" />,
      assignment: <ClipboardList className="w-5 h-5 text-blue-400" />,
      payment: <CreditCard className="w-5 h-5 text-pink-400" />,
      announcement: <Megaphone className="w-5 h-5 text-cyan-400" />,
    };
    return icons[type] || <Bell className="w-5 h-5 text-gray-400" />;
  };

  const getBadgeVariant = (type: string) => {
    const variants: Record<string, 'info' | 'warning' | 'success' | 'error' | 'default'> = {
      info: 'info',
      warning: 'warning',
      success: 'success',
      error: 'error',
      assignment: 'info',
      payment: 'info',
      announcement: 'default',
    };
    return variants[type] || 'default';
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DashboardLayout activeItem={activeNav} onItemClick={setActiveNav}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <p className="text-gray-400 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <Check className="w-5 h-5 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="!p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-700 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-1/4" />
                    <div className="h-4 bg-gray-700 rounded w-3/4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <Card className="!p-8">
            <div className="text-center">
              <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No notifications yet</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`!p-5 transition-all ${
                  !notification.read ? 'border-cyan-500/30 bg-cyan-500/5' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    !notification.read ? 'bg-cyan-500/20' : 'bg-gray-800'
                  }`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                        {notification.title}
                      </h3>
                      <Badge variant={getBadgeVariant(notification.type)} size="sm">
                        {notification.type}
                      </Badge>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-cyan-500 rounded-full" />
                      )}
                    </div>
                    <p className={`text-sm ${!notification.read ? 'text-gray-300' : 'text-gray-400'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-gray-400 hover:text-cyan-400 transition-colors p-1"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors p-1"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
