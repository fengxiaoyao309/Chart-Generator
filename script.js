// 全局变量存储图表实例
let chartInstance = null;

// 当页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const generateBtn = document.getElementById('generate-btn');
    const chartType = document.getElementById('chart-type');
    
    // 为生成按钮添加点击事件
    generateBtn.addEventListener('click', generateChart);
    
    // 图表类型改变时更新UI
    chartType.addEventListener('change', updateChartTypeUI);
    
    // 初始化UI
    updateChartTypeUI();
});

// 根据选择的图表类型更新UI
function updateChartTypeUI() {
    const chartType = document.getElementById('chart-type').value;
    const xAxisLabel = document.getElementById('x-axis-label').parentElement;
    const yAxisLabel = document.getElementById('y-axis-label').parentElement;
    const fitInfo = document.getElementById('fit-info');
    const fitLabelPosition = document.getElementById('fit-label-position').parentElement;
    
    // 饼图和环形图不需要轴标签
    if (chartType === 'pie' || chartType === 'doughnut') {
        xAxisLabel.style.display = 'none';
        yAxisLabel.style.display = 'none';
        fitInfo.style.display = 'none';
        fitLabelPosition.style.display = 'none';
    } else {
        xAxisLabel.style.display = 'block';
        yAxisLabel.style.display = 'block';
        
        // 只有拟合直线散点图需要显示拟合信息和位置选择
        if (chartType === 'scatter-fit') {
            fitInfo.style.display = 'block';
            fitLabelPosition.style.display = 'block';
        } else {
            fitInfo.style.display = 'none';
            fitLabelPosition.style.display = 'none';
        }
    }
}

// 生成图表
function generateChart() {
    // 获取用户输入
    const xDataInput = document.getElementById('x-data').value;
    const yDataInput = document.getElementById('y-data').value;
    const chartType = document.getElementById('chart-type').value;
    const chartTitle = document.getElementById('chart-title').value;
    const xAxisLabel = document.getElementById('x-axis-label').value;
    const yAxisLabel = document.getElementById('y-axis-label').value;
    const showGrid = document.getElementById('show-grid').checked;
    const fitLabelPosition = document.getElementById('fit-label-position').value;
    
    // 解析数据
    let xData = parseData(xDataInput);
    let yData = parseData(yDataInput);
    
    // 验证数据
    if (!validateData(xData, yData, chartType)) {
        return;
    }
    
    // 创建图表
    createChart(xData, yData, chartType, chartTitle, xAxisLabel, yAxisLabel, showGrid, fitLabelPosition);
}

// 解析输入数据
function parseData(dataString) {
    if (!dataString.trim()) {
        return [];
    }
    
    return dataString.split(',')
        .map(item => item.trim())
        .map(item => {
            const num = Number(item);
            return isNaN(num) ? item : num;
        });
}

// 验证数据
function validateData(xData, yData, chartType) {
    if (xData.length === 0 || yData.length === 0) {
        alert('请输入X轴和Y轴数据');
        return false;
    }
    
    if (chartType !== 'pie' && chartType !== 'doughnut' && xData.length !== yData.length) {
        alert('X轴和Y轴数据点数量必须相同');
        return false;
    }
    
    if ((chartType === 'pie' || chartType === 'doughnut') && yData.some(item => typeof item !== 'number' || item < 0)) {
        alert('饼图和环形图的数据必须是非负数值');
        return false;
    }
    
    if (chartType === 'scatter-fit') {
        if (xData.some(item => typeof item !== 'number') || yData.some(item => typeof item !== 'number')) {
            alert('拟合直线散点图的数据必须全部是数值');
            return false;
        }
        if (xData.length < 2) {
            alert('拟合直线至少需要2个数据点');
            return false;
        }
    }
    
    return true;
}

