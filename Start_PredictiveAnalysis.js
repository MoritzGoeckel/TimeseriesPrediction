const IndicatorCollection = require("./includes/data/IndicatorCollection.js");
const TimeSeriesGenerator = require("./includes/data/TimeSeriesGenerator.js");
const Indicator = require("./includes/data/Indicator.js");
const Resolver = require("./includes/data/Resolver.js");
const LookupSystem = require("./includes/data/predictionsystems/LookupSystem.js");
const Indicators = require('technicalindicators');
const ValueMinusIndicator = require("./includes/data/indicator_wrapper/ValueMinusIndicator.js");
const ChooseAttributeIndicator = require("./includes/data/indicator_wrapper/ChooseAttributeIndicator.js");
const LowerMiddleUpperIndicator = require("./includes/data/indicator_wrapper/LowerMiddleUpperIndicator.js");

const WebServer = require("./includes/api/WebServer.js");
let server = new WebServer(3000);

let gen = new TimeSeriesGenerator();
let series = gen.generateSeries(gen.complexSeries, 100 * 100, 200);

let outcomeTimeframe = 1;

let outcomeCondition = function(now, future)
{
    let delta = future[future.length - 1].value - now.value;

    if(delta > 0.5)
        return 1;
    if(delta < -0.5)
        return -1;
    
    return 0;
}

let predictionOutcomeEvaluation = function(now, future, outcomeCode){
    let threshold = 0.1;

    let delta = future[future.length - 1].value - now.value;

    if(isNaN(now.avgPrediction) || future[future.length - 1].timestamp == now.timestamp || isNaN(delta))
        return 0;

    if(now.avgPrediction >= threshold && delta > 0)
        return 1;

    if(now.avgPrediction <= -threshold && delta < 0)
        return 1;  

    if(now.avgPrediction < threshold && now.avgPrediction > -threshold)
        return 0;
    
    return -1;
}

let resolver = new Resolver([new LookupSystem(100, 10)], outcomeTimeframe, outcomeCondition);
let collection = new IndicatorCollection(resolver, []);

// Add some learning indicators
function rand(min, max)
{
    return Math.round(min + Math.random() * (min - max));
}

// SMA
for(let i = 1; i < 20; i++)
    collection.addIndicator(new Indicator(new ValueMinusIndicator(new Indicators.SMA({period : 2 + i, values : []})), "SMA"));

// EMA
for(let i = 1; i < 20; i++)
    collection.addIndicator(new Indicator(new ValueMinusIndicator(new Indicators.EMA({period : 2 + i, values : []})), "EMA"));

// WMA
for(let i = 1; i < 20; i++)
    collection.addIndicator(new Indicator(new ValueMinusIndicator(new Indicators.WMA({period : 2 + i, values : []})), "WMA"));

// MACD
for(let i = 1; i < 20; i++)
    collection.addIndicator(new Indicator(new ChooseAttributeIndicator(new Indicators.MACD({values : [],
    fastPeriod        : 3 + i,
    slowPeriod        : 6 + 2 * i,
    signalPeriod      : 1 + Math.floor(i / 2),
    SimpleMAOscillator: false,
    SimpleMASignal    : false}), "histogram"), "MACD"));

// BB
for(let std = 1; std < 4; std++)
    for(let i = 1; i < 10; i++)
        collection.addIndicator(new Indicator(new LowerMiddleUpperIndicator(new Indicators.BollingerBands({values : [],
        period: 1 + i,
        stdDev: std}), "lower / middle / upper"), "BB"));

// RSI
for(let i = 1; i < 20; i++)
    collection.addIndicator(new Indicator(new Indicators.RSI({period : 2 + i, values : []}), "RSI"));

// WEMA
for(let i = 1; i < 20; i++)
    collection.addIndicator(new Indicator(new ValueMinusIndicator(new Indicators.WEMA({period : 2 + i, values : []})), "WEMA"));

// ROC
for(let i = 1; i < 20; i++)
    collection.addIndicator(new Indicator(new Indicators.ROC({period : 2 + i, values : []}), "ROC"));

// TRX
for(let i = 1; i < 20; i++)
    collection.addIndicator(new Indicator(new ValueMinusIndicator(new Indicators.TRIX({period : 2 + i, values : []})), "TRIX"));

// KST
// https://runkit.com/anandaravindan/kst
// = kst?
/*var input = {
  values: [],
  ROCPer1     : 10,
  ROCPer2     : 15,
  ROCPer3     : 20,
  ROCPer4     : 30,
  SMAROCPer1  : 10,
  SMAROCPer2  : 10,
  SMAROCPer3  : 10,
  SMAROCPer4  : 15,
  signalPeriod: 3
};*/

// KD (Needs heigh low close)
// https://runkit.com/anandaravindan/stochastic

// W%C (Needs heigh low close)
// https://runkit.com/anandaravindan/williamsr

// ADL (Needs heigh low close volume)
// https://runkit.com/anandaravindan/adl

// ATR
// Heigh low close data required.
// https://runkit.com/anandaravindan/atr

// End of adding learning indicators

//The data for the graph
let ticks = []; //First one is date
const PRICE = 1, OUTCOME = 2, PRED = 3, PREDNN = 4, SUCCESS = 5;
let labels = ["date", "price", "pred"]; //"success"

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
    
    collection.resolve();
    
    //PRED (Can be more...)
    let predictions = collection.getPredictions();
    //console.log(predictions);
    for(let p = 0; p < predictions.length; p++)
        thisTick.push(predictions[p].value);

    //Show progress in console
    let progress = Math.round(i / series.length * 100);
    if(lastProgress != progress){
        console.log(Math.round(i / series.length * 100) + "%");
        lastProgress = progress;
    }

    //SUCCESS
    //thisTick.push(collection.getSuccessRate()); //Todo??

    ticks.push(thisTick);
}

server.start({labels: labels, data:ticks, info:undefined});

//Implement random forest
//https://github.com/karpathy/forestjs

//Extract ai from indicator collection