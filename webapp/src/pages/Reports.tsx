import { useEffect, useState } from 'react';
import { reportApi, weekApi, exportApi, downloadExcel } from '../api/client';
import type { Week, EmployeeUtilization, ProjectWiseReport, LeadSummary, FreeResource, OverbookedResource, EmployeeWiseItem } from '../types';
import { Download, Search, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';

const TABS = [
  { key: 'utilization', label: 'Employee Utilization' },
  { key: 'project-wise', label: 'Project Wise' },
  { key: 'lead-summary', label: 'Lead Summary' },
  { key: 'free-resources', label: 'Free Resources' },
  { key: 'overbooked', label: 'Overbooked' },
  { key: 'employee-wise', label: 'Employee Wise' },
  { key: 'comparison', label: 'Week Comparison' },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('utilization');
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([]);
  const [utilData, setUtilData] = useState<EmployeeUtilization[]>([]);
  const [projData, setProjData] = useState<ProjectWiseReport[]>([]);
  const [leadData, setLeadData] = useState<LeadSummary[]>([]);
  const [freeData, setFreeData] = useState<FreeResource[]>([]);
  const [overData, setOverData] = useState<OverbookedResource[]>([]);
  const [empWiseData, setEmpWiseData] = useState<EmployeeWiseItem[]>([]);
  const [compData, setCompData] = useState<{ weeks: { id: string; name: string }[]; report: Record<string, string | number>[] }>({ weeks: [], report: [] });
  const [expandedEmp, setExpandedEmp] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

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

  const fetchData = async () => {
    if (!selectedWeek) return;
    setLoading(true);
    try {
      const results = await Promise.all([
        reportApi.employeeUtilization({ weekId: selectedWeek }),
        reportApi.projectWise({ weekId: selectedWeek }),
        reportApi.leadSummary({ weekId: selectedWeek }),
        reportApi.freeResources({ weekId: selectedWeek }),
        reportApi.overbookedResources({ weekId: selectedWeek }),
        reportApi.employeeWise({ weekId: selectedWeek }),
      ]);
      setUtilData(results[0].data.report);
      setProjData(results[1].data.report);
      setLeadData(results[2].data.report);
      setFreeData(results[3].data.report);
      setOverData(results[4].data.report);
      setEmpWiseData(results[5].data.report || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchComparison = async () => {
    if (selectedWeeks.length < 2) return;
    setLoading(true);
    try {
      const { data } = await reportApi.weekComparison({ weekIds: selectedWeeks.join(',') });
      setCompData(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (activeTab !== 'comparison') fetchData(); }, [selectedWeek, activeTab]);
  useEffect(() => { if (activeTab === 'comparison') fetchComparison(); }, [selectedWeeks, activeTab]);

  const handleExport = async () => {
    if (!selectedWeek) return;
    const { data } = await exportApi.weeklyReport({ weekId: selectedWeek });
    const week = weeks.find((w) => w._id === selectedWeek);
    downloadExcel(data as Blob, `weekly-report-${week?.weekName || ''}.xlsx`);
  };

  const toggleWeek = (id: string) => {
    setSelectedWeeks((prev) => prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]);
  };

  const filteredUtilData = utilData.filter(
    (r) => !search || r.employee.toLowerCase().includes(search.toLowerCase()) || r.lead.toLowerCase().includes(search.toLowerCase())
  );

  const activeTabLabel = TABS.find((t) => t.key === activeTab)?.label || 'Reports';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 gradient-primary rounded-xl shadow-sm">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-500 mt-0.5">View and export planning reports</p>
          </div>
        </div>
        {activeTab !== 'comparison' && (
          <button onClick={handleExport} className="btn-secondary">
            <Download className="w-4 h-4" /> Export Excel
          </button>
        )}
      </div>

      {/* Week selector */}
      {activeTab !== 'comparison' ? (
        <div className="flex items-center gap-2 flex-wrap">
          <select className="input w-auto text-sm" value={selectedYear}
            onChange={(e) => { setSelectedYear(e.target.value); setSelectedMonth(''); setSelectedWeek(''); }}>
            <option value="">All Years</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="input w-auto text-sm" value={selectedMonth}
            onChange={(e) => { setSelectedMonth(e.target.value); setSelectedWeek(''); }}>
            <option value="">All Months</option>
            {monthsInYear.map((m) => <option key={m} value={m}>{MONTHS[m]}</option>)}
          </select>
          <select className="input w-auto text-sm min-w-[200px]" value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}>
            <option value="">Select week...</option>
            {filteredWeeks.map((w) => {
              const d = new Date(w.startDate);
              const isInactive = w.isActive === false;
              return <option key={w._id} value={w._id} className={isInactive ? 'text-red-600' : ''}>
                {w.weekName} — {d.toLocaleDateString()}{isInactive ? ' ⛔ Inactive' : ''}
              </option>;
            })}
          </select>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {weeks.map((w) => {
            const isInactive = w.isActive === false;
            return (
              <button key={w._id} onClick={() => toggleWeek(w._id)}
                className={`px-3 py-1.5 rounded-xl text-sm border transition-all duration-200 ${
                  selectedWeeks.includes(w._id)
                    ? isInactive ? 'bg-red-50 border-red-300 text-red-700' : 'bg-primary-50 border-primary-300 text-primary-700'
                    : isInactive ? 'bg-white border-red-200 text-red-500 hover:bg-red-50' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                }`}>
                {w.weekName}{isInactive ? ' (Inactive)' : ''}
              </button>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-100">
        <nav className="tabs-modern overflow-x-auto">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={activeTab === tab.key ? 'tab-modern-active' : 'tab-modern-inactive'}>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Search */}
      {activeTab === 'utilization' && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-10" placeholder="Filter by employee or lead..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Loading...</p>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === 'utilization' && <UtilizationTable data={filteredUtilData} />}
            {activeTab === 'project-wise' && <ProjectWiseTable data={projData} />}
            {activeTab === 'lead-summary' && <LeadSummaryTable data={leadData} />}
            {activeTab === 'free-resources' && <FreeResourcesTable data={freeData} />}
            {activeTab === 'overbooked' && <OverbookedTable data={overData} />}
            {activeTab === 'employee-wise' && <EmployeeWiseTable data={empWiseData} expandedEmp={expandedEmp} setExpandedEmp={setExpandedEmp} />}
            {activeTab === 'comparison' && <ComparisonTable data={compData} />}
          </div>
        </div>
      )}
    </div>
  );
}

function TableHead({ columns, align }: { columns: string[]; align?: ('left' | 'center' | 'right')[] }) {
  return (
    <thead>
      <tr className="bg-gray-50/80 border-b border-gray-100">
        {columns.map((col, i) => (
          <th key={i} className={`px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider ${
            align?.[i] || (i === 0 ? 'text-left' : i === columns.length - 1 ? 'text-right' : 'text-center')
          }`}>
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function UtilizationTable({ data }: { data: EmployeeUtilization[] }) {
  return (
    <table className="table-modern">
      <TableHead columns={['Employee', 'Lead', 'Capacity', 'Allocated', 'Free', 'Overbooked', 'Utilization', 'Status', '']} />
      <tbody>
        {data.map((r, i) => (
          <tr key={i}>
            <td className="font-semibold text-gray-900">{r.employee}</td>
            <td className="text-gray-500">{r.lead}</td>
            <td className="text-center text-gray-600">{r.capacityWH}</td>
            <td className="text-center text-gray-600">{r.allocatedWH}</td>
            <td className="text-center text-gray-600">{r.freeWH}</td>
            <td className="text-center text-red-600 font-semibold">{r.overbookedWH > 0 ? r.overbookedWH : '-'}</td>
            <td className="text-center font-semibold">{r.utilization}%</td>
            <td>
              <span className={`badge ${r.color === 'green' ? 'bg-emerald-50 text-emerald-700' : r.color === 'yellow' ? 'bg-yellow-50 text-yellow-700' : r.color === 'red' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                {r.statusLabel}
              </span>
            </td>
            <td></td>
          </tr>
        ))}
        {data.length === 0 && <tr><td colSpan={9} className="text-center py-12 text-gray-400">No data</td></tr>}
      </tbody>
    </table>
  );
}

function ProjectWiseTable({ data }: { data: ProjectWiseReport[] }) {
  return (
    <table className="table-modern">
      <TableHead columns={['Lead', 'Project', 'Employee', 'Days', 'Extra Hrs', 'WH']} />
      <tbody>
        {data.map((r, i) => (
          <tr key={i}>
            <td className="text-gray-900">{r.projectLead}</td>
            <td className="text-gray-900 font-medium">{r.project}</td>
            <td className="text-gray-900">{r.employee}</td>
            <td className="text-center text-gray-600">{r.days}</td>
            <td className="text-center text-gray-600">{r.extraHours}</td>
            <td className="text-center font-semibold text-primary-700">{r.allocatedWH}</td>
          </tr>
        ))}
        {data.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-gray-400">No data</td></tr>}
      </tbody>
    </table>
  );
}

function LeadSummaryTable({ data }: { data: LeadSummary[] }) {
  return (
    <table className="table-modern">
      <TableHead columns={['Lead', 'Projects', 'Employees', 'Capacity', 'Allocated', 'Free', 'Utilization']} />
      <tbody>
        {data.map((r, i) => (
          <tr key={i}>
            <td className="font-semibold text-gray-900">{r.projectLead}</td>
            <td className="text-center text-gray-600">{r.projectCount}</td>
            <td className="text-center text-gray-600">{r.employeeCount}</td>
            <td className="text-center text-gray-600">{r.totalCapacity}</td>
            <td className="text-center text-gray-600">{r.allocatedWH}</td>
            <td className="text-center text-gray-600">{r.freeWH}</td>
            <td className="text-center font-semibold">{r.utilization}%</td>
          </tr>
        ))}
        {data.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">No data</td></tr>}
      </tbody>
    </table>
  );
}

function FreeResourcesTable({ data }: { data: FreeResource[] }) {
  return (
    <table className="table-modern">
      <TableHead columns={['Employee', 'Lead', 'Capacity', 'Allocated', 'Free WH']} />
      <tbody>
        {data.map((r, i) => (
          <tr key={i}>
            <td className="font-semibold text-gray-900">{r.employee}</td>
            <td className="text-gray-500">{r.lead}</td>
            <td className="text-center text-gray-600">{r.capacityWH}</td>
            <td className="text-center text-gray-600">{r.allocatedWH}</td>
            <td className="text-center font-semibold text-emerald-600">{r.freeWH}</td>
          </tr>
        ))}
        {data.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-gray-400">No free resources</td></tr>}
      </tbody>
    </table>
  );
}

function OverbookedTable({ data }: { data: OverbookedResource[] }) {
  return (
    <table className="table-modern">
      <TableHead columns={['Employee', 'Capacity', 'Allocated', 'Overbooked', 'Projects']} align={['left','center','center','center','left']} />
      <tbody>
        {data.map((r, i) => (
          <tr key={i}>
            <td className="font-semibold text-gray-900">{r.employee}</td>
            <td className="text-center text-gray-600">{r.capacityWH}</td>
            <td className="text-center text-gray-600">{r.allocatedWH}</td>
            <td className="text-center font-semibold text-red-600">{r.overbookedWH}</td>
            <td className="text-gray-600 max-w-[250px] truncate">{r.projects?.join(', ') || '-'}</td>
          </tr>
        ))}
        {data.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-gray-400">No overbooked resources</td></tr>}
      </tbody>
    </table>
  );
}

function EmployeeWiseTable({ data, expandedEmp, setExpandedEmp }: { data: EmployeeWiseItem[]; expandedEmp: string | null; setExpandedEmp: (id: string | null) => void }) {
  return (
    <div className="p-2 space-y-2">
      {data.map((item) => (
        <div key={item.employeeId} className="border border-gray-100 rounded-xl overflow-hidden transition-all duration-200 hover:border-gray-200">
          <button
            onClick={() => setExpandedEmp(expandedEmp === item.employeeId ? null : item.employeeId)}
            className="w-full flex items-center justify-between px-5 py-4 bg-gray-50/50 hover:bg-gray-100/50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-sm font-bold text-white">{item.employee.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{item.employee}</p>
                <p className="text-xs text-gray-400">Reports to: {item.lead}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                item.color === 'red' ? 'bg-red-50 text-red-700' :
                item.color === 'yellow' ? 'bg-yellow-50 text-yellow-700' :
                item.color === 'green' ? 'bg-emerald-50 text-emerald-700' :
                'bg-gray-100 text-gray-600'
              }`}>{item.statusLabel}</span>
              <span className="text-gray-400 text-xs">{item.projects.length} project{item.projects.length !== 1 ? 's' : ''}</span>
              <span className="font-bold text-primary-700">{item.totalWH} WH</span>
              {expandedEmp === item.employeeId ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </button>
          {expandedEmp === item.employeeId && (
            <div className="overflow-x-auto animate-slide-down">
              <table className="table-modern">
                <thead>
                  <tr className="bg-white border-t border-gray-100">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Project</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Lead</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Days</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Extra Hrs</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">WH</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {item.projects.map((proj, i) => (
                    <tr key={i} className="bg-white hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 text-gray-900 font-medium">{proj.project}</td>
                      <td className="px-4 py-2.5 text-gray-500">{proj.lead}</td>
                      <td className="px-4 py-2.5 text-center text-gray-600">{proj.days}</td>
                      <td className="px-4 py-2.5 text-center text-gray-600">{proj.extraHours}</td>
                      <td className="px-4 py-2.5 text-center font-semibold">{proj.allocatedWH}</td>
                    </tr>
                  ))}
                  <tr className="bg-primary-50/30 font-semibold">
                    <td colSpan={4} className="px-4 py-2.5 text-right text-gray-700">Total:</td>
                    <td className="px-4 py-2.5 text-center text-primary-700">{item.totalWH} WH</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
      {data.length === 0 && <p className="text-center py-12 text-gray-400">No employee data for this week</p>}
    </div>
  );
}

function ComparisonTable({ data }: { data: { weeks: { id: string; name: string }[]; report: Record<string, string | number>[] } }) {
  if (data.weeks.length < 2) return <p className="text-center py-12 text-gray-400">Select at least 2 weeks to compare</p>;
  return (
    <table className="table-modern">
      <TableHead columns={['Employee', ...data.weeks.map((w) => w.name), 'Difference']} align={['left', ...data.weeks.map(() => 'center' as const), 'center']} />
      <tbody>
        {data.report.map((r, i) => (
          <tr key={i}>
            <td className="font-semibold text-gray-900">{r.employee}</td>
            {data.weeks.map((w) => (
              <td key={w.id} className="text-center text-gray-600">{r[w.name] ?? 0}</td>
            ))}
            <td className="text-center font-semibold">{r.difference}</td>
          </tr>
        ))}
        {data.report.length === 0 && <tr><td colSpan={data.weeks.length + 2} className="text-center py-12 text-gray-400">No data</td></tr>}
      </tbody>
    </table>
  );
}
