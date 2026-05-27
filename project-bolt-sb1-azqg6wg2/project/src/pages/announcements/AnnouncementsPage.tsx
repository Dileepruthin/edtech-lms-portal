import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Badge, Modal, Input } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Bell, Megaphone, Send, Plus, Users, Calendar, Clock, CheckCircle, AlertCircle, CreditCard as Edit } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'general' | 'urgent' | 'event' | 'reminder';
  audience: string;
  created_at: string;
  sent: boolean;
  author: string;
}

export default function AnnouncementsPage() {
  const { profile } = useAuth();
  const [activeNav, setActiveNav] = useState('announcements');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAnnouncements();
  }, [profile]);

  const fetchAnnouncements = async () => {
    // Dummy data
    const dummyAnnouncements: Announcement[] = [
      {
        id: '1',
        title: 'Platform Maintenance Scheduled',
        message: 'The platform will undergo maintenance on Saturday from 2 AM to 6 AM EST. During this time, some features may be unavailable.',
        type: 'urgent',
        audience: 'All Users',
        created_at: new Date().toISOString(),
        sent: true,
        author: 'Admin Team',
      },
      {
        id: '2',
        title: 'New Course Launch: Advanced AI/ML',
        message: 'Exciting news! We are launching a new course on Advanced AI and Machine Learning starting next month. Early enrollment is now open!',
        type: 'general',
        audience: 'Students',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        sent: true,
        author: 'Course Department',
      },
      {
        id: '3',
        title: 'Virtual Career Fair',
        message: 'Join us for a virtual career fair on March 15th. Connect with top tech companies and explore job opportunities.',
        type: 'event',
        audience: 'Students',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        sent: true,
        author: 'Career Services',
      },
      {
        id: '4',
        title: 'Assignment Deadline Reminder',
        message: 'This is a reminder that the deadline for the Week 4 assignment is approaching. Make sure to submit before Friday.',
        type: 'reminder',
        audience: 'Faculty',
        created_at: new Date(Date.now() - 259200000).toISOString(),
        sent: true,
        author: 'Academic Office',
      },
      {
        id: '5',
        title: 'Holiday Schedule Update',
        message: 'Classes will be suspended during the holiday period from December 23 to January 2. Normal operations will resume on January 3.',
        type: 'general',
        audience: 'All Users',
        created_at: new Date(Date.now() - 345600000).toISOString(),
        sent: true,
        author: 'Admin Team',
      },
    ];

    setAnnouncements(dummyAnnouncements);
    setLoading(false);
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      urgent: <AlertCircle className="w-5 h-5 text-red-400" />,
      general: <Bell className="w-5 h-5 text-cyan-400" />,
      event: <Calendar className="w-5 h-5 text-emerald-400" />,
      reminder: <Clock className="w-5 h-5 text-amber-400" />,
    };
    return icons[type] || icons.general;
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, 'error' | 'info' | 'success' | 'warning' | 'default'> = {
      urgent: 'error',
      general: 'info',
      event: 'success',
      reminder: 'warning',
    };
    return <Badge variant={variants[type] || 'default'}>{type}</Badge>;
  };

  const filteredAnnouncements = announcements.filter(a => {
    if (filter === 'all') return true;
    return a.type === filter;
  });

  return (
    <DashboardLayout activeItem={activeNav} onItemClick={setActiveNav}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Announcements</h1>
            <p className="text-gray-400 mt-1">
              {profile?.role === 'admin' ? 'Create and manage platform announcements' : 'Platform news and updates'}
            </p>
          </div>
          {(profile?.role === 'admin' || profile?.role === 'faculty') && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Create Announcement
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="!p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total</p>
                <p className="text-2xl font-bold text-white mt-1">{announcements.length}</p>
              </div>
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
          </Card>

          <Card className="!p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">General</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {announcements.filter(a => a.type === 'general').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Bell className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="!p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Urgent</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {announcements.filter(a => a.type === 'urgent').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </Card>

          <Card className="!p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Events</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {announcements.filter(a => a.type === 'event').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'general', 'urgent', 'event', 'reminder'].map((type) => (
            <Button
              key={type}
              variant={filter === type ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>

        {/* Announcements List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="!p-5 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-1/4 mb-3" />
                <div className="h-4 bg-gray-700 rounded w-3/4" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => (
              <Card
                key={announcement.id}
                className={`!p-5 ${
                  announcement.type === 'urgent'
                    ? 'border-red-500/30 bg-red-500/5'
                    : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    announcement.type === 'urgent'
                      ? 'bg-red-500/20'
                      : 'bg-gray-800'
                  }`}>
                    {getTypeIcon(announcement.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white text-lg">{announcement.title}</h3>
                          {getTypeBadge(announcement.type)}
                        </div>
                        <p className="text-gray-400 text-sm">
                          From {announcement.author} · {announcement.audience}
                        </p>
                      </div>
                      <div className="text-right">
                        {announcement.sent && (
                          <Badge variant="success" size="sm">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Sent
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-300 mt-3">{announcement.message}</p>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700/50">
                      <span className="text-sm text-gray-400">
                        {new Date(announcement.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      {(profile?.role === 'admin' || profile?.role === 'faculty') && (
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Announcement"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="Announcement title"
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Message</label>
            <textarea
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              rows={4}
              placeholder="Write your announcement..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Type</label>
              <select className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white">
                <option value="general">General</option>
                <option value="urgent">Urgent</option>
                <option value="event">Event</option>
                <option value="reminder">Reminder</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Audience</label>
              <select className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white">
                <option value="all">All Users</option>
                <option value="students">Students</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin Only</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button className="flex-1">
              <Send className="w-4 h-4 mr-2" />
              Send Announcement
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
