import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Chart, Badge, ProgressBar } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Users,
  DollarSign,
  TrendingUp,
  BookOpen,
  CreditCard,
  UserCheck,
  UserX,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface StatCard {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatCard[]>([]);
  const [revenueData, setRevenueData] = useState<Record<string, unknown>[]>([]);
  const [studentEngagement, setStudentEngagement] = useState<Record<string, unknown>[]>([]);
  const [courseDistribution, setCourseDistribution] = useState<Record<string, unknown>[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [topCourses, setTopCourses] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      // Count students
      const { count: totalStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      // Count courses
      const { count: totalCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      // Get payments
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const completedPayments = payments?.filter(p => p.status === 'completed') || [];

      // Get enrollments
      const { count: totalEnrollments } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true });

      // Active students this month
      const { data: activeStudents } = await supabase
        .from('students')
        .select('id')
        .eq('status', 'active');

      // Set stats
      setStats([
        {
          title: 'Total Students',
          value: totalStudents || 0,
          change: 12,
          icon: <Users className="w-6 h-6" />,
          color: 'cyan',
        },
        {
          title: 'Total Revenue',
          value: `$${totalRevenue.toLocaleString()}`,
          change: 8.5,
          icon: <DollarSign className="w-6 h-6" />,
          color: 'emerald',
        },
        {
          title: 'Active Courses',
          value: totalCourses || 0,
          change: 5,
          icon: <BookOpen className="w-6 h-6" />,
          color: 'blue',
        },
        {
          title: 'Total Enrollments',
          value: totalEnrollments || 0,
          change: -2,
          icon: <TrendingUp className="w-6 h-6" />,
          color: 'pink',
        },
      ]);

      // Revenue by month (mock data for chart)
      setRevenueData([
        { name: 'Jan', revenue: 12000, students: 45 },
        { name: 'Feb', revenue: 15000, students: 52 },
        { name: 'Mar', revenue: 18000, students: 61 },
        { name: 'Apr', revenue: 22000, students: 78 },
        { name: 'May', revenue: 28000, students: 89 },
        { name: 'Jun', revenue: 32000, students: 95 },
      ]);

      // Student engagement by category
      setStudentEngagement([
        { name: 'Week 1', engagement: 85 },
        { name: 'Week 2', engagement: 78 },
        { name: 'Week 3', engagement: 92 },
        { name: 'Week 4', engagement: 88 },
      ]);

      // Course distribution by category
      setCourseDistribution([
        { name: 'Web Development', value: 35 },
        { name: 'Data Science', value: 25 },
        { name: 'Mobile Dev', value: 20 },
        { name: 'Design', value: 15 },
        { name: 'Business', value: 5 },
      ]);

      // Recent payments
      if (payments && payments.length > 0) {
        const recent = await Promise.all(
          payments.slice(0, 5).map(async (payment) => {
            const { data: student } = await supabase
              .from('students')
              .select('user_id, profiles (full_name)')
              .eq('id', payment.student_id)
              .single();

            return {
              ...payment,
              student_name: (student?.profiles as any)?.full_name || 'Unknown',
            };
          })
        );
        setRecentPayments(recent);
      }

      // Top courses by enrollment
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id, courses (id, title, thumbnail_url)');

      if (enrollments) {
        const courseCounts: Record<string, { count: number; title: string; thumbnail: string }> = {};
        enrollments.forEach((e: any) => {
          if (e.courses) {
            const id = e.courses.id;
            if (!courseCounts[id]) {
              courseCounts[id] = {
                count: 0,
                title: e.courses.title,
                thumbnail: e.courses.thumbnail_url,
              };
            }
            courseCounts[id].count++;
          }
        });

        const sorted = Object.entries(courseCounts)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 5)
          .map(([id, data]) => ({ id, ...data }));

        setTopCourses(sorted);
      }
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const colorMap: Record<string, string> = {
    cyan: 'bg-cyan-500/20 text-cyan-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    blue: 'bg-blue-500/20 text-blue-400',
    pink: 'bg-pink-500/20 text-pink-400',
  };

  return (
    <DashboardLayout activeItem={activeNav} onItemClick={setActiveNav}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">Overview of platform metrics and analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm">
              Export Report
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="!p-5">
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[stat.color]}`}>
                  {stat.icon}
                </div>
                {stat.change !== undefined && (
                  <div className={`flex items-center gap-1 text-sm ${stat.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {stat.change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    <span>{Math.abs(stat.change)}%</span>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-gray-400 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">Revenue Overview</h2>
              <p className="text-gray-400 text-sm mt-1">Monthly revenue and student enrollment</p>
            </div>
            <Chart type="area" data={revenueData} dataKey="revenue" xKey="name" height={250} />
          </Card>

          {/* Course Distribution */}
          <Card>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">Course Distribution</h2>
              <p className="text-gray-400 text-sm mt-1">Enrollments by category</p>
            </div>
            <Chart type="pie" data={courseDistribution} dataKey="value" height={250} />
          </Card>
        </div>

        {/* Student Engagement & Top Courses */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Engagement */}
          <Card className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">Student Engagement</h2>
              <p className="text-gray-400 text-sm mt-1">Weekly activity levels</p>
            </div>
            <Chart type="line" data={studentEngagement} dataKey="engagement" xKey="name" height={250} />
          </Card>

          {/* Top Courses */}
          <Card padding="none">
            <div className="p-5 border-b border-gray-700/50">
              <h2 className="text-lg font-semibold text-white">Top Courses</h2>
              <p className="text-gray-400 text-sm mt-1">By enrollment count</p>
            </div>
            <div className="p-4 space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-gray-700/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : topCourses.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No courses yet</p>
              ) : (
                topCourses.map((course, index) => (
                  <div
                    key={course.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{course.title}</p>
                      <p className="text-sm text-gray-400">{course.count} enrollments</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Recent Payments */}
        <Card padding="none">
          <div className="p-5 border-b border-gray-700/50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Recent Payments</h2>
              <button
                onClick={() => {
                  setActiveNav('payments');
                  navigate('/payments');
                }}
                className="text-sm text-cyan-400 hover:text-cyan-300"
              >
                View All
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Transaction ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">Loading...</td>
                  </tr>
                ) : recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">No payments yet</td>
                  </tr>
                ) : (
                  recentPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-300">{payment.transaction_id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-white">{payment.student_name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-white">${Number(payment.amount).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="default">{payment.payment_type}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            payment.status === 'completed' ? 'success' :
                            payment.status === 'failed' ? 'error' :
                            payment.status === 'refunded' ? 'warning' : 'info'
                          }
                        >
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
