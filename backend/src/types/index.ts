/**
 * Represents a populated Mongoose document with at least an _id and optional name.
 */
export interface PopulatedDoc {
  _id: { toString(): string };
  name?: string;
}

/**
 * Represents an Allocation document after populating projectLeadId, projectId, and employeeId.
 */
export interface AllocationPopulated {
  allocatedWH: number;
  allocatedDays: number;
  extraHours: number;
  employeeId: PopulatedDoc;
  projectLeadId: PopulatedDoc;
  projectId: PopulatedDoc;
}

export interface EmployeeWiseProject {
  project: string;
  lead: string;
  days: number;
  extraHours: number;
  allocatedWH: number;
}

export interface EmployeeWiseItem {
  employeeId: string;
  employee: string;
  lead: string;
  projects: EmployeeWiseProject[];
  totalWH: number;
  statusLabel: string;
  color: string;
}
