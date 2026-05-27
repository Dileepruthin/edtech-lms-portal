import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Badge, Modal, Input, Select } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Video,
  Calendar,
  Clock,
  Users,
  Play,
  ExternalLink,
  Plus,
  Settings,
  VideoOff,
  CheckCircle
} from 'lucide-react';

interface LiveClass {
  id: string;
  title: string;
  description: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_url: string;
  meeting_platform: string;
  meeting_id: string;
  meeting_password: string;
  status: string;
  instructor_id: string;
  courses?: {
    title: string;
  };
  batches?: {
    name: string;
  };
  profiles?: {
    full_name: string;
  };
  attendee_count?: number;
}

export default function LiveClassesPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeNav, setActiveNav] = useState('live-classes');
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<LiveClass | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLiveClasses();
  }, [profile]);

  const fetchLiveClasses = async () => {
    try {
      let query = supabase
        .from('live_classes')
        .select(`
          *,
          courses (title),
          batches (name),
          profiles!live_classes_instructor_id_fkey (full_name)
        `)
        .order('scheduled_at', { ascending: true });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      if (profile?.role === 'faculty') {
        query = query.eq('instructor_id', profile.id);
      }

      const { data } = await query;

      if (data) {
        const classesWithAttendees = await Promise.all(
          data.map(async (cls: any) => {
            const { count } = await supabase
              .from('class_attendees')
              .select('*', { count: 'exact', head: true })
              .eq('live_class_id', cls.id);

            return {
              ...cls,
              attendee_count: count || 0,
            };
          })
        );
        setClasses(classesWithAttendees);
      }
    } catch (error) {
      console.error('Error fetching live classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      zoom: 'bg-blue-500/20 text-blue-400',
      google_meet: 'bg-emerald-500/20 text-emerald-400',
      teams: 'bg-purple-500/20 text-purple-400',
      other: 'bg-gray-500/20 text-gray-400',
    };
    return icons[platform] || icons.other;
  };

  const getStatusVariant = (status: string) => {
    const variants: Record<string, 'info' | 'success' | 'warning' | 'error' | 'default'> = {
      scheduled: 'info',
      live: 'success',
      completed: 'default',
      cancelled: 'error',
    };
    return variants[status] || 'default';
  };

  const getTimeUntil = (date: string) => {
    const diff = new Date(date).getTime() - Date.now();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (diff < 0) return 'Past';
    if (days > 0) return `in ${days}d`;
    if (hours > 0) return `in ${hours}h`;
    return `in ${minutes}m`;
  };

  const now = new Date();
  const upcomingClasses = classes.filter(c => new Date(c.scheduled_at) > now && c.status === 'scheduled');
  const pastClasses = classes.filter(c => new Date(c.scheduled_at) <= now || c.status === 'completed' || c.status === 'cancelled');

  return (
    <DashboardLayout activeItem={activeNav} onItemClick={setActiveNav}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Live Classes</h1>
            <p className="text-gray-400 mt-1">Join and manage online class sessions</p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Classes' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'live', label: 'Live Now' },
                { value: 'completed', label: 'Completed' },
              ]}
            />
            {(profile?.role === 'faculty' || profile?.role === 'admin') && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Schedule Class
              </Button>
            )}
          </div>
        </div>

        {/* Live Now Banner */}
        {classes.filter(c => c.status === 'live').length > 0 && (
          <Card className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-500/30 !p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-red-500/30 rounded-xl flex items-center justify-center animate-pulse">
                <Video className="w-7 h-7 text-red-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <Badge variant="error">LIVE NOW</Badge>
                </div>
                <h3 className="text-lg font-semibold text-white mt-1">
                  {classes.find(c => c.status === 'live')?.title}
                </h3>
                <p className="text-sm text-gray-400">
                  {classes.find(c => c.status === 'live')?.attendee_count || 0} participants joined
                </p>
              </div>
              <Button onClick={() => setSelectedClass(classes.find(c => c.status === 'live') || null)}>
                <Play className="w-5 h-5 mr-2" />
                Join Now
              </Button>
            </div>
          </Card>
        )}

        {/* Upcoming Classes */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Upcoming Classes</h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="!p-5 animate-pulse">
                  <div className="h-6 bg-gray-700 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-gray-700 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-gray-700 rounded w-full" />
                </Card>
              ))}
            </div>
          ) : upcomingClasses.length === 0 ? (
            <Card className="!p-8 text-center">
              <VideoOff className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No upcoming classes scheduled</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingClasses.map((liveClass) => (
                <Card
                  key={liveClass.id}
                  className="!p-5 hover:border-cyan-500/30 transition-all cursor-pointer group"
                  onClick={() => setSelectedClass(liveClass)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant={getStatusVariant(liveClass.status)}>
                      {liveClass.status}
                    </Badge>
                    <div className={`px-2.5 py-1 rounded-lg text-sm font-medium ${getPlatformIcon(liveClass.meeting_platform)}`}>
                      {liveClass.meeting_platform.replace('_', ' ')}
                    </div>
                  </div>

                  <h3 className="font-semibold text-white text-lg mb-2 group-hover:text-cyan-400 transition-colors">
                    {liveClass.title}
                  </h3>

                  {liveClass.courses?.title && (
                    <p className="text-sm text-gray-400 mb-3">{liveClass.courses.title}</p>
                  )}

                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(liveClass.scheduled_at).toLocaleDateString()}</span>
                      <span className="text-cyan-400 font-medium">
                        {getTimeUntil(liveClass.scheduled_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(liveClass.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>({liveClass.duration_minutes} min)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{liveClass.attendee_count || 0} registered</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-700/50">
                    <Button size="sm" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Join Class
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Past Classes */}
        {pastClasses.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Past Classes</h2>
            <div className="space-y-3">
              {pastClasses.slice(0, 5).map((liveClass) => (
                <Card
                  key={liveClass.id}
                  className="!p-4 hover:bg-gray-800/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedClass(liveClass)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        liveClass.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {liveClass.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <VideoOff className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{liveClass.title}</h4>
                        <p className="text-sm text-gray-400">
                          {new Date(liveClass.scheduled_at).toLocaleDateString()} · {liveClass.duration_minutes} min
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={getStatusVariant(liveClass.status)} size="sm">
                        {liveClass.status}
                      </Badge>
                      {liveClass.recording_url && (
                        <Button variant="ghost" size="sm">
                          <Play className="w-4 h-4 mr-1" />
                          Recording
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Class Details Modal */}
      <Modal
        isOpen={!!selectedClass}
        onClose={() => setSelectedClass(null)}
        title={selectedClass?.title}
        size="lg"
      >
        {selectedClass && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant={getStatusVariant(selectedClass.status)}>
                {selectedClass.status}
              </Badge>
              <div className={`px-2.5 py-1 rounded-lg text-sm font-medium ${getPlatformIcon(selectedClass.meeting_platform)}`}>
                {selectedClass.meeting_platform.replace('_', ' ')}
              </div>
            </div>

            {selectedClass.description && (
              <p className="text-gray-300">{selectedClass.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-gray-400 text-sm">Date & Time</p>
                <p className="text-white font-medium mt-1">
                  {new Date(selectedClass.scheduled_at).toLocaleDateString()}
                </p>
                <p className="text-gray-300">
                  {new Date(selectedClass.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-gray-400 text-sm">Duration</p>
                <p className="text-white font-medium mt-1">{selectedClass.duration_minutes} minutes</p>
              </div>
            </div>

            {selectedClass.meeting_url && (
              <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/20">
                <p className="text-sm text-gray-400 mb-2">Meeting Link</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={selectedClass.meeting_url}
                    readOnly
                    className="flex-1 bg-gray-800/50 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300"
                  />
                  <Button
                    onClick={() => window.open(selectedClass.meeting_url, '_blank')}
                    size="sm"
                  >
                    Open
                  </Button>
                </div>
                {selectedClass.meeting_id && (
                  <p className="text-sm text-gray-400 mt-2">
                    Meeting ID: <span className="text-white">{selectedClass.meeting_id}</span>
                    {selectedClass.meeting_password && (
                      <span> · Password: <span className="text-white">{selectedClass.meeting_password}</span></span>
                    )}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="ghost" onClick={() => setSelectedClass(null)} className="flex-1">
                Close
              </Button>
              {(selectedClass.status === 'live' || selectedClass.status === 'scheduled') && selectedClass.meeting_url && (
                <Button
                  onClick={() => window.open(selectedClass.meeting_url, '_blank')}
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Join Class
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Create Class Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Schedule Live Class"
        size="lg"
      >
        <LiveClassForm
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchLiveClasses();
          }}
        />
      </Modal>
    </DashboardLayout>
  );
}

// Live Class Form Component
function LiveClassForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_at: '',
    duration_minutes: 60,
    meeting_url: '',
    meeting_platform: 'zoom',
    meeting_id: '',
    meeting_password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('live_classes').insert({
        ...formData,
        instructor_id: profile?.id,
        scheduled_at: new Date(formData.scheduled_at).toISOString(),
      });

      if (!error) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating class:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Class Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Enter class title"
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Class description (optional)"
          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date & Time"
          type="datetime-local"
          value={formData.scheduled_at}
          onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
          required
        />
        <Input
          label="Duration (minutes)"
          type="number"
          value={formData.duration_minutes}
          onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
          required
        />
      </div>

      <Select
        label="Meeting Platform"
        value={formData.meeting_platform}
        onChange={(e) => setFormData({ ...formData, meeting_platform: e.target.value })}
        options={[
          { value: 'zoom', label: 'Zoom' },
          { value: 'google_meet', label: 'Google Meet' },
          { value: 'teams', label: 'Microsoft Teams' },
          { value: 'other', label: 'Other' },
        ]}
      />

      <Input
        label="Meeting URL"
        type="url"
        value={formData.meeting_url}
        onChange={(e) => setFormData({ ...formData, meeting_url: e.target.value })}
        placeholder="https://zoom.us/j/..."
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Meeting ID"
          value={formData.meeting_id}
          onChange={(e) => setFormData({ ...formData, meeting_id: e.target.value })}
          placeholder="Optional"
        />
        <Input
          label="Password"
          value={formData.meeting_password}
          onChange={(e) => setFormData({ ...formData, meeting_password: e.target.value })}
          placeholder="Optional"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" isLoading={loading} className="flex-1">
          Schedule Class
        </Button>
      </div>
    </form>
  );
}
