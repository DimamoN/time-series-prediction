'use strict';

let ma = document.getElementById('maChart').getContext('2d');
let wma = document.getElementById('wmaChart').getContext('2d');
let es = document.getElementById('esChart').getContext('2d');

let btnBestFit = document.getElementById('bestFit');

let chartMa, chartWma, chartEs;

// colors
const PURPLE = 'rgb(150, 99, 132)';
const BLUE = 'rgb(99, 99, 132)';

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

function predictedDataSet(dataList) {
    return dataSet("CPU load (%) - predicted", dataList, BLUE);
}

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

const CPU_LOAD_REAL = dataSet("CPU load (%) - real", realValues, PURPLE);

let maData = {
    context: ma,
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
    }
};

let wmaData = {
    prevRate: 0.5,
    prev2Rate: 0.5,
    context: wma,

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
    }
};

let esData = {
    alpha: 0.75,
    context: es,

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
    }
};

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
        setWmaMistake(prevParam);
    }

    {
        // best fit ES
        let minMistake = '99999';
        let alpha = esData.alpha;
        for (let i = 0; i <= 100; ++i) {
            const mistake = averageMistake(realValues, esData.predictList(realValues, i / 100));
            if (parseFloat(mistake) < parseFloat(minMistake)) {
                minMistake = mistake;
                alpha = (i / 100).toFixed(2);
            }
        }
        document.getElementById("esMistake").innerHTML = mistakeText + minMistake;
        esSlider.value = alpha * 100;
        esAlpha.innerHTML = alpha + '';

        //update chart
        esData.alpha = alpha;
        buildChart(esData);
        setEsMistake(alpha);
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
        const prevRate = this.value / 100;
        wmaPrevRate.innerHTML = prevRate;
        wmaPrev2Rate.innerHTML = (1 - prevRate).toFixed(2);
        const cpuLoadWmaPredicted = predictedDataSet(wmaData.predictList(realValues, prevRate));
        chartWma = lineChart(wma, LABELS, [CPU_LOAD_REAL, cpuLoadWmaPredicted]);
        setWmaMistake(prevRate);
    };
}

// ES SLIDER
let esSlider = document.getElementById("esSlider");
let esAlpha = document.getElementById("esAlpha");
{
    // set default values
    esAlpha.innerHTML = '0.5';

    esSlider.oninput = function () {
        const alpha = this.value / 100;
        esAlpha.innerHTML = alpha;
        const cpuLoadEsPredicted = predictedDataSet(esData.predictList(realValues, alpha));
        chartEs = lineChart(es, LABELS, [CPU_LOAD_REAL, cpuLoadEsPredicted]);
        setEsMistake(alpha);
    };
}

chartMa = buildChart(maData);
chartWma = buildChart(wmaData);
chartEs = buildChart(esData);

// set mistakes //
const mistakeText = 'Average mistake = ';

function setWmaMistake(prevRate = wmaData.prevRate) {
    document.getElementById("wmaMistake").innerHTML =
        mistakeText + averageMistake(realValues, wmaData.predictList(realValues, prevRate));
}

function setMaMistake() {
    document.getElementById("maMistake").innerHTML =
        mistakeText + averageMistake(realValues, maData.predictList(realValues));
}

function setEsMistake(alpha = esData.alpha) {
    document.getElementById("esMistake").innerHTML =
        mistakeText + averageMistake(realValues, esData.predictList(realValues, alpha));
}

setMaMistake();
setWmaMistake();
setEsMistake();


