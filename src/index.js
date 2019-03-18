const Chart = require('./charts');
const Thumb = require('./thumb');

const chart_data = require('./chart_data');
const data = chart_data[1];

const shortChart = new Chart('view', data);
const longChart = new Chart('timeLine', data);

const configThumb = {
    thumb: '.thumb',
    parent: '.lineChart',
    method: shortChart.drawShort.bind(shortChart, data),
    longChart: longChart,
};

const thumb = new Thumb(configThumb, data);

function drawCharts(data) {
    shortChart.drawShort(data,0);
    longChart.drawLong(data,0);
}

drawCharts(data);

const switcher = document.querySelector('.swither');
const thumb = document.querySelector('.thumb');
const swithLabel = document.querySelector('.swithLabel');
const labelText = swithLabel.querySelector('span');
switcher.addEventListener('change', onChange);

function onChange({target}) {
    const { checked } = target;
    changeTheme(checked);
}
function changeTheme(checked) {
    if (checked) {
        document.body.style.backgroundColor = '#242f3e';
        thumb.classList.toggle('thumb-nightTheme');
        labelText.innerText = 'Switch to Day mode';
        labelText.style.color = '#35a8f1'
    } else {
        document.body.style.backgroundColor = 'transparent';
        thumb.classList.toggle('thumb-nightTheme');
        labelText.innerText = 'Switch to Night mode'
        labelText.style.color = '#000'
    }
}

changeTheme(true);