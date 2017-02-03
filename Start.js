const TimeSeriesGenerator = require("./TimeSeriesGenerator.js");
const LearningIndicator = require("./LearningIndicator.js");
const Indicators = require('technicalindicators');
const ValueMinusIndicator = require("./indicators/ValueMinusIndicator.js");
const ChooseAttributeIndicator = require("./indicators/ChooseAttributeIndicator.js");

const WebServer = require("./WebServer.js");

let server = new WebServer(3000);

let condition = function(now, future)
{
    let delta = future[future.length - 1].value - now.value;

    if(delta >= 0.1)
        return 1;
    else if(delta <= -0.1)
        return -1;
    else
        return 0;
}

let gen = new TimeSeriesGenerator();
let series = gen.generateSeries(gen.normalSeries, 200 * 10, 200);

var sma = new ValueMinusIndicator(new Indicators.SMA({period : 5, values : []}));
var macd = new ChooseAttributeIndicator(new Indicators.MACD({values : [],
  fastPeriod        : 5,
  slowPeriod        : 8,
  signalPeriod      : 3 ,
  SimpleMAOscillator: false,
  SimpleMASignal    : false}), "histogram");

let li = new LearningIndicator(macd, 100, 3, 5, condition);

let data = {datasets:[], dates:[]};

let values = [];
let predictions = [];
let outcomes = [];

let counter = 1;
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

        let predictionThreshold = 0.4;

        if(prediction >= predictionThreshold || prediction <= -predictionThreshold){
            if(diff >= 0.1 && prediction >= predictionThreshold)
                successes++;
            if(diff <= -0.1 && prediction <= -predictionThreshold)
                successes++;
            
            counter++;
        }

        hitrate.push(successes / counter);
    }
}

data.datasets.push({name:"values", data:values});
data.datasets.push({name:"predictions", data:predictions});
data.datasets.push({name:"outocmes", data:outcomes});
data.datasets.push({name:"hitrate", data:hitrate});

console.log((successes / counter) + " after " + counter);
//console.log(li.getLookupTable());


server.start(data);