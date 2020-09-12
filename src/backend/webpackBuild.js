/**
* Created by bharatbatra on 11/11/17.
*/
const webpack = require('webpack');
const colors = require('colors');
const webpackConfig = require('../../webpack.config.live.js').default;
const compiler = webpack(webpackConfig);
console.info('Generating live config Webpack Bundle...'.yellow);
compiler.run( (err, result) => {

  if(!!err) {
    console.error('[ERROR] running webpack compiler'.bold.red, err);
  }

  const stats = result.toJson();

  if(stats.hasErrors) {
    console.log('[ERROR] generating minified webpack bundle'.bold.red);
    stats.errors.map(err => console.log(err.orange));
  }

  if(stats.hasWarnings) {
    console.log('[Warning] generating minified webpack bundle'.bold.yellow);
    stats.warnings.map(warn => console.log(warn.yellow));
  }

  console.info('App successfully bundled '.bold.green);

});


