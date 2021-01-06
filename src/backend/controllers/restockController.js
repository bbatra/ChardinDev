const fs = require('fs');
const path = require('path')
import {getZipFileFromCodaAndProcess} from "../utilities/3PLwarehouse";
import lowCodeMiddlewareHTML from '../views/lowCodeMiddlewareHTML';

const downloadRestockFile = (req, res) => {
    // const file = fs.readFileSync(path.join(__dirname, '../shipments/ShippingPlan010620.tsv'), 'binary');
    // res.setHeader('Content-Length', file.length);
    res.download(path.join(__dirname, '../shipments/ShippingPlan010620.tsv'), 'ShippingPlan010620.tsv');
    // res.end();
}

const processRestockZip = async (req, res) => {
  try{
    await getZipFileFromCodaAndProcess();
    res.send(lowCodeMiddlewareHTML("done!"));
  }
  catch(e){
    res.send(lowCodeMiddlewareHTML(e.message));
    res.sendStatus(400)
  }
}

export default {
  downloadRestockFile,
  processRestockZip
}