const app = require('./addMiddleware.js');
import viewController from '../controllers/viewController'
import restockController from '../controllers/restockController';
import inventoryController from '../controllers/inventoryController';

app.get('/restock/plan/get', restockController.downloadShippingPlan);
app.get('/restock/output/get', restockController.downloadRestockOutput);
app.get('/restock/zipfile/put', restockController.processRestockZip);
app.get('/inventory/update', inventoryController.updateInventoryInDB)
app.get('*', viewController.render);

module.exports = app;
