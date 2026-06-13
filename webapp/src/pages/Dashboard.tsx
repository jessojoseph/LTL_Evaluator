import { useEffect, useState } from 'react';
import { reportApi, weekApi } from '../api/client';
import type { DashboardData, Week, EmployeeUtilization, OverbookedResource } from '../types';
import {
  Users, Clock, CheckCircle2, AlertTriangle, TrendingUp, BarChart3,
  Calendar, Briefcase, Info,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BrandMark } from '../components/BrandLogo';
import { launcherIcon } from '../assets';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLORS = ['#0f5c3a', '#1a7a4c', '#34d399', '#6ee7b7', '#a7f3d0', '#0d4f31'];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-xs">
        <p className="font-semibold text-gray-900 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-gray-600 font-medium">{p.value.toFixed(1)} WH</p>
        ))}
      </div>
    );
  }
  return null;
};

const StatCard = ({ label, value, icon: Icon, iconColor, iconBg }: {
  label: string;
  value: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
    <div>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <span className="text-[13px] font-bold text-gray-500 tracking-tight">{label}</span>
      </div>
      <p className="text-2xl font-extrabold text-gray-900 tracking-tight mt-5 leading-none">{value}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');

  const [utilizationData, setUtilizationData] = useState<EmployeeUtilization[]>([]);
  const [overbookedData, setOverbookedData] = useState<OverbookedResource[]>([]);
  const [activeSummaryTab, setActiveSummaryTab] = useState('capacity');

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
    Promise.all([
      reportApi.dashboard({ weekId: selectedWeek }),
      reportApi.employeeUtilization({ weekId: selectedWeek }),
      reportApi.overbookedResources({ weekId: selectedWeek }),
    ])
      .then(([dashRes, utilRes, overRes]) => {
        setData(dashRes.data);
        setUtilizationData(utilRes.data.report || []);
        setOverbookedData(overRes.data.report || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedWeek]);

  const selectedWeekObj = weeks.find((w) => w._id === selectedWeek);

  const kpiCards = [
    { label: 'Total Employees', value: String(data?.totalEmployees ?? 0), icon: Users, iconColor: 'text-primary-600', iconBg: 'bg-primary-50' },
    { label: 'Active Projects', value: String(data?.totalProjects ?? 0), icon: Briefcase, iconColor: 'text-primary-600', iconBg: 'bg-primary-50' },
    { label: 'Total Capacity', value: `${data?.totalWeeklyCapacity ?? 0} WH`, icon: Clock, iconColor: 'text-primary-600', iconBg: 'bg-primary-50' },
    { label: 'Allocated', value: `${data?.totalAllocatedWH ?? 0} WH`, icon: CheckCircle2, iconColor: 'text-primary-600', iconBg: 'bg-primary-50' },
    { label: 'Free Capacity', value: `${data?.totalFreeWH ?? 0} WH`, icon: TrendingUp, iconColor: 'text-primary-600', iconBg: 'bg-primary-50' },
    { label: 'Overbooked', value: `${data?.totalOverbookedWH ?? 0} WH`, icon: AlertTriangle, iconColor: 'text-red-600', iconBg: 'bg-red-50' },
    { label: 'Avg Utilization', value: `${data?.averageUtilization ?? 0}%`, icon: BarChart3, iconColor: 'text-primary-600', iconBg: 'bg-primary-50' },
  ];

  const leadData = (data?.leadWiseAllocation ?? []).map((l) => ({ name: l.leadName || 'Unknown', wh: l.totalWH }));
  const projectData = (data?.projectWiseAllocation ?? []).map((p) => ({ name: p.projectName || 'Unknown', wh: p.totalWH }));

  const highestAllocatedProject = projectData.length > 0 
    ? [...projectData].sort((a, b) => b.wh - a.wh)[0].name 
    : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-semibold">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Date Pickers Selector Row */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <BrandMark size="sm" imageSrc={launcherIcon} />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {selectedWeekObj ? (
                <>Week: <span className="font-semibold text-primary-600">{selectedWeekObj.weekName}</span></>
              ) : 'Select a week to view'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative flex items-center bg-white border border-gray-100 rounded-xl px-3.5 py-2 shadow-sm text-xs text-gray-700 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-primary-100/50 transition-all duration-200">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <select className="bg-transparent border-none outline-none pr-6 cursor-pointer font-bold text-gray-600 appearance-none" value={selectedYear}
              onChange={(e) => { setSelectedYear(e.target.value); setSelectedMonth(''); setSelectedWeek(''); }}>
              <option value="">All Years</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <div className="absolute right-3.5 pointer-events-none w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[3.5px] border-t-gray-400" />
          </div>
          
          <div className="relative flex items-center bg-white border border-gray-100 rounded-xl px-3.5 py-2 shadow-sm text-xs text-gray-700 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-primary-100/50 transition-all duration-200">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <select className="bg-transparent border-none outline-none pr-6 cursor-pointer font-bold text-gray-600 appearance-none" value={selectedMonth}
              onChange={(e) => { setSelectedMonth(e.target.value); setSelectedWeek(''); }}>
              <option value="">All Months</option>
              {monthsInYear.map((m) => <option key={m} value={m}>{MONTHS[m]}</option>)}
            </select>
            <div className="absolute right-3.5 pointer-events-none w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[3.5px] border-t-gray-400" />
          </div>

          <div className="relative flex items-center bg-white border border-gray-100 rounded-xl px-3.5 py-2 shadow-sm text-xs text-gray-700 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-primary-100/50 transition-all duration-200 min-w-[220px]">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <select className="bg-transparent border-none outline-none pr-6 cursor-pointer font-bold text-gray-600 appearance-none w-full" value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}>
              <option value="">Select week...</option>
              {filteredWeeks.map((w) => {
                const d = new Date(w.startDate);
                const isInactive = w.isActive === false;
                return (
                  <option key={w._id} value={w._id} className={isInactive ? 'text-red-600' : ''}>
                    {w.weekName} — {d.toLocaleDateString()}{isInactive ? ' ⛔ Inactive' : ''}
                  </option>
                );
              })}
            </select>
            <div className="absolute right-3.5 pointer-events-none w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[3.5px] border-t-gray-400" />
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {kpiCards.map((kpi) => (
          <StatCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead-wise Allocation Card */}
        <div className="card p-6 shadow-sm border border-gray-100 bg-white rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-5 bg-primary-600 rounded-full" />
              <h3 className="text-sm font-bold text-gray-950">Lead-wise Allocation</h3>
            </div>
          </div>
          {leadData.length > 0 ? (
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={leadData} barCategoryGap={16}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0f5c3a" stopOpacity={1} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'medium' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar 
                    dataKey="wh" 
                    fill="url(#barGradient)" 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={50} 
                    label={{ position: 'top', fill: '#475569', fontSize: 11, fontWeight: 'bold', formatter: (v: number) => `${v} WH` }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-gray-400 text-xs font-semibold">No allocation data for this week</div>
          )}
        </div>

        {/* Project-wise Allocation Card */}
        <div className="card p-6 shadow-sm border border-gray-100 bg-white rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-5 bg-primary-600 rounded-full" />
              <h3 className="text-sm font-bold text-gray-950">Project-wise Allocation</h3>
            </div>
          </div>

          {projectData.length > 0 ? (
            <div className="flex flex-col justify-between flex-1">
              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 mt-4">
                <div className="relative flex items-center justify-center">
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart width={200} height={200}>
                      <Pie
                        data={projectData}
                        dataKey="wh"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={68}
                        paddingAngle={3}
                      >
                        {projectData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-extrabold text-gray-950 tracking-tight leading-none">{data?.totalAllocatedWH ?? 0} WH</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1.5">Total Allocated</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 justify-center min-w-[150px] w-full sm:w-auto">
                  {projectData.map((entry, index) => {
                    const total = projectData.reduce((sum, item) => sum + item.wh, 0);
                    const percent = total > 0 ? Math.round((entry.wh / total) * 100) : 0;
                    return (
                      <div key={entry.name} className="flex items-center justify-between text-xs w-full py-0.5 border-b border-gray-50/50">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full block" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="font-bold text-gray-700">{entry.name}</span>
                        </div>
                        <div className="text-right pl-4">
                          <span className="font-extrabold text-gray-950">{percent}%</span>
                          <span className="text-[10px] text-gray-400 font-semibold ml-1">({entry.wh} WH)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {highestAllocatedProject && (
                <div className="mt-5 p-3 bg-primary-50/40 rounded-xl border border-primary-100/20 flex items-center gap-2.5 text-xs text-primary-800 font-medium">
                  <Info className="w-4 h-4 text-primary-600 flex-shrink-0" />
                  <span>Most resources allocated to <span className="font-bold">{highestAllocatedProject}</span></span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-gray-400 text-xs font-semibold">No project data for this week</div>
          )}
        </div>
      </div>

      {/* Allocation Summary Section */}
      <div className="card p-6 shadow-sm border border-gray-100 bg-white rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-5 bg-primary-600 rounded-full" />
            <div>
              <h3 className="text-sm font-bold text-gray-950">Allocation Summary</h3>
              <p className="text-xs text-gray-400 mt-0.5">Overview of resource allocation and capacity for {selectedWeekObj?.weekName || 'selected week'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-3.5 py-2 border border-gray-100">
            <Calendar className="w-3.5 h-3.5 text-primary-600" />
            <span className="font-semibold text-gray-700">{selectedWeekObj ? `${selectedWeekObj.weekName} (${new Date(selectedWeekObj.startDate).toLocaleDateString()} - ${new Date(selectedWeekObj.endDate).toLocaleDateString()})` : 'No week selected'}</span>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="border-b border-gray-100 mb-6 flex gap-2">
          {[
            { key: 'capacity', label: 'Capacity Distribution' },
            { key: 'trend', label: 'Utilization Trend' },
            { key: 'overbooked', label: 'Top Overbooked Resources' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSummaryTab(tab.key)}
              className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-px ${
                activeSummaryTab === tab.key
                  ? 'border-primary-600 text-primary-700 font-extrabold'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeSummaryTab === 'capacity' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Primary Lead</th>
                  <th className="px-4 py-3 text-center">Capacity</th>
                  <th className="px-4 py-3 text-center">Allocated</th>
                  <th className="px-4 py-3 text-center">Free</th>
                  <th className="px-4 py-3 text-center">Utilization</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                {utilizationData.slice(0, 8).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-gray-900">{row.employee}</td>
                    <td className="px-4 py-3.5 text-gray-400">{row.lead}</td>
                    <td className="px-4 py-3.5 text-center">{row.capacityWH} WH</td>
                    <td className="px-4 py-3.5 text-center text-primary-700 font-semibold">{row.allocatedWH} WH</td>
                    <td className="px-4 py-3.5 text-center font-semibold">{row.freeWH} WH</td>
                    <td className="px-4 py-3.5 text-center font-semibold">{row.utilization}%</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        row.color === 'green' ? 'bg-primary-50 text-primary-700' :
                        row.color === 'yellow' ? 'bg-yellow-50 text-yellow-700' :
                        row.color === 'red' ? 'bg-rose-50 text-rose-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {row.statusLabel}
                      </span>
                    </td>
                  </tr>
                ))}
                {utilizationData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">No utilization data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeSummaryTab === 'trend' && (
          <div>
            {utilizationData.length > 0 ? (
              <div className="w-full">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={utilizationData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="employee" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip />
                    <Bar dataKey="utilization" fill="#0f5c3a" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center py-12 text-gray-400 text-sm">No trend data available</p>
            )}
          </div>
        )}

        {activeSummaryTab === 'overbooked' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3 text-center">Capacity</th>
                  <th className="px-4 py-3 text-center">Allocated</th>
                  <th className="px-4 py-3 text-center">Overbooked</th>
                  <th className="px-4 py-3">Projects</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                {overbookedData.slice(0, 5).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-gray-900">{row.employee}</td>
                    <td className="px-4 py-3.5 text-center">{row.capacityWH} WH</td>
                    <td className="px-4 py-3.5 text-center text-primary-700">{row.allocatedWH} WH</td>
                    <td className="px-4 py-3.5 text-center text-rose-600 font-bold">{row.overbookedWH} WH</td>
                    <td className="px-4 py-3.5 text-gray-400 truncate max-w-[200px]" title={row.projects.join(', ')}>
                      {row.projects.join(', ')}
                    </td>
                  </tr>
                ))}
                {overbookedData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">No overbooked employees for this week</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
