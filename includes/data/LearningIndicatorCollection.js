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

        this.history.push({timestamp:entry.timestamp, value:entry.value, indicators:this.currentValues})
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

    initNeuralNetwork(conditionTimeframe, conditionFunction){
        this.conditionTimeframe = conditionTimeframe;
        this.conditionFunction = conditionFunction;
        this.networkOptions = {
                rate: .1,
                iterations: 3,
                //error: .005,
                shuffle: true,
                //log: 1000,
                cost: Synaptic.Trainer.cost.CROSS_ENTROPY,
                batchSize: 100
            };
        
        this.trainingSet = [];        

        //var exported = myNetwork.toJSON();
        //var imported = Network.fromJSON(exported);
        this.network = new Synaptic.Architect.Perceptron(this.lis.length, this.lis.length, 1);
    }

    getNeuralNetworkPrediction(){
        return {timestamp:this.lastTimestamp, value:this.network.activate(this.currentValues)[0]};
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

                let usedIndicatorValues = this.history[0].indicators.splice(0, this.history[0].indicators.length);
                this.history.shift();

                //Train
                for(let i in usedIndicatorValues)
                {
                    if(isNaN(usedIndicatorValues[i]))
                        usedIndicatorValues[i] = 0.5;
                    if(isFinite(usedIndicatorValues[i]) == false)
                        usedIndicatorValues[i] = 0.5; //Standart values
                }

                this.trainingSet.push({input:usedIndicatorValues, output:[result]});
            }
            else
                break;
        }


        while(this.trainingSet.length > this.networkOptions.batchSize)
            this.trainingSet.shift();

        if(this.trainingSet.length != 0)
        {
            var trainer = new Synaptic.Trainer(this.network);
            trainer.train(this.trainingSet, this.networkOptions);
        }
    }
}