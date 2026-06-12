# Resource Planning & Weekly Allocation System

## Tech Stack

- **Backend:** Node.js
- **Recommended Backend Framework:** NestJS or Express.js
- **Frontend:** React
- **Database:** MONGO DB
- **Authentication:** JWT
- **API Style:** REST API
- **Reporting:** Excel export and dashboard reports

---

## 1. Project Overview

Build a web-based system to replace Excel-based weekly resource planning.

The system should manage:

- Weekly project allocation
- Project lead-wise planning
- Employee-wise weekly hours
- Free hours
- Overbooked hours
- 5-day and 6-day working weeks
- Project-wise utilization
- Historical week-wise reports
- Excel export

---

## 2. Main Business Rules

### Weekly Capacity

Each week can have different working days.

```text
Weekly Capacity = Working Days × Hours Per Day
```

Examples:

| Working Days | Hours Per Day | Weekly Capacity |
|---:|---:|---:|
| 5 | 7.5 | 37.5 WH |
| 6 | 7.5 | 45 WH |

### Allocation Hours

```text
Allocated WH = (Allocated Days × Hours Per Day) + Extra Hours
```

Example:

```text
2 days × 7.5 = 15 WH
1 day + 1 hour = 8.5 WH
```

### Free Hours

```text
Free WH = Weekly Capacity - Allocated WH
```

### Overbooked Hours

```text
Overbooked WH = Allocated WH - Weekly Capacity
```

Only show overbooked hours if allocated WH is greater than capacity.

### Utilization Percentage

```text
Utilization % = (Allocated WH / Weekly Capacity) × 100
```

---

## 3. User Roles

## Admin

Admin can:

- Manage employees
- Manage project leads
- Manage projects
- Create weekly plans
- Set working days and hours per day
- Add resource allocations
- View all reports
- Export reports

## Project Manager

Project Manager can:

- Create weekly allocation
- Assign employees to projects
- View utilization
- View free resources
- View overbooked employees
- Generate weekly reports

## Project Lead

Project Lead can:

- View projects under them
- View allocated employees
- Add or suggest allocations
- View project-wise weekly WH
- View team utilization

## Employee

Employee can:

- View assigned projects
- View weekly allocated hours
- View project-wise workload

---

## 4. Master Modules

## 4.1 Employee Master

Fields:

| Field | Type | Required |
|---|---|---|
| Employee ID | Auto | Yes |
| Name | Text | Yes |
| Email | Text | Yes |
| Phone | Text | No |
| Designation | Text | No |
| Department | Text | No |
| Default Project Lead | Dropdown | No |
| Status | Active / Inactive | Yes |

Features:

- Add employee
- Edit employee
- Deactivate employee
- Search employee
- Filter by project lead
- Filter by status

---

## 4.2 Project Lead Master

Fields:

| Field | Type | Required |
|---|---|---|
| Lead ID | Auto | Yes |
| Lead Name | Text | Yes |
| Email | Text | Yes |
| Status | Active / Inactive | Yes |

Example leads:

- Shaun
- Jesso
- Anandhu
- Abhijith

---

## 4.3 Project Master

Fields:

| Field | Type | Required |
|---|---|---|
| Project ID | Auto | Yes |
| Project Name | Text | Yes |
| Project Lead | Dropdown | Yes |
| Client Name | Text | No |
| Project Type | Internal / Client / Support | No |
| Status | Active / On Hold / Completed / No Work | Yes |
| Priority | Low / Medium / High | No |

Example projects:

### Shaun

- KL06
- Salon
- Serpent
- Pethe LMS

### Jesso

- CRM

### Anandhu

- Plantation
- Plantation eAuction
- SARPA KL
- HWC
- KFD
- Sandalwood
- Timber
- DSS

### Abhijith

- HCL
- Leopard
- SaaS
- HRMS
- Attendance
- LLB

---

## 4.4 Week Master

