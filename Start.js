const TimeSeriesGenerator = require("./TimeSeriesGenerator.js");
const LearningIndicator = require("./LearningIndicator.js");
const Indicators = require('technicalindicators');
const ValueMinusIndicator = require("./indicators/ValueMinusIndicator.js");
const WebServer = require("./WebServer.js");

let server = new WebServer(3000);

let gen = new TimeSeriesGenerator();
let series = gen.generateSeries(gen.normalSeries, 40 * 10, 1000);
var sma = new ValueMinusIndicator(new Indicators.SMA({period : 5, values : []}));

let condition = function(now, future)
{
    let delta = future[future.length - 1].value - now.value;

    if(future[future.length - 1].timestamp - now.timestamp > 40)
        throw new Error("Can watch too far in the future");

    if(delta >= 0.1)
        return 1;
    else if(delta <= -0.1)
        return -1;
    else
        return 0;
}

let li = new LearningIndicator(sma, 40, 1, 5, condition);

let data = {datasets:[], dates:[]};

let values = [];
let predictions = [];
let outcomes = [];

let counter = 0;
let successes = 0;
let hitrate = [];

for(let i = 0; i < series.length; i++)
{
    li.push(series[i]);
    li.resolve();

    data.dates.push(i);

    values.push(series[i].value);

    let prediction = li.getPrediction();
    predictions.push(prediction);

    if(i + 5 < series.length)
    {
        let diff = series[i + 5].value - series[i].value;
        outcomes.push(diff);
        if(diff > 0.1 && prediction >= 0.1)
            successes++;
        if(diff < -0.1 && prediction <= -0.1)
            successes++;

        counter++;

        hitrate.push(successes / counter);

        if(counter >= 200){
            counter = 0;
            successes = 0;
        }
    }
}

data.datasets.push({name:"values", data:values});
data.datasets.push({name:"predictions", data:predictions});
data.datasets.push({name:"outocmes", data:outcomes});
data.datasets.push({name:"hitrate", data:hitrate});

console.log((successes / counter) + " after " + counter);

server.start(data);