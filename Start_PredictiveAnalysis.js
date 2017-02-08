const LearningIndicatorCollection = require("./includes/data/LearningIndicatorCollection.js");
const TimeSeriesGenerator = require("./includes/data/TimeSeriesGenerator.js");
const LearningIndicator = require("./includes/data/LearningIndicator.js");
const Indicators = require('technicalindicators');
const ValueMinusIndicator = require("./includes/data/indicator_wrapper/ValueMinusIndicator.js");
const ChooseAttributeIndicator = require("./includes/data/indicator_wrapper/ChooseAttributeIndicator.js");

const WebServer = require("./includes/api/WebServer.js");
let server = new WebServer(3000);

let gen = new TimeSeriesGenerator();
let series = gen.generateSeries(gen.normalSeries, 100 * 100, 500);

let collection = new LearningIndicatorCollection();

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

for(let i = 1; i < 20; i++)
    collection.addLearningIndicator(new LearningIndicator(new ChooseAttributeIndicator(new Indicators.MACD({values : [],
    fastPeriod        : 3 + i,
    slowPeriod        : 6 + 2 * i,
    signalPeriod      : 1 + Math.floor(i / 2),
    SimpleMAOscillator: false,
    SimpleMASignal    : false}), "histogram"), 100, 10, 5, condition));

function rand(min, max)
{
    return Math.round(min + Math.random() * (min - max));
}

/*for(let i = 1; i < 30; i++)
    collection.addLearningIndicator(new LearningIndicator(new ChooseAttributeIndicator(new Indicators.MACD({values : [],
    fastPeriod        : rand(2, 20),
    slowPeriod        : rand(2, 20),
    signalPeriod      : rand(2, 20),
    SimpleMAOscillator: false,
    SimpleMASignal    : false}), "histogram"), 100, 10, 5, condition));
*/

for(let i = 1; i < 20; i++)
    collection.addLearningIndicator(new LearningIndicator(new ValueMinusIndicator(new Indicators.SMA({period : 2 + i, values : []})), 100, 10, 5, condition));

collection.initNeuralNetwork(5, condition);

//The data for the graph
let price = {name:"price", data:[]};
let outcome = {name:"price_outcome", data:[]};
let predictionAvg = {name:"prediction", data:[]};
let predictionNN = {name:"prediction_nn", data:[]};

//Iterate the series
for(let i = 0; i < series.length; i++)
{
    collection.pushTick(series[i]);

    collection.updateNeuralNetwork();
    predictionNN.data.push(collection.getNeuralNetworkPrediction());

    predictionAvg.data.push(collection.getPrediction());
    price.data.push(series[i]);

    if(i + 5 < series.length)
        outcome.data.push(series[i + 5]);
}

//Todo: Get success statistics

server.start([price, outcome, predictionAvg, predictionNN]);