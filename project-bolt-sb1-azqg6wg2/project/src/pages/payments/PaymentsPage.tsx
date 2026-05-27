import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, Button, Badge, Select, Chart } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { CreditCard, DollarSign, Download, Filter, Calendar, TrendingUp } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  payment_type: string;
  status: string;
  payment_method: string;
  transaction_id: string;
  created_at: string;
  courses?: {
    title: string;
  };
}

export default function PaymentsPage() {
  const { profile } = useAuth();
  const [activeNav, setActiveNav] = useState('payments');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStats, setPaymentStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
  });
  const [chartData, setChartData] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    if (profile) {
      fetchPayments();
    }
  }, [profile]);

  const fetchPayments = async () => {
    try {
      if (profile?.role === 'student') {
        // Get student payments
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', profile.id)
          .single();

        if (studentData) {
          const { data: paymentsData } = await supabase
            .from('payments')
            .select(`
              *,
              courses (title)
            `)
            .eq('student_id', studentData.id)
            .order('created_at', { ascending: false });

          if (paymentsData) {
            setPayments(paymentsData);
            calculateStats(paymentsData);
          }
        }
      } else if (profile?.role === 'admin') {
        // Admin sees all payments
        const { data: paymentsData } = await supabase
          .from('payments')
          .select(`
            *,
            courses (title)
          `)
          .order('created_at', { ascending: false });

        if (paymentsData) {
          setPayments(paymentsData);
          calculateStats(paymentsData);
          prepareChartData(paymentsData);
        }
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (paymentsData: Payment[]) => {
    const total = paymentsData.reduce((sum, p) => sum + Number(p.amount), 0);
    const completed = paymentsData.filter(p => p.status === 'completed').length;
    const pending = paymentsData.filter(p => p.status === 'pending').length;
    const failed = paymentsData.filter(p => p.status === 'failed').length;

    setPaymentStats({ total, completed, pending, failed });
  };

  const prepareChartData = (paymentsData: Payment[]) => {
    // Group by month
    const monthlyTotals: Record<string, number> = {};
    paymentsData.forEach((p) => {
      const date = new Date(p.created_at);
      const monthKey = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + Number(p.amount);
    });

    const data = Object.entries(monthlyTotals)
      .slice(-6)
      .map(([name, amount]) => ({ name, amount }));

    setChartData(data);
  };

  const filteredPayments = payments.filter((payment) => {
    if (statusFilter === 'all') return true;
    return payment.status === statusFilter;
  });

  return (
    <DashboardLayout activeItem={activeNav} onItemClick={setActiveNav}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Payments</h1>
            <p className="text-gray-400 mt-1">
              {profile?.role === 'student' ? 'View your payment history' : 'Manage payments and transactions'}
            </p>
          </div>
          {profile?.role === 'admin' && (
            <Button variant="outline">
              <Download className="w-5 h-5 mr-2" />
              Export Report
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        {profile?.role === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="!p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    ${paymentStats.total.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
            </Card>

            <Card className="!p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Completed</p>
                  <p className="text-2xl font-bold text-white mt-1">{paymentStats.completed}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </Card>

            <Card className="!p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-white mt-1">{paymentStats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-amber-400" />
                </div>
              </div>
            </Card>

            <Card className="!p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Failed</p>
                  <p className="text-2xl font-bold text-white mt-1">{paymentStats.failed}</p>
                </div>
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-red-400" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Revenue Chart (Admin only) */}
        {profile?.role === 'admin' && chartData.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">Revenue Trend</h2>
            <Chart type="area" data={chartData} dataKey="amount" xKey="name" height={250} />
          </Card>
        )}

        {/* Filter */}
        <div className="flex items-center gap-4">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'completed', label: 'Completed' },
              { value: 'pending', label: 'Pending' },
              { value: 'failed', label: 'Failed' },
              { value: 'refunded', label: 'Refunded' },
            ]}
          />
        </div>

        {/* Payments Table */}
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Transaction ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                  {profile?.role === 'admin' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Course</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-400">Loading...</td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-400">No payments found</td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-300 font-mono">{payment.transaction_id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="default">{payment.payment_type}</Badge>
                      </td>
                      {profile?.role === 'admin' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-300">{payment.courses?.title || '-'}</span>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-white">${Number(payment.amount).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-300 capitalize">{payment.payment_method || '-'}</span>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button variant="ghost" size="sm">
                          Invoice
                        </Button>
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
