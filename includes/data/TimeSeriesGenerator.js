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

    generateSeries(fn, steps, maxTime){
        let output = [];
        for(let i = 0; i < maxTime; i += maxTime / steps)
            output.push({timestamp:i, value:fn(i)});
        
        return output;
    }

    generateCorrleatedSeries(originalSeries, count, callback){
        let series = [];
        let functions = [];

        for(let i = 0; i < count; i++){
            series.push([]);
        }

        for(let i = 0; i < series.length; i++)
        {
            let randomIndex = Math.floor(Math.random() * i);
            let randomCoefficient = (Math.random() * 10) - 5;
            let randomOffset = (Math.random() * 300) - 150;
            let randomNoise = Math.random() * 20 + 100;

            let direction = Math.random() * 10 - 5;

            functions.push(function(series, newestIndex){
                if(series[randomIndex].length >= newestIndex)
                    return series[randomIndex][newestIndex].value * randomCoefficient + randomOffset + ((Math.random() * randomNoise) - (randomNoise / 2)) + direction * newestIndex;
                else
                    throw new Error("Dependency not yet calculated");
            });      
        }

        for(let time = 0; time < originalSeries.length; time++)
            for(let i = 0; i < series.length; i++)
            {
                if(i == 0)
                    series[0].push({timestamp:time, value:originalSeries[time].value});
                else{
                    series[i].push({timestmap:time, value:functions[i](series, time)});
                }
            }

        callback(series);
    }
}