const MwsApi = require('amazon-mws');
const fs = require('fs');
const path = require('path')
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

const csv = fs.readFileSync(path.join(__dirname, './SKU2ASIN.csv'), 'utf8');

const csvRows = csv.split('\n').slice(1);
console.log(csvRows);

var ASINList = csvRows.map(row => {
  return row.split(',')[1]
})


// var ASINList = [
//     'B01CA4383E',
//     'B074WHMGN3',
//     'B01H287HF8'
// ];

var data = {
  'Version': '2011-10-01',
  'Action': 'GetMatchingProduct',
  'SellerId': SELLER_ID,
  'MWSAuthToken': MWS_AUTH_TOKEN,
  'MarketplaceId': MARKET_PLACE_ID_US
};
var index = 1;

export const getRankingsForAsinList = async (asins) => {

  const fullList = [];
  const dict = {};

  while(asins.length > 0){

    const myData = { ...data };
    for (let i in asins.slice(0,Math.min(10, asins.length))) {
      const myIndex = i + 1;
      myData['ASINList.ASIN.' + myIndex] = asins[i];
    }

    try{
      const response = await amazonMws.products.search(myData)

      console.log('response ', JSON.stringify(response, null, 2));
      const results = response.map( (pObject) => {
        const asin = pObject.ASIN;
        const rankings = pObject.Product.SalesRankings.SalesRank;
        if(rankings && rankings.length > 1){
          dict[asin] = rankings[1].Rank;
        }
        return {
          rankings,
          asin
        }
      });

      fullList.push(...results);
    }
    catch(e){
      console.log('error products', e);
      console.log(myData);
    }

    if(asins.length > 10){
      asins = asins.slice(10)
    }
    else {
      asins = [];//done
    }
  }


  // console.log(JSON.stringify(fullList, null, 2));
  let output = 'asin,category 1, rank 1, category 2, rank 2, category 3, rank 3 ';
  for(let sku of fullList){
    const { asin, rankings} = sku;
    output += `\n${asin}`;

    if(rankings){
      for(let ranking of rankings){
        output += `,${ranking.ProductCategoryId},${ranking.Rank}`
      }
    }
  }
  console.log(dict);
  return dict;
}

