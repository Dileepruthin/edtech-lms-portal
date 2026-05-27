import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Badge, EmptyState } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Award,
  Download,
  Share2,
  Calendar,
  CheckCircle,
  Star,
  Trophy
} from 'lucide-react';

interface Certificate {
  id: string;
  certificate_id: string;
  issued_at: string;
  courses: {
    title: string;
  thumbnail_url: string;
  duration_weeks: number;
  level: string;
  instructor_name: string;
  instructor_title: string;
  description: string;
  skills: string[];
    profiles?: {
      full_name: string;
    };
  };
}

export default function CertificatesPage() {
  const { profile } = useAuth();
  const [activeNav, setActiveNav] = useState('certificates');
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  // Dummy certificates for demo
  useEffect(() => {
    const dummyCerts: Certificate[] = [
      {
        id: '1',
        certificate_id: 'CERT-2024-000001',
        issued_at: new Date().toISOString(),
        courses: {
          title: 'Advanced React Development',
          thumbnail_url: 'https://images.pexels.com/photos/373545/pexels-photo-373545.jpeg',
          duration_weeks: 12,
          level: 'intermediate',
          instructor_name: 'Dr. Sarah Johnson',
          instructor_title: 'Senior Software Engineer',
          description: 'Successfully completed the Advanced React Development course with distinction.',
          skills: ['React Hooks', 'Redux', 'TypeScript', 'Testing'],
        },
      },
      {
        id: '2',
        certificate_id: 'CERT-2024-000002',
        issued_at: new Date(Date.now() - 86400000 * 30).toISOString(),
        courses: {
          title: 'Python for Data Science',
          thumbnail_url: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg',
          duration_weeks: 16,
          level: 'beginner',
          instructor_name: 'Prof. Michael Chen',
          instructor_title: 'Data Scientist',
          description: 'Successfully completed the Python for Data Science course.',
          skills: ['Python', 'NumPy', 'Pandas', 'Data Visualization'],
        },
      },
      {
        id: '3',
        certificate_id: 'CERT-2024-000003',
        issued_at: new Date(Date.now() - 86400000 * 60).toISOString(),
        courses: {
          title: 'Cloud Architecture Fundamentals',
          thumbnail_url: 'https://images.pexels.com/photos/1148820/pexels-photo-1148820.jpeg',
          duration_weeks: 8,
          level: 'advanced',
          instructor_name: 'James Wilson',
          instructor_title: 'Cloud Solutions Architect',
          description: 'Successfully completed the Cloud Architecture Fundamentals course.',
          skills: ['AWS', 'GCP', 'Cloud Design', 'DevOps'],
        },
      },
    ];
    setCertificates(dummyCerts);
    setLoading(false);
  }, []);

  return (
    <DashboardLayout activeItem={activeNav} onItemClick={setActiveNav}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Certificates</h1>
            <p className="text-gray-400 mt-1">Your earned achievements and certifications</p>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="text-white font-medium">{certificates.length} Certificates</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="!p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Certificates</p>
                <p className="text-2xl font-bold text-white mt-1">{certificates.length}</p>
              </div>
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
          </Card>

          <Card className="!p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Beginner</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {certificates.filter(c => c.courses.level === 'beginner').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </Card>

          <Card className="!p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Intermediate</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {certificates.filter(c => c.courses.level === 'intermediate').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="!p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Advanced</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {certificates.filter(c => c.courses.level === 'advanced').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-pink-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Certificates Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="!p-5 animate-pulse">
                <div className="h-32 bg-gray-700 rounded mb-4" />
                <div className="h-6 bg-gray-700 rounded w-3/4" />
              </Card>
            ))}
          </div>
        ) : certificates.length === 0 ? (
          <Card className="!p-8 text-center">
            <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Certificates Yet</h3>
            <p className="text-gray-400 mb-4">Complete courses to earn your certificates</p>
            <Button onClick={() => window.location.href = '/courses'}>Browse Courses</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <Card
                key={cert.id}
                padding="none"
                className="group cursor-pointer hover:border-cyan-500/30 transition-all overflow-hidden"
                onClick={() => setSelectedCert(cert)}
              >
                {/* Certificate Preview */}
                <div className="relative h-52 bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 via-transparent to-blue-500/30" />
                  <div className="absolute inset-0 border-8 border-cyan-500/10 m-4 rounded-xl" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <Award className="w-12 h-12 text-cyan-400 mb-3" />
                    <h3 className="font-bold text-white text-lg leading-tight mb-2">
                      {cert.courses.title}
                    </h3>
                    <p className="text-sm text-gray-300">{cert.courses.instructor_name}</p>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="info">{cert.courses.level}</Badge>
                    <span className="text-sm text-gray-400">
                      {new Date(cert.issued_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 font-mono mb-4">{cert.certificate_id}</p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">
                      <Download className="w-4 h-4 mr-1" />
                      PDF
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Share2 className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Certificate Preview Modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedCert(null)} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Certificate Preview</h2>
              <button
                onClick={() => setSelectedCert(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Certificate Design */}
            <div className="p-8">
              <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-4 border-cyan-500/30 rounded-2xl p-12 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5" />
                <div className="absolute top-4 left-4 right-4 bottom-4 border-2 border-cyan-500/20 rounded-xl" />

                <div className="relative text-center">
                  <Award className="w-20 h-20 text-cyan-400 mx-auto mb-6" />
                  <p className="text-sm text-gray-400 tracking-widest mb-4">CERTIFICATE OF COMPLETION</p>
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedCert.courses.title}</h2>
                  <p className="text-cyan-400 mb-8">Advanced EdTech Platform</p>

                  <p className="text-gray-400 mb-2">This is to certify that</p>
                  <p className="text-2xl font-bold text-white mb-6">{profile?.full_name || 'Student Name'}</p>
                  <p className="text-gray-400 max-w-lg mx-auto mb-8">{selectedCert.courses.description}</p>

                  <div className="grid grid-cols-3 gap-8 max-w-md mx-auto mb-8 text-center">
                    <div>
                      <p className="text-xs text-gray-500">DURATION</p>
                      <p className="font-semibold text-white">{selectedCert.courses.duration_weeks} Weeks</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">LEVEL</p>
                      <p className="font-semibold text-white capitalize">{selectedCert.courses.level}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">CERTIFICATE ID</p>
                      <p className="font-semibold text-white text-xs">{selectedCert.certificate_id}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-6">
                    <p className="text-sm text-gray-400">Instructor: {selectedCert.courses.instructor_name}</p>
                    <p className="text-xs text-gray-500">{selectedCert.courses.instructor_title}</p>
                  </div>
                </div>
              </div>

              {/* Skills Earned */}
              <div className="mt-6">
                <h3 className="font-semibold text-white mb-3">Skills Earned</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCert.courses.skills.map((skill, index) => (
                    <Badge key={index} variant="info">{skill}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <Button className="flex-1">
                  <Download className="w-5 h-5 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" className="flex-1">
                  <Share2 className="w-5 h-5 mr-2" />
                  Share Certificate
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
