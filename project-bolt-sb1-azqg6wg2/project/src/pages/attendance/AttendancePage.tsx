import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Chart, Badge, Select, Button, Input } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  UserCheck,
  UserX,
  Calendar,
  TrendingUp,
  Clock,
  Download,
  Filter
} from 'lucide-react';

interface AttendanceRecord {
  date: string;
  course_id: string;
  course_title: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes: string;
}

interface CourseAttendance {
  course_id: string;
  course_title: string;
  total_classes: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

export default function AttendancePage() {
  const { profile } = useAuth();
  const [activeNav, setActiveNav] = useState('attendance');
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [courseAttendance, setCourseAttendance] = useState<CourseAttendance[]>([]);
  const [monthlyData, setMonthlyData] = useState<Record<string, unknown>[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [markingMode, setMarkingMode] = useState(false);
  const [studentsToMark, setStudentsToMark] = useState<any[]>([]);

  useEffect(() => {
    fetchAttendanceData();
  }, [profile, selectedMonth]);

  const fetchAttendanceData = async () => {
    setLoading(true);

    // Dummy data for demo
    const dummyCourseAttendance: CourseAttendance[] = [
      {
        course_id: '1',
        course_title: 'Advanced React Development',
        total_classes: 24,
        present: 20,
        absent: 2,
        late: 2,
        percentage: 83,
      },
      {
        course_id: '2',
        course_title: 'Python for Data Science',
        total_classes: 32,
        present: 28,
        absent: 3,
        late: 1,
        percentage: 87,
      },
      {
        course_id: '3',
        course_title: 'Cloud Architecture',
        total_classes: 16,
        present: 15,
        absent: 1,
        late: 0,
        percentage: 94,
      },
    ];

    const dummyRecords: AttendanceRecord[] = [
      { date: '2024-01-15', course_id: '1', course_title: 'Advanced React Development', status: 'present', notes: '' },
      { date: '2024-01-14', course_id: '1', course_title: 'Advanced React Development', status: 'present', notes: '' },
      { date: '2024-01-13', course_id: '2', course_title: 'Python for Data Science', status: 'late', notes: '10 min late' },
      { date: '2024-01-12', course_id: '1', course_title: 'Advanced React Development', status: 'absent', notes: 'Medical leave' },
      { date: '2024-01-11', course_id: '3', course_title: 'Cloud Architecture', status: 'present', notes: '' },
    ];

    const dummyMonthlyData = [
      { name: 'Jan', present: 85, absent: 10, late: 5 },
      { name: 'Feb', present: 88, absent: 8, late: 4 },
      { name: 'Mar', present: 92, absent: 5, late: 3 },
      { name: 'Apr', present: 87, absent: 9, late: 4 },
      { name: 'May', present: 90, absent: 7, late: 3 },
    ];

    setCourseAttendance(dummyCourseAttendance);
    setAttendanceRecords(dummyRecords);
    setMonthlyData(dummyMonthlyData);
    setLoading(false);
  };

  const overallAttendance = courseAttendance.length > 0
    ? Math.round(courseAttendance.reduce((sum, c) => sum + c.percentage, 0) / courseAttendance.length)
    : 0;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
      present: 'success',
      absent: 'error',
      late: 'warning',
      excused: 'info',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-emerald-400';
    if (percentage >= 75) return 'text-cyan-400';
    if (percentage >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <DashboardLayout activeItem={activeNav} onItemClick={setActiveNav}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Attendance</h1>
            <p className="text-gray-400 mt-1">
              {profile?.role === 'student' ? 'Track your attendance records' : 'Manage student attendance'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={selectedMonth.toString()}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              options={[
                { value: '0', label: 'January' },
                { value: '1', label: 'February' },
                { value: '2', label: 'March' },
                { value: '3', label: 'April' },
                { value: '4', label: 'May' },
                { value: '5', label: 'June' },
              ]}
            />
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="!p-5 md:col-span-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Overall Attendance</p>
                <p className={`text-5xl font-bold mt-2 ${getPercentageColor(overallAttendance)}`}>
                  {overallAttendance}%
                </p>
                <p className="text-sm text-gray-400 mt-2">Average across all courses</p>
              </div>
              <div className="w-24 h-24 bg-cyan-500/20 rounded-full flex items-center justify-center">
                <UserCheck className="w-12 h-12 text-cyan-400" />
              </div>
            </div>
          </Card>

          <Card className="!p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Present</p>
                <p className="text-2xl font-bold text-white">
                  {courseAttendance.reduce((sum, c) => sum + c.present, 0)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="!p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <UserX className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Absent</p>
                <p className="text-2xl font-bold text-white">
                  {courseAttendance.reduce((sum, c) => sum + c.absent, 0)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="!p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Late</p>
                <p className="text-2xl font-bold text-white">
                  {courseAttendance.reduce((sum, c) => sum + c.late, 0)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Monthly Chart */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Monthly Attendance Trend</h3>
          <Chart
            type="area"
            data={monthlyData}
            dataKey="present"
            xKey="name"
            height={250}
          />
        </Card>

        {/* Course-wise Attendance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Course Breakdown */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Course-wise Breakdown</h3>
            <div className="space-y-4">
              {courseAttendance.map((course) => (
                <div
                  key={course.course_id}
                  className="p-4 bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{course.course_title}</h4>
                    <span className={`text-lg font-bold ${getPercentageColor(course.percentage)}`}>
                      {course.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                    <div
                      className={`h-2 rounded-full ${
                        course.percentage >= 90 ? 'bg-emerald-500' :
                        course.percentage >= 75 ? 'bg-cyan-500' :
                        course.percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${course.percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span><UserCheck className="w-4 h-4 inline mr-1 text-emerald-400" />{course.present} Present</span>
                    <span><UserX className="w-4 h-4 inline mr-1 text-red-400" />{course.absent} Absent</span>
                    <span><Clock className="w-4 h-4 inline mr-1 text-amber-400" />{course.late} Late</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Records */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recent Records</h3>
              <Select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                options={[
                  { value: 'all', label: 'All Courses' },
                  ...courseAttendance.map(c => ({ value: c.course_id, label: c.course_title })),
                ]}
              />
            </div>
            <div className="space-y-3">
              {attendanceRecords
                .filter(r => selectedCourse === 'all' || r.course_id === selectedCourse)
                .map((record, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{record.course_title}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(record.status)}
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
