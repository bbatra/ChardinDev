import {doBatchUpdates, getAllRecords, internalParseInt} from "./airtableBatch";

const MwsApi = require('amazon-mws');
const fs = require('fs');
const path = require('path');
import { timeout } from "./timeout";

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

    if(attempt > 20){
      return []
    }
    try{
      const response = await amazonMws.reports.search({
        ...data,
        'Action': 'GetReport',
        'ReportId': reportId
      })

      return response;
    }
    catch(e){
      console.log('[ERROR] amzReviews > getReport: ', e);
      await timeout(TIMEOUT);
      return getReport(reportId, attempt + 1);
    }

}

const requestReport = async () => {

  try{
    const response = await amazonMws.reports.submit({
      ...data,
      'Action': 'RequestReport',
      'ReportType': ' _GET_SELLER_FEEDBACK_DATA_'
    })

    return response.ReportRequestInfo.ReportRequestId;

  }
  catch(e){
    console.log('[ERROR] amzReviews > requestReport: ', e);
  }



}

const TIMEOUT = 30000;
const getGeneratedReportId = async (ReportRequestId, attempt = 0) => {
  if(attempt > 20){
    return [];
  }
  try{
    console.log('getGeneratedReport called: ', (Date.now() - start));
    const response = await amazonMws.reports.search({
      ...data,
      'Action': 'GetReportRequestList',
      'ReportType': ' _GET_SELLER_FEEDBACK_DATA_',
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
    console.log('[ERROR] amzReviews > getGeneratedReportId: ', e);
    await timeout(TIMEOUT);
    return getGeneratedReportId(ReportRequestId, attempt + 1);
  }

}

//4 stage process
export const getReviewsReportByAsin = async () => {
  const ReportRequestId = await requestReport();

  await timeout(TIMEOUT);
  const generatedReportId = await getGeneratedReportId(ReportRequestId);

  console.log('Got generated report Id: ', generatedReportId);
  let reportId = generatedReportId;

  const report = await getReport(reportId)

  console.log(report);
  // const resultDict = {};
  // report.data.map( row => {
  //   resultDict[row.ASIN] = {
  //     amzRec: row["Recommended replenishment qty"],
  //     last30: row["Units Sold Last 30 Days"],
  //     FBAstk: row["Total Units"]
  //   }
  // })

  // console.log(resultDict);
  // return resultDict;

}

getReviewsReportByAsin()


export const updateReviewsData = async () => {
  const tableName = 'Products'
  console.log('AMZ Reviews main');
  const records = await getAllRecords(tableName, ['SKU', 'AmzRec', 'ASIN']);
  const restockDict = await getReviewsReportByAsin();
  const updates = []
  const mapper = (record) => {
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

  records.map(mapper);//pushes to updates
  console.log(`Performing ${updates.length} from ${records.length} records`)
  await doBatchUpdates(tableName, updates);
}
