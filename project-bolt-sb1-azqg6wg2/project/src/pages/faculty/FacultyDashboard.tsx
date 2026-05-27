import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Chart, Badge, ProgressBar, Button } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  BookOpen,
  Users,
  ClipboardList,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Video,
  FileText,
  UserCheck,
  Award
} from 'lucide-react';

interface AssignedCourse {
  id: string;
  title: string;
  thumbnail_url: string;
  category: string;
  level: string;
  student_count: number;
}

interface Student {
  id: string;
  student_id: string;
  user_id: string;
  profiles: {
    full_name: string;
    email: string;
    avatar_url: string;
  };
  attendance_percentage: number;
  progress: number;
}

interface Assignment {
  id: string;
  title: string;
  due_date: string;
  course_id: string;
  courses: {
    title: string;
  };
  submission_count: number;
  total_students: number;
}

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [assignedCourses, setAssignedCourses] = useState<AssignedCourse[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [performanceData, setPerformanceData] = useState<Record<string, unknown>[]>([]);
  const [liveClassesToday, setLiveClassesToday] = useState(0);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, late: 0 });
  const [submissionsPending, setSubmissionsPending] = useState(0);
  const [gradingProgress, setGradingProgress] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    if (profile) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      // Fetch courses taught by this faculty
      const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', profile?.id);

      if (courses) {
        const coursesWithStudents = await Promise.all(
          courses.map(async (course) => {
            const { count } = await supabase
              .from('enrollments')
              .select('*', { count: 'exact', head: true })
              .eq('course_id', course.id);

            return {
              ...course,
              student_count: count || 0,
            };
          })
        );
        setAssignedCourses(coursesWithStudents);
      }

      // Fetch students enrolled in faculty's courses
      if (courses && courses.length > 0) {
        const courseIds = courses.map(c => c.id);

        const { data: enrollments } = await supabase
          .from('enrollments')
          .select(`
            student_id,
            progress,
            students (
              id,
              student_id,
              user_id,
              profiles (full_name, email, avatar_url)
            )
          `)
          .in('course_id', courseIds)
          .limit(10);

        if (enrollments) {
          const studentsWithAttendance = await Promise.all(
            enrollments.map(async (e: any) => {
              const { data: attendance } = await supabase
                .from('attendance')
                .select('status')
                .eq('student_id', e.student_id);

              const present = attendance?.filter(a => a.status === 'present').length || 0;
              const total = attendance?.length || 1;
              const attendancePct = (present / total) * 100;

              return {
                ...e.students,
                attendance_percentage: Math.round(attendancePct),
                progress: e.progress || 0,
              };
            })
          );
          setStudents(studentsWithAttendance);
        }

        // Fetch assignments for these courses
        const { data: assignmentsData } = await supabase
          .from('assignments')
          .select(`
            id,
            title,
            due_date,
            course_id,
            courses (title)
          `)
          .in('course_id', courseIds)
          .order('due_date', { ascending: true })
          .limit(5);

        if (assignmentsData) {
          const assignmentsWithCounts = await Promise.all(
            assignmentsData.map(async (a) => {
              const { count: studentCount } = await supabase
                .from('enrollments')
                .select('*', { count: 'exact', head: true })
                .eq('course_id', a.course_id);

              const { count: submissionCount } = await supabase
                .from('submissions')
                .select('*', { count: 'exact', head: true })
                .eq('assignment_id', a.id);

              return {
                ...a,
                total_students: studentCount || 0,
                submission_count: submissionCount || 0,
              };
            })
          );
          setAssignments(assignmentsWithCounts);
        }
      }

      // Performance data (mock for now)
      setPerformanceData([
        { name: 'Excellent', value: 35 },
        { name: 'Good', value: 40 },
        { name: 'Average', value: 18 },
        { name: 'Below Avg', value: 7 },
      ]);

      // Grading progress data
      setGradingProgress([
        { name: 'Week 1', graded: 90, pending: 10 },
        { name: 'Week 2', graded: 75, pending: 25 },
        { name: 'Week 3', graded: 85, pending: 15 },
        { name: 'Week 4', graded: 80, pending: 20 },
      ]);

      // Count live classes today
      if (profile?.id) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { count: liveClassesCount } = await supabase
          .from('live_classes')
          .select('*', { count: 'exact', head: true })
          .eq('instructor_id', profile.id)
          .gte('scheduled_at', today.toISOString())
          .lt('scheduled_at', tomorrow.toISOString());

        setLiveClassesToday(liveClassesCount || 0);
      }

      // Get pending submissions count
      if (courses && courses.length > 0) {
        const courseIds = courses.map(c => c.id);
        const { data: allAssignments } = await supabase
          .from('assignments')
          .select('id')
          .in('course_id', courseIds);

        if (allAssignments && allAssignments.length > 0) {
          const assignmentIds = allAssignments.map(a => a.id);
          const { count: pendingCount } = await supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .in('assignment_id', assignmentIds)
            .eq('status', 'submitted');

          setSubmissionsPending(pendingCount || 0);
        }
      }

      // Mock attendance stats
      setAttendanceStats({ present: 85, absent: 10, late: 5 });
    } catch (error) {
      console.error('Error fetching faculty dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (date: string) => {
    const diff = new Date(date).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <DashboardLayout activeItem={activeNav} onItemClick={setActiveNav}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Faculty Dashboard</h1>
            <p className="text-gray-400 mt-1">Manage your classes and track student performance</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="!p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">My Courses</p>
                <p className="text-2xl font-bold text-white mt-1">{assignedCourses.length}</p>
              </div>
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
          </Card>

          <Card className="!p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Students</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {assignedCourses.reduce((sum, c) => sum + c.student_count, 0)}
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
                <p className="text-gray-400 text-sm">Live Classes Today</p>
                <p className="text-2xl font-bold text-white mt-1">{liveClassesToday}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Video className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </Card>

          <Card className="!p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Reviews</p>
                <p className="text-2xl font-bold text-white mt-1">{submissionsPending}</p>
              </div>
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </Card>

          <Card className="!p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg. Attendance</p>
                <p className="text-2xl font-bold text-white mt-1">{attendanceStats.present}%</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assigned Courses */}
          <div className="lg:col-span-2">
            <Card padding="none">
              <div className="p-5 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">My Courses</h2>
                  <button
                    onClick={() => {
                      setActiveNav('courses');
                      navigate('/courses');
                    }}
                    className="text-sm text-cyan-400 hover:text-cyan-300"
                  >
                    Manage All
                  </button>
                </div>
              </div>
              <div className="p-5">
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-48 bg-gray-800/50 rounded-xl animate-pulse" />
                    <div className="h-48 bg-gray-800/50 rounded-xl animate-pulse" />
                  </div>
                ) : assignedCourses.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No courses assigned yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignedCourses.map((course) => (
                      <div
                        key={course.id}
                        onClick={() => navigate(`/courses/${course.id}`)}
                        className="bg-gray-800/50 rounded-xl overflow-hidden hover:bg-gray-800 transition-colors cursor-pointer group"
                      >
                        <div className="h-32 relative">
                          <img
                            src={course.thumbnail_url || 'https://images.pexels.com/photos/373545/pexels-photo-373545.jpeg'}
                            alt={course.title}
                            className="w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                            <Badge variant="info" size="sm">{course.level}</Badge>
                            <span className="text-sm text-gray-300">{course.student_count} students</span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-white mb-1">{course.title}</h3>
                          <p className="text-sm text-gray-400">{course.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Student Performance Distribution */}
          <Card>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">Performance Overview</h2>
              <p className="text-gray-400 text-sm mt-1">Student performance distribution</p>
            </div>
            <Chart type="pie" data={performanceData} dataKey="value" height={200} />
          </Card>
        </div>

        {/* Assignments & Students */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Assignments */}
          <Card padding="none">
            <div className="p-5 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Assignment Review</h2>
                <button
                  onClick={() => {
                    setActiveNav('assignments');
                    navigate('/assignments');
                  }}
                  className="text-sm text-cyan-400 hover:text-cyan-300"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {loading ? (
                <p className="text-gray-400 text-sm text-center py-4">Loading...</p>
              ) : assignments.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No assignments</p>
              ) : (
                assignments.map((assignment) => {
                  const days = getDaysRemaining(assignment.due_date);
                  const submissionRate = assignment.total_students > 0
                    ? Math.round((assignment.submission_count / assignment.total_students) * 100)
                    : 0;

                  return (
                    <div
                      key={assignment.id}
                      onClick={() => navigate(`/assignments/${assignment.id}`)}
                      className="p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-white">{assignment.title}</h3>
                          <p className="text-sm text-gray-400">{assignment.courses?.title}</p>
                        </div>
                        <Badge variant={days <= 1 ? 'error' : days <= 3 ? 'warning' : 'info'}>
                          {days > 0 ? `${days}d left` : 'Past due'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span className="text-gray-300">{assignment.submission_count} submitted</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-400">{assignment.total_students - assignment.submission_count} pending</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <ProgressBar value={submissionRate} showLabel label="Submission rate" size="sm" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Student Performance */}
          <Card padding="none">
            <div className="p-5 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Student Performance</h2>
                <button
                  onClick={() => {
                    setActiveNav('students');
                    navigate('/students');
                  }}
                  className="text-sm text-cyan-400 hover:text-cyan-300"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {loading ? (
                <p className="text-gray-400 text-sm text-center py-4">Loading...</p>
              ) : students.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No students enrolled</p>
              ) : (
                students.slice(0, 5).map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {student.profiles?.full_name?.charAt(0) || 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{student.profiles?.full_name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400">Progress: {Math.round(student.progress)}%</span>
                        <span className="text-xs text-gray-400">Attendance: {student.attendance_percentage}%</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={student.progress >= 70 ? 'success' : student.progress >= 40 ? 'warning' : 'error'}
                        size="sm"
                      >
                        {student.progress >= 70 ? 'On Track' : student.progress >= 40 ? 'Needs Help' : 'At Risk'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
