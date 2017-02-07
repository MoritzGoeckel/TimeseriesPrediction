const TSG = require("./TimeSeriesGeneratorCorrelation.js");
const WebServer = require("./WebServer.js");

let tsg = new TSG();

tsg.generateSeries(10, 100, function(data){
    let webdata = [];
    for(let i = 0; i < data.length; i++)
    {
        webdata.push({name:i, data:data[i]});
    }

    let server = new WebServer(3000);
    server.start({dates:data[0], datasets:webdata});
});