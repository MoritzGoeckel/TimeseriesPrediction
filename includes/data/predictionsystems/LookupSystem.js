module.exports = class{
    constructor(learningPeriod, lookupResolution)
    {
        this.lookupTables = [];
        this.lookupResolution = lookupResolution;

        this.learningPeriod = learningPeriod;
    }

    getName(){
        return "Lookup";
    }

    pushData(indicatorValues, result, timestamp){
        for(let i = 0; i < indicatorValues.length; i++)
        {
            let indicatorValue = indicatorValues[i];
            let usedIndicatorValue = Math.floor(indicatorValue * this.lookupResolution);

            if(this.lookupTables[i] == undefined)
                this.lookupTables[i] = {};

            if(this.lookupTables[i][usedIndicatorValue] == undefined)
                this.lookupTables[i][usedIndicatorValue] = {value:0, lastEntry:timestamp};

            let delta = timestamp - this.lookupTables[i][usedIndicatorValue].lastEntry;
            let wight = delta / this.learningPeriod;

            this.lookupTables[i][usedIndicatorValue].value = (1 - wight) * this.lookupTables[i][usedIndicatorValue].value + wight * result;
            this.lookupTables[i][usedIndicatorValue].lastEntry = timestamp;
        }
    }

    getPrediction(indicatorValues){
        let sum = 0;
        let count = 0;

        for(let i = 0; i < indicatorValues.length && i < this.lookupTables.length; i++)
        {
            let indicatorValue = indicatorValues[i];
            let usedIndicatorValue = Math.floor(indicatorValue * this.lookupResolution);

            //console.log(indicatorValues);
            //console.log(indicatorValue + " => " + usedIndicatorValue);

            if(this.lookupTables[i][usedIndicatorValue] != undefined)
            {
                let result = this.lookupTables[i][usedIndicatorValue].value;

                if(result != null && isNaN(result) == false && isNaN(indicatorValue) == false  && result != Infinity){
                    sum += result;
                    count++;
                }
            }
        }

        return sum / count;
    }
}