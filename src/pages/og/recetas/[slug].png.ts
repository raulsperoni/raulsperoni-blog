import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import satori from 'satori';
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const WIDTH = 1200;
const HEIGHT = 630;

const playfair = readFileSync(
	resolve(process.cwd(), 'src/fonts/PlayfairDisplay-Bold.ttf'),
);
const jetbrains = readFileSync(
	resolve(process.cwd(), 'src/fonts/JetBrainsMono-Regular.ttf'),
);

export const getStaticPaths = (async () => {
	const recetas = await getCollection('recetas');
	return recetas.map((receta) => ({
		params: { slug: receta.id },
		props: {
			title: receta.data.title,
			categoria: receta.data.categoria,
			hidratacion: receta.data.hidratacion ?? '',
			temperatura:
				receta.data.temperatura !== undefined
					? `${receta.data.temperatura}°C`
					: '',
		},
	}));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
	const { title, categoria, hidratacion, temperatura } = props as {
		title: string;
		categoria: string;
		hidratacion: string;
		temperatura: string;
	};

	const facts = [categoria, hidratacion && `${hidratacion} hidratación`, temperatura && `${temperatura} ambiente`]
		.filter(Boolean)
		.join('   ·   ');

	const svg = await satori(
		{
			type: 'div',
			props: {
				style: {
					display: 'flex',
					flexDirection: 'column',
					width: WIDTH,
					height: HEIGHT,
					backgroundColor: '#f1f0eb',
					padding: '60px',
					fontFamily: 'Playfair Display',
				},
				children: [
					{
						type: 'div',
						props: {
							style: {
								display: 'flex',
								alignItems: 'center',
								marginBottom: '16px',
							},
							children: {
								type: 'span',
								props: {
									style: {
										fontFamily: 'JetBrains Mono',
										fontSize: '22px',
										letterSpacing: '0.12em',
										color: '#c2160a',
									},
									children: '— RECETARIO',
								},
							},
						},
					},
					{
						type: 'div',
						props: {
							style: {
								display: 'flex',
								flexDirection: 'column',
								flex: 1,
								justifyContent: 'center',
							},
							children: [
								{
									type: 'div',
									props: {
										style: {
											display: 'flex',
											fontSize: '64px',
											fontWeight: 700,
											lineHeight: 1.12,
											color: '#1c1410',
											letterSpacing: '-0.01em',
										},
										children: title,
									},
								},
							],
						},
					},
					{
						type: 'div',
						props: {
							style: {
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								borderTop: '1px solid #d5d2c8',
								paddingTop: '20px',
							},
							children: [
								{
									type: 'span',
									props: {
										style: {
											fontFamily: 'JetBrains Mono',
											fontSize: '18px',
											color: '#7a6b5a',
											letterSpacing: '0.04em',
										},
										children: facts,
									},
								},
								{
									type: 'span',
									props: {
										style: {
											fontFamily: 'JetBrains Mono',
											fontSize: '18px',
											color: '#7a6b5a',
											letterSpacing: '0.04em',
										},
										children: 'raulsperoni.me',
									},
								},
							],
						},
					},
				],
			},
		},
		{
			width: WIDTH,
			height: HEIGHT,
			fonts: [
				{ name: 'Playfair Display', data: playfair, weight: 700, style: 'normal' },
				{ name: 'JetBrains Mono', data: jetbrains, weight: 400, style: 'normal' },
			],
		},
	);

	const png = await sharp(Buffer.from(svg)).png().toBuffer();

	return new Response(png, {
		headers: {
			'Content-Type': 'image/png',
			'Content-Length': png.length.toString(),
		},
	});
};
