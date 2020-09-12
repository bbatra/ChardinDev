let Client = require('ssh2-sftp-client');
let sftp = new Client();
const fs = require('fs');
const path = require('path')
const csvjson = require('csvjson');
import {timeout} from "./timeout";
import {doBatchUpdates, getAllRecords, internalParseInt} from "./airtableBatch";
const moment = require('moment');

const getLatestInventoryFileData = async () => {
  try {
    await sftp.connect({
      host: 'ftp.3plworldwide.com',
      port: '22',
      username: 'CHAROME',
      password: 'CHM3PL!'
    })

    const localPath = path.join(__dirname, './latest-inventory.csv');
    let dst = fs.createWriteStream(path.join(__dirname, './latest-inventory.csv'));
    const remoteDirectory = '/INVENTORY';

    const files = await sftp.list('/INVENTORY');
    let mostRecentFile;
    if (files && files.length > 0) {
      mostRecentFile = files.sort((a, b) => b.modifyTime - a.modifyTime)[0]
    }
    console.log(mostRecentFile);
    console.log('Modofy time : ', new Date(mostRecentFile.modifyTime));
    const remoteFile = `${remoteDirectory}/${mostRecentFile.name}`
    await sftp.get(remoteFile, dst);
    await timeout(3000);//leave some time to be sure
    return (fs.readFileSync(localPath, 'utf-8'));

  }
  catch (e){
    console.error('[ERROR] warehouseInventory > getLatestInventoryFileData : ', e);
  }
}

export const updateInventory = async() => {
  const csv = await getLatestInventoryFileData();
  const skuArr = csvjson.toObject(csv);
  const skuDict = {};
  skuArr.map((sku) => {
    skuDict[sku.PRODUCT] = {
      '3PL Stock': sku['QTY ON HAND'] ,
      '3PL Avail': sku['TOTAL QUANTITY AVAILABLE'],
      '3PL Held' : sku['QTY HELD']
    }
  })
  const tableName = 'Products'
  const records = await getAllRecords(tableName);
  const updates = [];
  records.map(record => {
    const skuData = skuDict[record.get('SKU')];
    if(skuData){
      console.log('Got sku data : ', skuData);
      updates.push({
        id: record.id,
        fields : {
          '3PL Stock': internalParseInt(skuData['3PL Stock']),
          '3PL Avail': internalParseInt(skuData['3PL Avail']) ,
          '3PL Held' : internalParseInt(skuData['3PL Held'])
        }
      })

    }
    else {
      updates.push({
        id: record.id,
        fields : {
          '3PL Stock': 0,
          '3PL Avail': 0 ,
          '3PL Held' : 0
        }
      })
    }
  })
  await doBatchUpdates(tableName, updates);
  console.log('Updates done!');
}

const parseSkuList = (fileContents, format = 'tsv') => {
  // const csv = tsv.split('\t').join(',');

  const delimiter = format === 'tsv' ? '\t' : ',';
  const options = {
    delimiter // optional
  };


  const packingListStartIndex = fileContents.indexOf('Merchant SKU');
  const shippingInfoLines = fileContents.substr(0, packingListStartIndex).split('\r').join('').split('\n');
  const packingListCSV = fileContents.substr(packingListStartIndex);
  console.log({
    shippingInfoLines
  });

  const shippingInfo = {};
  for(let line of shippingInfoLines){
    if(line.length > 0){
      const firstDelimiter = line.indexOf(delimiter);
      const parts = [line.substr(0, firstDelimiter), line.substr(firstDelimiter + 1)]
      shippingInfo[parts[0]] = parts[1];
    }
  }

  console.log({
    shippingInfo
  });

  let addressParts = shippingInfo['Ship To'].split('"').join('').split(',');
  let shipToName, shipToAddress1, shipToCity, shipToState, shipToZip;
  if(addressParts.length > 6) {
    addressParts = [`${addressParts[0].trim()}, ${addressParts[1].trim()}`, ...addressParts.slice(2)]
  }

  shipToName = addressParts[0].trim();
  shipToAddress1 = addressParts[1].trim();
  shipToCity = addressParts[2].trim();
  shipToState = addressParts[3].trim();
  shipToZip = addressParts[5].trim();

  const packingList = csvjson.toObject(packingListCSV, options);



  return {
    shippingInfo: {
      ...shippingInfo,
      shipToName,
      shipToAddress1,
      shipToCity,
      shipToState,
      shipToZip
    },
    packingList
  }

};

