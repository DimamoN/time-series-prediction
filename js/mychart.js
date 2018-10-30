'use strict';

let btnBestFit = document.getElementById('bestFit');
let chartMa, chartWma, chartEs, chartDes;

const PURPLE = 'rgb(150, 99, 132)';
const BLUE = 'rgb(99, 99, 132)';
const MISTAKE_TEXT = 'Average mistake = ';

// todo: make generation, not hard code
const EXPONENTIAL_DATA_SET = [40, 43, 40, 47, 45, 52, 50, 60, 55, 50, 40, 27, 34, 36, 45];
const realValues = [40, 43, 40, 47, 45, 52, 50, 60, 55, 50, 40, 27, 34, 36, 45];
const LABELS = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00',
    '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:30'];

/**
 * Creates dataSet
 * @param name the value to display
 * @param color in 'rgb(x,y,z)' format
 * @param dataList - sequence of chart values
 * @return dataSet
 */
function dataSet(name, dataList, color = BLUE) {
    return {
        label: name,
        backgroundColor: color,
        borderColor: color,
        data: dataList,
        fill: false,
    };
}

const CPU_LOAD_REAL = dataSet("CPU load (%) - real", realValues, PURPLE);

let predictedDataSet = (dataList) => dataSet("CPU load (%) - predicted", dataList, BLUE);

/**
 * Creates line chart
 * @param ctx 2d context
 * @param labels - labels list
 * @param _dataSets - dataSets list
 * @return dataSet
 */
function lineChart(ctx, labels, _dataSets) {
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: _dataSets
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                }]
            },
            animation: {
                duration: 0
            }
        }
    });
}

function averageMistake(realList, predictedList) {
    if (realList.length !== predictedList.length) {
        throw 'real and predicted lists must be the same length';
    }
    let allMistake = 0;
    for (let i = 0; i < realList.length; i++) {
        allMistake += Math.abs(realList[i] - predictedList[i]);
    }
    return (allMistake / realList.length).toFixed(2);
}

let maData = {
    context: document.getElementById('maChart').getContext('2d'),
    /**
     * Calculates next predicted element using Moving Average method
     * with period = 2
     * @param prev - previous element
     * @param prev2 - 2x previous element
     * @return predicted value
     */
    predict: function (prev, prev2) {
        return (prev + prev2) / 2;
    },
    predictList: function (realValues) {
        let predictedValues = [];
        for (let i = 0; i < realValues.length; ++i) {
            if (i === 0) {
                predictedValues[i] = 0;
            }
            else if (i === 1) {
                predictedValues[i] = realValues[i - 1];
            }
            else {
                predictedValues[i] = this.predict(realValues[i - 1], realValues[i - 2]);
            }
        }
        return predictedValues;
    },
    
    // view
    setMistake: function () {
        document.getElementById("maMistake").innerHTML =
            MISTAKE_TEXT + averageMistake(realValues, maData.predictList(realValues));
    }
};

let wmaData = {
    prevRate: 0.5,
    prev2Rate: 0.5,
    context: document.getElementById('wmaChart').getContext('2d'),

    predict: function (prev, prev2, prevRate, prev2Rate) {
        return (prevRate * prev) + (prev2Rate * prev2);
    },
    predictList: function (realValues, prevRate = this.prevRate) {
        let predictedValues = [];
        for (let i = 0; i < realValues.length; ++i) {
            if (i === 0) {
                predictedValues[i] = 0;
            }
            else if (i === 1) {
                predictedValues[i] = realValues[i - 1];
            }
            else {
                predictedValues[i] = this.predict(
                    realValues[i - 1],
                    realValues[i - 2],
                    prevRate,
                    1 - prevRate);
            }
        }
        return predictedValues;
    },

    // view
    setMistake: function() {
        document.getElementById("wmaMistake").innerHTML =
            MISTAKE_TEXT + averageMistake(realValues, wmaData.predictList(realValues, this.prevRate));
    }
};

let esData = {
    alpha: 0.75,
    context: document.getElementById('esChart').getContext('2d'),

    predict: function (prevActual, prevPredicted, alpha) {
        return (alpha * prevActual) + ((1 - alpha) * prevPredicted);
    },
    predictList: function (realValues, alpha = this.alpha) {
        let predictedValues = [];
        for (let i = 0; i < realValues.length; ++i) {
            if (i === 0) {
                predictedValues[i] = 0;
            }
            else if (i === 1) {
                predictedValues[i] = realValues[i - 1];
            }
            else {
                predictedValues[i] = this.predict(realValues[i - 1], predictedValues[i - 1], alpha);
            }
        }
        return predictedValues;
    },

    // view
    setMistake: function () {
        document.getElementById("esMistake").innerHTML =
            MISTAKE_TEXT + averageMistake(realValues, esData.predictList(realValues, this.alpha));
    }
};

