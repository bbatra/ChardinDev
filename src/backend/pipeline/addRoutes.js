const app = require('./addMiddleware.js');
import viewController from '../controllers/viewController'

app.get('*', viewController.render);

module.exports = app;
