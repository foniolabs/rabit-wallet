const { buildPackage } = require('./build');
const { devPackage } = require('./dev');
const { testPackage } = require('./test');
const { cleanPackage, cleanDirectories, deepClean } = require('./clean');

module.exports = {
  buildPackage,
  devPackage,
  testPackage,
  cleanPackage,
  cleanDirectories,
  deepClean
};