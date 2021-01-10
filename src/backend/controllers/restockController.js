const fs = require('fs');
const path = require('path')
const stream = require('stream');
import moment from 'moment';
import {getZipFileFromCodaAndProcess} from "../utilities/3PLwarehouse";
import lowCodeMiddlewareHTML from '../views/lowCodeMiddlewareHTML';
import {getAllRecords} from "../utilities/airtableBatch";
import csvjson from 'csvjson'

const downloadShippingPlan = async (req, res) => {
    console.log('Download shipping plan');
    const tableName = 'Products'
    const recordsRaw = await getAllRecords(tableName, ['SKU', 'CasesToSend', 'QtyInShipment', 'CasePk'], 'viwA2zkCnqk8qoinG');
    console.log('Got records from airtable')
    const recordsJson = recordsRaw.map(r => r.fields);
    const recordsTsv = csvjson.toCSV(recordsJson, { delimiter: '\t',headers: 'none'})

    const fileName = `PLN${moment(new Date).format('MMDDYY')}`;
    const fileHeader = `PlanName	${fileName}		
ShipToCountry	US		
AddressName	Phyllis Duncan		
AddressFieldOne	3PL Worldwide		
AddressFieldTwo	11190 White Birch Drive		
AddressCity	Rancho Cucamonga		
AddressCountryCode	US		
AddressStateOrRegion	CA		
AddressPostalCode	91730		
AddressDistrict
			
MerchantSKU	UnitsPerCase	NumberOfCases	Quantity`
    const fileBody = recordsTsv;
    const fileContents = Buffer.from(fileHeader + fileBody, "utf-8");


    const readStream = new stream.PassThrough();
    console.log('Read stream created');
    readStream.end(fileContents);

    console.log('read stream end')

    res.set('Content-disposition', `attachment; filename=${fileName}.tsv`);
    res.set('Content-Type', 'text/plain');

    console.log('Res set')

    readStream.pipe(res);

    console.log('Res piped');
}

const downloadRestockOutput = (req, res) => {
  const fileName = req.query.file;
  res.download(path.join(__dirname, `../shipments/${fileName}`), fileName);
}

const processRestockZip = async (req, res) => {
  try{
    await getZipFileFromCodaAndProcess();
    res.send(lowCodeMiddlewareHTML("done!"));
    return;
  }
  catch(e){
    res.send(lowCodeMiddlewareHTML(e.message));
    res.sendStatus(400)
  }
}

export default {
  downloadRestockOutput,
  downloadShippingPlan,
  processRestockZip
}