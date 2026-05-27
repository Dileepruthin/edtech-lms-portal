import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Badge, Select, EmptyState } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ClipboardList, Clock, CheckCircle, AlertCircle, Upload, FileText } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  max_score: number;
  file_url: string;
  course_id: string;
  courses: {
    id: string;
    title: string;
  };
  submission?: {
    id: string;
    score: number | null;
    status: string;
    feedback: string;
    submitted_at: string;
  };
}

export default function AssignmentsPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeNav, setActiveNav] = useState('assignments');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (profile) {
      fetchAssignments();
    }
  }, [profile]);

  const fetchAssignments = async () => {
    try {
      if (profile?.role === 'student') {
        // Get student's enrolled courses
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', profile.id)
          .single();

        if (!studentData) {
          setLoading(false);
          return;
        }

        // Get enrollments
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('student_id', studentData.id);

        if (enrollments && enrollments.length > 0) {
          const courseIds = enrollments.map(e => e.course_id);

          // Get assignments for those courses
          const { data: assignmentsData } = await supabase
            .from('assignments')
            .select(`
              *,
              courses (id, title)
            `)
            .in('course_id', courseIds)
            .order('due_date', { ascending: true });

          if (assignmentsData) {
            // Get submissions for these assignments
            const assignmentsWithSubmissions = await Promise.all(
              assignmentsData.map(async (assignment) => {
                const { data: submission } = await supabase
                  .from('submissions')
                  .select('*')
                  .eq('assignment_id', assignment.id)
                  .eq('student_id', studentData.id)
                  .maybeSingle();

                return {
                  ...assignment,
                  submission: submission || undefined,
                };
              })
            );
            setAssignments(assignmentsWithSubmissions);
          }
        }
      } else if (profile?.role === 'faculty' || profile?.role === 'admin') {
        // Faculty/Admin see all assignments for their courses
        let query = supabase
          .from('assignments')
          .select(`
            *,
            courses (id, title)
          `)
          .order('due_date', { ascending: true });

        if (profile.role === 'faculty') {
          const { data: courses } = await supabase
            .from('courses')
            .select('id')
            .eq('instructor_id', profile.id);

          if (courses && courses.length > 0) {
            query = query.in('course_id', courses.map(c => c.id));
          }
        }

        const { data } = await query;
        if (data) {
          setAssignments(data);
        }
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (date: string) => {
    const diff = new Date(date).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const filteredAssignments = assignments.filter((assignment) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'submitted') return assignment.submission?.status === 'submitted';
    if (statusFilter === 'graded') return assignment.submission?.status === 'graded';
    if (statusFilter === 'pending') return !assignment.submission;
    if (statusFilter === 'overdue') return getDaysRemaining(assignment.due_date) < 0 && !assignment.submission;
    return true;
  });

  return (
    <DashboardLayout activeItem={activeNav} onItemClick={setActiveNav}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Assignments</h1>
            <p className="text-gray-400 mt-1">
              {profile?.role === 'student' ? 'View and submit your assignments' : 'Manage and review assignments'}
            </p>
          </div>
          {(profile?.role === 'faculty' || profile?.role === 'admin') && (
            <Button onClick={() => navigate('/assignments/new')}>
              Create Assignment
            </Button>
          )}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Assignments' },
              { value: 'pending', label: 'Pending' },
              { value: 'submitted', label: 'Submitted' },
              { value: 'graded', label: 'Graded' },
              { value: 'overdue', label: 'Overdue' },
            ]}
          />
        </div>

        {/* Assignments List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="!p-5 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-1/4 mb-3" />
                <div className="h-4 bg-gray-700 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-700 rounded w-3/4" />
              </Card>
            ))}
          </div>
        ) : filteredAssignments.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="w-8 h-8" />}
            title="No assignments found"
            description={statusFilter !== 'all' ? 'Try changing your filter' : 'No assignments available yet'}
          />
        ) : (
          <div className="space-y-4">
            {filteredAssignments.map((assignment) => {
              const days = getDaysRemaining(assignment.due_date);
              const isOverdue = days < 0 && !assignment.submission;
              const isUpcoming = days >= 0 && days <= 3;

              return (
                <Card
                  key={assignment.id}
                  className="!p-5 hover:border-cyan-500/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/assignments/${assignment.id}`)}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        assignment.submission?.status === 'graded'
                          ? 'bg-emerald-500/20'
                          : isOverdue
                            ? 'bg-red-500/20'
                            : isUpcoming
                              ? 'bg-amber-500/20'
                              : 'bg-cyan-500/20'
                      }`}>
                        {assignment.submission?.status === 'graded' ? (
                          <CheckCircle className="w-6 h-6 text-emerald-400" />
                        ) : isOverdue ? (
                          <AlertCircle className="w-6 h-6 text-red-400" />
                        ) : (
                          <ClipboardList className={`w-6 h-6 ${
                            isUpcoming ? 'text-amber-400' : 'text-cyan-400'
                          }`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white text-lg">{assignment.title}</h3>
                          {assignment.submission && (
                            <Badge
                              variant={assignment.submission.status === 'graded' ? 'success' : 'info'}
                              size="sm"
                            >
                              {assignment.submission.status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-300 mb-2">{assignment.courses?.title}</p>
                        <p className="text-sm text-gray-400 line-clamp-2">{assignment.description}</p>

                        {/* File attachment indicator */}
                        {assignment.file_url && (
                          <div className="flex items-center gap-2 mt-3 text-sm text-gray-400">
                            <FileText className="w-4 h-4" />
                            <span>Attachment available</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end gap-2">
                      <Badge
                        variant={
                          isOverdue ? 'error' :
                          isUpcoming ? 'warning' :
                          'default'
                        }
                      >
                        {isOverdue ? `${Math.abs(days)} days overdue` : `${days} days left`}
                      </Badge>
                      <span className="text-sm text-gray-400">
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </span>
                      {assignment.submission ? (
                        <div className="text-right">
                          {assignment.submission.score !== null && (
                            <p className="text-lg font-semibold text-white">
                              {assignment.submission.score}/{assignment.max_score}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            Submitted {new Date(assignment.submission.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                      ) : profile?.role === 'student' && (
                        <Button size="sm" className="mt-2">
                          <Upload className="w-4 h-4 mr-2" />
                          Submit
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
    </DashboardLayout>
  );
}
