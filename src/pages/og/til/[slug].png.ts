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
const playfairItalic = readFileSync(
	resolve(process.cwd(), 'src/fonts/PlayfairDisplay-Italic.ttf'),
);
const jetbrains = readFileSync(
	resolve(process.cwd(), 'src/fonts/JetBrainsMono-Regular.ttf'),
);

export const getStaticPaths = (async () => {
	const posts = await getCollection('til');
	return posts.map((post) => ({
		params: { slug: post.id },
		props: {
			title: post.data.title,
			titleEn: post.data.title_en,
			tags: post.data.tags,
		},
	}));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
	const { title, titleEn, tags } = props as {
		title: string;
		titleEn: string;
		tags: string[];
	};

	const tagText = tags.map((t: string) => `#${t}`).join('  ');

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
					// TIL label with accent line
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
									children: '— TIL',
								},
							},
						},
					},
					// Titles
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
											fontSize: '52px',
											fontWeight: 700,
											lineHeight: 1.15,
											color: '#1c1410',
											letterSpacing: '-0.01em',
											marginBottom: '20px',
										},
										children: title,
									},
								},
								{
									type: 'div',
									props: {
										style: {
											display: 'flex',
											fontSize: '36px',
											fontStyle: 'italic',
											lineHeight: 1.2,
											color: '#7a6b5a',
										},
										children: titleEn,
									},
								},
							],
						},
					},
					// Footer
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
										children: tagText,
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
				{
					name: 'Playfair Display',
					data: playfair,
					weight: 700,
					style: 'normal',
				},
				{
					name: 'Playfair Display',
					data: playfairItalic,
					weight: 400,
					style: 'italic',
				},
				{
					name: 'JetBrains Mono',
					data: jetbrains,
					weight: 400,
					style: 'normal',
				},
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
