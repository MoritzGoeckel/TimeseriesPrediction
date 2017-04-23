const svm = require("svm");

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
        return "SVM";
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

            console.log("Training SVM with " + inputs.length + " samples: " + negativesCount + "n + " + positivesCount + "p");
            this.SVM = new svm.SVM();
            this.SVM.train(inputs, outputs, { kernel: svm.linearKernel, numpasses: 1, maxiter: 10000 / 100, C: 1e-2}); //, { kernel: 'rbf', rbfsigma: 0.3, C: 10 } //tol: 1e-5, alphatol: 1e-5
        }
    }

    getPrediction(indicatorValues){
        if(this.SVM != undefined)
            return this.SVM.predict(getNoNaN(indicatorValues));
        else
            return NaN;
    }
}