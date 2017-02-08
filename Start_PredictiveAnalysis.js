const TimeSeriesGenerator = require("./includes/data/TimeSeriesGenerator.js");
const LearningIndicator = require("./includes/data/LearningIndicator.js");
const Indicators = require('technicalindicators');
const ValueMinusIndicator = require("./includes/data/indicator_wrapper/ValueMinusIndicator.js");
const ChooseAttributeIndicator = require("./includes/data/indicator_wrapper/ChooseAttributeIndicator.js");

const WebServer = require("./includes/api/WebServer.js");

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
let series = gen.generateSeries(gen.normalSeries, 100 * 10, 100);

var sma = new ValueMinusIndicator(new Indicators.SMA({period : 5, values : []}));
var macd = new ChooseAttributeIndicator(new Indicators.MACD({values : [],
  fastPeriod        : 5,
  slowPeriod        : 8,
  signalPeriod      : 3 ,
  SimpleMAOscillator: false,
  SimpleMASignal    : false}), "histogram");

let lis = [];
lis.push(new LearningIndicator(macd, 100, 10, 5, condition));
lis.push(new LearningIndicator(sma, 100, 10, 5, condition));

let price = {name:"price", data:[]};
let predictionAvg = {name:"prediction", data:[]};
let liValues = [{name:"macd", data:[]}, {name:"sma", data:[]}];
let liPredictions = [{name:"macd_pred", data:[]}, {name:"sma_pred", data:[]}];

for(let i = 0; i < series.length; i++)
{
    let timestamp;
    let predictionSum = 0;
    for(let a in lis){
        lis[a].pushTick(series[i]);
        lis[a].resolve();
        liValues[a].data.push(lis[a].getIndicatorValue());
        liPredictions[a].data.push(lis[a].getPrediction());

        let pred = lis[a].getPrediction();
        timestamp = pred.timestamp;
        predictionSum += pred.value;
    }

    predictionAvg.data.push({timestamp:timestamp, value:predictionSum / lis.length});

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

    price.data.push(series[i]);
}

liValues.unshift(price);
liPredictions.push(predictionAvg);

let output = liValues.concat(liPredictions);

//console.log(liValues);
server.start(output);