// 创建图表
function createChart(xData, yData, chartType, chartTitle, xAxisLabel, yAxisLabel, showGrid, fitLabelPosition) {
    const ctx = document.getElementById('chart').getContext('2d');
    
    // 如果已经有图表实例，先销毁它
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    // 准备数据
    let data = {};
    let options = {};
    
    // 根据图表类型设置数据和选项
    if (chartType === 'scatter' || chartType === 'scatter-fit') {
        // 对于拟合直线散点图，需要计算回归线
        let regressionLine = null;
        let rSquared = 0;
        let equation = '';
        
        if (chartType === 'scatter-fit') {
            // 准备回归分析的数据格式
            const regressionData = xData.map((x, i) => [x, yData[i]]);
            
            // 计算线性回归
            regressionLine = regression.linear(regressionData);
            rSquared = regressionLine.r2;
            
            // 获取方程
            const slope = regressionLine.equation[0];
            const intercept = regressionLine.equation[1];
            equation = `y = ${slope.toFixed(5)}x ${intercept >= 0 ? '+' : ''} ${Math.abs(intercept).toFixed(5)}`;
            
            // 更新UI显示方程和R²
            document.getElementById('equation').textContent = `方程: ${equation}`;
            document.getElementById('r-squared').textContent = `R² = ${rSquared.toFixed(5)}`;
        }
        
        // 准备散点图数据
        data = {
            datasets: [{
                label: '数据点',
                data: xData.map((x, i) => ({ x: x, y: yData[i] })),
                backgroundColor: 'rgba(0, 0, 0, 1)',  // 黑色点
                borderColor: 'rgba(0, 0, 0, 1)',
                borderWidth: 1,
                pointRadius: 5,
                pointHoverRadius: 7,
                type: 'scatter'
            }]
        };
        
        // 如果是拟合直线散点图，添加回归线
        if (chartType === 'scatter-fit') {
            // 计算回归线的起点和终点
            const minX = Math.min(...xData);
            const maxX = Math.max(...xData);
            
            // 使用回归方程计算y值
            const startY = regressionLine.predict(minX)[1];
            const endY = regressionLine.predict(maxX)[1];
            
            // 添加回归线数据集，将R²值添加到标签中
            data.datasets.push({
                label: `拟合线: ${equation} (R² = ${rSquared.toFixed(5)})`,
                data: [
                    { x: minX, y: startY },
                    { x: maxX, y: endY }
                ],
                type: 'line',
                fill: false,
                borderColor: 'rgba(255, 0, 0, 1)',  // 红色线
                borderWidth: 2,
                borderDash: [5, 5],  // 虚线
                pointRadius: 0,
                tension: 0
            });
        }
        
        // 设置图表选项
        options = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: xAxisLabel || 'X',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: showGrid,
                        color: 'rgba(0, 0, 0, 0.1)',
                        borderColor: 'rgba(0, 0, 0, 0.5)',
                        borderWidth: 1
                    },
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yAxisLabel || 'Y',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: showGrid,
                        color: 'rgba(0, 0, 0, 0.1)',
                        borderColor: 'rgba(0, 0, 0, 0.5)',
                        borderWidth: 1
                    },
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 40,
                        font: {
                            size: 12
                        }
                    }
                },
                title: {
                    display: !!chartTitle,
                    text: chartTitle,
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `(${context.parsed.x.toFixed(4)}, ${context.parsed.y.toFixed(4)})`;
                        }
                    }
                }
            }
        };
    } 
    
    // 创建图表
    chartInstance = new Chart(ctx, {
        type: chartType === 'scatter-fit' ? 'scatter' : chartType,
        data: data,
        options: options
    });
    
    // 如果是拟合直线散点图，手动添加拟合信息到图表上
    if (chartType === 'scatter-fit') {
        addFitInfoToChart(regressionLine, fitLabelPosition, xData, yData);
    }
}

// 手动添加拟合信息到图表上
function addFitInfoToChart(regressionLine, position, xData, yData) {
    if (!regressionLine) return;
    
    // 获取图表容器
    const chartContainer = document.querySelector('.chart-container');
    
    // 移除可能存在的旧标注
    const oldAnnotation = document.querySelector('.chart-annotation');
    if (oldAnnotation) {
        oldAnnotation.remove();
    }
    
    // 创建新的标注元素
    const annotation = document.createElement('div');
    annotation.className = 'chart-annotation';
    
    // 设置标注内容
    const slope = regressionLine.equation[0];
    const intercept = regressionLine.equation[1];
    const equation = `y = ${slope.toFixed(5)}x ${intercept >= 0 ? '+' : ''} ${Math.abs(intercept).toFixed(5)}`;
    
    annotation.innerHTML = `
        <div>R² = ${regressionLine.r2.toFixed(5)}</div>
        <div>拟合方程: ${equation}</div>
    `;
    
    // 计算图表容器的尺寸
    const containerRect = chartContainer.getBoundingClientRect();
    
    // 设置标注位置
    annotation.style.position = 'absolute';
    
    switch (position) {
        case 'bottom-right':
            annotation.style.right = '20px';
            annotation.style.bottom = '40px';
            break;
        case 'bottom-left':
            annotation.style.left = '20px';
            annotation.style.bottom = '40px';
            break;
        case 'top-right':
            annotation.style.right = '20px';
            annotation.style.top = '40px';
            break;
        case 'top-left':
            annotation.style.left = '20px';
            annotation.style.top = '40px';
            break;
    }
    
    // 添加标注到图表容器
    chartContainer.appendChild(annotation);
    
    // 确保标注在图表容器内部
    const annotationRect = annotation.getBoundingClientRect();
    if (annotationRect.right > containerRect.right) {
        annotation.style.right = '10px';
        annotation.style.left = 'auto';
    }
    if (annotationRect.bottom > containerRect.bottom) {
        annotation.style.bottom = '10px';
        annotation.style.top = 'auto';
    }
}

// 获取拟合标签的X位置
function getFitLabelXPosition(xData, position) {
    const min = Math.min(...xData);
    const max = Math.max(...xData);
    const range = max - min;
    
    if (position.includes('left')) {
        return min + range * 0.1;
    } else {
        return max - range * 0.1;
    }
}

