import webpack from 'webpack';
import path from 'path';
import ExtractTextPlugin from 'extract-text-webpack-plugin';

export default {
    debug: true,
    devtool: 'cheap-module-eval-source-map',
    noInfo: true, // to display a list of files that webpack will be bundling in the console
    entry: [
        'webpack/hot/dev-server',
        'eventsource-polyfill', // hot reloading in IE
        'webpack-hot-middleware/client?reload=true',
        './src/frontend/client' // react app entry point
    ],
    target: 'web',
    output: {
        path: __dirname + '/src/static/scripts',
        publicPath: '/static/scripts/',
        filename: 'bundle.js'
    },
    devServer: {
        hot: true,
        contentBase: './static/dist'
    },
    plugins: [
        new webpack.optimize.OccurenceOrderPlugin(),
        new ExtractTextPlugin('styles.css'),
        new webpack.optimize.DedupePlugin(),
        new webpack.NoErrorsPlugin(), // to display console errors in the browser
        new webpack.HotModuleReplacementPlugin()
    ],
    module: {
        loaders: [{
            test: /\.(js|jsx)$/,
            include: path.join(__dirname, 'src/frontend'),
            loaders: ['babel']
        }, {
            test: /(\.css)$/,
            loader: ExtractTextPlugin.extract('css?sourceMap')
        }],

        noParse: [
            /src\/static\/scripts\/xregexp-all.min.js/
        ]
    }
};
