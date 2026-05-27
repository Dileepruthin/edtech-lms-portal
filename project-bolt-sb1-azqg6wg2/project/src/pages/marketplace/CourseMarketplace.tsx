import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Input, Select, EmptyState } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Star,
  Clock,
  Users,
  Play,
  BookOpen,
  TrendingUp,
  Filter,
  Search
} from 'lucide-react';

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
  profiles?: {
    full_name: string;
  };
  student_count?: number;
  avg_rating?: number;
  featured?: boolean;
}

export default function CourseMarketplace() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data } = await supabase
        .from('courses')
        .select(`
          *,
          profiles!courses_instructor_id_fkey (full_name)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (data) {
        const coursesWithStats = await Promise.all(
          data.map(async (course) => {
            const { count } = await supabase
              .from('enrollments')
              .select('*', { count: 'exact', head: true })
              .eq('course_id', course.id);

            return {
              ...course,
              student_count: count || 0,
              featured: Math.random() > 0.7, // Mock featured status
            };
          })
        );
        setCourses(coursesWithStats);
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
    const matchesPrice = priceFilter === 'all' ||
      (priceFilter === 'free' && course.price === 0) ||
      (priceFilter === 'paid' && course.price > 0);
    return matchesSearch && matchesLevel && matchesCategory && matchesPrice;
  }).sort((a, b) => {
    if (sortBy === 'popular') return (b.student_count || 0) - (a.student_count || 0);
    if (sortBy === 'newest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    return 0;
  });

  const featuredCourses = courses.filter(c => c.featured).slice(0, 3);
  const categories = [...new Set(courses.map(c => c.category).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-purple-500/20" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Discover Your Next
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"> Learning Journey</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Explore premium courses from expert instructors. Build skills that matter.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-lg"
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center justify-center gap-8 mt-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <span>{courses.length} Courses</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span>{courses.reduce((sum, c) => sum + (c.student_count || 0), 0)} Students</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-cyan-400" />
                <span>Expert Instructors</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Courses */}
      {featuredCourses.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-cyan-400" />
                Featured Courses
              </h2>
              <p className="text-gray-400 mt-1">Handpicked courses for you</p>
            </div>
            <Badge variant="info">Premium Selection</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.map((course) => (
              <Card
                key={course.id}
                padding="none"
                className="group cursor-pointer hover:border-cyan-500/50 transition-all overflow-hidden"
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <div className="relative h-48">
                  <img
                    src={course.thumbnail_url || 'https://images.pexels.com/photos/373545/pexels-photo-373545.jpeg'}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <Badge variant="warning" size="sm">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    {course.price === 0 ? (
                      <Badge variant="success">Free</Badge>
                    ) : (
                      <Badge variant="default">${course.price}</Badge>
                    )}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="font-semibold text-white text-lg line-clamp-2">{course.title}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-400 line-clamp-2 mb-3">{course.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{course.student_count || 0} students</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration_weeks} weeks</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Courses */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <div className="lg:w-64 flex-shrink-0">
            <Card className="!p-5 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </h3>
              </div>

              <div className="space-y-4">
                <Select
                  label="Level"
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
                  label="Category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Categories' },
                    ...categories.map(c => ({ value: c, label: c })),
                  ]}
                />

                <Select
                  label="Price"
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Prices' },
                    { value: 'free', label: 'Free' },
                    { value: 'paid', label: 'Paid' },
                  ]}
                />

                <Select
                  label="Sort By"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  options={[
                    { value: 'popular', label: 'Most Popular' },
                    { value: 'newest', label: 'Newest' },
                    { value: 'price-low', label: 'Price: Low to High' },
                    { value: 'price-high', label: 'Price: High to Low' },
                  ]}
                />
              </div>
            </Card>
          </div>

          {/* Course Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-400">
                Showing {filteredCourses.length} courses
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="!p-5 animate-pulse">
                    <div className="h-40 bg-gray-700 rounded mb-4" />
                    <div className="h-6 bg-gray-700 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-700 rounded w-1/2" />
                  </Card>
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="w-8 h-8" />}
                title="No courses found"
                description="Try adjusting your search or filters"
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
                    <div className="relative h-40">
                      <img
                        src={course.thumbnail_url || 'https://images.pexels.com/photos/373545/pexels-photo-373545.jpeg'}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-14 h-14 bg-cyan-500/90 rounded-full flex items-center justify-center">
                          <Play className="w-7 h-7 text-white ml-1" />
                        </div>
                      </div>
                      <div className="absolute top-3 right-3">
                        {course.price === 0 ? (
                          <Badge variant="success">Free</Badge>
                        ) : (
                          <Badge variant="default">${course.price}</Badge>
                        )}
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="info" size="sm">{course.level}</Badge>
                        {course.category && (
                          <Badge variant="default" size="sm">{course.category}</Badge>
                        )}
                      </div>

                      <h3 className="font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-2">
                        {course.title}
                      </h3>

                      <p className="text-sm text-gray-400 line-clamp-2 mb-4">{course.description}</p>

                      {course.profiles?.full_name && (
                        <p className="text-xs text-cyan-400 mb-3">by {course.profiles.full_name}</p>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-400 pt-3 border-t border-gray-800">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{course.duration_weeks}w</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{course.student_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-400" />
                          <span>4.5</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {!profile && (
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-y border-cyan-500/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Learning?</h2>
            <p className="text-gray-300 mb-8 max-w-xl mx-auto">
              Create your free account and get access to hundreds of premium courses.
            </p>
            <Button size="lg" onClick={() => navigate('/signup')}>
              Get Started Free
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
