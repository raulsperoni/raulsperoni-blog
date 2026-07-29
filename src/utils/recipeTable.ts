/**
 * Builds the grid for a Cooking-for-Engineers style recipe table: ingredients
 * down the left, operations to the right in cells that span every row they
 * touch, so the shape of the table *is* the shape of the process.
 *
 *   900 g Harina │         │        │
 *   670 g Agua   │ mezclar │        │
 *   220 g M.M.   ├─────────┤ mezclar│ pliegues …
 *    18 g Sal    ├─────────┴────────┤
 *
 * Rows are ordered by the step that introduces each ingredient, so the table
 * reads top-down in the order you actually put things in the bowl.
 */

export type Ingredient = { item: string; grams?: number; note?: string };
export type Step = { do: string; time?: string; add: string[] };

export type Cell =
	| { kind: 'op'; do: string; time?: string; rowspan: number; colspan: 1 }
	| { kind: 'filler'; rowspan: number; colspan: number };

export type Row = { ingredient: Ingredient; cells: Cell[] };

export type RecipeTable = {
	/** Full-width rows above the table (leading steps that add nothing). */
	prelude: Step[];
	rows: Row[];
	/** Number of operation columns, i.e. the table is 1 + columns wide. */
	columns: number;
};

/** Names must match the ingredient, but accents and case are forgiven. */
const key = (s: string) =>
	s
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim()
		.toLowerCase();

/**
 * @throws if a step names an ingredient the phase doesn't have, or if an
 * ingredient is never added — either way the table would silently lie.
 */
export function buildRecipeTable(
	ingredients: Ingredient[],
	steps: Step[],
	label: string,
): RecipeTable {
	const remaining = new Map<string, Ingredient[]>();
	for (const ing of ingredients) {
		const k = key(ing.item);
		const bucket = remaining.get(k);
		if (bucket) bucket.push(ing);
		else remaining.set(k, [ing]);
	}

	const take = (name: string): Ingredient => {
		const bucket = remaining.get(key(name));
		const ing = bucket?.shift();
		if (!ing) {
			throw new Error(
				`[${label}] el paso menciona "${name}", que no está en la lista de ` +
					`ingredientes (o se usó más veces de las que aparece).`,
			);
		}
		return ing;
	};

	// Leading steps that add nothing are prerequisites, not operations on the
	// dough: they become full-width rows above the table.
	const firstAdd = steps.findIndex((s) => s.add.length > 0);
	const prelude = firstAdd === -1 ? [] : steps.slice(0, firstAdd);
	const ops = firstAdd === -1 ? steps : steps.slice(firstAdd);

	const ordered: Ingredient[] = [];
	// Rows covered by each operation, i.e. everything added up to and including
	// it. Non-decreasing, which is what lets the fillers below merge cleanly.
	const spans: number[] = [];
	for (const step of ops) {
		for (const name of step.add) ordered.push(take(name));
		spans.push(ordered.length);
	}

	const orphans = [...remaining.values()].flat();
	if (orphans.length > 0) {
		throw new Error(
			`[${label}] ningún paso agrega: ${orphans.map((i) => i.item).join(', ')}.`,
		);
	}

	const total = ordered.length;
	const rows: Row[] = ordered.map((ingredient) => ({ ingredient, cells: [] }));
	if (total === 0) return { prelude, rows, columns: 0 };

	// Every operation cell starts on the first row and hangs down.
	rows[0].cells = ops.map((step, j) => ({
		kind: 'op' as const,
		do: step.do,
		time: step.time,
		rowspan: spans[j],
		colspan: 1 as const,
	}));

	// Below a short column there's dead space. Adjacent columns that die at the
	// same row share one blank cell, the way the printed tables do.
	for (let j = 0; j < ops.length; ) {
		const start = spans[j];
		if (start >= total) break;
		let end = j;
		while (end + 1 < ops.length && spans[end + 1] === start) end++;
		rows[start].cells.push({
			kind: 'filler',
			rowspan: total - start,
			colspan: end - j + 1,
		});
		j = end + 1;
	}

	return { prelude, rows, columns: ops.length };
}
