import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';

export async function GET(context) {
	const posts = await getCollection('blog');
	const tils = await getCollection('til');
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: [
			...posts.map((post) => ({
				...post.data,
				link: `/blog/${post.id}/`,
			})),
			...tils.map((til) => ({
				title: `TIL: ${til.data.title} / ${til.data.title_en}`,
				description: til.data.description,
				pubDate: til.data.pubDate,
				link: `/til/${til.id}/`,
			})),
		],
	});
}
