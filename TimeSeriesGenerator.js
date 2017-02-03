module.exports = class{
    constructor()
    {
        let simpleSeries = function(x){
            return Math.sin(Math.PI*x/10);
        };
        this.simpleSeries = simpleSeries;

        let normalSeries = function(x){
            return simpleSeries(x) + Math.sin(Math.PI*x/1)*0.2;
        };
        this.normalSeries = normalSeries;

        let complexSeries = function(x){
            return normalSeries(x) + Math.sin(Math.PI*x/0.3)*0.05;
        };
        this.complexSeries = complexSeries;

        let normalSeriesBias = function(x){
            return simpleSeries(x) + Math.sin(Math.PI*x/1)*0.2 + x/5;
        };
        this.normalSeriesBias = normalSeriesBias;
    }

    generateSeries(fn, steps, max){
        let output = [];
        for(let i = 0; i < max; i += max / steps)
            output.push({timestamp:i, value:fn(i)});
        
        return output;
    }
}