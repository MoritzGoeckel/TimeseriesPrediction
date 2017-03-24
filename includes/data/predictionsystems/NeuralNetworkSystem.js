const Synaptic = require('synaptic');

module.exports = class{
    constructor(learningRate, reinforceTimeframe)
    {
        this.maxSeenValue = -100000;
        this.minSeenValue = 100000;

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

    getName(){
        return "Neural";
    }

    pushData(indicatorValues, result, timestamp){

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

        let lastItem = this.trainingSet[this.trainingSet.length - 1];
        while(this.trainingSet.length > 0 && this.trainingSet[0].timestamp + this.networkOptions.batchTimeframe < lastItem.timestamp){
            this.trainingSet.shift();
        }

        if(this.trainingSet.length != 0)
        {
            //console.log("Update NN with " + this.trainingSet.length + " samples");
            var trainer = new Synaptic.Trainer(this.network);
            trainer.train(this.trainingSet.slice(), this.networkOptions);
        }
    }

    getPrediction(value){
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
}