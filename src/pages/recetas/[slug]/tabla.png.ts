/**
 * A downloadable, branded PNG of the recipe's process table — the same
 * Cooking-for-Engineers grid the page shows, sized for saving or sharing.
 *
 * Satori has no tables and no rowspan, so every box is placed at an explicit
 * pixel height computed here. The grid is set in JetBrains Mono precisely
 * because it's monospaced: character advance is exactly 0.6em, which makes the
 * line wrapping (and therefore every height) computable up front.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import satori from 'satori';
import sharp from 'sharp';
import { buildRecipeTable, type Ingredient, type RecipeTable, type Step } from '../../../utils/recipeTable';

const C = {
	bg: '#f1f0eb',
	text: '#1c1410',
	muted: '#7a6b5a',
	border: '#d5d2c8',
	accent: '#c2160a',
	accentDark: '#8b0c05',
	accentLight: '#fde8e6',
};

const PAD = 56;
const GRAMS_W = 88;
const NAME_W = 300;
const ING_W = GRAMS_W + NAME_W;
const OP_W = 150;
const CELL_PAD_X = 12;
const CELL_PAD_Y = 12;
const MIN_ROW_H = 54;

const F = { name: 19, grams: 19, note: 15, op: 18, time: 14 };
const lineH = (size: number) => Math.round(size * 1.4);
/** JetBrains Mono advances exactly 0.6em per glyph. */
const charsThatFit = (width: number, size: number) => Math.max(1, Math.floor(width / (size * 0.6)));

/** Greedy word wrap; returns the number of lines the text will occupy. */
function countLines(text: string, width: number, size: number): number {
	const max = charsThatFit(width, size);
	let lines = 1;
	let used = 0;
	for (const word of text.split(/\s+/).filter(Boolean)) {
		const cost = used === 0 ? word.length : used + 1 + word.length;
		if (cost <= max) {
			used = cost;
		} else {
			lines++;
			used = word.length;
		}
		// A word longer than the column wraps mid-word.
		while (used > max) {
			lines++;
			used -= max;
		}
	}
	return lines;
}

// The two files are mislabelled: -Bold.ttf holds the italic face and
// -Italic.ttf holds the bold one (check their internal `name` table).
const playfairBold = readFileSync(resolve(process.cwd(), 'src/fonts/PlayfairDisplay-Italic.ttf'));
const playfairItalic = readFileSync(resolve(process.cwd(), 'src/fonts/PlayfairDisplay-Bold.ttf'));
const jetbrains = readFileSync(resolve(process.cwd(), 'src/fonts/JetBrainsMono-Regular.ttf'));

type Op = { do: string; time?: string; rowspan: number };

type Phase = {
	heading: string;
	prelude: Step[];
	rows: Ingredient[];
	ops: Op[];
	rowHeights: number[];
	total: number;
};

/**
 * Row heights come from the ingredient text, then grow if an operation cell
 * needs more room than the rows it spans — that way nothing is ever clipped.
 */
function layout(heading: string, table: RecipeTable, total: number): Phase {
	const rows = table.rows.map((r) => r.ingredient);
	const ops = table.rows[0]?.cells.filter((c) => c.kind === 'op') ?? [];

	const rowHeights = rows.map((ing) => {
		const nameW = NAME_W - CELL_PAD_X;
		let h = CELL_PAD_Y * 2 + countLines(ing.item, nameW, F.name) * lineH(F.name);
		if (ing.note) h += countLines(`— ${ing.note}`, nameW, F.note) * lineH(F.note);
		return Math.max(MIN_ROW_H, h);
	});

	const opW = OP_W - CELL_PAD_X * 2;
	for (const op of ops) {
		if (op.kind !== 'op') continue;
		let needed = CELL_PAD_Y * 2 + countLines(op.do, opW, F.op) * lineH(F.op);
		if (op.time) needed += countLines(op.time, opW, F.time) * lineH(F.time);
		const span = Math.min(op.rowspan, rowHeights.length);
		const avail = rowHeights.slice(0, span).reduce((a, b) => a + b, 0);
		if (needed > avail) {
			const extra = Math.ceil((needed - avail) / span);
			for (let i = 0; i < span; i++) rowHeights[i] += extra;
		}
	}

	return {
		heading,
		prelude: table.prelude,
		rows,
		ops: ops.map((c) => (c.kind === 'op' ? { do: c.do, time: c.time, rowspan: c.rowspan } : { do: '', rowspan: 0 })),
		rowHeights,
		total,
	};
}

