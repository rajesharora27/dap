## 2025-12-15 - [Database Connection Issue]
**Learning:** The environment seems to lack a running Postgres database on port 5432 and I don't have permission to use Docker. I need to rely on static analysis or mocking for now.
**Action:** Since I cannot run the benchmark against a real DB, I will proceed with the optimization based on the theoretical performance gain of O(n) vs O(1) DB roundtrips and aggregation.
## 2025-12-15 - [Database Aggregation for Progress Calculation]
**Learning:** Replaced O(n) fetching of all tasks (with potentially heavy columns) with O(1) DB aggregation (groupBy) to calculate progress metrics. This saves memory and network bandwidth, especially for large adoption plans.
**Action:** Applied to all progress recalculation points in `CustomerAdoptionResolvers`.
