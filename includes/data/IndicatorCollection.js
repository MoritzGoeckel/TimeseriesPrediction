module.exports = class{
    constructor(resolver, indicators){
        this.indicators = indicators;
        this.currentValues = [];

        this.resolver = resolver;
    }

    addIndicator(indicator){
        this.indicators.push(indicator);
    }

    pushTick(entry){
        this.lastEntry = entry;

        this.currentValues = [];

        for(let a = 0; a < this.indicators.length; a++){
            this.indicators[a].pushTick(entry);
            this.currentValues.push(this.indicators[a].getIndicatorValue().value);
        }

        this.resolver.pushData(entry.timestamp, this.currentValues.slice(), entry.value);
    }

    getValues(){
        return this.currentValues;
    }

    getLastEntry(){
        return this.lastEntry;
    }

    resolve(){
        this.resolver.resolve();
    }

    getPredictions(){
        return this.resolver.getPredictions(this.currentValues);
    }

    getPredictionSystemNames(){
        return this.resolver.getPredictionSystemNames();
    }
}