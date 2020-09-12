import webpack from 'webpack';
import path from 'path';
import ExtractTextPlugin from 'extract-text-webpack-plugin';

const GLOBALS = {
    'process.env.NODE_ENV': JSON.stringify('live')
};

export default {
    debug: true,
    devtool: 'source-map',
    noInfo: false, // to display a list of files that webpack will be bundling in the console
    entry: './src/frontend/client', // react app entry point
    target: 'web',
    output: {
        path: __dirname + '/src/static/scripts',
        publicPath: '/static/scripts/',
        filename: 'bundle.js'
    },
    plugins: [
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.DefinePlugin(GLOBALS),
        new ExtractTextPlugin('styles.css'),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        })
    ],
    module: {
        loaders: [{
            test: /\.(js|jsx)$/,
            include: path.join(__dirname, 'src/app'),
            loaders: ['babel']
        }, {
            test: /(\.css)$/,
            loader: ExtractTextPlugin.extract('css?sourceMap')
        }],

        noParse: [
            /src\/client\/scripts\/xregexp-all.min.js/
        ]
    }
};
