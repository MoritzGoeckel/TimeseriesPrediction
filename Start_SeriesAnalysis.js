const TSG = require("./includes/data/TimeSeriesGenerator.js");
const WebServer = require("./includes/api/WebServer.js");

let tsg = new TSG();

let generated = tsg.generateSeries(tsg.simpleSeries, 1000, 20);
let correlated = tsg.generateCorrleatedSeries(generated, 6, 0.5, 3, function(correlated){
    exportSeries(correlated);
});

function exportSeries(series){
    let seriesWithNames = [];
    for(let i = 0; i < series.length; i++)
    {
        seriesWithNames.push({name:i, data:series[i]});
    }

    let server = new WebServer(3000);
    server.start({datasets:seriesWithNames});
}