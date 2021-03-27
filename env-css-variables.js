const { foo, bar } = require('./env-js-variables');

module.exports = {
	environmentVariables: {
		'--foo': `${foo}ms`,
		'--bar': `${bar}ms`,
	},
};
