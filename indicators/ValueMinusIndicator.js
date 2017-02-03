module.exports = class{
    constructor(indicator){
        this.indicator = indicator;
    }

    nextValue(v){
        return v - this.indicator.nextValue(v);
    }
}