const path = require('path');
const fs = require('fs').promises;
const sass = require('sass');
const Fiber = require('fibers');
const postcss = require('postcss');
const postcssNormalize = require('postcss-normalize');
const cssDeclarationSorter = require('css-declaration-sorter');
const postcssSortMediaQueries = require('postcss-sort-media-queries');
const postcssPresetEnv = require('postcss-preset-env');
const postcssEnvFunction = require('postcss-env-function');
const postcssReporter = require('postcss-reporter');
const cssnano = require('cssnano');

// Get current environment, defaults to `production`
const ENV_INDEX = process.argv.indexOf('--env');
const ENV = ENV_INDEX < 0 ? 'production' : process.argv[ENV_INDEX + 1];
const IS_DEV = ENV === 'development';

// Set `source` and `destination`
const SRC = './styles/style.scss';
const DEST = `./styles/dist/${IS_DEV ? 'style.css' : 'style.min.css'}`;

// Build array of postCSS plugins
const POSTCSS_PLUGINS = [
	postcssNormalize({
		forceImport: true,
	}),
	cssDeclarationSorter,
	postcssSortMediaQueries,
	postcssEnvFunction({
		importFrom: './env-css-variables.js',
	}),
	postcssPresetEnv({
		autoprefixer: {
			grid: 'no-autoplace',
			flexbox: 'no-2009',
		},
	}),
	postcssReporter,
];
if (!IS_DEV) {
	POSTCSS_PLUGINS.push(cssnano);
}

// Exit if anything goes wrong
const exitWithError = (error) => {
	console.error(error);
	process.exit(1);
};

// Write file to disk
const writeToDisk = async (location, contents) => {
	try {
		await fs.mkdir(path.dirname(location), { recursive: true });
		await fs.writeFile(location, contents);
	} catch (error) {
		exitWithError(error);
	}
};

// Compile SASS
sass.render(
	{
		file: SRC,
		outFile: DEST,
		sourceMap: IS_DEV,
		fiber: Fiber, // Speeds up async parsing of files
	},
	async (error, result) => {
		if (error) exitWithError(error);

		try {
			// Parse CSS with postcss
			const { css, map } = await postcss(POSTCSS_PLUGINS).process(
				result.css,
				{
					from: DEST,
					to: DEST,
					map: IS_DEV ? { prev: result.map.toString() } : false,
				}
			);

			// Output style(.min).css
			writeToDisk(DEST, css);

			// Output style.css.map
			if (map) {
				writeToDisk(`${DEST}.map`, JSON.stringify(map));
			}
		} catch (error) {
			exitWithError(error);
		}
	}
);