const ORDER_3PL = {
  'WHSE': 'CA',
  'STORE/DC#': '',
  'REC#': '',
  'STAT': 3,
  'PICK#': (row) => row.shippingInfo['Shipment ID'].trim(),
  'PICK DATE': () => moment(new Date()).format("MM-DD-YYYY"),
  'PICK REF#': '',
  'INV#': '',
  'INV DATE': '',
  'INV REF#': '',
  'BOL#': '',
  'DIV': 'CHM',
  'ACCT#': '',
  'ORDER#': '',
  'ITEM#': (row) => row.sku['Merchant SKU'].trim(),
  'DESCRIPTION': '',
  'UPC#': (row) => row.sku['external-id'].trim(),
  'SKU': '',
  'VIA': 'BEST',
  'DELIVER': () => moment(new Date()).format("MM-DD-YYYY"),
  'CANCEL': () => moment(new Date()).add(3, 'days').format("MM-DD-YYYY"),//TODO: figure logic for weekends etc, next business day
  'QTY': (row) => row.sku['Shipped'],
  'UOM': (row) => { return row.sku['Units per Case'] ? 'CS' : 'EA'},
  'PACK': (row) => { return row.sku['Units per Case'] ? row.sku['Units per Case'] : '' },//only needs to be there for cases
  'CTNS': '',
  'SHIP TO NAME': (row) => row.shippingInfo.shipToName,
  'SHIP TO ATTN': '',
  'SHIP TO ADDRESS': (row) => row.shippingInfo.shipToAddress1,
  'SHIP TO ADDRESS-2': '',
  'SHIP TO CITY': (row) => row.shippingInfo.shipToCity,
  'SHIP TO STATE': (row) => row.shippingInfo.shipToState,
  'SHIP TO ZIP': (row) => row.shippingInfo.shipToZip,
  'BILL TO NAME': '',
  'BILL TO ATTN': '',
  'BILLTO ADDRESS': '',
  'BILL TO ADDRESS-2': '',
  'BILL TO CITY': '',
  'BILL TO STATE': '',
  'BILL TO ZIP': '',
  'COMMENTS': (row) => `Shipping labels in file package-${row.shippingInfo['Shipment ID'].trim()}.pdf`,
}

const mapShipmentToOrderFile = (shipment) => {
  let csv = '';
  console.log(shipment);
  for(let sku of shipment.packingList){
    const obj = {sku, shippingInfo: shipment.shippingInfo}
    const parts = []
    for(let prop in ORDER_3PL){
      let part = ORDER_3PL[prop];
      if(typeof ORDER_3PL[prop] === 'function'){
        part = ORDER_3PL[prop](obj);
      }

      let phrase = part;
      if(part && part.indexOf && part.indexOf(',') > -1 ){
        phrase = `"${part}"`
      }
      parts.push(phrase)
    }
    csv += parts.join(',') + '\n';
  }
  return csv;
}

export const inputShipmentOrder = () => {
  fs.readdir(path.join(__dirname, '../shipments'), function(err, items) {
    console.log(items);

    let orderFileBody = Object.keys(ORDER_3PL).join(',') + '\n';

    for (var i=0; i<items.length; i++) {

      // console.log(items[i]);
      if(items[i].indexOf('CHM.ORDER') === -1 && (items[i].indexOf('.tsv') > -1 || items[i].indexOf('.txt') > -1 || items[i].indexOf('.csv') > -1)){
        const fileContents = fs.readFileSync(path.join(__dirname, `../shipments/${items[i]}`), 'utf-8')
        const fileFormat = items[i].indexOf('.tsv') > -1 || items[i].indexOf('.txt') > -1 ? 'tsv': 'csv';
        const shipment = parseSkuList(fileContents, fileFormat);
        const csvLinesInOrder = mapShipmentToOrderFile(shipment);
        orderFileBody += `${csvLinesInOrder}`
      }
    }
    console.log(orderFileBody);
    fs.writeFileSync(path.join(__dirname, `../shipments/CHM.ORDER.${moment(new Date).format('MMDDYY')}.csv`), orderFileBody, 'utf-8');
  });


}



