/**
 * INTERNAL CODE — safe to edit.
 *
 * @engineering-library/data-patterns
 *
 * House helpers for the non-visual half of a frontend: schema validation,
 * forms and tables. Import from here rather than reaching into `src/`.
 *
 *   import { zodForm, paginationQuery, clientTable, pageInfo }
 *     from '@engineering-library/data-patterns';
 *
 * These are built against the pinned upstream submodules in
 * `frontend/data/upstream/`, so `npm run typecheck` fails inside the sync
 * pull request if an upstream release breaks the API we rely on.
 */

export {
  email,
  password,
  slug,
  uuid,
  httpUrl,
  moneyMinor,
  positiveInt,
  requiredText,
  paginationQuery,
  parseEnv,
  parseOrThrow,
  toFieldErrors,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  type PaginationQuery,
} from './schemas.js';

export { zodForm, applyServerErrors, firstErrorMessage } from './forms.js';

export {
  columnsFor,
  initialTableState,
  clientTable,
  sortingToQuery,
  queryToSorting,
  pageInfo,
  formatMoney,
  formatDate,
  formatPercent,
  formatCompact,
} from './table.js';
