import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Badge, Modal, Input, Select, Chart, ProgressBar } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Users,
  Calendar,
  TrendingUp,
  Plus,
  UserPlus,
  Clock,
  BookOpen,
  Award
} from 'lucide-react';

interface Batch {
  id: string;
  name: string;
  description: string;
  department: string;
  year: string;
  start_date: string;
  end_date: string;
  capacity: number;
  status: string;
  student_count?: number;
  avg_progress?: number;
  attendance_rate?: number;
}

interface Student {
  id: string;
  student_id: string;
  profiles: {
    full_name: string;
    email: string;
  };
  attendance_rate?: number;
  progress?: number;
}

export default function BatchesPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeNav, setActiveNav] = useState('batches');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [batchStudents, setBatchStudents] = useState<Student[]>([]);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, [profile]);

  const fetchBatches = async () => {
    try {
      const { data } = await supabase
        .from('batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        const batchesWithStats = await Promise.all(
          data.map(async (batch) => {
            const { count: studentCount } = await supabase
              .from('batch_students')
              .select('*', { count: 'exact', head: true })
              .eq('batch_id', batch.id);

            return {
              ...batch,
              student_count: studentCount || 0,
            };
          })
        );
        setBatches(batchesWithStats);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchStudents = async (batchId: string) => {
    try {
      const { data } = await supabase
        .from('batch_students')
        .select(`
          students (
            id,
            student_id,
            profiles (full_name, email)
          )
        `)
        .eq('batch_id', batchId);

      if (data) {
        const students = data.map((bs: any) => ({
          id: bs.students.id,
          student_id: bs.students.student_id,
          profiles: bs.students.profiles,
        }));
        setBatchStudents(students);
      }
    } catch (error) {
      console.error('Error fetching batch students:', error);
    }
  };

  const getBatchAnalyticsData = () => {
    return [
      { name: 'Week 1', progress: 65, attendance: 88 },
      { name: 'Week 2', progress: 72, attendance: 92 },
      { name: 'Week 3', progress: 78, attendance: 85 },
      { name: 'Week 4', progress: 85, attendance: 90 },
    ];
  };

  return (
    <DashboardLayout activeItem={activeNav} onItemClick={setActiveNav}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Batch Management</h1>
            <p className="text-gray-400 mt-1">Create and manage student batches</p>
          </div>
          {profile?.role === 'admin' && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Create Batch
            </Button>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="!p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Batches</p>
                <p className="text-2xl font-bold text-white mt-1">{batches.length}</p>
              </div>
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
          </Card>

          <Card className="!p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Batches</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {batches.filter(b => b.status === 'active').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </Card>

          <Card className="!p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Students</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {batches.reduce((sum, b) => sum + (b.student_count || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="!p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Departments</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {new Set(batches.map(b => b.department).filter(Boolean)).size}
                </p>
              </div>
              <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-pink-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Batches Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="!p-5 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-700 rounded w-1/2" />
              </Card>
            ))}
          </div>
        ) : batches.length === 0 ? (
          <Card className="!p-8 text-center">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No batches created yet</p>
            {profile?.role === 'admin' && (
              <Button onClick={() => setShowCreateModal(true)} className="mt-4">
                Create First Batch
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((batch) => (
              <Card
                key={batch.id}
                className="!p-5 hover:border-cyan-500/30 transition-all cursor-pointer group"
                onClick={() => {
                  setSelectedBatch(batch);
                  fetchBatchStudents(batch.id);
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <Badge
                    variant={batch.status === 'active' ? 'success' : batch.status === 'completed' ? 'default' : 'warning'}
                  >
                    {batch.status}
                  </Badge>
                  <div className="text-sm text-gray-400">
                    {batch.year}
                  </div>
                </div>

                <h3 className="font-semibold text-white text-lg mb-1 group-hover:text-cyan-400 transition-colors">
                  {batch.name}
                </h3>

                {batch.department && (
                  <p className="text-sm text-cyan-400 mb-2">{batch.department}</p>
                )}

                <p className="text-sm text-gray-400 line-clamp-2 mb-4">{batch.description}</p>

                {/* Student Count Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-400">Students</span>
                    <span className="text-white">{batch.student_count || 0}/{batch.capacity}</span>
                  </div>
                  <ProgressBar
                    value={batch.student_count || 0}
                    max={batch.capacity}
                    size="sm"
                    variant="gradient"
                  />
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-400 pt-3 border-t border-gray-700/50">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {batch.start_date
                        ? new Date(batch.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                        : 'TBD'}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Batch Details Modal */}
      <Modal
        isOpen={!!selectedBatch}
        onClose={() => {
          setSelectedBatch(null);
          setBatchStudents([]);
        }}
        title={selectedBatch?.name}
        size="xl"
      >
        {selectedBatch && (
          <div className="space-y-6">
            {/* Batch Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-gray-400 text-sm">Department</p>
                <p className="text-white font-medium mt-1">{selectedBatch.department || '-'}</p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-gray-400 text-sm">Year</p>
                <p className="text-white font-medium mt-1">{selectedBatch.year || '-'}</p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-gray-400 text-sm">Students</p>
                <p className="text-white font-medium mt-1">
                  {selectedBatch.student_count || 0}/{selectedBatch.capacity}
                </p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-gray-400 text-sm">Status</p>
                <p className="text-white font-medium mt-1 capitalize">{selectedBatch.status}</p>
              </div>
            </div>

            {/* Analytics Chart */}
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Batch Performance</h3>
              <Chart
                type="line"
                data={getBatchAnalyticsData()}
                dataKey="progress"
                xKey="name"
                height={200}
              />
            </Card>

            {/* Students List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Students</h3>
                {profile?.role === 'admin' && (
                  <Button size="sm" onClick={() => setShowAddStudentModal(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Student
                  </Button>
                )}
              </div>

              {batchStudents.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No students in this batch</p>
              ) : (
                <div className="space-y-2">
                  {batchStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {student.profiles?.full_name?.charAt(0) || 'S'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white">{student.profiles?.full_name}</p>
                        <p className="text-sm text-gray-400">{student.student_id}</p>
                      </div>
                      <Badge variant="info" size="sm">{student.profiles?.email}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="ghost" onClick={() => setSelectedBatch(null)} className="flex-1">
                Close
              </Button>
              <Button onClick={() => navigate(`/batches/${selectedBatch.id}/timetable`)} className="flex-1">
                <Calendar className="w-4 h-4 mr-2" />
                View Timetable
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Batch Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Batch"
        size="lg"
      >
        <BatchForm
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchBatches();
          }}
        />
      </Modal>
    </DashboardLayout>
  );
}

// Batch Form Component
function BatchForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department: '',
    year: '',
    start_date: '',
    end_date: '',
    capacity: 50,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('batches').insert({
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        created_by: profile?.id,
      });

      if (!error) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating batch:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Batch Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="e.g., Batch 2024-A"
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Batch description (optional)"
          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Department"
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          placeholder="e.g., Computer Science"
        />
        <Input
          label="Year"
          value={formData.year}
          onChange={(e) => setFormData({ ...formData, year: e.target.value })}
          placeholder="e.g., 2024"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Start Date"
          type="date"
          value={formData.start_date}
          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
        />
        <Input
          label="End Date"
          type="date"
          value={formData.end_date}
          onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
        />
      </div>

      <Input
        label="Capacity"
        type="number"
        value={formData.capacity}
        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
        required
      />

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" isLoading={loading} className="flex-1">
          Create Batch
        </Button>
      </div>
    </form>
  );
}
