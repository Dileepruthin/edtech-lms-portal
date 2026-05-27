import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Badge, Modal, Input, Select } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Bell,
  DollarSign,
  Calendar,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
  Mail,
  Plus
} from 'lucide-react';

interface PaymentReminder {
  id: string;
  title: string;
  message: string;
  type: string;
  amount: number;
  due_date: string;
  status: string;
  sent_at: string;
  student_id: string;
  students?: {
    profiles: {
      full_name: string;
      email: string;
    };
    student_id: string;
  };
}

export default function PaymentRemindersPage() {
  const { profile } = useAuth();
  const [activeNav, setActiveNav] = useState('reminders');
  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    sent: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    fetchReminders();
  }, [profile]);

  const fetchReminders = async () => {
    try {
      if (profile?.role === 'admin') {
        const { data, error } = await supabase
          .from('payment_reminders')
          .select(`
            *,
            students (
              student_id,
              profiles (full_name, email)
            )
          `)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setReminders(data);
          calculateStats(data);
        }
      } else if (profile?.role === 'student') {
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', profile.id)
          .single();

        if (studentData) {
          const { data } = await supabase
            .from('payment_reminders')
            .select('*')
            .eq('student_id', studentData.id)
            .order('created_at', { ascending: false });

          if (data) {
            setReminders(data);
            calculateStats(data);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (remindersData: PaymentReminder[]) => {
    const pending = remindersData.filter(r => r.status === 'pending').length;
    const sent = remindersData.filter(r => r.status === 'sent').length;
    const totalAmount = remindersData.reduce((sum, r) => sum + Number(r.amount), 0);

    setStats({
      total: remindersData.length,
      pending,
      sent,
      totalAmount,
    });
  };

  const getReminderIcon = (type: string) => {
    const icons: Record<string, any> = {
      due_fee: <DollarSign className="w-5 h-5 text-amber-400" />,
      payment_pending: <AlertCircle className="w-5 h-5 text-red-400" />,
      overdue: <Clock className="w-5 h-5 text-red-400" />,
      custom: <Bell className="w-5 h-5 text-cyan-400" />,
    };
    return icons[type] || icons.custom;
  };

  const getStatusVariant = (status: string) => {
    const variants: Record<string, 'info' | 'success' | 'warning' | 'error' | 'default'> = {
      pending: 'warning',
      sent: 'info',
      acknowledged: 'success',
      dismissed: 'default',
    };
    return variants[status] || 'default';
  };

  const sendReminder = async (reminderId: string) => {
    await supabase
      .from('payment_reminders')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', reminderId);

    fetchReminders();
  };

  const dismissReminder = async (reminderId: string) => {
    await supabase
      .from('payment_reminders')
      .update({ status: 'dismissed' })
      .eq('id', reminderId);

    fetchReminders();
  };

  const filteredReminders = reminders.filter((reminder) => {
    if (filter === 'all') return true;
    return reminder.status === filter;
  });

  return (
    <DashboardLayout activeItem={activeNav} onItemClick={setActiveNav}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Payment Reminders</h1>
            <p className="text-gray-400 mt-1">
              {profile?.role === 'admin' ? 'Manage automated payment reminders' : 'Your payment notifications'}
            </p>
          </div>
          {profile?.role === 'admin' && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Create Reminder
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        {profile?.role === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="!p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Reminders</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
            </Card>

            <Card className="!p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-400" />
                </div>
              </div>
            </Card>

            <Card className="!p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Sent</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.sent}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </Card>

            <Card className="!p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Amount</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    ${stats.totalAmount.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-pink-400" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-4">
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'sent', label: 'Sent' },
              { value: 'acknowledged', label: 'Acknowledged' },
              { value: 'dismissed', label: 'Dismissed' },
            ]}
          />
        </div>

        {/* Reminders List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="!p-5 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-700 rounded w-1/2" />
              </Card>
            ))}
          </div>
        ) : filteredReminders.length === 0 ? (
          <Card className="!p-8 text-center">
            <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No payment reminders found</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReminders.map((reminder) => {
              const daysUntilDue = reminder.due_date
                ? Math.ceil((new Date(reminder.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <Card
                  key={reminder.id}
                  className={`!p-5 ${
                    reminder.status === 'pending' ? 'border-amber-500/30 bg-amber-500/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      reminder.status === 'pending'
                        ? 'bg-amber-500/20'
                        : 'bg-gray-800'
                    }`}>
                      {getReminderIcon(reminder.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-white text-lg">{reminder.title}</h3>
                          {reminder.students && (
                            <p className="text-sm text-cyan-400">
                              {reminder.students.profiles?.full_name} ({reminder.students.student_id})
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusVariant(reminder.status)}>
                            {reminder.status}
                          </Badge>
                          <Badge variant="default" size="sm">
                            {reminder.type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-gray-400 text-sm mt-2">{reminder.message}</p>

                      <div className="flex items-center gap-6 mt-4 text-sm">
                        {reminder.amount > 0 && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-pink-400" />
                            <span className="text-white font-semibold">${reminder.amount}</span>
                          </div>
                        )}
                        {reminder.due_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className={daysUntilDue !== null && daysUntilDue < 0 ? 'text-red-400' : 'text-gray-400'}>
                              Due: {new Date(reminder.due_date).toLocaleDateString()}
                              {daysUntilDue !== null && (
                                <span className="ml-1 text-xs">
                                  ({daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days left`})
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                        {reminder.sent_at && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <Send className="w-4 h-4" />
                            <span>Sent: {new Date(reminder.sent_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {profile?.role === 'admin' && reminder.status === 'pending' && (
                        <Button size="sm" onClick={() => sendReminder(reminder.id)}>
                          <Mail className="w-4 h-4 mr-1" />
                          Send
                        </Button>
                      )}
                      {reminder.status === 'pending' && profile?.role === 'student' && (
                        <Button variant="ghost" size="sm" onClick={() => dismissReminder(reminder.id)}>
                          Dismiss
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Reminder Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Payment Reminder"
        size="lg"
      >
        <ReminderForm
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchReminders();
          }}
        />
      </Modal>
    </DashboardLayout>
  );
}

// Reminder Form Component
function ReminderForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    student_id: '',
    title: '',
    message: '',
    type: 'due_fee',
    amount: 0,
    due_date: '',
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('students')
      .select(`
        id,
        student_id,
        profiles (full_name)
      `)
      .limit(100);

    if (data) {
      setStudents(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('payment_reminders').insert({
        ...formData,
        due_date: formData.due_date || null,
      });

      if (!error) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Student"
        value={formData.student_id}
        onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
        options={[
          { value: '', label: 'Select student' },
          ...students.map((s: any) => ({
            value: s.id,
            label: `${s.profiles?.full_name} (${s.student_id})`,
          })),
        ]}
        required
      />

      <Input
        label="Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Reminder title"
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Message</label>
        <textarea
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Reminder message"
          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          options={[
            { value: 'due_fee', label: 'Due Fee' },
            { value: 'payment_pending', label: 'Payment Pending' },
            { value: 'overdue', label: 'Overdue' },
            { value: 'custom', label: 'Custom' },
          ]}
        />
        <Input
          label="Amount ($)"
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
          min="0"
          step="0.01"
        />
      </div>

      <Input
        label="Due Date"
        type="date"
        value={formData.due_date}
        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
      />

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" isLoading={loading} className="flex-1">
          Create Reminder
        </Button>
      </div>
    </form>
  );
}
