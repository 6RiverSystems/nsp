'use strict';
var usage = require('../../lib/utils/usage.js')('check.txt');
var Check = require('../check.js');
var Path = require('path');
var getFormatter = require('../../lib/index').getFormatter;


var findHighestCVSSScore = function(vulnerabilities) {

  return Math.max.apply(null, vulnerabilities.map(function(vuln) {

    return vuln.cvss_score;
  }));
};


var cvssScoreThresholdFromRating = function(rating) {
  var ratingThresholds = {
    'critical': 9,
    'high': 7,
    'medium': 4,
    'low': 0.1
  };

  if (typeof rating !== 'string') {
    return rating;
  }
  
  return ratingThresholds[rating.toLowerCase()] || ratingThresholds['low'];
};


var onCommand = function (args) {

  if (args.help) {
    return usage();
  }

  if (typeof args.output !== 'function') {
    args.output = getFormatter(args.output);
  }

  var pkgPath = Path.join(process.cwd(), 'package.json');
  var shrinkwrapPath = Path.join(process.cwd(), 'npm-shrinkwrap.json');
  var packageLockPath = Path.join(process.cwd(), 'package-lock.json');

  Check({ package: pkgPath, shrinkwrap: shrinkwrapPath, packagelock: packageLockPath, offline: args.offline, advisoriesPath: args.advisoriesPath }, function (err, result) {

    var file = args.offline ? shrinkwrapPath : pkgPath;
    var output = args.output(err, result, file);
    var cvssScoreTreshold = cvssScoreThresholdFromRating(args['warn-threshold']) || args['warn-threshold'];
    var exitCode = (err || (result.length && !args['warn-only'] && findHighestCVSSScore(result) >= cvssScoreTreshold)) ? 1 : 0;

    if (output) {
      if (exitCode) {
        console.error(output);
      }
      else {
        console.log(output);
      }
    }
    process.exitCode = exitCode;
  });
};

module.exports = {
  name: 'check',
  options: [
    {
      name: 'offline',
      boolean: true,
      default: false
    },
    {
      name: 'advisoriesPath',
      default: false
    },
    {
      name: 'warn-only',
      boolean: true,
      default: false
    },
    {
      name: 'quiet',
      boolean: true,
      default: false
    },
    {
      name: 'warn-threshold',
      number: true,
      default: 0.1
    }
  ],
  command: onCommand
};
