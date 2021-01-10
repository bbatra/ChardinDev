var Airtable = require('airtable');
var base = new Airtable({apiKey: 'keyLHDlXFGBP21E4R'}).base('appRmNsz6U4L9kKgD');
import { getRestockReportByAsin } from "./amzRestock";

export const getAllRecords = async (tableName = 'Products copy', fieldNames = [], view) => {

  try{
    const records = await base(tableName).select({
      fields: ["SKU", ...fieldNames],
      view
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
