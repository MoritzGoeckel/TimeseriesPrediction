const TSG = require("./includes/data/TimeSeriesGenerator.js");
const WebServer = require("./includes/api/WebServer.js");

let tsg = new TSG();

let generated = tsg.generateSeries(tsg.simpleSeries, 1000, 100);
let correlated = tsg.generateCorrleatedSeries(generated, 3, function(correlated){
    correlated.unshift(generated);
    exportSeries(correlated);
});

function exportSeries(series){
    let seriesWithNames = [];
    for(let i = 0; i < series.length; i++)
    {
        seriesWithNames.push({name:i, data:series[i]});
    }

    let dates = [];
    for(let i = 0; i < series[0].length; i++)
        dates.push(i);

    let server = new WebServer(3000);
    server.start({dates:dates, datasets:seriesWithNames});
}