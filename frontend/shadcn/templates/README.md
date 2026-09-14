# shadcn/ui — Internal Templates

**`@engineering-library/shadcn-templates` · INTERNAL CODE · safe to edit**

House utilities and variant definitions following shadcn/ui conventions, built
against the pinned upstream submodule. This is ours: edit it, extend it, test
it. Upstream sync never touches this directory.

- Upstream reference (read-only): [`../upstream/ui`](../upstream/ui)

---

## A note on how shadcn/ui works

shadcn/ui is not a component dependency — it is a collection of components you
copy into your project and own. That makes the upstream repository a **reference
for conventions** rather than something to import from.

So we track upstream to answer *"how does shadcn structure this?"*, and keep our
own house tokens here. It also explains why `cn()` lives here rather than being
imported from the submodule: upstream is a pnpm monorepo we deliberately do not
build.

---

## Usage

```bash
npm install
```

```ts
import { cn, buttonVariants, statusBadgeVariants }
  from '@engineering-library/shadcn-templates';

// Variants produce class strings; cn() merges and resolves conflicts.
<button className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), className)}>
  Save
</button>

<span className={statusBadgeVariants({ tone: 'success' })}>Healthy</span>
```

---

## API

| Export | Purpose |
| --- | --- |
| `cn(...classes)` | `clsx` + `tailwind-merge`. Joins conditional classes **and** resolves conflicting Tailwind utilities so the last one wins. |
| `buttonVariants(props)` | Variants `default · destructive · outline · secondary · ghost · link`; sizes `sm · default · lg · icon`. |
| `statusBadgeVariants(props)` | Tones `neutral · info · success · warning · danger`. |

### Why `cn` is not string concatenation

```ts
cn('px-2', 'px-4')                    // → 'px-4'          conflict resolved
'px-2' + ' ' + 'px-4'                 // → 'px-2 px-4'     winner depends on CSS order
cn('bg-primary px-4', 'bg-red-500')   // → 'px-4 bg-red-500'
```

That last line is what makes a component overridable through a `className` prop.
Without `tailwind-merge`, a caller's override may silently lose.

The badge tones are aligned with `PALETTE` in
[`@engineering-library/chartjs-examples`](../../chartjs/examples), so a
"warning" badge and a "warning" chart series read as the same thing.

---

## Development

```bash
npm test
npm run typecheck
```

---

## Extending

Add variants here with a test. If you need a shadcn component we have not
templated yet, read its implementation in [`../upstream/ui`](../upstream/ui),
then add **our** version here.

**Never** edit `../upstream/ui`. It is a pinned submodule; the edit cannot be
committed.
