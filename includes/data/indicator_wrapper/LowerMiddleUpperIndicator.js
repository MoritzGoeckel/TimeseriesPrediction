module.exports = class{
    constructor(indicator){
        this.indicator = indicator;
    }

    nextValue(v){
        let indicatorValue = this.indicator.nextValue(v);

        if(indicatorValue == undefined)
            return NaN;

        let ratio = (v - indicatorValue.lower) / (indicatorValue.upper - indicatorValue.lower);
        return ratio;
    }
}