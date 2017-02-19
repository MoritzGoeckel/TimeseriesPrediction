const LearningIndicatorCollection = require("./includes/data/LearningIndicatorCollection.js");
const TimeSeriesGenerator = require("./includes/data/TimeSeriesGenerator.js");
const LearningIndicator = require("./includes/data/LearningIndicator.js");
const Indicators = require('technicalindicators');
const ValueMinusIndicator = require("./includes/data/indicator_wrapper/ValueMinusIndicator.js");
const ChooseAttributeIndicator = require("./includes/data/indicator_wrapper/ChooseAttributeIndicator.js");

const WebServer = require("./includes/api/WebServer.js");
let server = new WebServer(3000);

let gen = new TimeSeriesGenerator();
let series = gen.generateSeries(gen.normalSeries, 100 * 100 * 4, 200);

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

collection.initNeuralNetwork(5, condition, .0001, 50);

//The data for the graph
let price = {name:"price", data:[]};
let outcome = {name:"price_outcome", data:[]};
let predictionAvg = {name:"prediction", data:[]};
let predictionNN = {name:"prediction_nn", data:[]};

let lastProgress;

//Iterate the series
for(let i = 0; i < series.length; i++)
{
    collection.pushTick(series[i]);

    if(i % 100 == 0)
        collection.updateNeuralNetwork();
    
    predictionNN.data.push(collection.getNeuralNetworkPrediction());

    predictionAvg.data.push(collection.getPrediction());
    price.data.push(series[i]);

    if(i + 5 < series.length)
        outcome.data.push({timestamp:series[i].timestamp, value:series[i + 5].value - series[i].value});

    let progress = Math.round(i / series.length * 100);
    if(lastProgress != progress){
        console.log(Math.round(i / series.length * 100) + "%");
        lastProgress = progress;
    }
}

//Todo: Get success statistics

let predictionAvg_success = 0;
let predictionAvg_count = 0;
let predictionNN_success = 0;
let predictionNN_count = 0;

let threshold = 0.3;

for(let i = 0; i < price.data.length; i++){
    if(outcome.data[i] != undefined && isNaN(outcome.data[i].value) == false){

        if(isNaN(predictionAvg.data[i].value) == false && predictionAvg.data[i] != undefined)
        {
            if(predictionAvg.data[i].value > threshold && outcome.data[i].value > price.data[i].value)
                predictionAvg_success++;

            if(predictionAvg.data[i].value < -threshold && outcome.data[i].value < price.data[i].value)
                predictionAvg_success++;

            if(predictionAvg.data[i].value > threshold || predictionAvg.data[i].value < -threshold)
                predictionAvg_count++;
        }

        if(isNaN(predictionNN.data[i].value) == false && predictionNN.data[i] != undefined)
        {
            if(predictionNN.data[i].value > threshold && outcome.data[i].value > price.data[i].value)
                predictionNN_success++;

            if(predictionNN.data[i].value < -threshold && outcome.data[i].value < price.data[i].value)
                predictionNN_success++;
              
            if(predictionNN.data[i].value > threshold || predictionNN.data[i].value < -threshold)
                predictionNN_count++;
        }
    }
}

console.log("pred_avg: " + Math.round(predictionAvg_success / predictionAvg_count * 100) + "%");
console.log("pred_nn: " + Math.round(predictionNN_success / predictionNN_count * 100) + "%");

server.start([price, outcome, predictionAvg, predictionNN]);