const LearningIndicatorCollection = require("./includes/data/LearningIndicatorCollection.js");
const TimeSeriesGenerator = require("./includes/data/TimeSeriesGenerator.js");
const LearningIndicator = require("./includes/data/LearningIndicator.js");
const Indicators = require('technicalindicators');
const ValueMinusIndicator = require("./includes/data/indicator_wrapper/ValueMinusIndicator.js");
const ChooseAttributeIndicator = require("./includes/data/indicator_wrapper/ChooseAttributeIndicator.js");

const WebServer = require("./includes/api/WebServer.js");
let server = new WebServer(3000);

let gen = new TimeSeriesGenerator();
let series = gen.generateSeries(gen.complexSeries, 100 * 100, 200);

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
let ticks = []; //First one is date
const PRICE = 1, OUTCOME = 2, PRED = 3, PREDNN = 4;
let labels = ["date", "price", "price_outcome", "prediction", "prediction_nn"];

let lastProgress;

//Iterate the series
for(let i = 0; i < series.length; i++)
{
    let thisTick = [];
    thisTick.push(series[i].timestamp);
    thisTick.push(series[i].value);
    
    collection.pushTick(series[i]);

    /*if(i % 100 == 0)
        collection.updateNeuralNetwork();*/

    if(i + 5 < series.length)
        thisTick.push(series[i + 5].value - series[i].value);
    else
        thisTick.push(NaN);
    
    thisTick.push(collection.getPrediction().value);
    thisTick.push(collection.getNeuralNetworkPrediction().value);

    let progress = Math.round(i / series.length * 100);
    if(lastProgress != progress){
        console.log(Math.round(i / series.length * 100) + "%");
        lastProgress = progress;
    }

    ticks.push(thisTick);
}

//Todo: Get success statistics
let predictionAvg_success = 0;
let predictionAvg_count = 0;
let predictionNN_success = 0;
let predictionNN_count = 0;

let threshold = 0.05;

for(let i = 0; i < ticks.length; i++){
    if(ticks[i][OUTCOME] != undefined && isNaN(ticks[i][OUTCOME]) == false){

        //Prediction AVG
        if(isNaN(ticks[i][PRED]) == false && ticks[i][PRED] != undefined)
        {
            if(ticks[i][PRED] > threshold && ticks[i][OUTCOME] > 0)
                predictionAvg_success++;

            if(ticks[i][PRED] < -threshold && ticks[i][OUTCOME] < 0)
                predictionAvg_success++;

            if(ticks[i][PRED] > threshold || ticks[i][PRED] < -threshold)
                predictionAvg_count++;
        }

        //PredictionNN
        if(isNaN(ticks[i][PREDNN]) == false && ticks[i][PREDNN] != undefined)
        {
            if(ticks[i][PREDNN] > threshold && ticks[i][OUTCOME] > 0)
                predictionNN_success++;

            if(ticks[i][PREDNN] < -threshold && ticks[i][OUTCOME] < 0)
                predictionNN_success++;
              
            if(ticks[i][PREDNN] > threshold || ticks[i][PREDNN] < -threshold)
                predictionNN_count++;
        }
    }
}

console.log("pred_avg: " + Math.round(predictionAvg_success / predictionAvg_count * 100) + "%");
console.log("pred_nn: " + Math.round(predictionNN_success / predictionNN_count * 100) + "%");

let info = "Pred: " + Math.round(predictionAvg_success / predictionAvg_count * 100) + "%<br />";
info += "PrNN: " + Math.round(predictionNN_success / predictionNN_count * 100) + "%";

server.start({labels: labels, data:ticks, info:info});