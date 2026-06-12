import { useEffect, useState } from 'react';
import { reportApi, weekApi, exportApi, downloadExcel } from '../api/client';
import type { Week, EmployeeUtilization, ProjectWiseReport, LeadSummary, FreeResource, OverbookedResource, EmployeeWiseItem } from '../types';
import { Download, Search } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Reports</h1><p className="text-gray-500 mt-1">View and export planning reports</p></div>
        {activeTab !== 'comparison' && (
          <button onClick={handleExport} className="btn-secondary"><Download className="w-4 h-4" /> Export Excel</button>
        )}
      </div>

      {/* Week selector */}
      {activeTab !== 'comparison' ? (
        <div className="flex items-center gap-2 flex-wrap">
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
      ) : (
        <div className="flex flex-wrap gap-2">
          {weeks.map((w) => (
            <button key={w._id} onClick={() => toggleWeek(w._id)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${selectedWeeks.includes(w._id) ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {w.weekName}
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Search */}
      {activeTab === 'utilization' && (
        <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input className="input pl-9" placeholder="Filter by employee or lead..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
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

function UtilizationTable({ data }: { data: EmployeeUtilization[] }) {
  return (
    <table className="w-full text-sm">
      <thead><tr className="bg-gray-50 border-b border-gray-200">
        <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
        <th className="text-left px-4 py-3 font-medium text-gray-600">Lead</th>
        <th className="text-center px-4 py-3 font-medium text-gray-600">Capacity</th>
        <th className="text-center px-4 py-3 font-medium text-gray-600">Allocated</th>
        <th className="text-center px-4 py-3 font-medium text-gray-600">Free</th>
        <th className="text-center px-4 py-3 font-medium text-gray-600">Overbooked</th>
        <th className="text-center px-4 py-3 font-medium text-gray-600">Utilization</th>
        <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
      </tr></thead>
      <tbody className="divide-y divide-gray-200">
        {data.map((r, i) => (
          <tr key={i} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-medium text-gray-900">{r.employee}</td>
            <td className="px-4 py-3 text-gray-600">{r.lead}</td>
            <td className="px-4 py-3 text-center text-gray-600">{r.capacityWH}</td>
            <td className="px-4 py-3 text-center text-gray-600">{r.allocatedWH}</td>
            <td className="px-4 py-3 text-center text-gray-600">{r.freeWH}</td>
            <td className="px-4 py-3 text-center text-red-600 font-medium">{r.overbookedWH > 0 ? r.overbookedWH : '-'}</td>
            <td className="px-4 py-3 text-center font-medium">{r.utilization}%</td>
            <td className="px-4 py-3">
              <span className={`badge ${r.color === 'green' ? 'bg-green-50 text-green-700' : r.color === 'yellow' ? 'bg-yellow-50 text-yellow-700' : r.color === 'red' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                {r.statusLabel}
              </span>
            </td>
          </tr>
        ))}
        {data.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-gray-400">No data</td></tr>}
      </tbody>
    </table>
  );
}

function ProjectWiseTable({ data }: { data: ProjectWiseReport[] }) {
  return (
    <table className="w-full text-sm">
      <thead><tr className="bg-gray-50 border-b border-gray-200">
        <th className="text-left px-4 py-3 font-medium text-gray-600">Lead</th><th className="text-left px-4 py-3 font-medium text-gray-600">Project</th>
        <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th><th className="text-center px-4 py-3 font-medium text-gray-600">Days</th>
        <th className="text-center px-4 py-3 font-medium text-gray-600">Extra Hrs</th><th className="text-center px-4 py-3 font-medium text-gray-600">WH</th>
      </tr></thead>
      <tbody className="divide-y divide-gray-200">
        {data.map((r, i) => (
          <tr key={i} className="hover:bg-gray-50">
            <td className="px-4 py-3 text-gray-900">{r.projectLead}</td><td className="px-4 py-3 text-gray-900">{r.project}</td>
            <td className="px-4 py-3 text-gray-900">{r.employee}</td><td className="px-4 py-3 text-center text-gray-600">{r.days}</td>
            <td className="px-4 py-3 text-center text-gray-600">{r.extraHours}</td><td className="px-4 py-3 text-center font-medium">{r.allocatedWH}</td>
          </tr>
        ))}
        {data.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-gray-400">No data</td></tr>}
      </tbody>
    </table>
  );
}

function LeadSummaryTable({ data }: { data: LeadSummary[] }) {
  return (
    <table className="w-full text-sm">
      <thead><tr className="bg-gray-50 border-b border-gray-200">
        <th className="text-left px-4 py-3 font-medium text-gray-600">Lead</th><th className="text-center px-4 py-3 font-medium text-gray-600">Projects</th>
        <th className="text-center px-4 py-3 font-medium text-gray-600">Employees</th><th className="text-center px-4 py-3 font-medium text-gray-600">Capacity</th>
        <th className="text-center px-4 py-3 font-medium text-gray-600">Allocated</th><th className="text-center px-4 py-3 font-medium text-gray-600">Free</th>
        <th className="text-center px-4 py-3 font-medium text-gray-600">Utilization</th>
      </tr></thead>
      <tbody className="divide-y divide-gray-200">
        {data.map((r, i) => (
          <tr key={i} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-medium text-gray-900">{r.projectLead}</td><td className="px-4 py-3 text-center text-gray-600">{r.projectCount}</td>
            <td className="px-4 py-3 text-center text-gray-600">{r.employeeCount}</td><td className="px-4 py-3 text-center text-gray-600">{r.totalCapacity}</td>
            <td className="px-4 py-3 text-center text-gray-600">{r.allocatedWH}</td><td className="px-4 py-3 text-center text-gray-600">{r.freeWH}</td>
            <td className="px-4 py-3 text-center font-medium">{r.utilization}%</td>
          </tr>
        ))}
        {data.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">No data</td></tr>}
      </tbody>
    </table>
  );
}

function FreeResourcesTable({ data }: { data: FreeResource[] }) {
  return (
    <table className="w-full text-sm">
      <thead><tr className="bg-gray-50 border-b border-gray-200">
        <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th><th className="text-left px-4 py-3 font-medium text-gray-600">Lead</th>
        <th className="text-center px-4 py-3 font-medium text-gray-600">Capacity</th><th className="text-center px-4 py-3 font-medium text-gray-600">Allocated</th>
        <th className="text-center px-4 py-3 font-medium text-gray-600">Free WH</th>
      </tr></thead>
      <tbody className="divide-y divide-gray-200">
        {data.map((r, i) => (
          <tr key={i} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-medium text-gray-900">{r.employee}</td><td className="px-4 py-3 text-gray-600">{r.lead}</td>
            <td className="px-4 py-3 text-center text-gray-600">{r.capacityWH}</td><td className="px-4 py-3 text-center text-gray-600">{r.allocatedWH}</td>
            <td className="px-4 py-3 text-center font-medium text-green-600">{r.freeWH}</td>
          </tr>
        ))}
        {data.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-gray-400">No free resources</td></tr>}
      </tbody>
    </table>
  );
}

function OverbookedTable({ data }: { data: OverbookedResource[] }) {
  return (
    <table className="w-full text-sm">
      <thead><tr className="bg-gray-50 border-b border-gray-200">
        <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th><th className="text-center px-4 py-3 font-medium text-gray-600">Capacity</th>
        <th className="text-center px-4 py-3 font-medium text-gray-600">Allocated</th><th className="text-center px-4 py-3 font-medium text-gray-600">Overbooked</th>
        <th className="text-left px-4 py-3 font-medium text-gray-600">Projects</th>
      </tr></thead>
      <tbody className="divide-y divide-gray-200">
        {data.map((r, i) => (
          <tr key={i} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-medium text-gray-900">{r.employee}</td><td className="px-4 py-3 text-center text-gray-600">{r.capacityWH}</td>
            <td className="px-4 py-3 text-center text-gray-600">{r.allocatedWH}</td><td className="px-4 py-3 text-center font-medium text-red-600">{r.overbookedWH}</td>
            <td className="px-4 py-3 text-gray-600">{r.projects?.join(', ') || '-'}</td>
          </tr>
        ))}
        {data.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-gray-400">No overbooked resources</td></tr>}
      </tbody>
    </table>
  );
}

function EmployeeWiseTable({ data, expandedEmp, setExpandedEmp }: { data: EmployeeWiseItem[]; expandedEmp: string | null; setExpandedEmp: (id: string | null) => void }) {
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.employeeId} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setExpandedEmp(expandedEmp === item.employeeId ? null : item.employeeId)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-700">{item.employee.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{item.employee}</p>
                <p className="text-xs text-gray-500">Reports to: {item.lead}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                item.color === 'red' ? 'bg-red-50 text-red-700' :
                item.color === 'yellow' ? 'bg-yellow-50 text-yellow-700' :
                item.color === 'green' ? 'bg-green-50 text-green-700' :
                'bg-gray-100 text-gray-600'
              }`}>{item.statusLabel}</span>
              <span className="text-gray-500">{item.projects.length} project{item.projects.length !== 1 ? 's' : ''}</span>
              <span className="font-semibold text-primary-700">{item.totalWH} WH</span>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedEmp === item.employeeId ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </button>
          {expandedEmp === item.employeeId && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white border-t border-gray-200">
                    <th className="text-left px-4 py-2 font-medium text-gray-500">Project</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">Lead</th>
                    <th className="text-center px-4 py-2 font-medium text-gray-500">Days</th>
                    <th className="text-center px-4 py-2 font-medium text-gray-500">Extra Hrs</th>
                    <th className="text-center px-4 py-2 font-medium text-gray-500">WH</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {item.projects.map((proj, i) => (
                    <tr key={i} className="bg-white hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-900">{proj.project}</td>
                      <td className="px-4 py-2 text-gray-600">{proj.lead}</td>
                      <td className="px-4 py-2 text-center text-gray-600">{proj.days}</td>
                      <td className="px-4 py-2 text-center text-gray-600">{proj.extraHours}</td>
                      <td className="px-4 py-2 text-center font-medium">{proj.allocatedWH}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-medium">
                    <td colSpan={4} className="px-4 py-2 text-right text-gray-700">Total:</td>
                    <td className="px-4 py-2 text-center text-primary-700">{item.totalWH} WH</td>
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
    <table className="w-full text-sm">
      <thead><tr className="bg-gray-50 border-b border-gray-200">
        <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
        {data.weeks.map((w) => <th key={w.id} className="text-center px-4 py-3 font-medium text-gray-600">{w.name}</th>)}
        <th className="text-center px-4 py-3 font-medium text-gray-600">Difference</th>
      </tr></thead>
      <tbody className="divide-y divide-gray-200">
        {data.report.map((r, i) => (
          <tr key={i} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-medium text-gray-900">{r.employee}</td>
            {data.weeks.map((w) => <td key={w.id} className="px-4 py-3 text-center text-gray-600">{r[w.name] ?? 0}</td>)}
            <td className="px-4 py-3 text-center font-medium">{r.difference}</td>
          </tr>
        ))}
        {data.report.length === 0 && <tr><td colSpan={data.weeks.length + 2} className="text-center py-12 text-gray-400">No data</td></tr>}
      </tbody>
    </table>
  );
}
