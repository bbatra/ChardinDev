import {doBatchUpdates, getAllRecords, internalParseInt} from "./airtableBatch";

const MwsApi = require('amazon-mws');
const fs = require('fs');
const path = require('path');
import { timeout } from "./timeout";
import { getRankingsForAsinList } from "./amzRank";

const config = require('config');
const { SELLER_ID, MWS_AUTH_TOKEN, MARKET_PLACE_ID_US, accessKey, accessSecret } = config.mws;

const amazonMws = new MwsApi();
amazonMws.setApiKey(accessKey, accessSecret);


let start = Date.now();


var data = {
  'Version': '2009-01-01',
  'SellerId': SELLER_ID,
  'MWSAuthToken': MWS_AUTH_TOKEN,
  'MarketplaceId': MARKET_PLACE_ID_US,
};

const getReport = async (reportId, attempt = 0) => {

    try{
      const response = await amazonMws.reports.search({
        ...data,
        'Action': 'GetReport',
        'ReportId': reportId
      })

      return response;
    }
    catch(e){
      console.log('[ERROR] amzRestock > getReport: ', e);
      await timeout(TIMEOUT);
      if(attempt <= 20){
        return getReport(reportId, attempt + 1);
      }
      else {
        console.log('[ERROR] amzRestock > getReport: Timed out after attempt number ', attempt);
      }
      return [];
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
    console.log('[ERROR] amzRestock > requestReport : ', e);
  }

}

const TIMEOUT = 30000;
const getGeneratedReportId = async (ReportRequestId, attempt = 0) => {
  if(attempt >= 20){
    return [];
  }
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
      return getGeneratedReportId(ReportRequestId, attempt + 1);
    }

  }
  catch(e){
    console.log('[ERROR] amzRestock > getGeneratedReportId: ', e);
    await timeout(TIMEOUT);
    return getGeneratedReportId(ReportRequestId, attempt + 1);
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
