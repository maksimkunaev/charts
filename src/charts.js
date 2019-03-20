const utils = require('./utils');
const hexToRgb = utils.hexToRgb;
const getTooltipInfo = utils.getTooltipInfo;
const formatDate = utils.formatDate;

class Chart {
    canvas = null;

    canvasConfig = {
        width: 600,
        height: 500,
        ref: null,
    };

    chartConfig = {
        screenWidth: null,
        columns: [],
        xPositions: [],
        x0: 30,
        y0: 30,
        stepX: 10,
        stepY: 10,
        countX: 0,
        countY: 0,
        data: [],
        dates: [],
        view: '',
        position: '',
        datesPerLine: 8,
        tooltipInfo: {},
        isVisible: [],
    };

    constructor(ref, data) {
        this.canvas = document.getElementById(ref);

        this.ctx = this.canvas.getContext("2d");

        this.chartConfig.data = data;
        this.canvasConfig.ref = ref;
        this.setScreenOptions();
        this.canvas.addEventListener('click', this.onCanvasClick.bind(this));
    }

    setConfig(data, startDate, endDate, view) {
        const { columns, colors } = data;

        const { width, height } = this.canvasConfig;
        const { isVisible } = this.chartConfig;
        let maxX = 0;
        let maxY = 0;
        this.chartConfig.view = view;

        this.chartConfig.columns = [];


        let newColumns = columns.slice();

        //switch on and off different graphics
        if (isVisible.length > 1) {
            isVisible.forEach((item, index) => {
                const newIndex = isVisible.length - index - 1;

                if (isVisible[newIndex].isVisible === false) {
                    if (newColumns.length > 2) {
                        newColumns.splice(newIndex + 1, 1);
                    }
                }
            })
        };

        newColumns.forEach((column, idx) => {
            if (idx === 0) return;//newColumns[0] is X columns, do not process

            const start = startDate ? startDate : -11;
            const end = endDate ? endDate + 1: column.length;

            if (!endDate || end >= column.length) {
                this.chartConfig.position = 'rightSide';
            } else {
                this.chartConfig.position = '??????';
            }

            let data = [];

            switch(view) {
                case 'short':
                data = column.slice(start, end);
                    break;

                case 'long':
                data = column.slice(1);
                    break;

                default:
                    data = column.slice(1);
                    break;
            }

            // set stepY
            maxY = Math.max(...data.slice(1)) > maxY ? Math.max(...data.slice(1)) : maxY;

            // set stepX
            maxX = data.length - 1;

            const name = column[0];
            const color = colors[name];
            const newColumn = {
                start,
                end,
                name,
                data,
                color,
            };
            this.chartConfig.columns.push(newColumn);

            //set array of dates for X coordinate
            if (idx !== 1) return; //only for one column is enough
            this.chartConfig.dates = this.chartConfig.data.columns[0].slice(start, end).map(ms => {
                return formatDate(new Date(ms))
            });
        });

        this.chartConfig.countX = maxX;
        this.chartConfig.countY = maxY;

        this.chartConfig.stepY = height/ maxY;
        this.chartConfig.stepX = endDate ? (width * 1.1) / maxX : width / maxX ;
    }

    drawShort(data, startDate, endDate) {
        this.setConfig(data, startDate, endDate, 'short');
        this.clearChart();
        this.drawChart();
        this.drawHorizontalLines();
        this.drawDates();
    }

    drawLong(data, startDate, endDate) {
        this.setConfig(data, startDate, endDate, 'long');
        this.drawChart()
    }

    drawChart() {
        const { height } = this.canvasConfig;
        const { y0, stepX, stepY, columns, view, position, dates } = this.chartConfig;

        const { ctx } = this;
        const draw = (column, index) => {
            ctx.beginPath();

            const { data, color } = column;
            data.forEach((point, idx) => {
                let x = position === 'rightSide' ? idx * stepX : idx * stepX - stepX/2;
                let y = y0 + (height - y0 - point * stepY);

                if (idx === 0)
                    ctx.moveTo(x, y);
                else
                    ctx.lineTo(x, y);

                //remember xPosition for every point
                if (view === 'short' && index === 0) {
                    this.chartConfig.xPositions.push({
                        date: dates[idx].short,
                        xPosition: x,
                    });
                }
            });

            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
        };

        columns.forEach(draw);
    }

    switchData(isVisible) {
        this.chartConfig.isVisible = isVisible;
        this.drawShort(this.chartConfig.data, this.chartConfig.columns[0].start,  --this.chartConfig.columns[0].end);//TODO fix
    }

    drawHorizontalLines() {
        const { countY } = this.chartConfig;
        const linesCount = 5;
        const step = Math.ceil( countY / linesCount);
        const { width, height } = this.canvasConfig;
        const { stepY, y0 } = this.chartConfig;
        //initialize horizontal lines array
        let lines = new Array(linesCount).fill(step);

        //set lines array
        lines.map( (step, idx) => {
            lines[idx] = step * idx
        });

        lines.forEach(lineStep => {
            const yPosition = y0 + (height - stepY * lineStep - y0);
            const text = String(Math.round(lineStep));

            this.drawLine(0, yPosition, width, yPosition, '#9aa6ae');
            this.drawText(text, 3, yPosition - 10);
        });
    }

    drawLine(x0, y0, x, y, color = '#9aa6ae', width = 1) {
        const { ctx } = this;

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.moveTo(x0, y0);
        ctx.lineTo(x, y);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
    }

