import captureWebsite from 'capture-website';
import fs from 'fs';
import {parse} from "csv-parse";
import https from "https";

const filePath = "./download/product.csv";
const url = "https://d3viuu04pg3ia5.cloudfront.net/TS_Code_Assesment.csv";
const items = [];

function getRemoteFile(filePath, url) {
    let localFile = fs.createWriteStream(filePath);
   https.get(url, function(response) {
        var len = parseInt(response.headers['content-length'], 10);
        var cur = 0;
        var total = len / 1048576; //1048576 - bytes in 1 Megabyte

        response.on('data', function(chunk) {
            cur += chunk.length;
            showProgress(filePath, cur, len, total);
        });

        response.on('end', function() {
            console.log("Download complete");
        });

        response.pipe(localFile);
    });
}

function showProgress(file, cur, len, total) {
    console.log("Downloading " + file + " - " + (100.0 * cur / len).toFixed(2)
        + "% (" + (cur / 1048576).toFixed(2) + " MB) of total size: "
        + total.toFixed(2) + " MB");
}

function generateHtmlPage(productId, imageUrl) {
    const today = new Date();
    return `<p>Today's Date : ${today.getMonth()+1}/${today.getDate()}/${today.getFullYear()} <br/>
        Product ID: ${productId}<br/>
        <img src="${imageUrl}" alt=""/></p>`;
}

 async function createScreenShot(items) {
     await Promise.all(items.map(function (item) {
         let htmlPage = generateHtmlPage(item[1], item[2]);
          captureWebsite.file(htmlPage, `${item[0]}.png`, {
             inputType: 'html',
             width: 300,
             height: 500
         });
         items.shift();
     }));
 }
async function generateScreenShotFromCsv() {
    //getting remote file
    getRemoteFile(filePath, url);

    fs.createReadStream("./download/product.csv")
        .pipe(parse({ delimiter: ",", from_line: 2 }))
        .on("data",  async function (row) {
            let fileName = row[1].split(".");
            let productId = row[0].split(".")[0];
            let imgUrl = row[1];
            items.push([fileName[fileName.length - 2].split("/").pop(), productId, imgUrl]);
            await createScreenShot(items)
        })
        .on("end", function () {
            console.log("finished");
        })
        .on("error", function (error) {
            console.log(error.message);
        });
}
generateScreenShotFromCsv().then(r => console.log("Finished"));
