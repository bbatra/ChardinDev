const request = require('request-promise');
const encodedApiKey = 'MTg1MnAwVEtlNnltOkdybGdEeDJBRjVtZUluQQ==';
export const getInventory = async () => {

  const headers = {
    Authorization: `Basic ${encodedApiKey}`
  }

  var options = {
    method : 'GET',
    url : 'https://api.cartrover.com/v1/merchant/inventory?limit=100&page=1',
    resolveWithFullResponse: true,
    headers
  };

  try{
    const response = await request(options)
    console.log(response.headers);
  }
  catch(e){
    console.error('[ERROR] getInventory : ', e);
  }

}

getInventory();