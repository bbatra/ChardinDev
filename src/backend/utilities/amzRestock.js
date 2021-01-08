import {doBatchUpdates, getAllRecords, internalParseInt} from "./airtableBatch";

const MwsApi = require('amazon-mws');
const fs = require('fs');
const path = require('path');
import { timeout } from "./timeout";
import { getRankingsForAsinList } from "./amzRank";

const
  SELLER_ID = 'AXIATCKCVD08Z',
  MWS_AUTH_TOKEN = 'amzn.mws.84b9bc3f-0d58-8927-02a1-3fae9ec20821',
  MARKET_PLACE_ID_US = 'ATVPDKIKX0DER',
  MARKET_PLACE_ID_CA = 'A2EUQ1WTGCTBG2',
  MARKET_PLACE_ID_MX = 'A1AM78C64UM0Y8',
  accessKey = 'AKIAII3OZS75ANHTSU7Q',
  accessSecret = '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';

const amazonMws = new MwsApi();
amazonMws.setApiKey(accessKey, accessSecret);


let start = Date.now();


var data = {
  'Version': '2009-01-01',
  'SellerId': SELLER_ID,
  'MWSAuthToken': MWS_AUTH_TOKEN,
  'MarketplaceId': MARKET_PLACE_ID_US,
};

const getReport = async (reportId) => {

    try{
      const response = await amazonMws.reports.search({
        ...data,
        'Action': 'GetReport',
        'ReportId': reportId
      })

      return response;
    }
    catch(e){
      console.log('error products', e);
      await timeout(TIMEOUT);
      return getReport(reportId);
    }

}

const requestReport = async () => {

  try{
    const response = await amazonMws.reports.submit({
      ...data,
      'Action': 'RequestReport',
      'ReportType': '_GET_RESTOCK_INVENTORY_RECOMMENDATIONS_REPORT_'
    })

    return response.ReportRequestInfo.ReportRequestId;

  }
  catch(e){
    console.log('error products', e);
  }



}

const TIMEOUT = 30000;
const getGeneratedReportId = async (ReportRequestId) => {
  try{
    console.log('getGeneratedReport called: ', (Date.now() - start));
    const response = await amazonMws.reports.search({
      ...data,
      'Action': 'GetReportRequestList',
      'ReportType': '_GET_RESTOCK_INVENTORY_RECOMMENDATIONS_REPORT_',
      'ReportRequestIdList.Id.1': ReportRequestId
    })


    if(response.ReportRequestInfo && response.ReportRequestInfo.ReportProcessingStatus === "_DONE_"){
      return response.ReportRequestInfo.GeneratedReportId;
    }
    else {
      await timeout(TIMEOUT);
      return getGeneratedReportId(ReportRequestId);
    }

  }
  catch(e){
    console.log('error products', e);
    await timeout(TIMEOUT);
    return getGeneratedReportId(ReportRequestId);
  }

}

//4 stage process
export const getRestockReportByAsin = async () => {
  const ReportRequestId = await requestReport();

  await timeout(TIMEOUT);
  const generatedReportId = await getGeneratedReportId(ReportRequestId);

  console.log('Got generated report Id: ', generatedReportId);
  let reportId = generatedReportId;

  const report = await getReport(reportId)

  const resultDict = {};
  report.data.map( row => {
    resultDict[row.ASIN] = {
      amzRec: row["Recommended replenishment qty"],
      last30: row["Units Sold Last 30 Days"],
      FBAstk: row["Total Units"],
      FBAinbound: row["Inbound"]
    }
  })

  return resultDict;

}

export const updateRestockData = async () => {
  const tableName = 'Products';
  const records = await getAllRecords(tableName, ['SKU', 'AmzRec', 'ASIN']);
  const restockDict = await getRestockReportByAsin();
  const updatesDict = [];
  const updates = []
  const asins = [];
  const mapper = (record) => {
    const asin = record.get('ASIN')
    if(asin) {
      asins.push(asin);
    }
    const restockInfo = restockDict[asin];
    //TODO: consider case where this ASIN is not in the restock sheet
    if(restockInfo){
      const update = {
        id: record.id,
        fields : {
          AmzRec: internalParseInt(restockInfo.amzRec),
          Last30: internalParseInt(restockInfo.last30),
          "FBA Stock": internalParseInt(restockInfo.FBAstk),
          "FBA Inbound": internalParseInt(restockInfo.FBAinbound)
        }
      }
      updatesDict[asin] = update;
    }

  }

  records.map(mapper);//pushes to updates
  console.log(`Performing ${updates.length} from ${records.length} records`)
  const rankingsDict = await getRankingsForAsinList(asins);//TODO: save updates
  for(let asin of Object.keys(updatesDict)){
    if(rankingsDict[asin] && updatesDict[asin].fields){
      updatesDict[asin].fields.Rank = internalParseInt(rankingsDict[asin]);
    }
    updates.push(updatesDict[asin]);
  }
  await timeout(10000);
  await doBatchUpdates(tableName, updates);
}
