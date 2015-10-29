var babel = require('babel-core');
var path = require('path');
var fs = require('fs');
var glob = require('glob');
var minimatch = require('minimatch');

module.exports = function (logger, platformsData, projectData, hookArgs) {
	var platformData = platformsData.getPlatformData(hookArgs.platform);
	var outDir = platformData.appDestinationDirectoryPath;

	var babelOptions = {
		sourceMaps: 'inline'
	};

	if (fs.existsSync('.babelrc')) {
		babelOptions = JSON.parse(fs.readFileSync('.babelrc'));
	} else {
		var packageOpts = JSON.parse(fs.readFileSync(path.join(projectData.projectDir, 'package.json')));
		if (packageOpts.babel) {
			babelOptions = packageOpts.babel;
		}
	}

	return new Promise(function (resolve, reject) {
		logger.trace('Looking for ' + path.join(outDir, '**/*.js'));
		var excludedPath = path.join(outDir, 'app/tns_modules/**/*');
		glob(path.join(outDir, 'app/**/*.js'), {}, function (err, files) {
			if (err) {
				reject(err);
			} else {
				files.forEach(function (jsFile) {
					if (minimatch(jsFile, excludedPath)) {
						return;
					}

					logger.trace('Processing ' + jsFile);
					var result = babel.transformFileSync(jsFile, babelOptions);
					fs.writeFileSync(jsFile, result.code);
				});
				console.log('Processing complete');
				resolve();
			}
		});
	});
}
