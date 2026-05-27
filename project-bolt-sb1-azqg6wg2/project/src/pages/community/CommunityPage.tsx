import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Input, Badge, Modal } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  MessageCircle,
  Users,
  Send,
  Plus,
  Hash,
  Search,
  Pin,
  MoreVertical,
  Heart,
  Share2,
  Bell,
  Star
} from 'lucide-react';

interface Discussion {
  id: string;
  title: string;
  content: string;
  author: string;
  course: string;
  replies: number;
  likes: number;
  pinned: boolean;
  created_at: string;
}

interface Community {
  id: string;
  name: string;
  course: string;
  members: number;
  messages: number;
  unread: number;
  type: 'class' | 'general' | 'study-group';
}

export default function CommunityPage() {
  const { profile } = useAuth();
  const [activeNav, setActiveNav] = useState('community');
  const [activeTab, setActiveTab] = useState('discussions');
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    // Dummy data
    const dummyDiscussions: Discussion[] = [
      {
        id: '1',
        title: 'How to implement authentication in React?',
        content: 'I am building a React app and need to implement authentication. What are the best practices?',
        author: 'Alex Johnson',
        course: 'Advanced React Development',
        replies: 12,
        likes: 24,
        pinned: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: '2',
        title: 'Best resources for learning TypeScript',
        content: 'Can anyone recommend good TypeScript learning resources?',
        author: 'Sarah Miller',
        course: 'Python for Data Science',
        replies: 8,
        likes: 15,
        pinned: false,
        created_at: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: '3',
        title: 'Study group for Cloud Architecture exam',
        content: 'Anyone interested in forming a study group for the upcoming Cloud Architecture exam?',
        author: 'Mike Chen',
        course: 'Cloud Architecture',
        replies: 6,
        likes: 10,
        pinned: false,
        created_at: new Date(Date.now() - 259200000).toISOString(),
      },
      {
        id: '4',
        title: 'Week 3 Project Discussion',
        content: 'Let us discuss this weeks project implementation approaches here.',
        author: 'James Wilson',
        course: 'Advanced React Development',
        replies: 20,
        likes: 35,
        pinned: true,
        created_at: new Date(Date.now() - 345600000).toISOString(),
      },
    ];

    const dummyCommunities: Community[] = [
      {
        id: '1',
        name: 'React Development Class',
        course: 'Advanced React Development',
        members: 156,
        messages: 1248,
        unread: 12,
        type: 'class',
      },
      {
        id: '2',
        name: 'Python Learners Hub',
        course: 'Python for Data Science',
        members: 203,
        messages: 2891,
        unread: 5,
        type: 'class',
      },
      {
        id: '3',
        name: 'Cloud Engineers Network',
        course: 'Cloud Architecture',
        members: 89,
        messages: 567,
        unread: 0,
        type: 'class',
      },
      {
        id: '4',
        name: 'Study Group - Final Exams',
        course: '',
        members: 45,
        messages: 892,
        unread: 8,
        type: 'study-group',
      },
      {
        id: '5',
        name: 'General Discussions',
        course: '',
        members: 512,
        messages: 4512,
        unread: 23,
        type: 'general',
      },
    ];

    setDiscussions(dummyDiscussions);
    setCommunities(dummyCommunities);
    setLoading(false);
  };

  const getCommunityIcon = (type: string) => {
    const icons: Record<string, any> = {
      class: 'bg-cyan-500/20 text-cyan-400',
      'study-group': 'bg-emerald-500/20 text-emerald-400',
      general: 'bg-blue-500/20 text-blue-400',
    };
    return icons[type] || icons.general;
  };

  const filteredDiscussions = discussions.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout activeItem={activeNav} onItemClick={setActiveNav}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Student Community</h1>
            <p className="text-gray-400 mt-1">Connect, discuss, and learn together</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setShowNewPost(true)}>
              <Plus className="w-5 h-5 mr-2" />
              New Discussion
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'discussions' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('discussions')}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Discussions
          </Button>
          <Button
            variant={activeTab === 'communities' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('communities')}
          >
            <Users className="w-4 h-4 mr-2" />
            Communities
          </Button>
        </div>

        {/* Discussions Tab */}
        {activeTab === 'discussions' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search discussions..."
                  className="pl-10"
                />
              </div>

              {/* Discussion Cards */}
              {filteredDiscussions.map((discussion) => (
                <Card
                  key={discussion.id}
                  className="!p-5 hover:border-cyan-500/30 transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {discussion.author.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {discussion.pinned && (
                          <Pin className="w-4 h-4 text-amber-400" />
                        )}
                        <h3 className="font-semibold text-white">{discussion.title}</h3>
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-2 mb-3">{discussion.content}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{discussion.author}</span>
                        <span>in {discussion.course}</span>
                        <span>{new Date(discussion.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700/50">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {discussion.replies}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {discussion.likes}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm">View Discussion</Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Quick Stats */}
              <Card className="!p-5">
                <h3 className="font-semibold text-white mb-4">Your Activity</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Posts</span>
                    <span className="text-white font-medium">24</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Replies</span>
                    <span className="text-white font-medium">89</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Helpful Votes</span>
                    <span className="text-white font-medium">156</span>
                  </div>
                </div>
              </Card>

              {/* Top Contributors */}
              <Card className="!p-5">
                <h3 className="font-semibold text-white mb-4">Top Contributors</h3>
                <div className="space-y-3">
                  {['Sarah Miller', 'Alex Johnson', 'Mike Chen', 'Emily Davis'].map((name, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full text-white text-sm font-semibold">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{name}</p>
                        <p className="text-xs text-gray-400">{Math.floor(Math.random() * 500) + 100} pts</p>
                      </div>
                      <Star className="w-4 h-4 text-amber-400" />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Communities Tab */}
        {activeTab === 'communities' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {communities.map((community) => (
              <Card
                key={community.id}
                className="!p-5 hover:border-cyan-500/30 transition-all cursor-pointer"
                onClick={() => setSelectedCommunity(community)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getCommunityIcon(community.type)}`}>
                    <Hash className="w-6 h-6" />
                  </div>
                  {community.unread > 0 && (
                    <Badge variant="error">{community.unread}</Badge>
                  )}
                </div>

                <h3 className="font-semibold text-white mb-1">{community.name}</h3>
                {community.course && (
                  <p className="text-sm text-cyan-400 mb-3">{community.course}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {community.members}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    {community.messages}
                  </span>
                </div>
              </Card>
            ))}

            {/* Create Community Card */}
            <Card className="!p-5 border-dashed border-2 border-gray-700 hover:border-cyan-500 transition-all cursor-pointer flex items-center justify-center min-h-[180px]">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-400">Create Community</p>
              </div>
            </Card>
          </div>
        )}

        {/* Community Chat Modal */}
        {selectedCommunity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedCommunity(null)} />
            <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-3xl w-full h-[80vh] flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getCommunityIcon(selectedCommunity.type)}`}>
                    <Hash className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{selectedCommunity.name}</h3>
                    <p className="text-sm text-gray-400">{selectedCommunity.members} members</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCommunity(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Dummy messages */}
                {[
                  { user: 'Alex Johnson', message: 'Has anyone completed the Week 3 assignment?', time: '10:30 AM', self: false },
                  { user: 'You', message: 'Yes, it was quite challenging but interesting!', time: '10:35 AM', self: true },
                  { user: 'Sarah Miller', message: 'Can someone share resources for the project?', time: '10:42 AM', self: false },
                  { user: 'Mike Chen', message: 'I found some great tutorials on YouTube', time: '10:45 AM', self: false },
                ].map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.self ? 'justify-end' : 'justify-start'}`}>
                    <div className={`rounded-2xl px-4 py-2 max-w-xs ${
                      msg.self ? 'bg-cyan-500 text-white' : 'bg-gray-800 text-white'
                    }`}>
                      <p className="text-xs text-gray-300 mb-1">{msg.user}</p>
                      <p>{msg.message}</p>
                      <p className="text-xs text-gray-400 mt-1 text-right">{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-700">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button size="sm">
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New Post Modal */}
        <Modal
          isOpen={showNewPost}
          onClose={() => setShowNewPost(false)}
          title="Create Discussion"
        >
          <div className="space-y-4">
            <Input
              label="Title"
              placeholder="Discussion title"
            />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Content</label>
              <textarea
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                rows={4}
                placeholder="Share your thoughts..."
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="ghost" onClick={() => setShowNewPost(false)} className="flex-1">
                Cancel
              </Button>
              <Button className="flex-1">
                Post Discussion
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
