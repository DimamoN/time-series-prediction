let ma = document.getElementById('maChart').getContext('2d');
let wma = document.getElementById('wmaChart').getContext('2d');
let es = document.getElementById('esChart').getContext('2d');

// colors
const PURPLE = 'rgb(150, 99, 132)';
const BLUE = 'rgb(99, 99, 132)';

// todo: make generation, not hard code
const realValues = [40, 45, 50, 59, 67, 71, 70, 64, 60, 56, 50];
const LABELS = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00'];

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
let chartMa = lineChart(ma, LABELS, [cpuLoadReal, cpuLoadMaPredicted]);

///////////////////////////////
/// Weighted Moving Average ///
//////////////////////////////

const PREV_RATE = 0.75;
const PREV2_RATE = 0.25;

// (prevRate + prev2Rate) == 1
function predictWma(prev, prev2, prevRate, prev2Rate) {
    return (prevRate * prev) + (prev2Rate * prev2);
}

function predictWmaList(realValues) {
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
                PREV_RATE,
                PREV2_RATE);
        }
    }
    return predictedValues;
}

const cpuLoadWmaPredicted = predictedDataSet(predictWmaList(realValues));
let chartWma = lineChart(wma, LABELS, [cpuLoadReal, cpuLoadWmaPredicted]);

/////////////////////////////
/// Exponential Smoothing ///
/////////////////////////////

const ALPHA = 0.8; // [0..1]

function predictES(prevActual, prevPredicted, alpha) {
    return (alpha * prevActual) + ((1 - alpha) * prevPredicted);
}

function predictESList(realValues) {
    let predictedValues = [];
    for (let i = 0; i < realValues.length; ++i) {
        if (i === 0) {
            predictedValues[i] = 0;
        }
        else if (i === 1) {
            predictedValues[i] = realValues[i - 1];
        }
        else {
            predictedValues[i] = predictES(realValues[i - 1], predictedValues[i - 1], ALPHA);
        }
    }
    return predictedValues;
}

const cpuLoadESPredicted = predictedDataSet(predictESList(realValues));
let chartEs = lineChart(es, LABELS, [cpuLoadReal, cpuLoadESPredicted]);


///////////////////////////////

// set mistakes
const mistakeText = 'Average mistake = ';
document.getElementById("maMistake").innerHTML = mistakeText + averageMistake(realValues, predictMaList(realValues));
document.getElementById("wmaMistake").innerHTML = mistakeText + averageMistake(realValues, predictWmaList(realValues));
document.getElementById("esMistake").innerHTML = mistakeText + averageMistake(realValues, predictESList(realValues));

// compare results
console.dir({
    '0) real list' : realValues,
    '1) predicted ma list' : predictMaList(realValues),
    '2) predicted wma list' : predictWmaList(realValues),
    '3) predicted es list' : predictESList(realValues)
});


