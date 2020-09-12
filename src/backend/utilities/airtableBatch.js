var Airtable = require('airtable');
var base = new Airtable({apiKey: 'keyLHDlXFGBP21E4R'}).base('appRmNsz6U4L9kKgD');
import { getRestockReportByAsin } from "./amzRestock";

export const getAllRecords = async (tableName = 'Products copy', fieldNames = []) => {

  try{
    const records = await base(tableName).select({
      // Selecting the first 3 records in Grid view:
      fields: ["SKU", ...fieldNames],
    }).all();

    return records;
  }
  catch(e){
    console.error(e);
  }

  return [];


}

const MAX_UPDATES_PER_CALL = 10;//Airtable limit
export const doBatchUpdates = async (tableName = 'Products copy', updates) => {
  let doneUpdates = [];
  while (updates.length > 0) {
    const updateBatch = updates.slice(0, MAX_UPDATES_PER_CALL);
    //Update toUpdate
    try {
      const updated = await base(tableName).update(updateBatch);
      updates = updates.slice(MAX_UPDATES_PER_CALL);
      doneUpdates.push(...updated);
    }
    catch(e){
      console.error('[ERROR] updating batch: ', e, '\n', {updateBatch});
      return {
        error: e,
        records: doneUpdates
      }
    }
  }
  return { success: true, records: doneUpdates };
}


export const internalParseInt = (str) => {
  try{
    const val = parseInt(str);
    if(isNaN(val)){
      return 0
    }
    else {
      return val;
    }
  }
  catch(e){
    console.error('[ERROR] Internal ParseInt : ', e, {str});
    return 0;
  }

}

const main = async () => {
  const tableName = 'Products'
  console.log('Airtable batch main');
  const records = await getAllRecords(tableName, ['SKU', 'AmzRec', 'ASIN']);
  const restockDict = await getRestockReportByAsin();
  const updates = []
  const mapper = (record) => {
    console.log(record.get('ASIN'));
    const restockInfo = restockDict[record.get('ASIN')];
    if(restockInfo){
      const update = {
        id: record.id,
          fields : {
          AmzRec: internalParseInt(restockInfo.amzRec),
          Last30: internalParseInt(restockInfo.last30),
          "FBA Stock": internalParseInt(restockInfo.FBAstk)
        }
      }
      updates.push(update);
    }

  }

  records.map(mapper);
  console.log(`Performing ${updates.length} from ${records.length} records`)
  await doBatchUpdates(tableName, updates);
}