let desData = {
    alpha: 0.75,
    beta: 0.5,

    context: document.getElementById('desChart').getContext('2d'),

    predict: function (level, trend) {
        return level + trend;
    },

    calcLevel : (realValue, prevLevel, prevTrend, alpha = this.alpha) => {
        return alpha * (realValue) + (1 - alpha) * (prevLevel + prevTrend);
    },

    calcTrend : (level, prevLevel, prevTrend, beta = this.beta) => {
        return beta * (level - prevLevel) + (1 - beta) * prevTrend;
    },

    predictList: function (realValues, alpha = this.alpha, beta = this.beta) {

        let predictedValues = [];
        let levels = [];
        let trends = [];

        for (let i = 0; i < realValues.length; ++i) {

            const calc = () => {
                levels[i] = this.calcLevel(realValues[i - 1], levels[i - 1], trends[i - 1], alpha);
                trends[i] = this.calcTrend(levels[i], levels[i - 1], trends[i - 1], beta);
            };

            if (i === 0) {
                predictedValues[i] = 0;
                levels[i] = 0;
                trends[i] = 0;
            }
            else if (i === 1) {
                predictedValues[i] = realValues[i - 1];
                calc();
            }
            else {
                calc();
                predictedValues[i] = this.predict(levels[i - 1], trends[i - 1]);
            }
        }
        return predictedValues;
    },

    // view
    setMistake: function () {
        document.getElementById("desMistake").innerHTML =
            MISTAKE_TEXT + averageMistake(realValues, this.predictList(realValues, this.alpha));
    }
};

let charts = [maData, wmaData, esData, desData];

function buildChart(chartData) {
    const cpuLoadPredicted = predictedDataSet(chartData.predictList(realValues));
    return lineChart(chartData.context, LABELS, [CPU_LOAD_REAL, cpuLoadPredicted]);
}

btnBestFit.onclick = function () {
    {
        // best fit WMA
        let minMistake = '99999';
        let prevParam = wmaData.prevRate;
        for (let i = 0; i <= 100; ++i) {
            const mistake = averageMistake(realValues, wmaData.predictList(realValues, i / 100));
            if (parseFloat(mistake) < parseFloat(minMistake)) {
                minMistake = mistake;
                prevParam = (i / 100).toFixed(2);
            }
        }

        //todo: refactor !!!! OR IT WILL BE PAINFUL TO CONTINUE!
        wmaPrevRate.innerHTML = prevParam + '';
        wmaPrev2Rate.innerHTML = (1 - parseFloat(wmaPrevRate.innerHTML)).toFixed(1);
        wmaSlider.value = prevParam * 100;

        // update chart
        wmaData.prevRate = prevParam;
        buildChart(wmaData);
        wmaData.setMistake();
    }

    {
        // best fit ES
        let minMistake = '99999';
        let alpha = esData.alpha;
        for (let a = 0; a <= 100; ++a) {
            const mistake = averageMistake(realValues, esData.predictList(realValues, a / 100));
            if (parseFloat(mistake) < parseFloat(minMistake)) {
                minMistake = mistake;
                alpha = (a / 100).toFixed(2);
            }
        }
        document.getElementById("esMistake").innerHTML = MISTAKE_TEXT + minMistake;
        esSlider.value = alpha * 100;
        esAlpha.innerHTML = alpha + '';

        //update chart
        esData.alpha = alpha;
        buildChart(esData);
        esData.setMistake();
    }

    {
        // best fit DES
        let minMistake = '99999';
        let alpha = desData.alpha;
        let beta = desData.beta;

        for (let a = 0; a <= 100; ++a) {
            for (let b = 0; b <= 100; ++b) {
                const mistake = averageMistake(realValues, desData.predictList(realValues, a / 100, b / 100));

                if (parseFloat(mistake) < parseFloat(minMistake)) {
                    minMistake = mistake;
                    alpha = (a / 100).toFixed(2);
                    beta = (b / 100).toFixed(2);
                }
            }
        }

        document.getElementById("desMistake").innerHTML = MISTAKE_TEXT + minMistake;
        desSliderA.value = alpha * 100;
        desSliderB.value = beta * 100;
        desAlpha.innerHTML = alpha + '';
        desBeta.innerHTML = beta + '';

        //update chart
        desData.alpha = alpha;
        desData.beta = beta;
        buildChart(desData);
        desData.setMistake();
    }

};

// WMA SLIDER
let wmaSlider = document.getElementById("wmaSlider");
let wmaPrevRate = document.getElementById("wmaPrevRate");
let wmaPrev2Rate = document.getElementById("wmaPrev2Rate");
{
    // set default values
    wmaPrevRate.innerHTML = '0.5';
    wmaPrev2Rate.innerHTML = (1 - parseFloat(wmaPrevRate.innerHTML)).toFixed(1);

    wmaSlider.oninput = function () {
        wmaData.prevRate = this.value / 100;
        wmaPrev2Rate.innerHTML = (1 - wmaData.prevRate).toFixed(2);
        buildChart(wmaData);
        wmaData.setMistake();
    };
}

// ES SLIDER
let esSlider = document.getElementById("esSlider");
let esAlpha = document.getElementById("esAlpha");
{
    // set default values
    esAlpha.innerHTML = '0.5';

    esSlider.oninput = function () {
        esData.alpha = this.value / 100;
        esAlpha.innerHTML = esData.alpha;
        buildChart(esData);
        esData.setMistake();
    };
}

// DES SLIDER
let desSliderA = document.getElementById("desSliderAlpha");
let desSliderB = document.getElementById("desSliderBeta");
let desAlpha = document.getElementById("desAlpha");
let desBeta = document.getElementById("desBeta");
{
    // set default values
    desAlpha.innerHTML = '0.75';
    desBeta.innerHTML = '0.5';

    desSliderA.oninput = function () {
        desData.alpha = this.value / 100;
        desAlpha.innerHTML = desData.alpha;
        buildChart(desData);
        desData.setMistake();
    };

    desSliderB.oninput = function () {
        desData.beta = this.value / 100;
        desBeta.innerHTML = desData.beta;
        buildChart(desData);
        desData.setMistake();
    };
}

// view //
chartMa = buildChart(maData);
chartWma = buildChart(wmaData);
chartEs = buildChart(esData);
chartDes = buildChart(desData);
charts.forEach(c => c.setMistake());