// Minimal element helpers — satori wants explicit `display: flex` everywhere.
type Node = { type: string; props: Record<string, unknown> };
const box = (style: Record<string, unknown>, children: unknown): Node => ({
	type: 'div',
	props: { style: { display: 'flex', ...style }, children },
});
const text = (style: Record<string, unknown>, children: string): Node => ({
	type: 'div',
	props: { style: { display: 'flex', fontFamily: 'JetBrains Mono', ...style }, children },
});

function phaseNode(phase: Phase, tableW: number): Node {
	const gridH = phase.rowHeights.reduce((a, b) => a + b, 0);

	const ingredientColumn = box(
		{ flexDirection: 'column', width: ING_W },
		phase.rows.map((ing, i) =>
			box(
				{
					height: phase.rowHeights[i],
					alignItems: 'center',
					borderBottom: `1px solid ${C.border}`,
				},
				[
					text(
						{
							width: GRAMS_W,
							paddingRight: 10,
							justifyContent: 'flex-end',
							fontSize: F.grams,
							color: C.accentDark,
						},
						ing.grams ? `${ing.grams} g` : '',
					),
					box({ flexDirection: 'column', width: NAME_W, paddingRight: CELL_PAD_X }, [
						text({ fontSize: F.name, lineHeight: `${lineH(F.name)}px`, color: C.text }, ing.item),
						...(ing.note
							? [text({ fontSize: F.note, lineHeight: `${lineH(F.note)}px`, color: C.muted }, `— ${ing.note}`)]
							: []),
					]),
				],
			),
		),
	);

	const opColumns = phase.ops.map((op, j) => {
		const span = Math.min(op.rowspan, phase.rowHeights.length);
		const h = phase.rowHeights.slice(0, span).reduce((a, b) => a + b, 0);
		return box({ flexDirection: 'column', width: OP_W }, [
			box(
				{
					flexDirection: 'column',
					height: h,
					padding: `${CELL_PAD_Y}px ${CELL_PAD_X}px`,
					border: `1px solid ${C.border}`,
					borderLeft: j === 0 ? `1px solid ${C.border}` : 'none',
					alignItems: 'center',
					justifyContent: 'center',
				},
				[
					text({ fontSize: F.op, lineHeight: `${lineH(F.op)}px`, color: C.text, textAlign: 'center' }, op.do),
					...(op.time
						? [
								text(
									{
										marginTop: 4,
										fontSize: F.time,
										lineHeight: `${lineH(F.time)}px`,
										color: C.muted,
										textAlign: 'center',
									},
									op.time,
								),
							]
						: []),
				],
			),
		]);
	});

	return box({ flexDirection: 'column', marginBottom: 40 }, [
		{
			type: 'div',
			props: {
				style: {
					display: 'flex',
					fontFamily: 'Playfair Italic',
					fontSize: 26,
					color: C.text,
					marginBottom: 14,
				},
				children: phase.heading,
			},
		},
		...phase.prelude.map((step) =>
			text(
				{
					width: tableW,
					padding: '10px 14px',
					marginBottom: -1,
					fontSize: F.time,
					letterSpacing: '0.06em',
					color: C.accentDark,
					backgroundColor: C.accentLight,
					border: `1px solid ${C.border}`,
				},
				`${step.do}${step.time ? ` · ${step.time}` : ''}`.toUpperCase(),
			),
		),
		box({ height: gridH }, [ingredientColumn, ...opColumns]),
		box({ height: 40, alignItems: 'center' }, [
			text(
				{ width: GRAMS_W, paddingRight: 10, justifyContent: 'flex-end', fontSize: F.note, color: C.muted },
				`${phase.total} g`,
			),
			text({ fontSize: F.note, letterSpacing: '0.08em', color: C.muted }, 'TOTAL'),
		]),
	]);
}

