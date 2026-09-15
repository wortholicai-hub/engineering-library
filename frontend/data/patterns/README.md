# `@engineering-library/data-patterns`

**INTERNAL CODE — safe to edit.** House helpers for the non-visual half of a
frontend: schema validation, forms and tables.

Built against the pinned upstream submodules in
[`../upstream/`](../upstream) — [Zod](../upstream/zod),
[React Hook Form](../upstream/react-hook-form) and
[TanStack Table](../upstream/table). Because this package is typed against
their published types, `npm run typecheck` fails inside the upstream sync
pull request when one of them ships a breaking change, instead of failing in
someone's product.

```bash
npm install
npm test
npm run typecheck
```

---

## What is in here

| Import | Use it for |
| --- | --- |
| `email`, `password`, `slug`, `uuid`, `httpUrl`, `moneyMinor`, `requiredText` | Field schemas with our wording and our password policy |
| `paginationQuery` | Query params for any paginated list endpoint — coerces `?page=2` correctly |
| `toFieldErrors`, `parseOrThrow`, `parseEnv` | Turn a validation failure into field errors, an exception, or a startup check |
| `zodForm`, `applyServerErrors`, `firstErrorMessage` | React Hook Form wired to Zod the house way |
| `clientTable`, `initialTableState`, `columnsFor` | A sortable, filterable, paginated TanStack table in one call |
| `sortingToQuery`, `queryToSorting`, `pageInfo` | Move table state to the server and back, and render "Showing 1–25 of 312" |
| `formatMoney`, `formatDate`, `formatPercent`, `formatCompact` | Cell formatters that also work in exports and emails |

---

## A form, end to end

One schema validates in the browser **and** on the server, so the two can
never disagree.

```ts
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  zodForm, email, password, applyServerErrors, toFieldErrors,
} from '@engineering-library/data-patterns';

export const signupSchema = z.object({ email, password });

// --- client ---------------------------------------------------------------
const form = useForm(zodForm(signupSchema, { email: '', password: '' }));

const onSubmit = form.handleSubmit(async (values) => {
  const res = await fetch('/api/signup', { method: 'POST', body: JSON.stringify(values) });
  if (!res.ok) {
    // "That email is already registered" lands under the email input,
    // not in an anonymous red banner.
    const formLevel = applyServerErrors(form.setError, await res.json());
    if (formLevel.length) toast.error(formLevel[0]);
  }
});

// --- server (same schema) -------------------------------------------------
const parsed = signupSchema.safeParse(await request.json());
if (!parsed.success) {
  return Response.json(toFieldErrors(parsed.error), { status: 422 });
}
```

Validation is `onTouched` by default: a field complains once the user has left
it, rather than while they are still typing.

## A table, end to end

```ts
import { useReactTable } from '@tanstack/react-table';
import {
  clientTable, columnsFor, pageInfo, formatMoney, formatDate,
} from '@engineering-library/data-patterns';

type Invoice = { id: string; customer: string; totalMinor: number; issuedAt: string };

const col = columnsFor<Invoice>();
const columns = [
  col.accessor('customer', { header: 'Customer' }),
  col.accessor('totalMinor', { header: 'Total', cell: (c) => formatMoney(c.getValue()) }),
  col.accessor('issuedAt',   { header: 'Issued', cell: (c) => formatDate(c.getValue()) }),
];

const table = useReactTable(clientTable({ data: invoices, columns }));

const { from, to, total, isEmpty } = pageInfo(
  table.getState().pagination,
  table.getFilteredRowModel().rows.length,
);
// isEmpty ? 'No invoices' : `Showing ${from}–${to} of ${total}`
```

Render it with the shadcn/ui data-table markup and
[`@engineering-library/shadcn-templates`](../../shadcn/templates) for the
button and badge variants.

### When the dataset outgrows the browser

Past a few thousand rows, sort and paginate on the server. The table state
converts straight into query parameters the `paginationQuery` schema accepts:

```ts
const query = sortingToQuery(sorting, pagination);
// -> { sort: 'issuedAt', order: 'desc', page: 3, pageSize: 25 }
const { page, pageSize, sort, order } = paginationQuery.parse(query); // server side
```

Only the primary sort column is sent. That is deliberate: multi-column sorting
is dropped visibly here rather than silently somewhere in the API layer.

---

## Conventions worth knowing

- **Money is stored in minor units** (cents), always as an integer.
  `formatMoney(129900)` → `$1,299.00`. Floats and money do not mix.
- **Normalise before validating.** `email` trims and lower-cases first, then
  checks the format — otherwise a trailing space from a phone keyboard fails
  validation.
- **`parseEnv` fails with every missing variable at once**, at startup, rather
  than one per deploy.

## Adding to this package

If a schema or helper you need is missing, add it **here** with a test, so the
next project inherits it. Do not fork the pattern into a product repository.
