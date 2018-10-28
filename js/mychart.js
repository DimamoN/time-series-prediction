'use strict';

let ma = document.getElementById('maChart').getContext('2d');
let wma = document.getElementById('wmaChart').getContext('2d');
let es = document.getElementById('esChart').getContext('2d');

let btnBestFit = document.getElementById('bestFit');

btnBestFit.onclick = function() {
    {
        // best fit WMA
        let minMistake = '99999';
        let prevParam = PREV_RATE;
        for (let i = 0; i <= 100; ++i) {
            const mistake = averageMistake(realValues, predictWmaList(realValues, i / 100));
            if (parseFloat(mistake) < parseFloat(minMistake)) {
                minMistake = mistake;
                prevParam = (i / 100).toFixed(2);
            }
        }
        //todo: refactor !!!! OR IT WILL BE PAINFUL TO CONTINUE!
        wmaSliderValue.innerHTML = prevParam + '';
        wmaSliderValue2.innerHTML = (1 - parseFloat(wmaSliderValue.innerHTML)).toFixed(1);
        wmaSlider.value = prevParam * 100;
        // update chart
        const cpuLoadWmaPredicted = predictedDataSet(predictWmaList(realValues, prevParam));
        chartWma = lineChart(wma, LABELS, [cpuLoadReal, cpuLoadWmaPredicted]);
        setWmaMistake(prevParam);
    }

    {
        // best fit ES
        let minMistake = '99999';
        let alpha = ALPHA;
        for (let i = 0; i <= 100; ++i) {
            const mistake = averageMistake(realValues, predictESList(realValues, i / 100));
            if (parseFloat(mistake) < parseFloat(minMistake)) {
                minMistake = mistake;
                alpha = (i / 100).toFixed(2);
            }
        }
        document.getElementById("esMistake").innerHTML = mistakeText + minMistake;
        esSlider.value = alpha * 100;
        esSliderValue.innerHTML = alpha + '';
        //update chart
        const cpuLoadEsPredicted = predictedDataSet(predictESList(realValues, alpha));
        chartEs = lineChart(es, LABELS, [cpuLoadReal, cpuLoadEsPredicted]);
        setEsMistake(alpha);

    }
};

// charts
let chartMa;
let chartWma;
let chartEs;

// WMA SLIDER
let wmaSlider = document.getElementById("wmaSlider");
let wmaSliderValue = document.getElementById("wmaSliderValue");
let wmaSliderValue2 = document.getElementById("wmaSliderValue2");

// set default values
wmaSliderValue.innerHTML = '0.5';
wmaSliderValue2.innerHTML = (1 - parseFloat(wmaSliderValue.innerHTML)).toFixed(1);

wmaSlider.oninput = function() {
    const prevRate = this.value / 100;
    wmaSliderValue.innerHTML = prevRate;
    wmaSliderValue2.innerHTML = (1 - prevRate).toFixed(2);
    const cpuLoadWmaPredicted = predictedDataSet(predictWmaList(realValues, prevRate));
    chartWma = lineChart(wma, LABELS, [cpuLoadReal, cpuLoadWmaPredicted]);
    setWmaMistake(prevRate);
};


// ES SLIDER
let esSlider = document.getElementById("esSlider");
let esSliderValue = document.getElementById("esSliderValue");

// set default values
esSliderValue.innerHTML = '0.5';

esSlider.oninput = function() {
    const alpha = this.value / 100;
    esSliderValue.innerHTML = alpha;
    const cpuLoadEsPredicted = predictedDataSet(predictESList(realValues, alpha));
    chartEs = lineChart(es, LABELS, [cpuLoadReal, cpuLoadEsPredicted]);
    setEsMistake(alpha);
};


// colors
const PURPLE = 'rgb(150, 99, 132)';
const BLUE = 'rgb(99, 99, 132)';


const EXPONENTIAL_DATA_SET = [40, 43, 40, 47, 45, 52, 50, 60, 55, 50, 40, 27, 34, 36, 45];

