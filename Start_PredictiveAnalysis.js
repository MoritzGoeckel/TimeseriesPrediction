const LearningIndicatorCollection = require("./includes/data/LearningIndicatorCollection.js");
const TimeSeriesGenerator = require("./includes/data/TimeSeriesGenerator.js");
const LearningIndicator = require("./includes/data/LearningIndicator.js");
const Indicators = require('technicalindicators');
const ValueMinusIndicator = require("./includes/data/indicator_wrapper/ValueMinusIndicator.js");
const ChooseAttributeIndicator = require("./includes/data/indicator_wrapper/ChooseAttributeIndicator.js");

const WebServer = require("./includes/api/WebServer.js");
let server = new WebServer(3000);

let gen = new TimeSeriesGenerator();
let series = gen.generateSeries(gen.normalSeries, 100 * 10, 100);

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

for(let i = 1; i < 20; i++)
    collection.addLearningIndicator(new LearningIndicator(new ValueMinusIndicator(new Indicators.SMA({period : 2 + i, values : []})), 100, 10, 5, condition));

let price = {name:"price", data:[]};
let outcome = {name:"price_outcome", data:[]};

let predictionAvg = {name:"prediction", data:[]};

for(let i = 0; i < series.length; i++)
{
    collection.pushTick(series[i]);
    predictionAvg.data.push(collection.getPrediction());
    price.data.push(series[i]);

    if(i + 5 < series.length)
        outcome.data.push(series[i + 5]);

    //var myPerceptron = new Architect.Perceptron(2, 10, 10, 10, 10, 1);
    //myNetwork.activate([1,0,1,0]);
    //myNetwork.activate([1,1]);
    //myNetwork.propagate(learningRate, [0]);

    //var exported = myNetwork.toJSON();
    //var imported = Network.fromJSON(exported);

    /*var trainer = new Trainer(myNetwork)
    var trainingSet = [
    {
        input: [0,0],
        output: [0]
    },
    {
        input: [0,1],
        output: [1]
    },
    {
        input: [1,0],
        output: [1]
    },
    {
        input: [1,1],
        output: [0]
    },
    ]

    trainer.train(trainingSet);*/
}

//console.log(liValues);
server.start([price, outcome, predictionAvg]);