import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Badge, ProgressBar, Modal, Input } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Play,
  Clock,
  Users,
  BookOpen,
  FileText,
  CheckCircle,
  ArrowLeft,
  Lock,
  Unlock,
  Award
} from 'lucide-react';

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
  pdf_url: string;
  duration_minutes: number;
  order_index: number;
  completed?: boolean;
}

interface CourseDetail {
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
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeNav, setActiveNav] = useState('courses');
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId, profile]);

  const fetchCourseDetails = async () => {
    try {
      // Fetch course details
      const { data: courseData } = await supabase
        .from('courses')
        .select(`
          *,
          profiles (full_name, avatar_url)
        `)
        .eq('id', courseId)
        .single();

      if (courseData) {
        setCourse(courseData);
      }

      // Fetch modules and lessons
      const { data: modulesData } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (modulesData) {
        // Fetch lessons for each module
        const modulesWithLessons = await Promise.all(
          modulesData.map(async (module) => {
            const { data: lessons } = await supabase
              .from('lessons')
              .select('*')
              .eq('module_id', module.id)
              .order('order_index', { ascending: true });

            return {
              ...module,
              lessons: lessons || [],
            };
          })
        );
        setModules(modulesWithLessons);
      }

      // Check enrollment status
      if (profile && profile.role === 'student') {
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', profile.id)
          .single();

        if (studentData) {
          const { data: enrollmentData } = await supabase
            .from('enrollments')
            .select('*')
            .eq('student_id', studentData.id)
            .eq('course_id', courseId)
            .maybeSingle();

          if (enrollmentData) {
            setEnrollment(enrollmentData);

            // Fetch lesson progress
            const { data: progressData } = await supabase
              .from('lesson_progress')
              .select('lesson_id, completed')
              .eq('enrollment_id', enrollmentData.id);

            if (progressData) {
              const progressMap = new Map(progressData.map(p => [p.lesson_id, p.completed]));
              setModules(prev => prev.map(module => ({
                ...module,
                lessons: module.lessons.map(lesson => ({
                  ...lesson,
                  completed: progressMap.get(lesson.id) || false,
                })),
              })));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!profile || profile.role !== 'student') return;

    setEnrolling(true);
    try {
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (studentData) {
        const { error } = await supabase
          .from('enrollments')
          .insert({
            student_id: studentData.id,
            course_id: courseId,
          });

        if (!error) {
          setShowEnrollModal(false);
          fetchCourseDetails();
        }
      }
    } catch (error) {
      console.error('Error enrolling:', error);
    } finally {
      setEnrolling(false);
    }
  };

  const handleLessonComplete = async (lessonId: string) => {
    if (!enrollment) return;

    await supabase
      .from('lesson_progress')
      .upsert({
        enrollment_id: enrollment.id,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
      });

    fetchCourseDetails();
  };

  if (loading) {
    return (
      <DashboardLayout activeItem={activeNav} onItemClick={setActiveNav}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout activeItem={activeNav} onItemClick={setActiveNav}>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-white">Course not found</h2>
          <Button onClick={() => navigate('/courses')} className="mt-4">
            Back to Courses
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedLessons = modules.reduce((sum, m) => sum + m.lessons.filter(l => l.completed).length, 0);
  const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <DashboardLayout activeItem={activeNav} onItemClick={setActiveNav}>
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/courses')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Courses</span>
        </button>

        {/* Course Header */}
        <div className="relative rounded-2xl overflow-hidden">
          <div className="h-64 md:h-80">
            <img
              src={course.thumbnail_url || 'https://images.pexels.com/photos/373545/pexels-photo-373545.jpeg'}
              alt={course.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="info">{course.level}</Badge>
                  {course.category && <Badge variant="default">{course.category}</Badge>}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{course.title}</h1>
                <p className="text-gray-300 max-w-2xl">{course.description}</p>
              </div>
              <div className="hidden md:block">
                {enrollment ? (
                  <Badge variant="success" size="md">Enrolled</Badge>
                ) : profile?.role === 'student' ? (
                  <Button onClick={() => setShowEnrollModal(true)} size="lg">
                    {course.price === 0 ? 'Enroll Free' : `Enroll - $${course.price}`}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar for enrolled students */}
        {enrollment && (
          <Card className="!p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Your Progress</span>
              <span className="text-white font-medium">{Math.round(progress)}% Complete</span>
            </div>
            <ProgressBar value={progress} variant="gradient" />
          </Card>
        )}

        {/* Course Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Modules & Lessons */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold text-white">Course Content</h2>

            {modules.length === 0 ? (
              <Card>
                <p className="text-gray-400 text-center py-8">No content available yet</p>
              </Card>
            ) : (
              modules.map((module, moduleIndex) => (
                <Card key={module.id} padding="none">
                  <div className="p-4 border-b border-gray-700/50 bg-gray-800/30">
                    <h3 className="font-semibold text-white">
                      Module {moduleIndex + 1}: {module.title}
                    </h3>
                    {module.description && (
                      <p className="text-sm text-gray-400 mt-1">{module.description}</p>
                    )}
                  </div>

                  <div className="divide-y divide-gray-800">
                    {module.lessons.map((lesson) => {
                      const isLocked = !enrollment && profile?.role === 'student';
                      const canAccess = enrollment || profile?.role === 'admin' || profile?.role === 'faculty';

                      return (
                        <div
                          key={lesson.id}
                          onClick={() => canAccess && setSelectedLesson(lesson)}
                          className={`flex items-center gap-4 p-4 transition-colors ${
                            canAccess
                              ? 'hover:bg-gray-800/50 cursor-pointer'
                              : 'opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            lesson.completed
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : isLocked
                                ? 'bg-gray-800 text-gray-500'
                                : 'bg-cyan-500/20 text-cyan-400'
                          }`}>
                            {lesson.completed ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : isLocked ? (
                              <Lock className="w-5 h-5" />
                            ) : (
                              <Play className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white">{lesson.title}</p>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                              {lesson.duration_minutes > 0 && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {lesson.duration_minutes} min
                                </span>
                              )}
                              {lesson.video_url && (
                                <span className="flex items-center gap-1">
                                  <Play className="w-4 h-4" /> Video
                                </span>
                              )}
                              {lesson.pdf_url && (
                                <span className="flex items-center gap-1">
                                  <FileText className="w-4 h-4" /> PDF
                                </span>
                              )}
                            </div>
                          </div>
                          {lesson.completed && (
                            <Badge variant="success" size="sm">Completed</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Course Info */}
            <Card>
              <h3 className="font-semibold text-white mb-4">Course Information</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Duration
                  </span>
                  <span className="text-white">{course.duration_weeks} weeks</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Lessons
                  </span>
                  <span className="text-white">{totalLessons}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Level
                  </span>
                  <Badge variant="info">{course.level}</Badge>
                </div>
                {course.price > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Award className="w-4 h-4" /> Price
                    </span>
                    <span className="text-white font-semibold">${course.price}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Instructor */}
            {course.profiles && (
              <Card>
                <h3 className="font-semibold text-white mb-4">Instructor</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {course.profiles.full_name?.charAt(0) || 'I'}
                  </div>
                  <div>
                    <p className="font-medium text-white">{course.profiles.full_name}</p>
                    <p className="text-sm text-gray-400">Course Instructor</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Mobile enroll button */}
            {!enrollment && profile?.role === 'student' && (
              <div className="md:hidden">
                <Button onClick={() => setShowEnrollModal(true)} className="w-full" size="lg">
                  {course.price === 0 ? 'Enroll Free' : `Enroll - $${course.price}`}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enroll Modal */}
      <Modal isOpen={showEnrollModal} onClose={() => setShowEnrollModal(false)} title="Enroll in Course">
        <div className="space-y-4">
          <p className="text-gray-300">
            You're about to enroll in <span className="text-white font-medium">{course.title}</span>.
            {course.price > 0 && (
              <span className="block mt-2">Course fee: <span className="text-white font-semibold">${course.price}</span></span>
            )}
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowEnrollModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleEnroll} isLoading={enrolling} className="flex-1">
              Confirm Enrollment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Lesson Modal */}
      <Modal isOpen={!!selectedLesson} onClose={() => setSelectedLesson(null)} title={selectedLesson?.title} size="xl">
        <div className="space-y-4">
          {selectedLesson?.video_url && (
            <div className="aspect-video bg-gray-800 rounded-xl flex items-center justify-center">
              <p className="text-gray-400">Video player placeholder</p>
            </div>
          )}
          {selectedLesson?.description && (
            <p className="text-gray-300">{selectedLesson.description}</p>
          )}
          {selectedLesson?.pdf_url && (
            <div className="p-4 bg-gray-800/50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-cyan-400" />
                <span className="text-white">Course Materials</span>
              </div>
              <Button variant="outline" size="sm">Download PDF</Button>
            </div>
          )}
          {enrollment && (
            <div className="flex gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={() => setSelectedLesson(null)}
                className="flex-1"
              >
                Close
              </Button>
              {!selectedLesson?.completed && (
                <Button
                  onClick={() => {
                    handleLessonComplete(selectedLesson?.id || '');
                    setSelectedLesson(null);
                  }}
                  className="flex-1"
                >
                  Mark as Complete
                </Button>
              )}
            </div>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
