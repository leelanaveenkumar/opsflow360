# OpsFlow360 – Fulfilment Operations Performance Dashboard

**OpsFlow360** is a GitHub-ready online portfolio dashboard for fulfilment-centre and last-mile operations performance. It is designed to demonstrate operations leadership, KPI tracking, shift planning, safety awareness, root-cause analysis and data-driven decision-making.

> **Important disclaimer:** This is a portfolio demo using synthetic data. It is not affiliated with Amazon or any employer. No real company data, customer data, employee data or confidential information is used.

## Why this project exists

This project supports an operations interview story by showing how a manager can monitor a fulfilment flow from **Receive → Stow → Pick → Pack → SLAM → Dispatch**.

It aligns with experience in:

- Shift operations and people management
- First-mile, fulfilment and last-mile logistics
- KPI monitoring and reporting
- Root-cause analysis and corrective actions
- Safety and escalation control
- Labour planning and capacity decisions

## Demo login

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `1000` |
| Manager | `manager` | `1000` |
| Viewer | `viewer` | `1000` |

Demo authentication is stored in the browser only. It is not production security.

## Key features

- Login-first dashboard
- Executive KPI overview
- Department performance: Inbound, Stow, Pick, Pack, SLAM and Dispatch
- Station comparison and ranking
- Shift planning and headcount calculator
- Safety and escalation tracker
- Rule-based automated insights
- Download hub for CSV reports
- CSV upload to append or replace data
- User management with Admin, Manager and Viewer roles
- Interview STAR story page
- Leadership Principles mapping page
- README / project notes page inside the app

## Data

The app generates seeded synthetic operations records from **2025-01-01 to 2026-04-30** across:

- 6 synthetic stations
- 6 departments
- 3 shifts
- 50,000+ synthetic records

Main fields:

```text
date, station, department, shift, process_path,
planned_volume, actual_volume,
planned_labour_hours, actual_labour_hours,
units_per_hour, defects, defect_rate, backlog,
on_time_dispatch_pct, sla_breaches, safety_incidents,
absenteeism_pct, cost_per_unit, manager_notes
```

## Tech stack

This version is intentionally **static-first** so it can run directly on GitHub Pages without a backend.

- HTML
- CSS
- Vanilla JavaScript
- Browser localStorage for demo users and uploaded demo data
- No backend required
- No package installation required

## Run locally

Open `index.html` directly in your browser.

Recommended simple local server:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Publish online with GitHub Pages

1. Create a new GitHub repository called `opsflow360`.
2. Upload all files from this folder.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose either:
   - **Deploy from a branch** → `main` → `/root`, or
   - **GitHub Actions** using the included workflow.
5. Your online URL should look like:

```text
https://guduruleelanaveen-lang.github.io/opsflow360/
```

Replace `guduruleelanaveen-lang` if your GitHub username is different.

## Interview explanation

A strong way to explain the project:

> I built OpsFlow360 as a synthetic fulfilment operations dashboard to show how I would manage performance across Receive, Stow, Pick, Pack, SLAM and Dispatch. The dashboard tracks volume, labour, UPH, defect rate, backlog, SLA breaches, on-time dispatch and safety incidents. It also includes a headcount calculator and automated insight cards, so I can identify bottlenecks quickly, take corrective actions and communicate performance clearly to leadership.

## Safety and ethics

- No real employer data
- No customer data
- No employee data
- No Amazon branding or logo use
- Clear synthetic-data disclaimer

