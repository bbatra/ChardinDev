import { updateInventory } from "../utilities/3PLwarehouse";
import lowCodeMiddlewareHTML from '../views/lowCodeMiddlewareHTML';

const updateInventoryInDB = async (req, res) => {
   updateInventory();
   res.send(lowCodeMiddlewareHTML(""));
}

export default {
  updateInventoryInDB
}