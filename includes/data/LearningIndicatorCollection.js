const Synaptic = require('synaptic'); // this line is not needed in the browser

module.exports = class{
    constructor(){
        this.lis = [];
        this.lastTimestamp = undefined;
        this.currentValues = [];
        this.currentPredictions = []; //Not used
        this.currentAvgPrediction = undefined;

        this.history = [];
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

        this.history.push({timestamp:entry.timestamp, value:entry.value, indicators:this.currentValues.slice(0, this.currentValues.length)})
        this.currentAvgPrediction = predictionSum / this.lis.length;
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

    initNeuralNetwork(conditionTimeframe, conditionFunction, learningRate, reinforceTimeframe){
        this.conditionTimeframe = conditionTimeframe;
        this.conditionFunction = conditionFunction;

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
        this.network = new Synaptic.Architect.Perceptron(this.lis.length, this.lis.length, 2);
    }

    getNeuralNetworkPrediction(){
        let result = this.network.activate(this.currentValues);
        return {timestamp:this.lastTimestamp, value:result[0] - result[1], raw:result};
    }

    updateNeuralNetwork(){

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
                //Resolve 0 with i
                let result = this.conditionFunction(this.history[0], this.history.slice(1, foundIndex + 1)); // result shound be 1 0 -1
                
                if(result != 0 && result != 1 && result != -1)
                    throw new Error("Result should be 0 or 1 or -1");

                let timestamp = this.history[0].timestamp;
                //Todo: Splice is not copy!!!!
                let usedIndicatorValues = this.history[0].indicators.slice();
                this.history.shift();

                //Train
                for(let i in usedIndicatorValues)
                {
                    if(isNaN(usedIndicatorValues[i]))
                        usedIndicatorValues[i] = 0.5;
                    if(isFinite(usedIndicatorValues[i]) == false)
                        usedIndicatorValues[i] = 0.5; //Standart values
                }

                if(result === 1)
                    result = [1, 0];
                if(result === -1)
                    result = [0, 1];
                if(result === 0)
                    result = [0, 0];
                
                if(this.trainingSet.length > 0 && this.trainingSet[this.trainingSet.length - 1].timestamp >= timestamp)
                    throw new Error("Should not contain a newer timestamp");

                this.trainingSet.push({input:usedIndicatorValues, output:result, timestamp:timestamp});
            }
            else
                break;
        }

        let lastItem = this.trainingSet[this.trainingSet.length - 1];
        while(this.trainingSet.length > 0 && this.trainingSet[0].timestamp + this.networkOptions.batchTimeframe < lastItem.timestamp){
            this.trainingSet.shift();
        }

        if(this.trainingSet.length != 0)
        {
            //console.log("Update NN with " + this.trainingSet.length + " samples");
            var trainer = new Synaptic.Trainer(this.network);
            trainer.train(this.trainingSet.slice(0, this.trainingSet.length), this.networkOptions);
        }
    }
}