Fields:

| Field | Type | Required |
|---|---|---|
| Week ID | Auto | Yes |
| Week Name | Text | Yes |
| Start Date | Date | Yes |
| End Date | Date | Yes |
| Working Days | Number | Yes |
| Hours Per Day | Number | Yes |
| Weekly Capacity | Auto-calculated | Yes |
| Status | Draft / Published / Closed | Yes |

Example:

```text
Week Name: Week 25
Working Days: 6
Hours Per Day: 7.5
Weekly Capacity: 45 WH
```

---

## 5. Allocation Module

This is the main screen of the system.

Fields:

| Field | Type | Required |
|---|---|---|
| Allocation ID | Auto | Yes |
| Week | Dropdown | Yes |
| Project Lead | Dropdown | Yes |
| Project | Dropdown | Yes |
| Employee | Dropdown | Yes |
| Allocated Days | Decimal | Yes |
| Extra Hours | Decimal | Default 0 |
| Allocated WH | Auto-calculated | Yes |
| Remarks | Text | No |

Features:

- Add allocation
- Edit allocation
- Delete allocation
- Copy previous week allocation
- Bulk import from Excel
- Export to Excel
- Show warning if employee exceeds weekly capacity
- Show free hours while entering allocation
- Allow one employee to work on multiple projects in the same week

---

## 6. Reports

## 6.1 Dashboard

Show KPI cards:

- Total Employees
- Total Projects
- Total Weekly Capacity
- Total Allocated WH
- Total Free WH
- Total Overbooked WH
- Average Utilization %

Show charts:

- Lead-wise allocation
- Project-wise allocation
- Employee utilization
- Free hours by employee
- Overbooked employees

---

## 6.2 Employee Utilization Report

Columns:

| Employee | Lead | Capacity WH | Allocated WH | Free WH | Overbooked WH | Utilization % |
|---|---|---:|---:|---:|---:|---:|

Status rules:

| Utilization | Status |
|---:|---|
| 0% | No Allocation |
| 1% to 49% | Underutilized |
| 50% to 100% | Normal |
| Above 100% | Overbooked |

Filters:

- Week
- Project Lead
- Employee
- Status

---

## 6.3 Project-Wise Weekly Report

Columns:

| Project Lead | Project | Employee | Days | Extra Hrs | Allocated WH |
|---|---|---|---:|---:|---:|

Group by:

1. Project Lead
2. Project
3. Employee

---

## 6.4 Project Lead Summary Report

Columns:

| Project Lead | No. of Projects | No. of Employees | Total Capacity WH | Allocated WH | Free WH | Utilization % |
|---|---:|---:|---:|---:|---:|---:|

---

## 6.5 Free Resource Report

Columns:

| Employee | Lead | Capacity WH | Allocated WH | Free WH |
|---|---|---:|---:|---:|

---

## 6.6 Overbooked Resource Report

Columns:

| Employee | Capacity WH | Allocated WH | Overbooked WH | Projects |
|---|---:|---:|---:|---|

---

## 6.7 Week Comparison Report

Compare multiple weeks.

Columns:

| Employee | Week 1 WH | Week 2 WH | Week 3 WH | Difference |
|---|---:|---:|---:|---:|

---

## 7. Database Tables

## users

```text
id
name
email
password_hash
role
status
created_at
updated_at
```

## employees

```text
id
name
email
phone
designation
department
default_lead_id
status
created_at
updated_at
```

## project_leads

```text
id
name
email
status
created_at
updated_at
```

## projects

```text
id
name
project_lead_id
client_name
project_type
status
priority
created_at
updated_at
```

## weeks

```text
id
week_name
start_date
end_date
working_days
hours_per_day
weekly_capacity
status
created_at
updated_at
```

## allocations

```text
id
week_id
project_lead_id
project_id
employee_id
allocated_days
extra_hours
allocated_wh
remarks
created_at
updated_at
```

