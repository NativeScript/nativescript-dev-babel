var babel = require('@babel/core');
var path = require('path');
var fs = require('fs');
var glob = require('glob');
var minimatch = require('minimatch');

module.exports = function ($logger, $projectData, $injector, hookArgs) {
	var logsPrefix = "nativescript-dev-babel: ";
	var platform = (hookArgs && (hookArgs.platform || (hookArgs.prepareData && hookArgs.prepareData.platform)) || '').toLowerCase();
	var platformData = getPlatformData($injector, $projectData, platform);
	var outDir = platformData.appDestinationDirectoryPath;

	var babelOptions = {
		sourceMaps: 'inline'
	};

	var babelrcFilePath = path.join($projectData.projectDir, '.babelrc');
	if (fs.existsSync(babelrcFilePath)) {
		babelOptions = JSON.parse(fs.readFileSync(babelrcFilePath));
	} else {
		var packageOpts = JSON.parse(fs.readFileSync(path.join($projectData.projectDir, 'package.json')));
		if (packageOpts.babel) {
			babelOptions = packageOpts.babel;
		}
	}

	var includedPatterns = babelOptions.include || 'app/**/*.js';
	includedPatterns = Array.isArray(includedPatterns) ? includedPatterns : [includedPatterns];
	var excludedPatterns = babelOptions.exclude || path.join(outDir, 'app/tns_modules/**/*');
	excludedPatterns = Array.isArray(excludedPatterns) ? excludedPatterns : [excludedPatterns];
	var transformations = [];
	for (var includePattern of includedPatterns) {
		transformations.push(new Promise(function (resolve, reject) {
			$logger.info(`${logsPrefix}Processing '${path.join(outDir, includePattern)}.'`);
			glob(path.join(outDir, includePattern), {}, function (err, files) {
				if (err) {
					reject(err);
					return;
				}

				var error = null;
				files.forEach(function (jsFile) {
					if (error || excludedPatterns.some(excludedPattern => minimatch(jsFile, excludedPattern))) {
						return;
					}

					$logger.trace(`${logsPrefix}Processing '${jsFile}'.`);
					try {
						var result = babel.transformFileSync(jsFile, babelOptions);
						fs.writeFileSync(jsFile, result.code);
					} catch (err) {
						error = err;
					}
				});
				$logger.info(`${logsPrefix}Processing '${path.join(outDir, includePattern)}' complete.`);
				if (error) {
					error.errorAsWarning = true;
				}
				error ? reject(error) : resolve();
			});
		})
		);
	}

	return Promise.all(transformations);
}

function getPlatformData($injector, $projectData, platform) {
	let platformData;
	try {
		// used in CLI 6+
		const platformsDataService = $injector.resolve("platformsDataService");
		platformData = platformsDataService.getPlatformData(platform, $projectData);
	} catch (err) {
		// Used in CLI 5.4.x and below:
		const platformsData = $injector.resolve("platformsData");
		platformData = platformsData.getPlatformData(platform, $projectData);
	}

	return platformData;
}