/**
 * INTERNAL CODE — safe to edit.
 *
 * Chart.js v4 is tree-shakeable: nothing renders until the pieces you use are
 * registered. Forgetting a registration produces a confusing runtime error, so
 * we register exactly the set our dashboard presets rely on, in one place.
 *
 * Upstream reference for the controller/element names:
 *   frontend/chartjs/upstream/Chart.js/src/index.ts
 */

import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Legend,
  Tooltip,
  LineController,
  BarController,
  DoughnutController,
} from 'chart.js';

let registered = false;

/**
 * Idempotent. Call once during app bootstrap, before rendering any chart from
 * this package. Safe to call again (e.g. in tests or HMR) without duplicating
 * registrations.
 */
export function registerDashboardCharts(): void {
  if (registered) return;
  Chart.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Filler,
    Legend,
    Tooltip,
    LineController,
    BarController,
    DoughnutController,
  );
  registered = true;
}

/** Test-only escape hatch so suites can assert the idempotency guard. */
export function __resetRegistrationForTests(): void {
  registered = false;
}
