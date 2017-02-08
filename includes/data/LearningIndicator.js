//https://www.npmjs.com/package/technicalindicators

module.exports = class{
    constructor(indicator, learningPeriod, lookupResolution, conditionTimeframe, conditionFunction){
        this.lastRecievedTimestamp = -1;

        this.lookupTable = {};
        this.lookupResolution = lookupResolution;

        this.indicator = indicator;
        this.learningPeriod = learningPeriod;
        this.history = [];
        this.conditionFunction = conditionFunction;
        this.conditionTimeframe = conditionTimeframe;
        this.lastIndicatorValue = undefined;

        this.maxSeenValue = -100000;
        this.minSeenValue = 100000;
    }

    push(entry){
        if(entry.timestamp > this.lastRecievedTimestamp)
        {
            this.lastRecievedTimestamp = entry.timestamp;
            let indicatorValue = this.indicator.nextValue(entry.value);
            this.lastIndicatorValue = indicatorValue;

            if(indicatorValue > this.maxSeenValue)
                this.maxSeenValue = indicatorValue;
            if(indicatorValue < this.minSeenValue)
                this.minSeenValue = indicatorValue;

            this.history.push({timestamp:entry.timestamp, value:entry.value, indicator:indicatorValue})
        }
        else
            throw new Error("We saw newer timestamps already!");
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
                //Resolve 0 with i
                let result = this.conditionFunction(this.history[0], this.history.slice(1, foundIndex + 1)); // result shound be 1 0 -1
                
                if(result != 0 && result != 1 && result != -1)
                    throw new Error("Result should be 0 or 1 or -1");

                let indicatorValue = this.history[0].indicator;
                let stepsize = (this.maxSeenValue - this.minSeenValue) / this.lookupResolution;
                let usedIndicatorValue = Math.floor((indicatorValue - this.minSeenValue) / stepsize);

                console.log(indicatorValue + " => " + usedIndicatorValue);

                if(this.lookupTable[usedIndicatorValue] == undefined)
                    this.lookupTable[usedIndicatorValue] = {value:0, lastEntry:this.history[0].timestamp};

                let delta = this.history[0].timestamp - this.lookupTable[usedIndicatorValue].lastEntry;
                let wight = delta / this.learningPeriod;

                this.lookupTable[usedIndicatorValue].value = (1 - wight) * this.lookupTable[usedIndicatorValue].value + wight * result;
                this.lookupTable[usedIndicatorValue].lastEntry = this.history[0].timestamp;

                this.history.shift();
            }
            else
                break;
        }
    }

    getPrediction(){
        let stepsize = (this.maxSeenValue - this.minSeenValue) / this.lookupResolution;
        let usedIndicatorValue = Math.floor((this.lastIndicatorValue - this.minSeenValue) / stepsize);

        if(this.lookupTable[usedIndicatorValue] != undefined)
            return this.lookupTable[usedIndicatorValue].value;
        else
            return undefined;
    }

    getIndicatorValue()
    {
        return (this.lastIndicatorValue - this.minSeenValue) / (this.maxSeenValue - this.minSeenValue);
    }

    getLookupTable()
    {
        return this.lookupTable;
    }
}