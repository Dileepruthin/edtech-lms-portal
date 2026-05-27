import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Input, Badge, Select, EmptyState, CardSkeleton } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Filter, BookOpen, Clock, Users, Star, Play } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  category: string;
  level: string;
  price: number;
  duration_weeks: number;
  instructor_id: string;
  status: string;
  student_count?: number;
  avg_rating?: number;
}

export default function CoursesPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeNav, setActiveNav] = useState('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchCourses();
  }, [profile]);

  const fetchCourses = async () => {
    try {
      let query = supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      // Non-admin users only see published courses
      if (profile?.role !== 'admin' && profile?.role !== 'faculty') {
        query = query.eq('status', 'published');
      }

      const { data } = await query;

      if (data) {
        // Get enrollment count for each course
        const coursesWithCount = await Promise.all(
          data.map(async (course) => {
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
        setCourses(coursesWithCount);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === 'all' || course.level === levelFilter;
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
    return matchesSearch && matchesLevel && matchesCategory;
  });

  const categories = [...new Set(courses.map(c => c.category).filter(Boolean))];

  const canManageCourses = profile?.role === 'admin' || profile?.role === 'faculty';

  return (
    <DashboardLayout activeItem={activeNav} onItemClick={setActiveNav}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Courses</h1>
            <p className="text-gray-400 mt-1">Browse and manage your courses</p>
          </div>
          {canManageCourses && (
            <Button
              onClick={() => navigate('/courses/new')}
              className="flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Course
            </Button>
          )}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
          <Select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Levels' },
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
            ]}
          />
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Categories' },
              ...categories.map(c => ({ value: c, label: c })),
            ]}
          />
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-8 h-8" />}
            title="No courses found"
            description={searchQuery || levelFilter !== 'all' || categoryFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first course'}
            action={
              canManageCourses && !searchQuery && levelFilter === 'all' && categoryFilter === 'all' ? (
                <Button onClick={() => navigate('/courses/new')}>
                  Create Course
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
                padding="none"
                className="group cursor-pointer hover:border-cyan-500/30 transition-all"
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                {/* Thumbnail */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={course.thumbnail_url || 'https://images.pexels.com/photos/373545/pexels-photo-373545.jpeg'}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent" />

                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 bg-cyan-500/90 rounded-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </div>

                  {/* Status badge */}
                  {course.status !== 'published' && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="warning">{course.status}</Badge>
                    </div>
                  )}

                  {/* Price badge */}
                  <div className="absolute top-3 right-3">
                    {course.price === 0 ? (
                      <Badge variant="success">Free</Badge>
                    ) : (
                      <Badge variant="default">${course.price}</Badge>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="info" size="sm">{course.level}</Badge>
                    {course.category && (
                      <Badge variant="default" size="sm">{course.category}</Badge>
                    )}
                  </div>

                  <h3 className="font-semibold text-white text-lg mb-2 group-hover:text-cyan-400 transition-colors">
                    {course.title}
                  </h3>

                  <p className="text-gray-400 text-sm line-clamp-2 mb-4">{course.description}</p>

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration_weeks} weeks</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{course.student_count || 0} students</span>
                    </div>
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
