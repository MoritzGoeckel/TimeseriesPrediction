module.exports = class{
    constructor(predictionSystems, conditionTimeframe, conditionFunction){
        this.predictionSystems = predictionSystems;
        this.conditionTimeframe = conditionTimeframe;
        this.conditionFunction = conditionFunction;
        this.history = [];
    }

    pushData(timestamp, indicatorValues, value){
        this.history.push({timestamp:timestamp, indicators:indicatorValues, value:value});
    }

    getPredictions(indicatorValues){
        let predictions = [];
        for(let i = 0; i < this.predictionSystems.length; i++)
            predictions.push({name:this.predictionSystems[i].getName(), value:this.predictionSystems[i].getPrediction(indicatorValues)});
        
        return predictions;
    }

    getPredictionSystemNames(){
        let names = [];
        for(let i = 0; i < this.predictionSystems.length; i++)
            names.push(this.predictionSystems[i].getName());

        return names;
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

                let result = this.conditionFunction(this.history[0], this.history.slice(1, foundIndex + 1)); // result shound be 1 0 -1
                
                if(result != 0 && result != 1 && result != -1)
                    throw new Error("Result should be 0 or 1 or -1");

                let indicatorValues = this.history[0].indicators;

                for(let i = 0; i < this.predictionSystems.length; i++)
                    this.predictionSystems[i].pushData(indicatorValues, result, this.history[0].timestamp);

                this.history.shift();
            }
            else
                break;
        }
    }
}