// 获取拟合标签的Y位置
function getFitLabelYPosition(yData, position) {
    const min = Math.min(...yData);
    const max = Math.max(...yData);
    const range = max - min;
    
    if (position.includes('top')) {
        return max - range * 0.1;
    } else {
        return min + range * 0.1;
    }
}

// 生成随机颜色
function generateColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const hue = (i * 360 / count) % 360;
        colors.push(`hsla(${hue}, 70%, 60%, 0.6)`);
    }
    return colors;
}

// 获取画布和按钮元素
const canvas = document.getElementById('chart');
const generateBtn = document.getElementById('generate-btn');
const downloadBtn = document.getElementById('download-btn'); // 添加这行
let currentChart = null;

// 添加下载按钮的点击事件处理函数
downloadBtn.addEventListener('click', function() {
    // 创建一个临时的 canvas 元素
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    
    // 设置临时 canvas 的尺寸与原图表相同
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    // 填充白色背景
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // 将原图表内容绘制到临时 canvas 上
    ctx.drawImage(canvas, 0, 0);
    
    // 创建下载链接
    const link = document.createElement('a');
    link.download = '图表.png';
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
});

// 生成图表的函数
function generateChart() {
    // 获取输入数据
    const xDataStr = document.getElementById('x-data').value;
    const yDataStr = document.getElementById('y-data').value;
    
    // 解析数据
    const xData = xDataStr.split(',').map(x => parseFloat(x.trim()));
    const yData = yDataStr.split(',').map(y => parseFloat(y.trim()));
    
    // 验证数据
    if (xData.length !== yData.length || xData.some(isNaN) || yData.some(isNaN)) {
        alert('请输入有效的数据！');
        return;
    }
    
    // 获取图表配置
    const chartType = document.getElementById('chart-type').value;
    const chartTitle = document.getElementById('chart-title').value;
    const xAxisLabel = document.getElementById('x-axis-label').value;
    const yAxisLabel = document.getElementById('y-axis-label').value;
    const showGrid = document.getElementById('show-grid').checked;
    const fitLineStyle = document.getElementById('fit-line-style').value; // 添加这行获取拟合线样式
    
    // 销毁现有图表
    if (currentChart) {
        currentChart.destroy();
    }
    
    // 准备数据
    let chartData = {
        labels: xData,
        datasets: [{
            label: '数据点',
            data: yData.map((y, i) => ({x: xData[i], y: y})),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    };
    
    // 配置选项
    const options = {
        responsive: true,
        plugins: {
            title: {
                display: !!chartTitle,
                text: chartTitle
            }
        },
        scales: {
            x: {
                title: {
                    display: !!xAxisLabel,
                    text: xAxisLabel
                },
                grid: {
                    display: showGrid
                }
            },
            y: {
                title: {
                    display: !!yAxisLabel,
                    text: yAxisLabel
                },
                grid: {
                    display: showGrid
                }
            }
        }
    };
    
    // 处理特殊图表类型
    if (chartType === 'scatter-fit') {
        // 计算回归直线
        const points = xData.map((x, i) => [x, yData[i]]);
        const result = regression.linear(points);
        
        // 隐藏外部拟合信息显示
        document.getElementById('fit-info').style.display = 'none';
        
        // 添加拟合线
        chartData.datasets.push({
            label: '拟合线',
            data: xData.map(x => ({
                x: x,
                y: result.predict(x)[1]
            })),
            type: 'line',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
            borderDash: fitLineStyle === 'dashed' ? [5, 5] : [], // 根据选择设置线条样式
            fill: false
        });

        // 修改图表选项，将拟合信息显示在图表上方
        options.plugins = {
            ...options.plugins,
            legend: {
                position: 'top',
                labels: {
                    generateLabels: function(chart) {
                        const originalLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                        
                        // 添加拟合方程和R²值，并在前面加上名称标识，保留五位小数
                        const equationLabel = {
                            text: `拟合方程：y = ${result.equation[0].toFixed(4)}x + ${result.equation[1].toFixed(4)}`,
                            fillStyle: 'transparent',
                            strokeStyle: 'transparent',
                            lineWidth: 0,
                            fontColor: '#333'
                        };
                        
                        const r2Label = {
                            text: `拟合参数：R² = ${result.r2.toFixed(4)}`,
                            fillStyle: 'transparent',
                            strokeStyle: 'transparent',
                            lineWidth: 0,
                            fontColor: '#333'
                        };
                        
                        return [...originalLabels, equationLabel, r2Label];
                    }
                },
                onClick: null // 禁用点击事件
            }
        };
    }

    // 创建图表
    currentChart = new Chart(canvas, {
        type: chartType === 'scatter-fit' ? 'scatter' : chartType,
        data: chartData,
        options: options
    });

    // 显示下载按钮
    downloadBtn.style.display = 'block';
}

// 添加按钮点击事件监听器
generateBtn.addEventListener('click', generateChart);