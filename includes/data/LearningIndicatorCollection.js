module.exports = class{
    constructor(){
        this.lis = [];
        this.lastTimestamp = undefined;
        this.currentValues = [];
        this.currentPredictions = []; //Not used
        this.currentAvgPrediction = undefined;
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

    resolveNN(){
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
}