const ml = require('machine_learning');

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
        return "ALT_SVM";
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

                if(this.trainingData[i].output == 0 && false) //negativesCount < positivesCount
                {
                    negativesCount++;
                    addTheData();
                }
            }

            console.log("Training ALT_SVM with " + inputs.length + " samples: " + negativesCount + "n + " + positivesCount + "p");
            

            this.classifier = new ml.SVM({
                x : inputs,
                y : outputs
            });
            this.classifier.train({
                C : 1.0, // default : 1.0. C in SVM. 
                tol : 1e-4, // default : 1e-4. Higher tolerance --> Higher precision 
                max_passes : 1, // default : 20. Higher max_passes --> Higher precision 
                alpha_tol : 1e-5, // default : 1e-5. Higher alpha_tolerance --> Higher precision 
            
                kernel : { type: "polynomial", c: 1, d: 5}
                // default : {type : "gaussian", sigma : 1.0} 
                // {type : "gaussian", sigma : 0.5} 
                // {type : "linear"} // x*y 
                // {type : "polynomial", c : 1, d : 8} // (x*y + c)^d 
                // Or you can use your own kernel. 
                // kernel : function(vecx,vecy) { return dot(vecx,vecy);} 
            });
        }
    }

    getPrediction(indicatorValues){
        if(this.classifier != undefined){
            let result = this.classifier.predict(getNoNaN(indicatorValues));
            console.log(result);
            return result[0];
        }
        else
            return NaN;
    }
}