const path = require('path');
const glob = require('glob');

const getEntryPoints = () => {
	const patterns = ['./scripts/[!_]*.js'];

	if (patterns.length <= 0) return {};

	const globPattern =
		patterns.length > 1 ? `${patterns.join(',')}` : patterns[0];
	const files = glob.sync(globPattern);

	const entries = files.reduce((collection, file) => {
		const { name } = path.parse(file);
		collection[name] = file;

		return collection;
	}, {});

	return entries;
};

const getFileFormat = (isDev, ext = 'js') => {
	// `[name].[contenthash].min.${ext}`
	return isDev ? `[name].${ext}` : `[name].min.${ext}`;
};

module.exports = (env) => {
	const isDev = env.development || false;

	const config = {
		devtool: isDev ? 'source-map' : false,
		mode: isDev ? 'development' : 'production',
		watch: isDev,
		entry: getEntryPoints(),
		output: {
			path: path.resolve(__dirname, './scripts/dist'),
			filename: getFileFormat(isDev),
			sourceMapFilename: '[file].map',
			clean: true,
		},
		module: {
			rules: [
				{
					test: /\.js$/,
					exclude: /(node_modules)/,
					use: {
						loader: 'babel-loader',
						options: {
							presets: ['@babel/preset-env'],
							plugins: [
								'@babel/plugin-proposal-class-properties',
							],
						},
					},
				},
			],
		},
	};

	return config;
};
