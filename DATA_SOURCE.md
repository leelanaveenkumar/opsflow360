# Data Source – OpsFlow360

OpsFlow360 uses **synthetic demo data only**.

## Primary data source

The main dashboard dataset is generated inside `app.js` by the `generateSyntheticData()` function.

The generated data covers:

- Date range: `2025-01-01` to `2026-04-30`
- Stations: `LHR-East`, `DRT-London`, `BHX-Midlands`, `MAN-North`, `BRS-West`, `NCL-NorthEast`
- Departments: `Inbound`, `Stow`, `Pick`, `Pack`, `SLAM`, `Dispatch`
- Shifts: `Morning`, `Twilight`, `Night`
- Approximate records: 52,000+

## Fields

```text
date, station, department, shift, process_path,
planned_volume, actual_volume,
planned_labour_hours, actual_labour_hours,
units_per_hour, defects, defect_rate, backlog,
on_time_dispatch_pct, sla_breaches, safety_incidents,
absenteeism_pct, cost_per_unit, manager_notes
```

## Upload option

The app also has a CSV upload feature. Uploaded rows are stored in the browser using `localStorage` and can replace or append the seeded demo data.

A sample upload file is available at:

```text
data/sample_operations_upload.csv
```

## Important disclaimer

This project does not use real Amazon data, customer data, employee data, package data, route data, confidential data, or any employer system export. It is a portfolio demonstration using synthetic operations data inspired by general fulfilment-centre process concepts.
