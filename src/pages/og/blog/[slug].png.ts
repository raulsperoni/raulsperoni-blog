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

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(date: Date): string {
	return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function truncate(str: string, max: number): string {
	return str.length <= max ? str : str.slice(0, max - 1) + '…';
}

export const getStaticPaths = (async () => {
	const posts = await getCollection('blog');
	return posts.map((post) => ({
		params: { slug: post.id },
		props: {
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.pubDate,
			tags: post.data.tags,
		},
	}));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
	const { title, description, pubDate, tags } = props as {
		title: string;
		description: string;
		pubDate: Date;
		tags: string[];
	};

	const tagText = tags.map((t: string) => `#${t}`).join('  ');
	const shortDesc = truncate(description, 120);

	const svg = await satori(
		{
			type: 'div',
			props: {
				style: {
					display: 'flex',
					flexDirection: 'column',
					width: WIDTH,
					height: HEIGHT,
					backgroundColor: '#f3ede1',
					padding: '60px',
					fontFamily: 'Playfair Display',
				},
				children: [
					// Dateline row
					{
						type: 'div',
						props: {
							style: {
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								marginBottom: '24px',
							},
							children: [
								{
									type: 'span',
									props: {
										style: {
											fontFamily: 'JetBrains Mono',
											fontSize: '20px',
											letterSpacing: '0.12em',
											color: '#c2160a',
										},
										children: '— escribo',
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
										children: formatDate(pubDate),
									},
								},
							],
						},
					},
					// Title + description
					{
						type: 'div',
						props: {
							style: {
								display: 'flex',
								flexDirection: 'column',
								flex: 1,
								justifyContent: 'center',
								gap: '20px',
							},
							children: [
								{
									type: 'div',
									props: {
										style: {
											fontSize: '56px',
											fontWeight: 700,
											lineHeight: 1.1,
											color: '#1c1410',
											letterSpacing: '-0.01em',
										},
										children: title,
									},
								},
								{
									type: 'div',
									props: {
										style: {
											fontSize: '24px',
											fontWeight: 400,
											fontStyle: 'italic',
											lineHeight: 1.4,
											color: '#5a4a3a',
										},
										children: shortDesc,
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
								borderTop: '1px solid #d8cfc1',
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
