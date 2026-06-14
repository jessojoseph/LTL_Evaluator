import { useEffect, useState } from 'react';
import { holidayApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Plus, Pencil, Trash2, X, Search, CalendarDays } from 'lucide-react';
import { TableSkeleton } from '../components/Loader';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';

interface Holiday {
  _id: string;
  date: string;
  name: string;
  type: 'national' | 'optional' | 'company' | 'working_saturday';
  year: number;
  isActive: boolean;
}

const typeLabels: Record<string, string> = {
  national: 'National',
  optional: 'Optional',
  company: 'Company',
  working_saturday: 'Working Saturday',
};

const typeColors: Record<string, string> = {
  national: 'bg-red-50 text-red-700 border-red-200',
  optional: 'bg-amber-50 text-amber-700 border-amber-200',
  company: 'bg-blue-50 text-blue-700 border-blue-200',
  working_saturday: 'bg-green-50 text-green-700 border-green-200',
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function Holidays() {
  const { hasPermission } = useAuth();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [form, setForm] = useState({ date: '', name: '', type: 'national' as string });
  const [loading, setLoading] = useState(true);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await holidayApi.getAll({ year: String(selectedYear) });
      setHolidays(data.holidays);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [selectedYear]);

  const filteredHolidays = holidays.filter((h) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return h.name.toLowerCase().includes(q) || h.type.toLowerCase().includes(q);
  });

  const pagination = usePagination({ data: filteredHolidays, pageSize: 10 });

  useEffect(() => { pagination.goToFirstPage(); }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ date: '', name: '', type: 'national' });
    setShowModal(true);
  };

  const openEdit = (h: Holiday) => {
    setEditing(h);
    setForm({
      date: h.date.split('T')[0],
      name: h.name,
      type: h.type,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    await holidayApi.remove(id);
    load();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await holidayApi.update(editing._id, form);
    } else {
      await holidayApi.create(form);
    }
    setShowModal(false);
    load();
  };

  // Group by month for calendar view
  const monthsWithHolidays = Array.from({ length: 12 }, (_, i) => {
    const monthHolidays = holidays.filter((h) => new Date(h.date).getMonth() === i);
    return { month: i, label: MONTHS[i], count: monthHolidays.length, holidays: monthHolidays };
  }).filter((m) => m.count > 0);

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 gradient-primary rounded-xl shadow-sm">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Holidays</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage company holidays and calendar</p>
          </div>
        </div>
        {hasPermission('holidays:create') && (
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Holiday
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <select className="input w-auto text-sm" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
          {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-10" placeholder="Search holidays..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : (
        <>
          {/* Calendar cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {monthsWithHolidays.map((m) => (
              <div key={m.month} className="card overflow-hidden">
                <button
                  onClick={() => setExpandedMonth(expandedMonth === m.month ? null : m.month)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-primary-600" />
                    <span className="font-semibold text-gray-900 text-sm">{m.label}</span>
                  </div>
                  <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">{m.count}</span>
                </button>
                {expandedMonth === m.month && (
                  <div className="border-t border-gray-100 animate-slide-down">
                    {m.holidays.map((h) => (
                      <div key={h._id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50/50">
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-gray-400 w-6 text-right">
                            {new Date(h.date).getDate()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{h.name}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${typeColors[h.type] || 'bg-gray-50 text-gray-600'}`}>
                              {typeLabels[h.type] || h.type}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {hasPermission('holidays:update') && (
                            <button onClick={() => openEdit(h)} className="p-1 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {hasPermission('holidays:delete') && (
                            <button onClick={() => handleDelete(h._id)} className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {monthsWithHolidays.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                No holidays marked for {selectedYear}
              </div>
            )}
          </div>

          {/* Table view */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-modern">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pagination.paginatedData.map((h) => (
                    <tr key={h._id} className="hover:bg-primary-50/40 transition-colors">
                      <td className="font-medium text-gray-900 text-sm">
                        {new Date(h.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="font-semibold text-gray-900">{h.name}</td>
                      <td>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${typeColors[h.type]}`}>
                          {typeLabels[h.type] || h.type}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {hasPermission('holidays:update') && (
                            <button onClick={() => openEdit(h)} className="p-2 text-gray-400 hover:text-primary-600 rounded-xl hover:bg-primary-50 transition-all" title="Edit">
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission('holidays:delete') && (
                            <button onClick={() => handleDelete(h._id)} className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pagination.paginatedData.length === 0 && !loading && (
                    <tr><td colSpan={4} className="text-center py-12 text-gray-400">No holidays found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setCurrentPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Holiday' : 'Add Holiday'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div>
                <label className="label">Holiday Name</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Republic Day" required />
              </div>
              <div>
                <label className="label">Type</label>
                <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required>
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
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
