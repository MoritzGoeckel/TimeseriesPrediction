const TimeSeriesGenerator = require("./TimeSeriesGenerator.js");
const LearningIndicator = require("./LearningIndicator.js");
const Indicators = require('technicalindicators');
const ValueMinusIndicator = require("./indicators/ValueMinusIndicator.js");

let gen = new TimeSeriesGenerator();
let series = gen.generateSeries(gen.simpleSeries, 40 * 10, 40);
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


for(let i in series)
{
    li.push(series[i]);
    li.resolve();
}

console.log(li.getPrediction());