const Chart = require('./charts');
const Slider = require('./slider');
const utils = require('./utils');
const createTemplate = utils.createTemplate;
const createCheckbox = utils.createCheckbox;

class Init {
    template = {};
    theme = {
        day: {
            wrap: 'transparent',
            sliderElem: 'slider',
            labelText: 'Switch to Night Mode',
            tooltip: 'tooltip',
            checkboxes: '#000',
            mainColor: '#000',
            subColor: '#fff',
        },
        night: {
            wrap: '#242f3e',
            sliderElem: 'slider-nightTheme',
            labelText: 'Switch to Day Mode',
            tooltip: 'tooltip-nightTheme',
            checkboxes: '#fff',
            mainColor: '#fff',
            subColor: '#222f3f',
        }
    };

    constructor(id, data) {
        this.data = data;

        this.createTemplate(id);
        this.initChart();
        this.initSlider();

        this.template.switcher.addEventListener('change', this.onChangeTheme);
        this.switchTheme.call(this, 'day');

        this.createCheckboxes();
    }

    createTemplate(id) {
        const id1 = `view_${id}`;
        const id2 = `timeLine_${id}`;

        this.template = createTemplate(id1, id2);
        this.id1 = id1;
        this.id2 = id2;

        const {
            wrapBlock,
        } = this.template;

        document.body.appendChild(wrapBlock);
    }

    initChart() {
        const { id1, id2, data } = this;

        const {
            wrap,
            dateElem,
            columnsElem,
            tooltipElem,
            labelText,
        } = this.template;

        const configShortChart = {
            wrap,
            canvas: id1,
            tooltipElem,
            columnsElem,
            dateElem,
            switchLabel: labelText,
        };

        const configLongChart = {
            canvas: id2,
        };

        this.shortChart = new Chart(configShortChart, data, 'short');
        this.longChart = new Chart(configLongChart, data, 'long');
        const { renderChart } = this.shortChart;
        this.renderChart = renderChart;
    }

    initSlider() {
        const { id1, shortChart, longChart, renderChart, data } = this;

        const {
            lineChart,
            sliderElem,
        } = this.template;

        const configSlider = {
            main: id1,
            slider: sliderElem,
            parent: lineChart,
            method: renderChart.bind(shortChart),
            longChart: longChart,
        };

        //init draggable slider
        new Slider(configSlider, data);
    }

    onChangeTheme = ({target}) => {
        const { checked } = target;
        const theme = checked ? 'night' : 'day';
        this.switchTheme(theme);
    };

    switchTheme(mode) {
        const { shortChart, theme } = this;

        const {
            wrap,
            sliderElem,
            tooltipElem,
            checkboxes,
            labelText,
        } = this.template;

        const { renderChart } = this;
        let newTheme = theme[mode];
        let nightTheme = theme.night;

        wrap.style.color = newTheme.mainColor;
        wrap.style.backgroundColor = newTheme.wrap;
        labelText.innerText = newTheme.labelText;
        checkboxes.style.color = newTheme.checkboxes;

        if (mode === 'night') {
            sliderElem.classList.add(nightTheme.sliderElem);
            tooltipElem.classList.add(nightTheme.tooltip);

        } else if (mode === 'day') {
            sliderElem.classList.remove(nightTheme.sliderElem);
            tooltipElem.classList.remove(nightTheme.tooltip);
        }

        renderChart.call(shortChart, {
            theme: theme[mode],
        })
    }

    createCheckboxes = () => {
        const { shortChart, data } = this;

        const {
            checkboxes,
        } = this.template;

        const { renderChart } = this;

        function switchData(data) {
            const changeData = (idx, color, e)=> {
                const { checked } = e.target;
                const parent = e.target.parentNode;
                const customCheckbox = parent.querySelector('.custom-checkbox');

                config[idx].isVisible = checked;
                customCheckbox.style.backgroundColor = checked ? color : 'transparent';
                shortChart.renderChart({
                    isVisible: config,
                });
            };

            const config = [];
            data.columns.map((col, idx) => {
                if (idx === 0) return;
                const fieldName = col[0];
                const color = data.colors[fieldName];
                const name = data.names[fieldName];

                createCheckbox(name, idx, config, changeData, checkboxes, color);
            });
        }

        switchData(data, renderChart.bind(shortChart));
    };
}

function init(chart_data) {
    new Init(1, chart_data[0]);
    new Init(2, chart_data[1]);
    new Init(3, chart_data[2]);
    new Init(4, chart_data[3]);
    new Init(5, chart_data[4]);
}

function getData() {
    const config = {
        apiKey: "AIzaSyCWmc3fEYZMczckv1oa58dm5DKyxKo1mmU",
        authDomain: "charts-17f12.firebaseapp.com",
        databaseURL: "https://charts-17f12.firebaseio.com",
        projectId: "charts-17f12",
        storageBucket: "",
        messagingSenderId: "445889936387"
    };

    firebase.initializeApp(config);

    const database = firebase.database();

    const starCountRef = database.ref('data');
    starCountRef.on('value', function(snapshot) {
        const data = JSON.parse(snapshot.val());
        init(data);
    });
}

getData(init);
