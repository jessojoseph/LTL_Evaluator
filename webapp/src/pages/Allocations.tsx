import { useEffect, useState, useCallback } from 'react';
import { allocationApi, weekApi, employeeApi, projectApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Allocation, Week, Employee, Project } from '../types';
import { Plus, Pencil, AlertTriangle, X, Power, PowerOff, FileSpreadsheet, Trash2, LayoutGrid, Table2 } from 'lucide-react';
import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { TableSkeleton } from '../components/Loader';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Allocations() {
  const { hasPermission } = useAuth();
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leads, setLeads] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [filterLead, setFilterLead] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Allocation | null>(null);
  const [warning, setWarning] = useState('');
  const [form, setForm] = useState({ weekId: '', projectLeadId: '', projectId: '', employeeId: '', allocatedDays: '0', extraHours: '0', remarks: '' });
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  const years = [...new Set(weeks.map((w) => new Date(w.startDate).getFullYear()))].sort((a, b) => b - a);
  const monthsInYear = selectedYear
    ? [...new Set(weeks
        .filter((w) => new Date(w.startDate).getFullYear() === Number(selectedYear))
        .map((w) => new Date(w.startDate).getMonth()))]
        .sort((a, b) => a - b)
    : [];
  const filteredWeeks = weeks.filter((w) => {
    if (w.isActive === false) return false;
    const d = new Date(w.startDate);
    if (selectedYear && d.getFullYear() !== Number(selectedYear)) return false;
    if (selectedMonth && d.getMonth() !== Number(selectedMonth)) return false;
    return true;
  });

  useEffect(() => {
    if (weeks.length > 0) {
      if (!selectedYear) {
        const newest = weeks[0];
        const d = new Date(newest.startDate);
        setSelectedYear(String(d.getFullYear()));
        setSelectedMonth(String(d.getMonth()));
        setSelectedWeek(newest._id);
      }
    }
  }, [weeks]);

  const load = async () => {
    setLoading(true);
    try {
      const wRes = await weekApi.getAll();
      setWeeks(wRes.data.weeks);
      const [eRes, lRes, pRes] = await Promise.all([
        employeeApi.getAll({ status: 'active' }),
        employeeApi.getAll({ isLead: 'true', status: 'active' }),
        projectApi.getAll({ status: 'active' }),
      ]);
      setEmployees(eRes.data.employees);
      setLeads(lRes.data.employees);
      setProjects(pRes.data.projects);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const getFilterParams = (): Record<string, string> => {
    const params: Record<string, string> = { weekId: selectedWeek };
    if (filterLead) params.projectLeadId = filterLead;
    if (filterProject) params.projectId = filterProject;
    if (filterEmployee) params.employeeId = filterEmployee;
    return params;
  };

  const fetchAllocations = (params: Record<string, string>) => {
    allocationApi.getAll(params).then(({ data }) => {
      setAllocations(data.allocations);
      setTableLoading(false);
    });
  };

  useEffect(() => {
    if (selectedWeek) {
      setTableLoading(true);
      fetchAllocations(getFilterParams());
    } else {
      setAllocations([]);
    }
  }, [selectedWeek, filterLead, filterProject, filterEmployee]);

  const {
    paginatedData,
    totalItems,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    setPageSize,
  } = usePagination({
    data: allocations,
    pageSize: 10,
    searchFields: ['remarks'],
    searchQuery: '',
  });

  const openCreate = () => {
    setEditing(null);
    setWarning('');
    setForm({ weekId: selectedWeek, projectLeadId: '', projectId: '', employeeId: '', allocatedDays: '0', extraHours: '0', remarks: '' });
    setShowModal(true);
  };

  const openEdit = (a: Allocation) => {
    setEditing(a);
    setWarning('');
    setForm({
      weekId: a.weekId._id, projectLeadId: a.projectLeadId._id, projectId: a.projectId._id,
      employeeId: a.employeeId._id, allocatedDays: String(a.allocatedDays), extraHours: String(a.extraHours), remarks: a.remarks || '',
    });
    setShowModal(true);
  };

  const saveAllocation = async (data: Record<string, unknown>) => {
    try {
      if (editing) {
        const { data: res } = await allocationApi.update(editing._id, data);
        if (res.warning) setWarning(res.warning);
      } else {
        const { data: res } = await allocationApi.create(data);
        if (res.warning) setWarning(res.warning);
      }
      setShowModal(false);
      fetchAllocations(getFilterParams());
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error saving allocation';
      setWarning(msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWarning('');

    const data = { ...form, allocatedDays: Number(form.allocatedDays), extraHours: Number(form.extraHours) };

    // Check if employee already has other allocations in this week
    try {
      const { data: existingData } = await allocationApi.getAll({
        weekId: form.weekId,
        employeeId: form.employeeId,
      });

      const otherAllocations = (existingData.allocations || []).filter(
        (a: Allocation) => !editing || a._id !== editing._id
      );

      if (otherAllocations.length > 0) {
        const details = otherAllocations.map(
          (a: Allocation) =>
            `• ${a.projectId.name} (Manager: ${a.projectLeadId.name}) — ${a.allocatedWH} WH`
        ).join('\n');

        const totalOtherWH = otherAllocations.reduce(
          (s: number, a: Allocation) => s + a.allocatedWH, 0
        );
        const freeWH = Math.max(0, (week?.weeklyCapacity || 40) - totalOtherWH);

        setConfirmModal({
          message: `This employee is already allocated to the following project(s) this week:\n\n${details}\n\nRemaining free hours: ${freeWH} WH\n\nDo you want to proceed with this allocation?`,
          onConfirm: () => {
            setConfirmModal(null);
            saveAllocation(data);
          },
        });
        return;
      }
    } catch {
      // If the check fails, just proceed with the save
    }

    saveAllocation(data);
  };

  const toggleStatus = async (id: string) => {
    await allocationApi.toggleStatus(id);
    fetchAllocations(getFilterParams());
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this allocation?')) return;
    try {
      await allocationApi.remove(id);
      fetchAllocations(getFilterParams());
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error deleting allocation';
      setWarning(msg);
    }
  };

  const filteredProjects = projects.filter((p) => !form.projectLeadId || p.projectLeadId._id === form.projectLeadId);
  const filteredProjectOptions = projects.filter((p) => !filterLead || p.projectLeadId._id === filterLead);
  const week = weeks.find((w) => w._id === selectedWeek);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 gradient-primary rounded-xl shadow-sm">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Allocations</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage weekly resource allocations</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
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
            <select className="input w-auto text-sm min-w-[180px]" value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}>
              <option value="">Select week...</option>
              {filteredWeeks.map((w) => {
                const d = new Date(w.startDate);
                return <option key={w._id} value={w._id}>{w.weekName} — {d.toLocaleDateString()} ({w.weeklyCapacity} WH)</option>;
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Filter row */}
      {selectedWeek && (
        <div className="card p-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filters</span>
              <select className="input w-auto text-sm" value={filterLead}
                onChange={(e) => setFilterLead(e.target.value)}>
                <option value="">All Leads</option>
                {leads.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
              </select>
              <select className="input w-auto text-sm" value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}>
                <option value="">All Projects</option>
                {filteredProjectOptions.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
              <select className="input w-auto text-sm" value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}>
                <option value="">All Employees</option>
                {employees.map((emp) => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
              </select>
              {(filterLead || filterProject || filterEmployee) && (
                <button onClick={() => { setFilterLead(''); setFilterProject(''); setFilterEmployee(''); }}
                  className="text-xs text-primary-600 hover:text-primary-800 font-medium transition-colors">
                  Clear filters
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex items-center gap-0.5 bg-gray-100 rounded-xl p-0.5">
                <button onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
                    viewMode === 'table' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  <Table2 className="w-3.5 h-3.5" /> Table
                </button>
                <button onClick={() => setViewMode('kanban')}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
                    viewMode === 'kanban' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  <LayoutGrid className="w-3.5 h-3.5" /> Board
                </button>
              </div>
              {hasPermission('allocations:create') && viewMode === 'table' && (
                <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add Allocation</button>
              )}
            </div>
          </div>
        </div>
      )}

      {warning && (
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-xl px-4 py-3 animate-slide-down">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {warning}
        </div>
      )}

      {viewMode === 'table' ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            {tableLoading ? (
              <TableSkeleton rows={5} cols={7} />
            ) : (
              <table className="table-modern">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lead</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Days</th>
                    <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Extra Hrs</th>
                    <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">WH</th>
                    <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedData.map((a) => (
                    <tr key={a._id} className="hover:bg-primary-50/40 transition-colors duration-150">
                      <td className="text-gray-900 font-medium">{a.projectLeadId?.name}</td>
                      <td className="text-gray-900">{a.projectId?.name}</td>
                      <td className="text-gray-900">{a.employeeId?.name}</td>
                      <td className="text-center text-gray-600">{a.allocatedDays}</td>
                      <td className="text-center text-gray-600">{a.extraHours}</td>
                      <td className="text-center font-semibold text-primary-700">{a.allocatedWH}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {hasPermission('allocations:update') && (
                            <button onClick={() => openEdit(a)} className="p-2 text-gray-400 hover:text-primary-600 rounded-xl hover:bg-primary-50 transition-all duration-200">
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission('allocations:update') && (
                            <button onClick={() => toggleStatus(a._id)}
                              className={`p-2 rounded-xl transition-all duration-200 ${
                                a.status === 'active' ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                              }`}
                              title={a.status === 'active' ? 'Deactivate' : 'Activate'}>
                              {a.status === 'active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                            </button>
                          )}
                          {hasPermission('allocations:delete') && (
                            <button onClick={() => handleDelete(a._id)}
                              className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all duration-200"
                              title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedData.length === 0 && !tableLoading && (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400">{selectedWeek ? 'No allocations for this week' : 'Select a week to view allocations'}</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      ) : week && selectedWeek ? (
        <KanbanBoard
          allocations={allocations}
          employees={employees}
          projects={projects}
          leads={leads}
          week={week}
          selectedWeek={selectedWeek}
          filterLead={filterLead}
          onRefresh={() => fetchAllocations(getFilterParams())}
          onEdit={openEdit}
          onWarning={setWarning}
        />
      ) : null}

      {week && (
        <div className="card p-4 text-sm">
          <div className="flex items-center gap-6 flex-wrap">
            <span className="text-gray-600">
              <span className="font-semibold text-gray-900">Week Capacity:</span> {week.weeklyCapacity} WH
              <span className="text-gray-400 ml-1">({week.workingDays} days × {week.hoursPerDay} hrs)</span>
            </span>
            <span className="text-gray-600">
              <span className="font-semibold text-gray-900">Total Allocated:</span>{' '}
              <span className="text-primary-700 font-semibold">{allocations.reduce((s, a) => s + a.allocatedWH, 0)} WH</span>
            </span>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="modal-overlay z-[60]" onClick={() => setConfirmModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-gray-900">Existing Allocation Detected</h2>
              </div>
              <button onClick={() => setConfirmModal(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans mb-6 leading-relaxed">{confirmModal.message}</pre>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button onClick={() => setConfirmModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={confirmModal.onConfirm} className="btn-primary">Proceed</button>
            </div>
          </div>
        </div>
      )}

      {/* Allocation Form Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Allocation' : 'Add Allocation'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Project Lead</label>
                  <select className="input" value={form.projectLeadId} onChange={(e) => setForm({ ...form, projectLeadId: e.target.value, projectId: '' })} required>
                    <option value="">Select lead</option>
                    {leads.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Project</label>
                  <select className="input" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} required>
                    <option value="">Select project</option>
                    {filteredProjects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Employee</label>
                  <select className="input" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required>
                    <option value="">Select employee</option>
                    {employees.map((emp) => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Days</label>
                  <input type="number" className="input" value={form.allocatedDays} onChange={(e) => setForm({ ...form, allocatedDays: e.target.value })} min="0" step="0.5" required />
                </div>
                <div>
                  <label className="label">Extra Hours</label>
                  <input type="number" className="input" value={form.extraHours} onChange={(e) => setForm({ ...form, extraHours: e.target.value })} min="0" step="0.5" />
                </div>
                <div className="col-span-2">
                  <label className="label">Remarks</label>
                  <textarea className="input" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2} />
                </div>
              </div>
              {week && (
                <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                  Calculated WH: <span className="font-semibold text-primary-700">{Number(form.allocatedDays) * week.hoursPerDay + Number(form.extraHours)}</span>
                </p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  Kanban Board Components
// ═══════════════════════════════════════════════════════════

interface KanbanBoardProps {
  allocations: Allocation[];
  employees: Employee[];
  projects: Project[];
  leads: Employee[];
  week: Week;
  selectedWeek: string;
  filterLead: string;
  onRefresh: () => void;
  onEdit: (a: Allocation) => void;
  onWarning: (msg: string) => void;
}

function KanbanBoard({
  allocations,
  employees,
  projects,
  leads,
  week,
  selectedWeek,
  filterLead,
  onRefresh,
  onEdit,
  onWarning,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<{ name: string; color: string } | null>(null);
  const [quickAlloc, setQuickAlloc] = useState<{
    employee: Employee;
    project: Project;
    targetColumnId: string;
  } | null>(null);
  const [quickDays, setQuickDays] = useState('1');
  const [quickExtraHours, setQuickExtraHours] = useState('0');

  // Filter projects by selected lead
  const visibleProjects = filterLead
    ? projects.filter((p) => p.projectLeadId._id === filterLead)
    : projects;

  // Build columns
  const projectColumns = visibleProjects.map((project) => {
    const projectAllocs = allocations.filter((a) => a.projectId._id === project._id);
    return {
      id: `col-${project._id}`,
      project,
      allocations: projectAllocs,
      totalAllocatedWH: projectAllocs.reduce((s, a) => s + a.allocatedWH, 0),
      uniqueEmployees: new Set(projectAllocs.map((a) => a.employeeId._id)).size,
    };
  });

  // Employees with zero allocations this week
  const allocatedEmpIds = new Set(allocations.map((a) => a.employeeId._id));
  const unallocatedEmployees = employees.filter((e) => !allocatedEmpIds.has(e._id));

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as Record<string, unknown> | undefined;
    if (data) {
      setActiveId(String(event.active.id));
      if (data.type === 'allocation') {
        const alloc = data.allocation as Allocation;
        setActiveCard({ name: alloc.employeeId.name, color: 'bg-primary-500' });
      } else if (data.type === 'unallocated') {
        const emp = data.employee as Employee;
        setActiveCard({ name: emp.name, color: 'bg-gray-400' });
      }
    }
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setActiveCard(null);

      if (!over) return;

      const activeData = active.data.current as Record<string, unknown> | undefined;
      if (!activeData) return;

      const sourceCol = activeData.sourceColumn as string;
      const targetId = String(over.id);

      // Dropped in same column
      if (sourceCol === targetId) return;

      try {
        if (activeData.type === 'unallocated') {
          // Dragging from Unallocated pool → a project column
          if (!targetId.startsWith('col-') || targetId === 'col-unallocated') return;

          const employee = activeData.employee as Employee;
          const targetProjectId = targetId.replace('col-', '');
          const targetProject = projects.find((p) => p._id === targetProjectId);
          if (!targetProject) return;

          // Prevent duplicate allocation to same project
          if (allocations.some((a) => a.employeeId._id === employee._id && a.projectId._id === targetProjectId)) {
            onWarning(`${employee.name} is already allocated to ${targetProject.name}`);
            return;
          }

          // Show confirmation modal to let user enter days/hours
          setQuickAlloc({ employee, project: targetProject, targetColumnId: targetId });
          setQuickDays('1');
          setQuickExtraHours('0');
          return;
        } else if (activeData.type === 'allocation') {
          const allocation = activeData.allocation as Allocation;

          if (targetId === 'col-unallocated') {
            // Delete allocation
            if (!window.confirm(`Remove ${allocation.employeeId.name} from ${allocation.projectId.name}?`)) return;
            await allocationApi.remove(allocation._id);
            onRefresh();
          } else if (targetId.startsWith('col-')) {
            // Move allocation to another project
            const targetProjectId = targetId.replace('col-', '');
            if (targetProjectId === allocation.projectId._id) return;

            const targetProject = projects.find((p) => p._id === targetProjectId);
            if (!targetProject) return;

            // Prevent duplicate
            if (allocations.some(
              (a) => a.employeeId._id === allocation.employeeId._id && a.projectId._id === targetProjectId && a._id !== allocation._id
            )) {
              onWarning(`${allocation.employeeId.name} is already allocated to ${targetProject.name}`);
              return;
            }

            await allocationApi.update(allocation._id, {
              projectId: targetProjectId,
              projectLeadId: targetProject.projectLeadId._id,
            });
            onRefresh();
          }
        }
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error updating allocation';
        onWarning(msg);
      }
    },
    [allocations, employees, projects, selectedWeek, onRefresh, onWarning]
  );

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div
        className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6"
        style={{ minHeight: 420 }}
      >
        {/* Unallocated column — sticky, doesn't scroll */}
        <div className="sticky left-0 z-10 pr-4 -mr-4 bg-gray-50">
          <BoardColumn
            id="col-unallocated"
            title="Unallocated Pool"
            subtitle={`${unallocatedEmployees.length} employee${unallocatedEmployees.length !== 1 ? 's' : ''} available`}
            totalAllocatedWH={0}
            capacity={week.weeklyCapacity * unallocatedEmployees.length}
            count={unallocatedEmployees.length}
          >
            {unallocatedEmployees.map((emp) => (
              <BoardCard
                key={emp._id}
                id={`unalloc-${emp._id}`}
                type="unallocated"
                employee={emp}
                sourceColumn="col-unallocated"
                isDragging={activeId === `unalloc-${emp._id}`}
              />
            ))}
            {unallocatedEmployees.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6 italic">All employees allocated</p>
            )}
          </BoardColumn>
        </div>

        {/* Project columns */}
        {projectColumns.map((col) => {
          const capacity = col.uniqueEmployees * week.weeklyCapacity;
          const utilPct = capacity > 0 ? Math.round((col.totalAllocatedWH / capacity) * 100) : 0;
          return (
            <BoardColumn
              key={col.id}
              id={col.id}
              title={col.project.name}
              subtitle={
                leads.find((l) => l._id === col.project.projectLeadId._id)?.name || 'Unknown lead'
              }
              totalAllocatedWH={col.totalAllocatedWH}
              capacity={capacity}
              count={col.allocations.length}
            >
              {col.allocations.map((alloc) => (
                <BoardCard
                  key={alloc._id}
                  id={`alloc-${alloc._id}`}
                  type="allocation"
                  allocation={alloc}
                  sourceColumn={col.id}
                  isDragging={activeId === `alloc-${alloc._id}`}
                  onClick={() => onEdit(alloc)}
                />
              ))}
            </BoardColumn>
          );
        })}

        {projectColumns.length === 0 && (
          <div className="flex items-center justify-center w-full text-gray-400 text-sm">
            {filterLead ? 'No projects for the selected lead' : 'No active projects'}
          </div>
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeCard && (
          <div
            className={`${activeCard.color} text-white rounded-xl px-4 py-3 shadow-2xl opacity-90 min-w-[180px]`}
          >
            <p className="font-semibold text-sm">{activeCard.name}</p>
          </div>
        )}
      </DragOverlay>

      {/* Quick allocation modal */}
      {quickAlloc && (
        <div className="modal-overlay z-[70]" onClick={() => setQuickAlloc(null)}>
          <div className="modal-content max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Confirm Allocation</h2>
              <button onClick={() => setQuickAlloc(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Employee</span>
                  <span className="font-medium text-gray-900">{quickAlloc.employee.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Project</span>
                  <span className="font-medium text-gray-900">{quickAlloc.project.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Lead</span>
                  <span className="font-medium text-gray-900">
                    {leads.find((l) => l._id === quickAlloc.project.projectLeadId._id)?.name || 'Unknown'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Days</label>
                  <input type="number" className="input" value={quickDays}
                    onChange={(e) => setQuickDays(e.target.value)}
                    min="0" step="0.5" required />
                </div>
                <div>
                  <label className="label">Extra Hours</label>
                  <input type="number" className="input" value={quickExtraHours}
                    onChange={(e) => setQuickExtraHours(e.target.value)}
                    min="0" step="0.5" />
                </div>
              </div>
              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                WH: <span className="font-semibold text-primary-700">
                  {Number(quickDays) * week.hoursPerDay + Number(quickExtraHours)}
                </span>
                &nbsp;(Capacity: {week.weeklyCapacity} WH)
              </p>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button onClick={() => setQuickAlloc(null)} className="btn-secondary">Cancel</button>
                <button onClick={async () => {
                  // Check for existing allocations first
                  try {
                    const { data: existingData } = await allocationApi.getAll({
                      weekId: selectedWeek,
                      employeeId: quickAlloc.employee._id,
                    });
                    const otherAllocs = (existingData.allocations || []).filter(
                      (a: Allocation) => a.projectId._id !== quickAlloc.project._id
                    );
                    if (otherAllocs.length > 0) {
                      const details = otherAllocs.map(
                        (a: Allocation) =>
                          `\u2022 ${a.projectId.name} (Manager: ${a.projectLeadId.name}) \u2014 ${a.allocatedWH} WH`
                      ).join('\n');
                      const totalOtherWH = otherAllocs.reduce(
                        (s: number, a: Allocation) => s + a.allocatedWH, 0
                      );
                      const newWH = Number(quickDays) * week.hoursPerDay + Number(quickExtraHours);
                      const freeWH = Math.max(0, week.weeklyCapacity - totalOtherWH);
                      if (!window.confirm(
                        `This employee is already allocated to:\n\n${details}\n\nRemaining free hours: ${freeWH} WH\nNew allocation: ${newWH} WH\n\nProceed?`
                      )) return;
                    }
                  } catch {
                    // If check fails, just proceed
                  }

                  try {
                    const { data: res } = await allocationApi.create({
                      weekId: selectedWeek,
                      projectLeadId: quickAlloc.project.projectLeadId._id,
                      projectId: quickAlloc.project._id,
                      employeeId: quickAlloc.employee._id,
                      allocatedDays: Number(quickDays),
                      extraHours: Number(quickExtraHours),
                    });
                    if (res.warning) onWarning(res.warning);
                    setQuickAlloc(null);
                    onRefresh();
                  } catch (err: unknown) {
                    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error creating allocation';
                    onWarning(msg);
                  }
                }} className="btn-primary">
                  Allocate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
}

// ── Board Column (droppable) ──

function BoardColumn({
  id,
  title,
  subtitle,
  children,
  totalAllocatedWH,
  capacity,
  count,
}: {
  id: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  totalAllocatedWH: number;
  capacity: number;
  count: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const isUnallocated = id === 'col-unallocated';

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-72 rounded-2xl border-2 transition-all duration-200 flex flex-col ${
        isOver
          ? 'border-primary-400 bg-primary-50/30 shadow-lg'
          : isUnallocated
          ? 'border-dashed border-gray-300 bg-gray-50/50'
          : 'border-gray-200 bg-white shadow-sm'
      }`}
    >
      {/* Column header */}
      <div className={`px-4 py-3 border-b ${isUnallocated ? 'border-gray-200' : 'border-gray-100'}`}>
        <div className="flex items-center justify-between mb-1">
          <h3 className={`font-semibold text-sm truncate ${isUnallocated ? 'text-gray-500' : 'text-gray-900'}`}>
            {title}
          </h3>
          <span className={`text-xs font-bold min-w-[1.5rem] h-5 flex items-center justify-center rounded-full ${
            isUnallocated ? 'bg-gray-200 text-gray-600' : 'bg-primary-50 text-primary-700'
          }`}>
            {count}
          </span>
        </div>
        {subtitle && <p className="text-[11px] text-gray-400 truncate">{subtitle}</p>}
        {!isUnallocated && capacity > 0 && (
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
              <span>WH: {totalAllocatedWH}</span>
              <span>Cap: {capacity}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  totalAllocatedWH > capacity
                    ? 'bg-red-400'
                    : totalAllocatedWH > capacity * 0.8
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min((totalAllocatedWH / capacity) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Card list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[80px]">
        {children}
      </div>
    </div>
  );
}

// ── Board Card (draggable) ──

function BoardCard({
  id,
  type,
  allocation,
  employee,
  sourceColumn,
  isDragging,
  onClick,
}: {
  id: string;
  type: 'allocation' | 'unallocated';
  allocation?: Allocation;
  employee?: Employee;
  sourceColumn: string;
  isDragging: boolean;
  onClick?: () => void;
}) {
  const data = type === 'allocation'
    ? { type, allocation, sourceColumn }
    : { type, employee, sourceColumn };

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    data,
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0 : 1,
  };

  if (type === 'unallocated' && employee) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className="w-full text-left bg-white border border-dashed border-gray-300 rounded-xl px-3.5 py-2.5 
                   hover:border-primary-300 hover:bg-primary-50/30 transition-all duration-150
                   shadow-sm hover:shadow cursor-grab active:cursor-grabbing"
      >
        <p className="text-sm font-medium text-gray-700">{employee.name}</p>
      </div>
    );
  }

  if (type === 'allocation' && allocation) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className="bg-white border border-gray-200 rounded-xl px-3.5 py-3
                   hover:border-primary-300 hover:shadow-md active:shadow-sm
                   transition-all duration-150 cursor-grab active:cursor-grabbing group"
      >
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm font-semibold text-gray-900 truncate flex-1">
            {allocation.employeeId.name}
          </p>
          <button
            onPointerDown={(e) => { e.stopPropagation(); onClick?.(); }}
            className="p-1 rounded-lg text-gray-300 hover:text-primary-600 hover:bg-primary-50 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
            title="Edit allocation"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="font-medium">{allocation.allocatedDays}d</span>
          <span className="text-gray-300">·</span>
          <span>{allocation.allocatedWH} WH</span>
          {allocation.extraHours > 0 && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-amber-600">+{allocation.extraHours}h</span>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}
