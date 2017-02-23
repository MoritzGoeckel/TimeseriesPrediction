const LearningIndicatorCollection = require("./includes/data/LearningIndicatorCollection.js");
const TimeSeriesGenerator = require("./includes/data/TimeSeriesGenerator.js");
const LearningIndicator = require("./includes/data/LearningIndicator.js");
const Indicators = require('technicalindicators');
const ValueMinusIndicator = require("./includes/data/indicator_wrapper/ValueMinusIndicator.js");
const ChooseAttributeIndicator = require("./includes/data/indicator_wrapper/ChooseAttributeIndicator.js");

const WebServer = require("./includes/api/WebServer.js");
let server = new WebServer(3000);

let gen = new TimeSeriesGenerator();
let series = gen.generateSeries(gen.normalSeries, 100 * 100, 200);

let outcomeTimeframe = 10;

let outcomeCondition = function(now, future)
{
    let delta = future[future.length - 1].value - now.value;

    if(delta > 0)
        return 1;
    else if(delta < 0)
        return -1;
    else
        return 0;
}

let predictionOutcomeEvaluation = function(now, future){
    let threshold = 0.1;

    let delta = future[future.length - 1].value - now.value;    

    if(isNaN(now.avgPrediction) || future[future.length - 1].timestamp == now.timestamp || isNaN(delta))
        return 0;
    
    if((now.avgPrediction > threshold && delta > 0) || (now.avgPrediction < -threshold && delta < 0))
        return 1;

    else if(now.avgPrediction < threshold && now.avgPrediction > -threshold)
        return 0;

    else if((now.avgPrediction > threshold && delta < 0) || (now.avgPrediction < -threshold && delta > 0))
        return -1;

    else
        throw new Error("Something is not covered here... " + now.avgPrediction + " " + delta);
}

let collection = new LearningIndicatorCollection(predictionOutcomeEvaluation, outcomeTimeframe, outcomeCondition, 50);

// Add some learning indicators
function rand(min, max)
{
    return Math.round(min + Math.random() * (min - max));
}

for(let i = 1; i < 20; i++)
    collection.addLearningIndicator(new LearningIndicator(new ChooseAttributeIndicator(new Indicators.MACD({values : [],
    fastPeriod        : 3 + i,
    slowPeriod        : 6 + 2 * i,
    signalPeriod      : 1 + Math.floor(i / 2),
    SimpleMAOscillator: false,
    SimpleMASignal    : false}), "histogram"), 100, 10, outcomeTimeframe, outcomeCondition));

/*for(let i = 1; i < 30; i++)
    collection.addLearningIndicator(new LearningIndicator(new ChooseAttributeIndicator(new Indicators.MACD({values : [],
    fastPeriod        : rand(2, 20),
    slowPeriod        : rand(2, 20),
    signalPeriod      : rand(2, 20),
    SimpleMAOscillator: false,
    SimpleMASignal    : false}), "histogram"), 100, 10, outcomeTimeframe, outcomeCondition));
*/

for(let i = 1; i < 20; i++)
    collection.addLearningIndicator(new LearningIndicator(new ValueMinusIndicator(new Indicators.SMA({period : 2 + i, values : []})), 100, 10, outcomeTimeframe, outcomeCondition));

// End of adding learning indicators

collection.initNeuralNetwork(0.3, 100);

//The data for the graph
let ticks = []; //First one is date
const PRICE = 1, OUTCOME = 2, PRED = 3, PREDNN = 4, SUCCESS = 5;
let labels = ["date", "price", "price_outcome", "prediction", "prediction_nn", "success"];

let lastProgress;

//Iterate the series
for(let i = 0; i < series.length; i++)
{
    let thisTick = [];
    //date
    thisTick.push(series[i].timestamp);

    //PRICE
    thisTick.push(series[i].value);

    //Update indicator collection
    collection.pushTick(series[i]);

    //Update the NN
    /*if(i % 10 == 0)
        collection.updateNeuralNetwork();*/

    //OUTCOME
    let futureIndex = i;
    while(futureIndex < series.length && series[futureIndex].timestamp - series[i].timestamp < outcomeTimeframe)
        futureIndex++;
    
    futureIndex--;

    if(futureIndex > 0 && futureIndex < series.length)
        thisTick.push(series[futureIndex].value - series[i].value); //Todo How to do live??
    else
        thisTick.push(NaN);
    
    collection.resolve();
    
    //PRED
    thisTick.push(collection.getPrediction().value);

    //PREDNN
    let predNN = collection.getNeuralNetworkPrediction();
    thisTick.push(predNN.value);

    //Show progress in console
    let progress = Math.round(i / series.length * 100);
    if(lastProgress != progress){
        console.log(Math.round(i / series.length * 100) + "%");
        lastProgress = progress;
    }

    //SUCCESS
    thisTick.push(collection.getSuccessRate()); //Todo??

    ticks.push(thisTick);
}

server.start({labels: labels, data:ticks, info:undefined});