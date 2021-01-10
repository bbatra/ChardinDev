import { updateInventory, notifyCodaInventoryUpdated } from "../utilities/3PLwarehouse";
import lowCodeMiddlewareHTML from '../views/lowCodeMiddlewareHTML';
import {updateRestockData} from "../utilities/amzRestock";
import {timeout} from "../utilities/timeout";


//helper
const doAsyncUpdates = async () => {
  await updateInventory();
  await timeout(30000);
  await updateRestockData();
}

const updateInventoryInDB = async (req, res) => {
  doAsyncUpdates();
  res.send(lowCodeMiddlewareHTML(""));
  await notifyCodaInventoryUpdated();
}

export default {
  updateInventoryInDB
}