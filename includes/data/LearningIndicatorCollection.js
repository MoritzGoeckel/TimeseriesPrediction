const Synaptic = require('synaptic'); // this line is not needed in the browser

module.exports = class{
    constructor(predictionOutcomeEvaluationFunction, conditionTimeframe, outcomeEvaluationFunction, successHistoryTimeframe){
        this.lis = [];
        this.lastTimestamp = undefined;
        this.currentValues = [];
        this.currentPredictions = []; //Not used
        this.currentAvgPrediction = undefined;

        this.history = [];
        this.successes = 0;
        this.success_chances = 0;

        this.conditionTimeframe = conditionTimeframe;
        this.outcomeEvaluationFunction = outcomeEvaluationFunction;
        this.predictionOutcomeEvaluationFunction = predictionOutcomeEvaluationFunction;

        this.successHistoryTimeframe = successHistoryTimeframe;
        this.success_history = [];
    }

    addLearningIndicator(indicator){
        this.lis.push(indicator);
    }

    pushTick(entry){
        this.lastTimestamp = entry.timestamp;

        //Clear
        this.currentPredictions = [];
        this.currentValues = [];

        let predictionSum = 0;
        for(let a in this.lis){
            this.lis[a].pushTick(entry);
            this.lis[a].resolve();

            let pred = this.lis[a].getPrediction();

            this.currentValues.push(this.lis[a].getIndicatorValue().value);
            this.currentPredictions.push(pred.value);

            predictionSum += pred.value;
        }

        this.currentAvgPrediction = predictionSum / this.lis.length;
        this.history.push({timestamp:entry.timestamp, value:entry.value, indicators:this.currentValues.slice(), avgPrediction:this.currentAvgPrediction});
    }

    getPrediction(){
        return {timestamp:this.lastTimestamp, value:this.currentAvgPrediction};
    }

    getValues(){
        return this.currentValues;
    }

    getPredictions(){
        return this.currentPredictions;
    }

    initNeuralNetwork(learningRate, reinforceTimeframe){
        this.networkOptions = {
                rate: learningRate,
                iterations: 1,
                //error: .005,
                shuffle: true,
                //log: 1000,
                cost: Synaptic.Trainer.cost.CROSS_ENTROPY, //Opt: Another cost function?
                batchTimeframe: reinforceTimeframe
            };
        
        this.trainingSet = [];        

        //var exported = myNetwork.toJSON();
        //var imported = Network.fromJSON(exported);
        this.network = new Synaptic.Architect.Perceptron(this.lis.length, Math.round(this.lis.length / 2), Math.round(this.lis.length / 4), 2);
    }

    getNeuralNetworkPrediction(){
        let noNaNValues = this.currentValues.slice();
        for(let i in noNaNValues)
        {
            if(isNaN(noNaNValues[i]))
                noNaNValues[i] = 0.5;
            if(isFinite(noNaNValues[i]) == false)
                noNaNValues[i] = 0.5;
        }

        let result = this.network.activate(noNaNValues);
        return {timestamp:this.lastTimestamp, value:result[0] - result[1], raw:result};
    }

    getSuccessRate(){
        return this.successes / this.success_chances;
    }

    resolve(){
        while(this.history.length > 0)
        {
            let foundIndex = undefined;
            for(let i = this.history.length - 1; i > 0; i--)
            {
                if(this.history[i].timestamp - this.history[0].timestamp <= this.conditionTimeframe)
                {
                    foundIndex = i;
                    break;
                }
            }

            if(foundIndex != undefined && foundIndex + 1 < this.history.length) //Is there also newer values?
            {
                foundIndex += 1;

                let result = this.outcomeEvaluationFunction(this.history[0], this.history.slice(1, foundIndex + 1));
                let outcomeEval = this.predictionOutcomeEvaluationFunction(this.history[0], this.history.slice(1, foundIndex + 1), result);

                if(outcomeEval != 0 && outcomeEval != 1 && outcomeEval != -1)
                    throw new Error("Eval should be 0 or 1 or -1");

                //Todo: Remove old
                if(outcomeEval == 1){
                    this.successes++;
                    this.success_chances++;
                    this.success_history.push({timestamp:this.history[0].timestamp, success:1, chance:1});
                }
                if(outcomeEval == -1){
                    this.success_chances++;
                    this.success_history.push({timestamp:this.history[0].timestamp, success:0, chance:1});                    
                }

                while(this.success_history.length > 0 && this.lastTimestamp - this.success_history[0].timestamp > this.successHistoryTimeframe)
                {
                    let removed = this.success_history.shift();
                    this.successes -= removed.success;
                    this.success_chances -= removed.chance;
                }

                if(result != 0 && result != 1 && result != -1)
                    throw new Error("Result should be 0 or 1 or -1");

                let timestamp = this.history[0].timestamp;
                let noNaNValues = this.history[0].indicators.slice();
                this.history.shift();

                //Train
                //No NaN or Infinite
                for(let i in noNaNValues)
                {
                    if(isNaN(noNaNValues[i]))
                        noNaNValues[i] = 0.5;
                    if(isFinite(noNaNValues[i]) == false)
                        noNaNValues[i] = 0.5; //Standart values
                }

                if(result === 1)
                    result = [1, 0];
                if(result === -1)
                    result = [0, 1];
                if(result === 0)
                    result = [0, 0];
                
                if(this.trainingSet.length > 0 && this.trainingSet[this.trainingSet.length - 1].timestamp >= timestamp)
                    throw new Error("Should not contain a newer timestamp");

                this.trainingSet.push({input:noNaNValues, output:result, timestamp:timestamp});
            }
            else
                break;
        }

        let lastItem = this.trainingSet[this.trainingSet.length - 1];
        while(this.trainingSet.length > 0 && this.trainingSet[0].timestamp + this.networkOptions.batchTimeframe < lastItem.timestamp){
            this.trainingSet.shift();
        }
    }

    updateNeuralNetwork(){
        if(this.trainingSet.length != 0)
        {
            //console.log("Update NN with " + this.trainingSet.length + " samples");
            var trainer = new Synaptic.Trainer(this.network);
            trainer.train(this.trainingSet.slice(), this.networkOptions);
        }
    }
}