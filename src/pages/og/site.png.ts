// Default social card for pages with no image of their own (home, listings).
import type { APIRoute } from 'astro';
import { SITE_AUTHOR, SITE_ROLE, SITE_TITLE } from '../../consts';
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

export const GET: APIRoute = async () => {
	const title = SITE_AUTHOR.name;
	const tagText = 'search · data · applied AI · civic tech';

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
					// Site label with accent line
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
									children: `— ${SITE_TITLE.toUpperCase()}`,
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
											fontSize: '84px',
											fontWeight: 700,
											lineHeight: 1.15,
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
											display: 'flex',
											marginTop: '20px',
											fontFamily: 'JetBrains Mono',
											fontSize: '28px',
											color: '#7a6b5a',
										},
										children: `${SITE_ROLE} · Montevideo`,
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
