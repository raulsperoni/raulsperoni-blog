// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_URL = 'https://raulsperoni.me';
export const SITE_TITLE = 'Lo de Raúl';
// The role line mirrors src/content/cv/en.md — keep them in sync.
export const SITE_ROLE = 'Principal Data Engineer and Technical Lead';
// <title> of the homepage: the name people search for comes first.
export const SITE_HOME_TITLE = `Raúl Speroni — Principal Data Engineer · ${SITE_TITLE}`;
export const SITE_DESCRIPTION =
	'Raúl Speroni, Principal Data Engineer y líder técnico en Montevideo, Uruguay. Búsqueda, datos e IA aplicada, herramientas de participación digital, notas técnicas y relatos.';
export const SITE_AUTHOR = {
	// Stable id so every page's structured data points at the same Person.
	'@id': `${SITE_URL}/#person`,
	name: 'Raúl Speroni',
	url: SITE_URL,
	jobTitle: SITE_ROLE,
	sameAs: [
		'https://bsky.app/profile/raulsperoni.me',
		'https://www.linkedin.com/in/raulsperoni/',
		'https://github.com/raulsperoni',
	],
};