    drawText(text, x, y, color = '#9aa6ae', width = 1) {
        const { ctx } = this;
        const { font } = this.chartConfig;

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.font = font;
        ctx.fillText(text, x, y);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
    }

    drawDates() {
        const { xPositions, datesPerLine, font  } = this.chartConfig;
        const { height } = this.canvas;

        let textSpace = Math.round(xPositions.length / datesPerLine);
        const datesPositions = xPositions.filter((i,idx)=>{
            return !(idx % textSpace);
        });

        datesPositions.forEach(position => {
            const color = '#9da8af';
            this.drawText(position.date, position.xPosition, height, color);
        });
    }

    clearChart() {
        this.ctx.clearRect(0, 0, this.canvas.width, this. canvas.height);
        this.chartConfig.xPositions = [];
    }

    setScreenOptions() {
        this.chartConfig.screenWidth = screen.width;
        this.chartConfig.isMobile = screen.width <= 520;
        const { isMobile } = this.chartConfig;
        this.chartConfig.font = isMobile ? "300 25px sans-serif" : "100 20px sans-serif";
        this.chartConfig.datesPerLine = isMobile ? 6 : 8;

        this.canvasConfig = {
            width: isMobile ? 600 : 1800,
            height: isMobile ? 500 : 500,
        };

        this.canvas.width = this.canvasConfig.width;
        this.canvas.height = this.canvasConfig.height + 30;
        document.addEventListener('resize', this.setScreenOptions);
    }

    onCanvasClick(e) {
        const { pageX } = e;
        const { left, width } = this.canvas.getBoundingClientRect();

        const y0 = 0;
        const height = 500;
        const resolution = this.canvas.width / width;
        const x0 = (pageX - left) * resolution;

        // we need to know where we draw horizontal line and what graphics we across
        // we get Image Line Data (where horizontal line will be drawn)
        const lineData = this.ctx.getImageData(x0, y0, 1, height);
        let colors = [];

        const { columns, stepY } = this.chartConfig;

        const originalColorsInRgb = columns.map(column => {
            const rgbColor = hexToRgb(column.color);
            return {
                ...column,
                rgbColor,
            }
        });

        // and will see what color we across
        lineData.data.map((color, idx)=>{
            if (color) {
                let colorPosition = idx % 4;
                let startColorPoint = idx - colorPosition;

                let endColorPoint = startColorPoint + 4;
                const rgbaArray = lineData.data.slice(startColorPoint, endColorPoint);

                const rgb = {
                    r: rgbaArray[0],
                    g: rgbaArray[1],
                    b: rgbaArray[2],
                    yPosition: startColorPoint / 4,
                };

                originalColorsInRgb.forEach((column, idx) => {
                    const { rgbColor } = column;
                    for (const key in rgbColor) {
                        const diff = Math.abs(rgbColor[key]  - rgb[key]);
                        if (diff > 0.03 * rgbColor[key]) {
                            return;
                        }
                    }

                    const dotColor = {
                      yPosition: rgb.yPosition,
                      name: column.name,
                      color: column.color,
                    };
                    colors.push(dotColor)
                });
            }
        });

        const tooltipInfo = getTooltipInfo(colors, columns, stepY, y0, height);

        this.chartConfig.tooltipInfo = {
            yPoints: tooltipInfo,
            x0,
        };

        this.clearChart();
        this.drawShort(this.chartConfig.data, this.chartConfig.columns[0].start,  --this.chartConfig.columns[0].end);//TODO fix
        this.drawTooltip(pageX);
        document.addEventListener('mousedown', this.clickOutside.bind(this));
    }

    clickOutside(event) {
        if (event.target !== this.canvas) {
            this.chartConfig.tooltipInfo.node.style.display = 'none';
            this.drawShort(this.chartConfig.data, this.chartConfig.columns[0].start,  --this.chartConfig.columns[0].end); //TODO fix

        }
    }

    drawTooltip(pageX) {
        const { ctx } = this;
        const { tooltipInfo, xPositions, dates } = this.chartConfig;
        const { x0, yPoints } = tooltipInfo;

        let formatDate = '';

        xPositions.map((xPos, idx) => {
            if (xPos.xPosition <= x0 && xPositions[idx + 1].xPosition >= x0) {
                const date = new Date(dates[idx].ms);
                const options = { weekday: 'short', month: 'short', day: 'numeric' };

                formatDate = date.toLocaleDateString('en-US', options);
            }
        });

        const y0 = 100;
        const height = 500;
        this.drawLine(x0, y0, x0, height, 'rgba(223, 230, 235, 0.5)', 3);

        const tooltip = document.querySelector('.tooltip');
        const columns = tooltip.querySelector('.columns');
        this.chartConfig.tooltipInfo.node = tooltip;
        this.chartConfig.tooltipInfo.date = formatDate;
        tooltip.style.display = 'flex';
        tooltip.style.left = pageX + 'px';
        tooltip.querySelector('.date').textContent = formatDate;

        columns.innerHTML = null;
        for (const key in yPoints) {
            Chart.drawTooltipName(yPoints[key], columns)
        }
    }

    static drawTooltipName(data, parents) {
        const column = document.createElement('div');
        const spanValue = document.createElement('span');
        const spanName = document.createElement('span');
        spanValue.textContent = data.yPosition;
        spanName.textContent = data.name;
        spanName.style.textTransform = 'uppercase';
        column.classList.add('column');
        column.style.color = data.color;
        column.appendChild(spanValue);
        column.appendChild(spanName);

        parents.appendChild(column);
    }
}

module.exports = Chart;