module.exports = class{
    simpleSeries(x){
        return Math.sin(Math.PI*x/10);
    }

    normalSeries(x){
        return this.simpleSeries(x)+Math.sin(Math.PI*x/1)*0.2;
    }

    complexSeries(x){
        return this.normalSeries(x)+Math.sin(Math.PI*x/0.3)*0.05;
    }

    generateSeries(fn, steps, max){
        let output = [];
        for(let i = 0; i < max; i += max / steps)
            output.push({timestamp:i, value:fn(i)});
        
        return output;
    }
}