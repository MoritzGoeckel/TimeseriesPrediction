module.exports = class{
    constructor(indicator, attrib){
        this.indicator = indicator;
        this.attrib = attrib;
    }

    nextValue(v){
        let value = this.indicator.nextValue(v);

        if(value != undefined){
            return value[this.attrib];
        }
        else
            return undefined;
    }
}