## project_week_statuses

```text
id
week_id
project_id
status
remarks
created_at
updated_at
```

---

## 8. Backend Requirements

Use Node.js.

Recommended options:

### Option 1: NestJS

Use this if the project should be structured and scalable.

Recommended packages:

- NestJS
- Prisma ORM
- PostgreSQL
- JWT authentication
- Class validator
- ExcelJS for Excel export

### Option 2: Express.js

Use this if the project should be simple and fast to build.

Recommended packages:

- Express.js
- Prisma ORM or Sequelize
- PostgreSQL or MySQL
- JWT
- Joi or Zod validation
- ExcelJS

---

## 9. Frontend Requirements

Use React.

Recommended stack:

- React
- Vite
- TypeScript
- React Router
- TanStack Query
- React Hook Form
- Zod
- Axios
- Tailwind CSS
- Shadcn UI or Material UI
- Recharts

---

## 10. API Endpoints

## Authentication

```http
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
```

## Employees

```http
GET /api/employees
POST /api/employees
GET /api/employees/:id
PUT /api/employees/:id
DELETE /api/employees/:id
```

## Project Leads

```http
GET /api/project-leads
POST /api/project-leads
GET /api/project-leads/:id
PUT /api/project-leads/:id
DELETE /api/project-leads/:id
```

## Projects

```http
GET /api/projects
POST /api/projects
GET /api/projects/:id
PUT /api/projects/:id
DELETE /api/projects/:id
```

## Weeks

```http
GET /api/weeks
POST /api/weeks
GET /api/weeks/:id
PUT /api/weeks/:id
DELETE /api/weeks/:id
POST /api/weeks/:id/copy-from/:previousWeekId
```

## Allocations

```http
GET /api/allocations?weekId=
POST /api/allocations
GET /api/allocations/:id
PUT /api/allocations/:id
DELETE /api/allocations/:id
POST /api/allocations/bulk
```

## Reports

```http
GET /api/reports/dashboard?weekId=
GET /api/reports/employee-utilization?weekId=
GET /api/reports/project-wise?weekId=
GET /api/reports/lead-summary?weekId=
GET /api/reports/free-resources?weekId=
GET /api/reports/overbooked-resources?weekId=
GET /api/reports/week-comparison?weekIds=
```

## Export

```http
GET /api/export/weekly-report?weekId=
GET /api/export/employee-utilization?weekId=
GET /api/export/project-wise?weekId=
```

---

## 11. Frontend Pages

## Login Page

- Email
- Password
- Login button

## Dashboard Page

- Week selector
- KPI cards
- Charts
- Free resources
- Overbooked resources

## Employees Page

- Employee list
- Add employee
- Edit employee
- Deactivate employee

## Projects Page

- Project list
- Add project
- Edit project
- Assign project lead

## Weeks Page

- Week list
- Create week
- Edit week
- Set working days
- Set hours per day
- Copy previous week

## Allocation Page

Features:

- Select week
- Add allocation rows
- Select project lead
- Select project
- Select employee
- Enter days
- Enter extra hours
- Auto-calculate WH
- Show employee capacity
- Show free hours live
- Save allocation
- Bulk upload from Excel
- Copy previous week allocation

## Reports Page

Tabs:

- Employee Utilization
- Project Wise
- Lead Summary
- Free Resources
- Overbooked Resources
- Week Comparison

---

## 12. Validation Rules

### Allocation Validation

- Week is required
- Project lead is required
- Project is required
- Employee is required
- Allocated days cannot be negative
- Extra hours cannot be negative
- Allocated WH must be auto-calculated
- Show warning when employee exceeds weekly capacity
- Allow overbooking only after confirmation

### Week Validation

- Start date is required
- End date is required
- Working days must be greater than 0
- Hours per day must be greater than 0
- Weekly capacity must be auto-calculated

### Project Validation

- Project name is required
- Project lead is required
- Project status is required

