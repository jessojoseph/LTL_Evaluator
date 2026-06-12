import { useEffect, useState } from 'react';
import { reportApi, weekApi } from '../api/client';
import type { DashboardData, Week } from '../types';
import {
  Users, FolderKanban, Clock, CheckCircle2, AlertTriangle, TrendingUp, BarChart3,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');

  // Derive available years/months from loaded weeks
  const years = [...new Set(weeks.map((w) => new Date(w.startDate).getFullYear()))].sort((a, b) => b - a);
  const monthsInYear = selectedYear
    ? [...new Set(weeks
        .filter((w) => new Date(w.startDate).getFullYear() === Number(selectedYear))
        .map((w) => new Date(w.startDate).getMonth()))]
        .sort((a, b) => a - b)
    : [];
  const filteredWeeks = weeks.filter((w) => {
    const d = new Date(w.startDate);
    if (selectedYear && d.getFullYear() !== Number(selectedYear)) return false;
    if (selectedMonth && d.getMonth() !== Number(selectedMonth)) return false;
    return true;
  });

  useEffect(() => {
    weekApi.getAll().then(({ data }) => {
      setWeeks(data.weeks);
      if (data.weeks.length > 0) {
        const newest = data.weeks[0];
        const d = new Date(newest.startDate);
        setSelectedYear(String(d.getFullYear()));
        setSelectedMonth(String(d.getMonth()));
        setSelectedWeek(newest._id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedWeek) return;
    setLoading(true);
    reportApi.dashboard({ weekId: selectedWeek }).then(({ data }) => setData(data)).catch(console.error).finally(() => setLoading(false));
  }, [selectedWeek]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  const kpiCards = [
    { label: 'Total Employees', value: data?.totalEmployees ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Projects', value: data?.totalProjects ?? 0, icon: FolderKanban, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Capacity', value: `${data?.totalWeeklyCapacity ?? 0} WH`, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Allocated WH', value: `${data?.totalAllocatedWH ?? 0} WH`, icon: CheckCircle2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Free WH', value: `${data?.totalFreeWH ?? 0} WH`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Overbooked WH', value: `${data?.totalOverbookedWH ?? 0} WH`, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Avg Utilization', value: `${data?.averageUtilization ?? 0}%`, icon: BarChart3, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const leadData = (data?.leadWiseAllocation ?? []).map((l) => ({ name: l.leadName || 'Unknown', wh: l.totalWH }));
  const projectData = (data?.projectWiseAllocation ?? []).map((p) => ({ name: p.projectName || 'Unknown', wh: p.totalWH }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Week: {data?.week?.name || 'N/A'}</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input w-auto" value={selectedYear} onChange={(e) => { setSelectedYear(e.target.value); setSelectedMonth(''); setSelectedWeek(''); }}>
            <option value="">All Years</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="input w-auto" value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); setSelectedWeek(''); }}>
            <option value="">All Months</option>
            {monthsInYear.map((m) => <option key={m} value={m}>{MONTHS[m]}</option>)}
          </select>
          <select className="input w-auto" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}>
            <option value="">Select week...</option>
            {filteredWeeks.map((w) => {
              const d = new Date(w.startDate);
              return <option key={w._id} value={w._id}>{w.weekName} — {d.toLocaleDateString()}</option>;
            })}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="card p-4">
            <div className={`inline-flex p-2 rounded-lg ${kpi.bg} mb-3`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Lead-wise Allocation</h3>
          {leadData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="wh" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-12">No data</p>
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Project-wise Allocation</h3>
          {projectData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={projectData} dataKey="wh" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name }) => name}>
                  {projectData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-12">No data</p>
          )}
        </div>
      </div>
    </div>
  );
}