// todo: make generation, not hard code
const realValues = [40, 43, 40, 47, 45, 52, 50, 60, 55, 50, 40, 27, 34, 36, 45];
const LABELS = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00',
                '15:30', '16:00', '16:30', '17:30'];

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

const cpuLoadReal = dataSet("CPU load (%) - real", realValues, PURPLE);

//////////////////////
/// Moving Average ///
//////////////////////

/**
 * Calculates next predicted element using Moving Average method
 * with period = 2
 * @param prev - previous element
 * @param prev2 - 2x previous element
 * @return predicted value
 */
function predictMa(prev, prev2) {
    return (prev + prev2) / 2;
}

// todo: make interface - predictNext(prevRealList), predictList(prevAllList)
// calc predicted values
function predictMaList(realValues) {
    let predictedValues = [];
    for (let i = 0; i < realValues.length; ++i) {
        if (i === 0) {
            predictedValues[i] = 0;
        }
        else if (i === 1) {
            predictedValues[i] = realValues[i - 1];
        }
        else {
            predictedValues[i] = predictMa(realValues[i - 1], realValues[i - 2]);
        }
    }
    return predictedValues;
}

const cpuLoadMaPredicted = predictedDataSet(predictMaList(realValues));
chartMa = lineChart(ma, LABELS, [cpuLoadReal, cpuLoadMaPredicted]);

///////////////////////////////
/// Weighted Moving Average ///
//////////////////////////////

const PREV_RATE = 0.5;
const PREV2_RATE = 0.25;

// (prevRate + prev2Rate) == 1
function predictWma(prev, prev2, prevRate, prev2Rate) {
    return (prevRate * prev) + (prev2Rate * prev2);
}

function predictWmaList(realValues, prevRate = PREV_RATE) {
    let predictedValues = [];
    for (let i = 0; i < realValues.length; ++i) {
        if (i === 0) {
            predictedValues[i] = 0;
        }
        else if (i === 1) {
            predictedValues[i] = realValues[i - 1];
        }
        else {
            predictedValues[i] = predictWma(
                realValues[i - 1],
                realValues[i - 2],
                prevRate,
                1 - prevRate);
        }
    }
    return predictedValues;
}

const cpuLoadWmaPredicted = predictedDataSet(predictWmaList(realValues));
chartWma = lineChart(wma, LABELS, [cpuLoadReal, cpuLoadWmaPredicted]);

/////////////////////////////
/// Exponential Smoothing ///
/////////////////////////////

const ALPHA = 0.75; // [0..1]

function predictES(prevActual, prevPredicted, alpha) {
    return (alpha * prevActual) + ((1 - alpha) * prevPredicted);
}

function predictESList(realValues, alpha = ALPHA) {
    let predictedValues = [];
    for (let i = 0; i < realValues.length; ++i) {
        if (i === 0) {
            predictedValues[i] = 0;
        }
        else if (i === 1) {
            predictedValues[i] = realValues[i - 1];
        }
        else {
            predictedValues[i] = predictES(realValues[i - 1], predictedValues[i - 1], alpha);
        }
    }
    return predictedValues;
}

const cpuLoadESPredicted = predictedDataSet(predictESList(realValues));
chartEs = lineChart(es, LABELS, [cpuLoadReal, cpuLoadESPredicted]);


///////////////////////////////

// set mistakes
const mistakeText = 'Average mistake = ';

function setWmaMistake(prevRate = PREV_RATE) {
    document.getElementById("wmaMistake").innerHTML =
        mistakeText + averageMistake(realValues, predictWmaList(realValues, prevRate));
}

function setMaMistake() {
    document.getElementById("maMistake").innerHTML =
        mistakeText + averageMistake(realValues, predictMaList(realValues));
}

function setEsMistake(alpha = ALPHA) {
    document.getElementById("esMistake").innerHTML =
        mistakeText + averageMistake(realValues, predictESList(realValues, alpha));
}

setMaMistake();
setWmaMistake();
setEsMistake();

// compare results
console.dir({
    '0) real list' : realValues,
    '1) predicted ma list' : predictMaList(realValues),
    '2) predicted wma list' : predictWmaList(realValues),
    '3) predicted es list' : predictESList(realValues)
});


