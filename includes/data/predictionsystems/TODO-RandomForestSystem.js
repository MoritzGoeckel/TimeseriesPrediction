const ml = require('forestjs');

function getNoNaN(input){
    let noNaNValues = input.slice();
    for(let i in noNaNValues)
    {
        if(isNaN(noNaNValues[i]))
            noNaNValues[i] = 0.5;
        if(isFinite(noNaNValues[i]) == false)
            noNaNValues[i] = 0.5;
    }

    return noNaNValues;
}

module.exports = class{
    constructor(learningPeriod, trainingInterval)
    {
        this.learningPeriod = learningPeriod;
        this.trainingData = [];
        this.lastTraining = undefined;
        this.trainingInterval = trainingInterval;
    }

    getName(){
        return "RandomForest";
    }

    pushData(indicatorValues, result, timestamp){
        let now = timestamp;

        if(this.lastTraining == undefined)
            this.lastTraining = now;

        this.trainingData.push({input:indicatorValues, output:result, timestamp:timestamp});
        while(this.trainingData.length > 0 && now - this.trainingData[0].timestamp > this.learningPeriod)
            this.trainingData.shift();

        if(now - this.lastTraining > this.trainingInterval && this.trainingData.length > 0)
        {
            this.lastTraining = now;

            let inputs = [];
            let outputs = [];

            let positivesCount = 0;
            let negativesCount = 0;
            for(let i = 0; i < this.trainingData.length; i++)
            {
                let addTheData = function(){
                    inputs.push(getNoNaN(this.trainingData[i].input));
                    outputs.push(this.trainingData[i].output);
                }.bind(this);

                if(this.trainingData[i].output == 1 || this.trainingData[i].output == -1)
                {
                    positivesCount++;
                    addTheData();
                }

                if(this.trainingData[i].output == 0 && negativesCount < positivesCount)
                {
                    negativesCount++;
                    addTheData();
                }
            }

            console.log("Training Regression with " + inputs.length + " samples: " + negativesCount + "n + " + positivesCount + "p");
            

            this.classifier = new forestjs.RandomForest();
            this.classifier.train(inputs, outputs, {numTrees: 100, maxDepth: 4, numTries: 10});
        }
    }

    getPrediction(indicatorValues){
        if(this.classifier != undefined){
            return this.classifier.predictOne(getNoNaN(indicatorValues));
        }
        else
            return NaN;
    }
}