import ExcelJS from 'exceljs';

interface SheetColumn {
  header: string;
  key: string;
  width?: number;
}

function addSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  columns: SheetColumn[],
  rows: Record<string, unknown>[]
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || 20,
  }));

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  rows.forEach((row) => sheet.addRow(row));

  return sheet;
}

export async function generateWeeklyExport(data: {
  employeeUtilization: Record<string, unknown>[];
  projectWise: Record<string, unknown>[];
  leadSummary: Record<string, unknown>[];
  freeResources: Record<string, unknown>[];
  overbookedResources: Record<string, unknown>[];
  dashboard: Record<string, unknown>[];
  employeeWise?: { employee: string; lead: string; projects: { project: string; lead: string; days: number; extraHours: number; allocatedWH: number }[]; totalWH: number; statusLabel: string; color: string }[];
}): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();

  addSheet(workbook, 'Dashboard Summary', [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Value', key: 'value', width: 20 },
  ], data.dashboard);

  addSheet(workbook, 'Employee Utilization', [
    { header: 'Employee', key: 'employee', width: 20 },
    { header: 'Lead', key: 'lead', width: 20 },
    { header: 'Capacity WH', key: 'capacityWH', width: 15 },
    { header: 'Allocated WH', key: 'allocatedWH', width: 15 },
    { header: 'Free WH', key: 'freeWH', width: 12 },
    { header: 'Overbooked WH', key: 'overbookedWH', width: 15 },
    { header: 'Utilization %', key: 'utilization', width: 15 },
  ], data.employeeUtilization);

  addSheet(workbook, 'Project Wise Allocation', [
    { header: 'Project Lead', key: 'projectLead', width: 20 },
    { header: 'Project', key: 'project', width: 20 },
    { header: 'Employee', key: 'employee', width: 20 },
    { header: 'Days', key: 'days', width: 10 },
    { header: 'Extra Hrs', key: 'extraHours', width: 12 },
    { header: 'Allocated WH', key: 'allocatedWH', width: 15 },
  ], data.projectWise);

  addSheet(workbook, 'Project Lead Summary', [
    { header: 'Project Lead', key: 'projectLead', width: 20 },
    { header: 'No. of Projects', key: 'projectCount', width: 18 },
    { header: 'No. of Employees', key: 'employeeCount', width: 18 },
    { header: 'Total Capacity WH', key: 'totalCapacity', width: 18 },
    { header: 'Allocated WH', key: 'allocatedWH', width: 15 },
    { header: 'Free WH', key: 'freeWH', width: 12 },
    { header: 'Utilization %', key: 'utilization', width: 15 },
  ], data.leadSummary);

  addSheet(workbook, 'Free Resources', [
    { header: 'Employee', key: 'employee', width: 20 },
    { header: 'Lead', key: 'lead', width: 20 },
    { header: 'Capacity WH', key: 'capacityWH', width: 15 },
    { header: 'Allocated WH', key: 'allocatedWH', width: 15 },
    { header: 'Free WH', key: 'freeWH', width: 12 },
  ], data.freeResources);

  addSheet(workbook, 'Overbooked Resources', [
    { header: 'Employee', key: 'employee', width: 20 },
    { header: 'Capacity WH', key: 'capacityWH', width: 15 },
    { header: 'Allocated WH', key: 'allocatedWH', width: 15 },
    { header: 'Overbooked WH', key: 'overbookedWH', width: 15 },
    { header: 'Projects', key: 'projects', width: 30 },
  ], data.overbookedResources);

  // Employee Wise sheet - flatten projects into rows per employee
  if (data.employeeWise && data.employeeWise.length > 0) {
    const flatRows: Record<string, unknown>[] = [];
    for (const emp of data.employeeWise) {
      for (const proj of emp.projects) {
        flatRows.push({
          employee: emp.employee,
          lead: emp.lead,
          project: proj.project,
          projectLead: proj.lead,
          days: proj.days,
          extraHours: proj.extraHours,
          allocatedWH: proj.allocatedWH,
        });
      }
      // Add a total row per employee
      flatRows.push({
        employee: emp.employee,
        lead: '',
        project: 'TOTAL',
        projectLead: '',
        days: '',
        extraHours: '',
        allocatedWH: emp.totalWH,
        status: emp.statusLabel,
      });
    }
    addSheet(workbook, 'Employee Wise', [
      { header: 'Employee', key: 'employee', width: 20 },
      { header: 'Reports To', key: 'lead', width: 20 },
      { header: 'Project', key: 'project', width: 25 },
      { header: 'Project Lead', key: 'projectLead', width: 20 },
      { header: 'Days', key: 'days', width: 10 },
      { header: 'Extra Hrs', key: 'extraHours', width: 12 },
      { header: 'Allocated WH', key: 'allocatedWH', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ], flatRows);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
