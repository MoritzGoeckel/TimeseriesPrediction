//https://www.npmjs.com/package/technicalindicators

module.exports = class{
    constructor(indicator, name){
        this.lastRecievedTimestamp = -1;

        this.indicator = indicator;

        if(this.indicator == undefined)
            throw new Error("Indicator undefined");

        this.lastIndicatorValue = undefined;

        this.name = name;

        if(this.name == undefined)
            throw new Error("Name undefined");

        this.maxSeenValue = -9999999;
        this.minSeenValue = 999999;
    }

    pushTick(entry){
        if(entry.timestamp > this.lastRecievedTimestamp)
        {
            this.lastRecievedTimestamp = entry.timestamp;
            let indicatorValue = this.indicator.nextValue(entry.value);
            this.lastIndicatorValue = indicatorValue;

            if(indicatorValue > this.maxSeenValue)
                this.maxSeenValue = indicatorValue;
                
            if(indicatorValue < this.minSeenValue)
                this.minSeenValue = indicatorValue;
        }
        else
            throw new Error("We saw newer timestamps already!");
    }

    getIndicatorValue()
    {
        return {value:(this.lastIndicatorValue - this.minSeenValue) / (this.maxSeenValue - this.minSeenValue), timestamp:this.lastRecievedTimestamp};
    }
}