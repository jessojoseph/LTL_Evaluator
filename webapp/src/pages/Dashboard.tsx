import { useEffect, useState } from 'react';
import { reportApi, weekApi } from '../api/client';
import type { DashboardData, Week, EmployeeUtilization, OverbookedResource } from '../types';
import {
  Users, Clock, CheckCircle2, AlertTriangle, TrendingUp, BarChart3,
  Calendar, Briefcase, Info,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line, Legend } from 'recharts';
import { BrandMark } from '../components/BrandLogo';
import { launcherIcon } from '../assets';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLORS = ['#0f5c3a', '#1a7a4c', '#34d399', '#6ee7b7', '#a7f3d0', '#0d4f31'];

const getHeatmapColorClass = (value: number) => {
  if (value === 0) return 'bg-gray-50/50 text-gray-300 border border-gray-150/30';
  if (value <= 15) return 'bg-primary-50 text-primary-700 font-semibold border border-primary-100/40';
  if (value <= 40) return 'bg-primary-100 text-primary-800 font-bold border border-primary-200/40';
  if (value <= 80) return 'bg-primary-600 text-white font-extrabold shadow-sm';
  return 'bg-[#0b4229] text-white font-black shadow-sm';
};


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

const StackedCustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (active && payload && payload.length) {
    const allocations = payload
      .filter((p) => p.value && p.value > 0 && p.dataKey !== 'totalWH')
      .map((p) => ({
        name: p.name || p.dataKey,
        value: p.value,
        color: p.fill || p.color,
      }))
      .sort((a, b) => b.value - a.value);

    const total = allocations.reduce((sum, item) => sum + item.value, 0);

    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-xs min-w-[200px] max-w-[280px]">
        <p className="font-bold text-gray-900 mb-2">{label}</p>
        <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
          {allocations.map((alloc, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 font-semibold text-gray-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full block" style={{ backgroundColor: alloc.color }} />
                <span className="truncate max-w-[130px]">{alloc.name}</span>
              </div>
              <span className="text-gray-900 font-extrabold">{alloc.value} WH</span>
            </div>
          ))}
        </div>
        {allocations.length > 0 && (
          <div className="border-t border-gray-100 mt-2.5 pt-2 flex items-center justify-between text-xs text-primary-700 font-extrabold">
            <span>Total WH</span>
            <span>{total.toFixed(1)} WH</span>
          </div>
        )}
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
  const [projectViewsTab, setProjectViewsTab] = useState<'chart' | 'table'>('chart');

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

  const matrixLeads = [...new Set(data?.leadWiseAllocation?.map((l) => l.leadName || 'Unknown') || [])].sort();
  const matrixProjects = [...new Set(data?.projectWiseAllocation?.map((p) => p.projectName || 'Unknown') || [])].sort();

  const cellLookup = new Map<string, number>();
  (data?.leadProjectAllocation || []).forEach((item) => {
    const key = `${item.leadName || 'Unknown'}|${item.projectName || 'Unknown'}`;
    cellLookup.set(key, (cellLookup.get(key) || 0) + item.totalWH);
  });

  const uniqueAllocatedEmployees = [...new Set((data?.projectEmployeeAllocation || []).map((pe) => pe.employeeName))].sort();

  const projectStackedData = (data?.projectWiseAllocation || []).map((proj) => {
    const projObj: Record<string, string | number> = {
      name: proj.projectName || 'Unknown',
      totalWH: proj.totalWH,
    };
    (data?.projectEmployeeAllocation || []).forEach((pe) => {
      if (pe.projectName === proj.projectName) {
        projObj[pe.employeeName] = pe.totalWH;
      }
    });
    return projObj;
  }).sort((a, b) => (b.totalWH as number) - (a.totalWH as number));

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

      {/* Analytics Grid Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Interactive Allocation Heatmap Grid Card */}
        <div className="card p-6 shadow-sm border border-gray-100 bg-white rounded-2xl flex flex-col justify-between xl:col-span-2">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-5 bg-primary-600 rounded-full" />
              <div>
                <h3 className="text-sm font-bold text-gray-950">Interactive Allocation Heatmap Grid</h3>
                <p className="text-xs text-gray-400 mt-0.5">Visual representation of working hour (WH) allocations between Leads and Projects</p>
              </div>
            </div>
            
            {/* Color Legend */}
            <div className="flex items-center gap-2.5 flex-wrap text-[10px] text-gray-500 font-bold">
              <span className="font-semibold text-gray-400 uppercase mr-1">Intensity:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-gray-50 border border-gray-150/30" />
                <span>0 WH</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-primary-50 border border-primary-100/40" />
                <span>1-15 WH</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-primary-100 border border-primary-200/40" />
                <span>16-40 WH</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-primary-600" />
                <span>41-80 WH</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-[#0b4229]" />
                <span>80+ WH</span>
              </div>
            </div>
          </div>

          {matrixLeads.length > 0 && matrixProjects.length > 0 ? (
            <div className="w-full">
              <div className="overflow-x-auto custom-scrollbar border border-gray-100 rounded-xl">
                <table className="w-full text-left border-collapse text-xs" style={{ minWidth: `${180 + matrixProjects.length * 110 + 100}px` }}>
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="px-4 py-3.5 w-[180px] sticky left-0 bg-gray-50 z-20 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Project Lead</th>
                      {matrixProjects.map((proj) => (
                        <th key={proj} className="px-3 py-3.5 text-center truncate max-w-[120px]" title={proj}>
                          {proj}
                        </th>
                      ))}
                      <th className="px-4 py-3.5 text-center w-[100px] border-l border-gray-100 font-extrabold text-gray-900 bg-gray-50/50">Total Lead</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                    {matrixLeads.map((lead) => {
                      let leadTotal = 0;
                      return (
                        <tr key={lead} className="hover:bg-gray-50/10 transition-colors">
                          {/* Sticky Lead Column */}
                          <td className="px-4 py-3 font-bold text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] truncate max-w-[180px]">
                            {lead}
                          </td>
                          {matrixProjects.map((proj) => {
                            const val = cellLookup.get(`${lead}|${proj}`) || 0;
                            leadTotal += val;
                            return (
                              <td key={proj} className="p-1 text-center">
                                <div
                                  className={`py-2 px-1 rounded-lg flex items-center justify-center transition-all duration-200 cursor-help ${getHeatmapColorClass(val)}`}
                                  title={`${lead} ➔ ${proj}: ${val} WH`}
                                >
                                  {val > 0 ? `${val} WH` : '—'}
                                </div>
                              </td>
                            );
                          })}
                          {/* Row Total */}
                          <td className="px-4 py-3 text-center font-extrabold text-primary-700 bg-primary-50/10 border-l border-gray-100">
                            {leadTotal} WH
                          </td>
                        </tr>
                      );
                    })}
                    {/* Column Totals Row */}
                    <tr className="bg-gray-50/50 font-bold border-t border-gray-100">
                      <td className="px-4 py-3.5 text-gray-950 sticky left-0 bg-gray-50 z-10 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        Total Project
                      </td>
                      {matrixProjects.map((proj) => {
                        const projTotal = matrixLeads.reduce((sum, lead) => sum + (cellLookup.get(`${lead}|${proj}`) || 0), 0);
                        return (
                          <td key={proj} className="px-3 py-3.5 text-center text-primary-700 font-extrabold">
                            {projTotal} WH
                          </td>
                        );
                      })}
                      {/* Grand Total */}
                      <td className="px-4 py-3.5 text-center font-black text-gray-900 bg-gray-100/50 border-l border-gray-100">
                        {matrixLeads.reduce((sum, lead) => sum + matrixProjects.reduce((s, proj) => s + (cellLookup.get(`${lead}|${proj}`) || 0), 0), 0)} WH
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {highestAllocatedProject && (
                <div className="mt-5 p-3 bg-primary-50/40 rounded-xl border border-primary-100/20 flex items-center gap-2.5 text-xs text-primary-800 font-medium">
                  <Info className="w-4 h-4 text-primary-600 flex-shrink-0" />
                  <span>Most resources allocated to <span className="font-bold">{highestAllocatedProject}</span></span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-gray-400 text-xs font-semibold">No allocation data for this week</div>
          )}
        </div>

        {/* Project Allocation Stats Ranking Card (1/3 width) */}
        <div className="card p-6 shadow-sm border border-gray-100 bg-white rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-5 bg-primary-600 rounded-full" />
              <div>
                <h3 className="text-sm font-bold text-gray-950">Project Allocation Stats</h3>
                <p className="text-xs text-gray-400 mt-0.5">Ranking of projects by allocated hours (WH)</p>
              </div>
            </div>
          </div>
          {projectData.length > 0 ? (
            <div className="mt-4 overflow-y-auto max-h-[320px] pr-2 custom-scrollbar">
              <div style={{ height: `${Math.max(260, projectData.length * 36)}px` }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={projectStackedData}
                    layout="vertical"
                    margin={{ top: 5, right: 25, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 9, fill: '#475569', fontWeight: 'bold' }}
                      width={80}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<StackedCustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                    {uniqueAllocatedEmployees.map((empName, index) => (
                      <Bar
                        key={empName}
                        dataKey={empName}
                        name={empName}
                        stackId="a"
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
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
            { key: 'projects', label: 'Project Statistics' },
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
        {activeSummaryTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex justify-end gap-1.5">
              <button
                onClick={() => setProjectViewsTab('chart')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  projectViewsTab === 'chart'
                    ? 'bg-primary-50 text-primary-700 border-primary-200 shadow-sm'
                    : 'bg-white text-gray-500 hover:text-gray-700 border-gray-200'
                }`}
              >
                Graph View
              </button>
              <button
                onClick={() => setProjectViewsTab('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  projectViewsTab === 'table'
                    ? 'bg-primary-50 text-primary-700 border-primary-200 shadow-sm'
                    : 'bg-white text-gray-500 hover:text-gray-700 border-gray-200'
                }`}
              >
                Table View
              </button>
            </div>

            {projectViewsTab === 'chart' ? (
              (data?.projectWiseAllocation || []).length > 0 ? (
                <div className="w-full mt-2">
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={data?.projectWiseAllocation || []} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                      <defs>
                        <linearGradient id="projBarGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0f5c3a" stopOpacity={1} />
                          <stop offset="100%" stopColor="#34d399" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="projectName" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'semibold' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} label={{ value: 'Hours (WH)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b', fontWeight: 'bold', offset: -5 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} label={{ value: 'Active Resources', angle: 90, position: 'insideRight', fontSize: 10, fill: '#64748b', fontWeight: 'bold', offset: -5 }} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const pList = payload as any[];
                            const name = pList[0].payload?.projectName || '';
                            const wh = pList.find(p => p.dataKey === 'totalWH')?.value;
                            const resCount = pList.find(p => p.dataKey === 'resourceCount')?.value;
                            return (
                              <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-xs">
                                <p className="font-bold text-gray-900 mb-1.5">{name}</p>
                                <p className="text-primary-700 font-semibold mb-0.5">Allocated: {wh} WH</p>
                                <p className="text-cyan-700 font-semibold">Resources: {resCount} Active</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, fontWeight: 'bold', paddingTop: '10px' }} />
                      <Bar yAxisId="left" dataKey="totalWH" name="Allocated Hours (WH)" fill="url(#projBarGrad)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Line yAxisId="right" type="monotone" dataKey="resourceCount" name="Active Resources" stroke="#06b6d4" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[260px] text-gray-400 text-xs font-semibold">No project data available</div>
              )
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/50 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="px-4 py-3">Project Name</th>
                      <th className="px-4 py-3 text-center">Allocated Hours</th>
                      <th className="px-4 py-3 text-center">Active Resources</th>
                      <th className="px-4 py-3 text-center">Priority</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3">Allocation Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                    {(data?.projectWiseAllocation || []).map((row, i) => {
                      const totalAllocated = data?.projectWiseAllocation.reduce((sum, item) => sum + item.totalWH, 0) || 1;
                      const percent = Math.round((row.totalWH / totalAllocated) * 100);
                      
                      return (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3.5 font-bold text-gray-900">{row.projectName}</td>
                          <td className="px-4 py-3.5 text-center text-primary-700 font-semibold">{row.totalWH} WH</td>
                          <td className="px-4 py-3.5 text-center font-semibold">{row.resourceCount ?? 0} active</td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.projectPriority === 'high' ? 'bg-rose-50 text-rose-700' :
                              row.projectPriority === 'medium' ? 'bg-amber-50 text-amber-700' :
                              'bg-blue-50 text-blue-700'
                            }`}>
                              {(row.projectPriority || 'medium').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.projectStatus === 'active' ? 'bg-primary-50 text-primary-700' :
                              row.projectStatus === 'on_hold' ? 'bg-amber-50 text-amber-700' :
                              row.projectStatus === 'completed' ? 'bg-gray-100 text-gray-600' :
                              'bg-red-50 text-red-700'
                            }`}>
                              {row.projectStatus ? row.projectStatus.replace('_', ' ') : 'active'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 w-[200px]">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-100 h-2 rounded-full overflow-hidden shrink-0">
                                <div className="bg-primary-600 h-full rounded-full" style={{ width: `${percent}%` }} />
                              </div>
                              <span className="text-[10px] text-gray-500 font-bold">{percent}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {(data?.projectWiseAllocation || []).length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-400">No project allocation data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeSummaryTab === 'capacity' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Primary Lead</th>
                  <th className="px-4 py-3">Projects</th>
                  <th className="px-4 py-3 text-center">Capacity</th>
                  <th className="px-4 py-3 text-center">Allocated</th>
                  <th className="px-4 py-3 text-center">Free</th>
                  <th className="px-4 py-3 text-center">Utilization</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                {utilizationData.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-gray-900">{row.employee}</td>
                    <td className="px-4 py-3.5 text-gray-400">{row.lead}</td>
                    <td className="px-4 py-3.5">
                      {row.projects.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[240px]">
                          {row.projects.map((p, j) => (
                            <span key={j} className="text-[10px] bg-primary-50 text-primary-700 font-semibold px-1.5 py-0.5 rounded-md truncate max-w-[120px]" title={p}>
                              {p}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
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
                    <td colSpan={8} className="text-center py-8 text-gray-400">No utilization data available</td>
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
