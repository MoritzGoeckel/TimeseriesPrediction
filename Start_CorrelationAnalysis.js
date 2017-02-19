const TSG = require("./includes/data/TimeSeriesGenerator.js");
const WebServer = require("./includes/api/WebServer.js");
const Regression = require('regression');

let tsg = new TSG();

let generated = tsg.generateSeries(tsg.simpleSeries, 1000, 20);
let correlated = tsg.generateCorrleatedSeries(generated, 6, 0.5, 3, function(correlated){

    //Some analysis Regression
    var data = [[0,1],[32, 67] .... [12, 79]];
    var result = regression('linear', data); //linear exponential logarithmic
    //Const function
    //console.log(result);
    //Distance extraordinary -> Bet to closing distance

    exportSeries(correlated);
});

function exportSeries(series){
    let seriesWithNames = [];
    for(let i = 0; i < series.length; i++)
    {
        seriesWithNames.push({name:i, data:series[i]});
    }

    let server = new WebServer(3000);
    server.start(seriesWithNames);
}