---

## 13. UI Requirements

- Clean admin dashboard layout
- Sidebar navigation
- Top week selector
- Search and filters
- Sortable tables
- Pagination
- Excel export buttons
- Responsive design

### Utilization Colors

| Status | Color |
|---|---|
| No Allocation | Grey |
| Underutilized | Yellow |
| Normal | Green |
| Overbooked | Red |

---

## 14. Excel Export Requirements

The weekly export should include these sheets:

1. Dashboard Summary
2. Employee Utilization
3. Project Wise Allocation
4. Project Lead Summary
5. Free Resources
6. Overbooked Resources

---

## 15. Sample Weekly Allocation Data

| Project Lead | Project | Employee | Days | Extra Hrs | WH |
|---|---|---|---:|---:|---:|
| Shaun | KL06 | Jikku | 2 | 0 | 15 |
| Shaun | KL06 | Nikhil | 2 | 0 | 15 |
| Shaun | Salon | Maria | 1 | 0 | 7.5 |
| Shaun | Salon | Savio | 1.5 | 0 | 11.25 |
| Shaun | Salon | Jesso | 1 | 0 | 7.5 |
| Anandhu | Sandalwood | Anandhu | 2 | 0 | 15 |
| Anandhu | Timber | Anandhu | 1 | 0 | 7.5 |
| Anandhu | DSS | Anandhu | 2 | 0 | 15 |
| Anandhu | Plantation | Justeena | 1 | 1 | 8.5 |
| Anandhu | Plantation eAuction | Justeena | 4 | 4 | 34 |
| Anandhu | Plantation eAuction | Alby | 5 | 0 | 37.5 |
| Anandhu | Plantation | Alby | 1 | 0 | 7.5 |
| Anandhu | SARPA KL & HWC | Nikhil | 2 | 0 | 15 |
| Anandhu | KFD | Nikhil | 2 | 0 | 15 |
| Anandhu | SARPA KL | Jesso | 1 | 0 | 7.5 |
| Jesso | CRM | Jesso | 0 | 45 | 45 |
| Jesso | CRM | Rao | 0 | 41 | 41 |
| Jesso | CRM | Jikku | 0 | 23 | 23 |
| Jesso | CRM | Amal | 0 | 28 | 28 |
| Jesso | CRM | Diviya | 0 | 41 | 41 |
| Abhijith | HCL / Leopard / SaaS | Abhijith | 4 | 0 | 30 |
| Abhijith | LLB | Ashik | 6 | 0 | 45 |
| Abhijith | HRMS | Emil | 4 | 0 | 30 |
| Abhijith | HRMS / Attendance | Gladson | 4.5 | 0 | 33.75 |
| Abhijith | Leopard | Maria | 0 | 3 | 3 |

---

## 16. Future Enhancements

- Timesheet entry
- Planned vs actual comparison
- Leave management
- Public holidays
- Employee skill matrix
- Project priority-based planning
- AI allocation suggestions
- Resource forecasting
- Jira, GitHub, or ClickUp integration
- Email notifications
- Slack or Teams notifications

---

## 17. MVP Scope

The MVP should include:

- Login
- Employee master
- Project lead master
- Project master
- Week master
- Allocation module
- Employee utilization report
- Project-wise report
- Lead summary report
- Dashboard
- Excel export
- Copy previous week allocation

---

## 18. Acceptance Criteria

The system is accepted when:

- Admin can create 5-day and 6-day weeks.
- Weekly capacity is calculated correctly.
- Admin can create employees, projects, and project leads.
- Admin can allocate employees to multiple projects in one week.
- Allocated WH is calculated correctly.
- Employee free hours are calculated correctly.
- Overbooked employees are highlighted.
- Reports can be filtered by week.
- Reports can be exported to Excel.
- Previous week allocation can be copied into a new week.
- Dashboard clearly shows weekly planning status.
