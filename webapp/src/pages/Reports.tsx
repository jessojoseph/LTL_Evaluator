import { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { reportApi, weekApi, payrollApi, exportApi, downloadExcel } from '../api/client';
import type { Week, EmployeeUtilization, ProjectWiseReport, LeadSummary, FreeResource, OverbookedResource, EmployeeWiseItem } from '../types';
import { Download, Search, ChevronDown, ChevronUp, BarChart3, AlertTriangle, Users, CalendarDays } from 'lucide-react';
import { Loader } from '../components/Loader';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { useAuth } from '../context/AuthContext';

// ── Allocation Report Tabs ──
const ALLOCATION_TABS = [
  { key: 'utilization', label: 'Employee Utilization' },
  { key: 'project-wise', label: 'Project Wise' },
  { key: 'lead-summary', label: 'Lead Summary' },
  { key: 'free-resources', label: 'Free Resources' },
  { key: 'overbooked', label: 'Overbooked' },
  { key: 'employee-wise', label: 'Employee Wise' },
  { key: 'comparison', label: 'Week Comparison' },
];

// ── Payroll Types ──
interface LeaveRecord {
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  isLop: boolean;
  lopReason?: string;
  days: number;
}

interface EmployeePayrollRow {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  email: string;
  department: string;
  designation: string;
  employmentType: string;
  workingDays: number;
  leaveDays: number;
  lopDays: number;
  presentDays: number;
  netPayableDays: number;
  leaveTypeBreakdown: Record<string, { days: number; lopDays: number }>;
  leaveRecords: LeaveRecord[];
}

interface PayrollResponse {
  year: number;
  month: number;
  monthName: string;
  summary: {
    totalEmployees: number;
    totalWorkingDays: number;
    totalLeaveDays: number;
    totalLopDays: number;
    employeesWithLop: number;
  };
  report: EmployeePayrollRow[];
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const LEAVE_TYPE_COLORS: Record<string, string> = {
  annual: 'bg-blue-50 text-blue-700 border-blue-200',
  sick: 'bg-red-50 text-red-700 border-red-200',
  casual: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medical: 'bg-purple-50 text-purple-700 border-purple-200',
  personal: 'bg-orange-50 text-orange-700 border-orange-200',
  other: 'bg-gray-50 text-gray-600 border-gray-200',
};

export default function Reports() {
  const { hasPermission } = useAuth();
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const canViewPayroll = hasPermission('reports:payroll');

  // Determine active tab from route params: /reports/:reportTab
  const isPayrollRoute = location.pathname === '/reports/payroll';
  const routeTab = isPayrollRoute ? 'payroll' : (params.reportTab || 'utilization');
  const [activeTab, setActiveTab] = useState(routeTab);

  // Sync tab when route changes
  useEffect(() => {
    setActiveTab(routeTab);
  }, [routeTab]);

  // ── Allocation Report State ──
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

  // ── Payroll State ──
  const payrollCurrentYear = new Date().getFullYear();
  const payrollCurrentMonth = new Date().getMonth();
  const [payYear, setPayYear] = useState(payrollCurrentYear);
  const [payMonth, setPayMonth] = useState(payrollCurrentMonth);
  const [payData, setPayData] = useState<PayrollResponse | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [paySearch, setPaySearch] = useState('');
  const [payExpandedEmp, setPayExpandedEmp] = useState<string | null>(null);

  const isPayrollTab = activeTab === 'payroll';

  // ── Allocation helpers ──
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

  // ── Init weeks ──
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

  // ── Fetch allocation data ──
  const fetchAllocationData = async () => {
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

  useEffect(() => {
    if (!isPayrollTab && activeTab !== 'comparison') fetchAllocationData();
  }, [selectedWeek, activeTab]);

  useEffect(() => {
    if (activeTab === 'comparison') fetchComparison();
  }, [selectedWeeks, activeTab]);

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

  const utilPagination = usePagination({ data: filteredUtilData, pageSize: 10 });
  const projPagination = usePagination({ data: projData, pageSize: 10 });
  const leadPagination = usePagination({ data: leadData, pageSize: 10 });
  const freePagination = usePagination({ data: freeData, pageSize: 10 });
  const overPagination = usePagination({ data: overData, pageSize: 10 });

  // ── Payroll fetch ──
  const fetchPayroll = async () => {
    setPayLoading(true);
    try {
      const { data: res } = await payrollApi.monthlySummary({
        year: String(payYear),
        month: String(payMonth),
      });
      setPayData(res);
    } finally {
      setPayLoading(false);
    }
  };

  useEffect(() => {
    if (isPayrollTab) fetchPayroll();
  }, [payYear, payMonth, isPayrollTab]);

  const handlePayrollExport = async () => {
    const { data: blob } = await payrollApi.exportExcel({
      year: String(payYear),
      month: String(payMonth),
    });
    downloadExcel(blob as Blob, `payroll-${MONTHS[payMonth].toLowerCase()}-${payYear}.xlsx`);
  };

  const payFilteredReport = payData?.report.filter(
    (r) =>
      !paySearch ||
      r.employeeName.toLowerCase().includes(paySearch.toLowerCase()) ||
      r.employeeCode.toLowerCase().includes(paySearch.toLowerCase()) ||
      r.department.toLowerCase().includes(paySearch.toLowerCase())
  ) || [];

  const payTotalLeaveDays = payFilteredReport.reduce((s, r) => s + r.leaveDays, 0);
  const payTotalLopDays = payFilteredReport.reduce((s, r) => s + r.lopDays, 0);

  // ── Build tab list with sections ──
  const tabSections = [
    {
      label: 'Allocation Reports',
      tabs: ALLOCATION_TABS,
    },
    ...(canViewPayroll ? [{
      label: 'Leave Reports',
      tabs: [{ key: 'payroll', label: 'Payroll' }],
    }] : []),
  ];

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
            <p className="text-sm text-gray-500 mt-0.5">
              {isPayrollTab ? 'Monthly leave summary for payroll calculation' : 'View and export planning reports'}
            </p>
          </div>
        </div>
        {!isPayrollTab && activeTab !== 'comparison' && (
          <button onClick={handleExport} className="btn-secondary">
            <Download className="w-4 h-4" /> Export Excel
          </button>
        )}
        {isPayrollTab && payData && (
          <button onClick={handlePayrollExport} className="btn-secondary">
            <Download className="w-4 h-4" /> Export Excel
          </button>
        )}
      </div>

      {/* ── Allocation: Week selector ── */}
      {!isPayrollTab && activeTab !== 'comparison' && (
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
      )}

      {/* ── Allocation: Week comparison selector ── */}
      {!isPayrollTab && activeTab === 'comparison' && (
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

      {/* ── Payroll: Controls ── */}
      {isPayrollTab && (
        <div className="flex items-center gap-3 flex-wrap">
          <select className="input w-auto text-sm" value={payYear} onChange={(e) => setPayYear(Number(e.target.value))}>
            {Array.from({ length: 5 }, (_, i) => payrollCurrentYear - 2 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select className="input w-auto text-sm" value={payMonth} onChange={(e) => setPayMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
          <div className="relative max-w-xs flex-1">
            <input className="input pl-8" placeholder="Search employee, code, or department..."
              value={paySearch} onChange={(e) => setPaySearch(e.target.value)} />
          </div>
        </div>
      )}

      {/* ── Tabs with sections ── */}
      <div className="border-b border-gray-100">
        <nav className="tabs-modern overflow-x-auto">
          {tabSections.map((section, si) => (
            <div key={si} className="flex items-center gap-0.5">
              {si > 0 && <div className="w-px h-5 bg-gray-200 mx-2" />}
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mr-1 select-none">{section.label}</span>
              {section.tabs.map((tab) => (
                <button key={tab.key} onClick={() => {
                  if (tab.key === 'payroll') {
                    navigate('/reports/payroll');
                  } else {
                    navigate(`/reports/${tab.key}`);
                  }
                }}
                  className={activeTab === tab.key ? 'tab-modern-active' : 'tab-modern-inactive'}>
                  {tab.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </div>

      {/* ── Allocation: Search ── */}
      {activeTab === 'utilization' && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-10" placeholder="Filter by employee or lead..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      )}

      {/* ── Allocation Report Content ── */}
      {!isPayrollTab && (loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader text="Loading report data..." />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === 'utilization' && <UtilizationTable data={utilPagination.paginatedData} />}
            {activeTab === 'project-wise' && <ProjectWiseTable data={projPagination.paginatedData} />}
            {activeTab === 'lead-summary' && <LeadSummaryTable data={leadPagination.paginatedData} />}
            {activeTab === 'free-resources' && <FreeResourcesTable data={freePagination.paginatedData} />}
            {activeTab === 'overbooked' && <OverbookedTable data={overPagination.paginatedData} />}
            {activeTab === 'employee-wise' && <EmployeeWiseTable data={empWiseData} expandedEmp={expandedEmp} setExpandedEmp={setExpandedEmp} />}
            {activeTab === 'comparison' && <ComparisonTable data={compData} />}
          </div>
          {activeTab === 'utilization' && (
            <Pagination currentPage={utilPagination.currentPage} totalPages={utilPagination.totalPages}
              totalItems={utilPagination.totalItems} pageSize={utilPagination.pageSize}
              onPageChange={utilPagination.setCurrentPage} onPageSizeChange={utilPagination.setPageSize} />
          )}
          {activeTab === 'project-wise' && (
            <Pagination currentPage={projPagination.currentPage} totalPages={projPagination.totalPages}
              totalItems={projPagination.totalItems} pageSize={projPagination.pageSize}
              onPageChange={projPagination.setCurrentPage} onPageSizeChange={projPagination.setPageSize} />
          )}
          {activeTab === 'lead-summary' && (
            <Pagination currentPage={leadPagination.currentPage} totalPages={leadPagination.totalPages}
              totalItems={leadPagination.totalItems} pageSize={leadPagination.pageSize}
              onPageChange={leadPagination.setCurrentPage} onPageSizeChange={leadPagination.setPageSize} />
          )}
          {activeTab === 'free-resources' && (
            <Pagination currentPage={freePagination.currentPage} totalPages={freePagination.totalPages}
              totalItems={freePagination.totalItems} pageSize={freePagination.pageSize}
              onPageChange={freePagination.setCurrentPage} onPageSizeChange={freePagination.setPageSize} />
          )}
          {activeTab === 'overbooked' && (
            <Pagination currentPage={overPagination.currentPage} totalPages={overPagination.totalPages}
              totalItems={overPagination.totalItems} pageSize={overPagination.pageSize}
              onPageChange={overPagination.setCurrentPage} onPageSizeChange={overPagination.setPageSize} />
          )}
        </div>
      ))}

      {/* ── Payroll Content ── */}
      {isPayrollTab && (payLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader text="Loading payroll data..." />
        </div>
      ) : !payData ? (
        <div className="text-center py-16 text-gray-400">No data available</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4 flex items-center gap-4">
              <div className="p-3 bg-primary-50 rounded-xl">
                <Users className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Employees</p>
                <p className="text-2xl font-bold text-gray-900">{payData.summary.totalEmployees}</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <CalendarDays className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Working Days</p>
                <p className="text-2xl font-bold text-gray-900">{payData.summary.totalWorkingDays}</p>
                <p className="text-[10px] text-gray-400">{payData.monthName} {payData.year}</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded-xl">
                <Download className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Leave Days</p>
                <p className="text-2xl font-bold text-gray-900">{payTotalLeaveDays}</p>
                <p className="text-[10px] text-gray-400">{payData.summary.employeesWithLop} employees with LOP</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-4">
              <div className="p-3 bg-red-50 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">LOP Total</p>
                <p className="text-2xl font-bold text-red-600">{payTotalLopDays}</p>
                <p className="text-[10px] text-gray-400">{payTotalLopDays > 0 ? `${((payTotalLopDays / payTotalLeaveDays) * 100).toFixed(1)}% of all leaves` : 'No LOP this month'}</p>
              </div>
            </div>
          </div>

          {/* Employee Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-modern">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dept</th>
                    <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Working Days</th>
                    <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Leave Days</th>
                    <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">LOP</th>
                    <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Present</th>
                    <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Payable Days</th>
                    <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payFilteredReport.map((row) => (
                    <tr key={row.employeeId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-xs font-bold text-emerald-700">{row.employeeName.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{row.employeeName}</p>
                            <p className="text-[11px] text-gray-400">{row.employeeCode} · {row.designation}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{row.department}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">{row.workingDays}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-medium text-amber-700">{row.leaveDays}</span>
                        {row.leaveDays > 0 && (
                          <div className="flex gap-1 justify-center mt-1">
                            {Object.entries(row.leaveTypeBreakdown).map(([type, val]) =>
                              val.days > 0 && (
                                <span key={type} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${LEAVE_TYPE_COLORS[type] || 'bg-gray-50 text-gray-600'}`}>
                                  {type}:{val.days}
                                </span>
                              )
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.lopDays > 0 ? (
                          <span className="inline-flex items-center gap-1 text-sm font-bold text-red-600">
                            <AlertTriangle className="w-3.5 h-3.5" /> {row.lopDays}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-emerald-700">{row.presentDays}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-bold text-gray-900">{row.netPayableDays}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.leaveRecords.length > 0 && (
                          <button onClick={() => setPayExpandedEmp(payExpandedEmp === row.employeeId ? null : row.employeeId)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400">
                            {payExpandedEmp === row.employeeId ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {payFilteredReport.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-12 text-gray-400">No employees found</td></tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-50/80 border-t border-gray-100">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-gray-900 text-sm">Total</td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-900 text-sm">{payData.summary.totalWorkingDays}</td>
                    <td className="px-4 py-3 text-center font-semibold text-amber-700 text-sm">{payTotalLeaveDays}</td>
                    <td className="px-4 py-3 text-center font-semibold text-red-600 text-sm">{payTotalLopDays}</td>
                    <td className="px-4 py-3 text-center font-semibold text-emerald-700 text-sm">{payFilteredReport.reduce((s, r) => s + r.presentDays, 0)}</td>
                    <td className="px-4 py-3 text-center font-bold text-gray-900 text-sm">{payFilteredReport.reduce((s, r) => s + r.netPayableDays, 0)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Expanded leave rows */}
            {payExpandedEmp && (
              <div className="border-t border-gray-100 bg-gray-50/30 animate-slide-down">
                {(() => {
                  const emp = payData.report.find((r) => r.employeeId === payExpandedEmp);
                  if (!emp) return null;
                  return (
                    <div className="p-4 space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Leave Records — {emp.employeeName}</p>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Type</th>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Dates</th>
                            <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Days</th>
                            <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">LOP?</th>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {emp.leaveRecords.map((lr, i) => (
                            <tr key={i} className="hover:bg-white transition-colors">
                              <td className="px-3 py-2">
                                <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${LEAVE_TYPE_COLORS[lr.type] || 'bg-gray-50 text-gray-600'}`}>{lr.type}</span>
                              </td>
                              <td className="px-3 py-2 text-gray-600">{new Date(lr.startDate).toLocaleDateString()} – {new Date(lr.endDate).toLocaleDateString()}</td>
                              <td className="px-3 py-2 text-center font-medium">{lr.days}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                                  lr.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                                  lr.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                                  'bg-gray-100 text-gray-500'
                                }`}>{lr.status}</span>
                              </td>
                              <td className="px-3 py-2 text-center">
                                {lr.isLop ? <span className="text-red-600 font-bold">⚠ LOP</span> : <span className="text-gray-400">—</span>}
                              </td>
                              <td className="px-3 py-2 text-gray-500 text-xs max-w-[200px] truncate">{lr.lopReason || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </>
      ))}
    </div>
  );
}

// ════════════════════════════════════════
//  Allocation Table Components
// ════════════════════════════════════════

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
            <td className="text-center">
              <span className="inline-flex items-center justify-center min-w-[2rem] h-6 bg-primary-50 text-primary-700 text-xs font-bold rounded-full px-2">
                {r.projectCount}
              </span>
              {r.projectNames.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {r.projectNames.map((name, j) => (
                    <p key={j} className="text-[11px] text-gray-500 leading-tight truncate max-w-[200px]" title={name}>
                      {name}
                    </p>
                  ))}
                </div>
              )}
            </td>
            <td className="text-center">
              <span className="inline-flex items-center justify-center min-w-[2rem] h-6 bg-primary-50 text-primary-700 text-xs font-bold rounded-full px-2">
                {r.employeeCount}
              </span>
              {r.employeeNames.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {r.employeeNames.map((name, j) => (
                    <p key={j} className="text-[11px] text-gray-500 leading-tight truncate max-w-[180px]" title={name}>
                      {name}
                    </p>
                  ))}
                </div>
              )}
            </td>
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
              {expandedEmp === item.employeeId ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
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
            {data.weeks.map((w) => <td key={w.id} className="text-center text-gray-600">{r[w.name] ?? 0}</td>)}
            <td className="text-center font-semibold">{r.difference}</td>
          </tr>
        ))}
        {data.report.length === 0 && <tr><td colSpan={data.weeks.length + 2} className="text-center py-12 text-gray-400">No data</td></tr>}
      </tbody>
    </table>
  );
}
