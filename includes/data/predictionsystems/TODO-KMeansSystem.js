const ml = require('machine_learning');

/*

var ml = require('machine_learning');
 
var data = [[1,0,1,0,1,1,1,0,0,0,0,0,1,0],
            [1,1,1,1,1,1,1,0,0,0,0,0,1,0],
            [1,1,1,0,1,1,1,0,1,0,0,0,1,0],
            [1,0,1,1,1,1,1,1,0,0,0,0,1,0],
            [1,1,1,1,1,1,1,0,0,0,0,0,1,1],
            [0,0,1,0,0,1,0,0,1,0,1,1,1,0],
            [0,0,0,0,0,0,1,1,1,0,1,1,1,0],
            [0,0,0,0,0,1,1,1,0,1,0,1,1,0],
            [0,0,1,0,1,0,1,1,1,1,0,1,1,1],
            [0,0,0,0,0,0,1,1,1,1,1,1,1,1],
            [1,0,1,0,0,1,1,1,1,1,0,0,1,0]
           ];
 
var result = ml.kmeans.cluster({
    data : data,
    k : 4,
    epochs: 100,
 
    distance : {type : "pearson"}
    // default : {type : 'euclidean'} 
    // {type : 'pearson'} 
    // Or you can use your own distance function 
    // distance : function(vecx, vecy) {return Math.abs(dot(vecx,vecy));} 
});
 
console.log("clusters : ", result.clusters);
console.log("means : ", result.means);

*/

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

                    let out = [0, 0];
                    if(this.trainingData[i].output == -1)
                        out = [0, 1];
                    if(this.trainingData[i].output == 1)
                        out = [1, 0];

                    outputs.push(out);
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
            

            this.classifier = new ml.LogisticRegression({
                'input' : inputs,
                'label' : outputs,
                'n_in' : inputs[0].length,
                'n_out' : 2
            });
            this.classifier.set('log level',1)
            this.classifier.train({
                'lr' : 0.8,
                'epochs' : 300
            });
        }
    }

    getPrediction(indicatorValues){
        if(this.classifier != undefined){
            let result = this.classifier.predict([getNoNaN(indicatorValues)]);
            console.log(result);
            //if(result[0][2] == 1)
            //    return 0;
            //else
            return result[0][0] - result[0][1];
        }
        else
            return NaN;
    }
}