import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, ProgressBar, Badge, CardSkeleton } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { BookOpen, Clock, TrendingUp, Award, Calendar, Bell, Play } from 'lucide-react';

interface EnrolledCourse {
  id: string;
  courses: {
    id: string;
    title: string;
    thumbnail_url: string;
    category: string;
    level: string;
  };
  progress: number;
  status: string;
}

interface UpcomingAssignment {
  id: string;
  title: string;
  due_date: string;
  courses: {
    title: string;
  };
}

interface Certificate {
  id: string;
  certificate_id: string;
  issued_at: string;
  courses: {
    title: string;
  };
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  read: boolean;
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [assignments, setAssignments] = useState<UpcomingAssignment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalProgress: 0,
    attendancePercentage: 0,
  });

  useEffect(() => {
    if (profile) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      // Get student ID
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', profile?.id)
        .single();

      if (!studentData) {
        setLoading(false);
        return;
      }

      const studentId = studentData.id;

      // Fetch enrolled courses
      const { data: courses } = await supabase
        .from('enrollments')
        .select(`
          id,
          progress,
          status,
          courses (
            id,
            title,
            thumbnail_url,
            category,
            level
          )
        `)
        .eq('student_id', studentId)
        .order('enrolled_at', { ascending: false })
        .limit(4);

      if (courses) setEnrolledCourses(courses);

      // Fetch upcoming assignments
      const { data: assignmentData } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          due_date,
          courses ( title )
        `)
        .gt('due_date', new Date().toISOString())
        .order('due_date', { ascending: true })
        .limit(5);

      if (assignmentData) setAssignments(assignmentData);

      // Fetch certificates
      const { data: certData } = await supabase
        .from('certificates')
        .select(`
          id,
          certificate_id,
          issued_at,
          courses ( title )
        `)
        .eq('student_id', studentId)
        .order('issued_at', { ascending: false })
        .limit(3);

      if (certData) setCertificates(certData);

      // Fetch notifications
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (notifs) setNotifications(notifs);

      // Calculate stats
      const completed = courses?.filter(c => c.status === 'completed').length || 0;
      const avgProgress = courses?.length
        ? courses.reduce((acc, c) => acc + Number(c.progress || 0), 0) / courses.length
        : 0;

      // Get attendance
      const { data: attendance } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', studentId);

      const presentCount = attendance?.filter(a => a.status === 'present').length || 0;
      const attendancePct = attendance?.length ? (presentCount / attendance.length) * 100 : 0;

      setStats({
        totalCourses: courses?.length || 0,
        completedCourses: completed,
        totalProgress: avgProgress,
        attendancePercentage: Math.round(attendancePct),
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back, {profile?.full_name?.split(' ')[0]}!
            </h1>
            <p className="text-gray-400 mt-1">Here's your learning progress overview</p>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="!p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Enrolled Courses</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.totalCourses}</p>
              </div>
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
          </Card>

          <Card className="!p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Completed</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.completedCourses}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </Card>

          <Card className="!p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg. Progress</p>
                <p className="text-2xl font-bold text-white mt-1">{Math.round(stats.totalProgress)}%</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="!p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Attendance</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.attendancePercentage}%</p>
              </div>
              <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-pink-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Enrolled Courses */}
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
                    className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className="p-5">
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CardSkeleton />
                    <CardSkeleton />
                  </div>
                ) : enrolledCourses.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No enrolled courses yet</p>
                    <button
                      onClick={() => navigate('/courses')}
                      className="mt-4 text-sm text-cyan-400 hover:text-cyan-300"
                    >
                      Browse Courses
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {enrolledCourses.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className="bg-gray-800/50 rounded-xl overflow-hidden hover:bg-gray-800 transition-colors cursor-pointer"
                        onClick={() => navigate(`/courses/${enrollment.courses.id}`)}
                      >
                        <div className="h-32 bg-gradient-to-br from-gray-700 to-gray-800 relative">
                          <img
                            src={enrollment.courses.thumbnail_url}
                            alt={enrollment.courses.title}
                            className="w-full h-full object-cover opacity-60"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                          <div className="absolute bottom-3 left-3">
                            <Badge variant="info" size="sm">{enrollment.courses.level}</Badge>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-white mb-2">{enrollment.courses.title}</h3>
                          <ProgressBar
                            value={enrollment.progress || 0}
                            showLabel
                            label="Progress"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Assignments */}
            <Card padding="none">
              <div className="p-5 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Upcoming Assignments</h2>
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
                {assignments.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">No upcoming assignments</p>
                ) : (
                  assignments.map((assignment) => {
                    const days = getDaysRemaining(assignment.due_date);
                    return (
                      <div
                        key={assignment.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          days <= 1 ? 'bg-red-500/20' : days <= 3 ? 'bg-amber-500/20' : 'bg-cyan-500/20'
                        }`}>
                          <Clock className={`w-5 h-5 ${
                            days <= 1 ? 'text-red-400' : days <= 3 ? 'text-amber-400' : 'text-cyan-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{assignment.title}</p>
                          <p className="text-sm text-gray-400">{assignment.courses?.title}</p>
                          <p className={`text-xs mt-1 ${days <= 1 ? 'text-red-400' : days <= 3 ? 'text-amber-400' : 'text-gray-500'}`}>
                            Due in {days} day{days !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            {/* Recent Notifications */}
            <Card padding="none">
              <div className="p-5 border-b border-gray-700/50">
                <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
              </div>
              <div className="p-4 space-y-3">
                {notifications.filter(n => !n.read).slice(0, 3).map((notification) => (
                  <div key={notification.id} className="flex items-start gap-3 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                    <Bell className="w-5 h-5 text-cyan-400 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm">{notification.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{notification.message}</p>
                    </div>
                  </div>
                ))}
                {notifications.filter(n => !n.read).length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">All caught up!</p>
                )}
              </div>
            </Card>

            {/* Certificates */}
            {(certificates.length > 0 || loading) && (
              <Card padding="none">
                <div className="p-5 border-b border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Certificates</h2>
                    <button
                      onClick={() => navigate('/certificates')}
                      className="text-sm text-cyan-400 hover:text-cyan-300"
                    >
                      View All
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {certificates.slice(0, 2).map((cert) => (
                    <div
                      key={cert.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/10 transition-colors"
                    >
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <Award className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">{cert.courses?.title}</p>
                        <p className="text-xs text-gray-400">{cert.certificate_id}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