export const getStaticPaths = (async () => {
	const recetas = await getCollection('recetas');
	return recetas
		.filter((r) => (r.data.recipe?.process.length ?? 0) > 0)
		.map((receta) => ({ params: { slug: receta.id }, props: receta }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props, site }) => {
	const receta = props as Awaited<ReturnType<typeof getCollection<'recetas'>>>[number];
	const { title, categoria, hidratacion, temperatura, recipe } = receta.data;
	if (!recipe) return new Response('sin receta', { status: 404 });

	const phases: Phase[] = [];
	if (recipe.starterProcess.length > 0) {
		phases.push(
			layout(
				'Masa madre (paso cero)',
				buildRecipeTable(recipe.starter, recipe.starterProcess, `${receta.id} · masa madre`),
				recipe.starter.reduce((a, x) => a + (x.grams ?? 0), 0),
			),
		);
	}
	phases.push(
		layout(
			'Masa final',
			buildRecipeTable(recipe.dough, recipe.process, `${receta.id} · masa final`),
			recipe.dough.reduce((a, x) => a + (x.grams ?? 0), 0),
		),
	);

	const columns = Math.max(...phases.map((p) => p.ops.length));
	const tableW = ING_W + columns * OP_W;
	const width = tableW + PAD * 2;

	const facts = [categoria, hidratacion && `${hidratacion} hidratación`, temperatura !== undefined && `${temperatura}°C ambiente`]
		.filter(Boolean)
		.join('   ·   ');
	const url = `${(site?.host ?? 'raulsperoni.me')}/recetas/${receta.id}`;

	const card = box({ flexDirection: 'column', width, backgroundColor: C.bg, padding: PAD }, [
		text({ fontSize: 15, letterSpacing: '0.12em', color: C.accent, marginBottom: 14 }, '—— RECETARIO'),
		{
			type: 'div',
			props: {
				style: {
					display: 'flex',
					fontFamily: 'Playfair Display',
					fontWeight: 700,
					fontSize: 46,
					lineHeight: '52px',
					letterSpacing: '-0.01em',
					color: C.text,
					marginBottom: 12,
				},
				children: title,
			},
		},
		text({ fontSize: F.note, letterSpacing: '0.04em', color: C.muted, marginBottom: 36 }, facts),
		...phases.map((p) => phaseNode(p, tableW)),
		box(
			{
				justifyContent: 'space-between',
				alignItems: 'center',
				borderTop: `1px solid ${C.border}`,
				paddingTop: 18,
			},
			[
				text({ fontSize: F.note, letterSpacing: '0.04em', color: C.accentDark }, url),
				text({ fontSize: F.note, letterSpacing: '0.04em', color: C.muted }, 'los gramos escalan en el sitio'),
			],
		),
	]);

	const svg = await satori(card, {
		width,
		fonts: [
			{ name: 'JetBrains Mono', data: jetbrains, weight: 400, style: 'normal' },
			// Registered as separate families: satori mixes them up when one
			// family carries both a bold and an italic face.
			{ name: 'Playfair Display', data: playfairBold, weight: 700, style: 'normal' },
			{ name: 'Playfair Italic', data: playfairItalic, weight: 400, style: 'normal' },
		],
	});

	const png = await sharp(Buffer.from(svg)).png().toBuffer();

	return new Response(png, {
		headers: {
			'Content-Type': 'image/png',
			'Content-Length': png.length.toString(),
		},
	});
};
