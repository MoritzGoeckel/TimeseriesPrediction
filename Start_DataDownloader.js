let MarketsApi = require("./MarketsAPI.js");
let TimeseriesStorage = require("./TimeseriesStorage.js");

let Express = require('express');
let ExpressRest = require('express-rest');
let Schedule = require('node-schedule');

let redisPort = 6379;
let port = 61710;

let exp = Express();
let rest = ExpressRest(exp);

let names = {};

let storage = new TimeseriesStorage(redisPort, 3, function(){
    console.log("Connected");
});

function updateData(){
    MarketsApi.getMarkets(function(markets){
        for(let i in markets)
            storage.push(markets[i].symbol, {bid:markets[i].usdbid, ask:markets[i].usdask, median:markets[i].usdmedian, volume:markets[i].usdvolume}, new Date().getTime() / 1000, function(){
                console.log("Inserted " + markets[i].symbol);
                names[markets[i].symbol] = "";
            });

        console.log("Done Update");
    });
}

Schedule.scheduleJob('*/10 * * * * *', updateData);

exp.use("/", Express.static(__dirname + '/Frontend'));

rest.get('/api', function(req, rest) {
    //req.params.query

    let output = {markets:[], dates:[]};
    for(let name in names)
    {
        storage.getLast(name, 100, function(res){
            let dates = [];
            let data = [];
            
            for(let i in res)
            {
                data.push(res[i].value);
                dates.push(res[i].timestamp);
            }

            output.dates = dates;
            output.markets.push({name:name, data:data});

            if(output.markets.length == Object.keys(names).length)
                return rest.ok(output);
        });
    }
});

let listener = exp.listen(port, function(){
    console.log('Listening on port ' + listener.address().port);
});

updateData();