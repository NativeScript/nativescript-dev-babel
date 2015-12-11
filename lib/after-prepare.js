var babel = require('babel-core');
var path = require('path');
var fs = require('fs');
var glob = require('glob');
var minimatch = require('minimatch');

module.exports = function (logger, platformsData, projectData, hookArgs) {
	var platformData = platformsData.getPlatformData(hookArgs.platform.toLowerCase());
	var outDir = platformData.appDestinationDirectoryPath;

	var babelOptions = {
		sourceMaps: 'inline'
	};

	var babelrcFilePath = path.join(projectData.projectDir, '.babelrc');
	if (fs.existsSync(babelrcFilePath)) {
		babelOptions = JSON.parse(fs.readFileSync(babelrcFilePath));
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
				return;
			}

			var error = null;
			files.forEach(function (jsFile) {
				if (error || minimatch(jsFile, excludedPath)) {
					return;
				}

				logger.trace('Processing ' + jsFile);
				try {
					var result = babel.transformFileSync(jsFile, babelOptions);
					fs.writeFileSync(jsFile, result.code);
				} catch(err) {
					error = err;
				}
			});
			console.log('Processing complete');
			if (error) {
				error.errorAsWarning = true;
			}
			error ? reject(error) : resolve();
		});
	});
}
