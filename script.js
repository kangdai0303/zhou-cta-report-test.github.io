// 初始化Mermaid - 兼容性检查和延迟加载
function initializeMermaid() {
    if (typeof mermaid !== 'undefined') {
        try {
            mermaid.initialize({ 
                startOnLoad: false,
                theme: 'base',
                securityLevel: 'loose',
                flowchart: {
                    htmlLabels: true,
                    curve: 'basis'
                }
            });
            console.log('Mermaid初始化成功');
        } catch (error) {
            console.warn('Mermaid初始化失败:', error);
        }
    } else {
        console.warn('Mermaid库未加载，流程图将使用文本版本');
    }
}

// 兼容性检查函数
function checkBrowserCompatibility() {
    var isCompatible = true;
    var issues = [];
    
    // 检查基本API支持
    if (!document.querySelector) {
        isCompatible = false;
        issues.push('querySelector');
    }
    
    if (!document.getElementById) {
        isCompatible = false;
        issues.push('getElementById');
    }
    
    if (!Array.prototype.forEach) {
        issues.push('Array.forEach (已提供polyfill)');
    }
    
    if (typeof Chart === 'undefined') {
        issues.push('Chart.js库未加载');
        // Chart.js对于生成报告是必需的，但不应阻止页面加载
        // isCompatible = false;
    }
    
    if (issues.length > 0) {
        console.warn('兼容性检查发现问题:', issues.join(', '));
    }
    
    return isCompatible;
}

// 页面加载后尝试初始化
function onDOMReady() {
    checkBrowserCompatibility();
    initializeMermaid();
}

document.addEventListener('DOMContentLoaded', onDOMReady);

// 如果DOMContentLoaded已经触发，立即初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDOMReady);
} else {
    onDOMReady();
}

// 全局变量存储分数
var scores = {
    advanced: 0,
    comprehensive: 0,
    basic: 0
};

// 裁剪canvas四个方向空白的函数
function cropRightMargin(originalCanvas) {
    // 创建一个新的canvas来绘制裁剪后的图片
    var croppedCanvas = document.createElement('canvas');
    var ctx = croppedCanvas.getContext('2d');
    
    // 分析原图，找到内容的实际边界
    var imageData = originalCanvas.getContext('2d').getImageData(0, 0, originalCanvas.width, originalCanvas.height);
    var data = imageData.data;
    
    // 从左向右扫描，找到第一个非白色像素的位置
    var leftBound = 0;
    var found = false;
    
    for (var x = 0; x < originalCanvas.width && !found; x++) {
        for (var y = 0; y < originalCanvas.height; y++) {
            var index = (y * originalCanvas.width + x) * 4;
            var r = data[index];
            var g = data[index + 1];
            var b = data[index + 2];
            var a = data[index + 3];
            
            // 如果不是白色或透明，则找到内容边界
            if (!(r > 250 && g > 250 && b > 250) || a < 250) {
                leftBound = Math.max(0, x - 10); // 在内容左侧保留10px的空白
                found = true;
                break;
            }
        }
    }
    
    // 从右向左扫描，找到最后一个非白色像素的位置
    var rightBound = originalCanvas.width;
    found = false;
    
    for (var x = originalCanvas.width - 1; x >= 0 && !found; x--) {
        for (var y = 0; y < originalCanvas.height; y++) {
            var index = (y * originalCanvas.width + x) * 4;
            var r = data[index];
            var g = data[index + 1];
            var b = data[index + 2];
            var a = data[index + 3];
            
            // 如果不是白色或透明，则找到内容边界
            if (!(r > 250 && g > 250 && b > 250) || a < 250) {
                rightBound = x + 10; // 在内容右侧保留10px的空白
                found = true;
                break;
            }
        }
    }
    
    // 从下向上扫描，找到最后一个非白色像素的位置
    var bottomBound = originalCanvas.height;
    found = false;
    
    for (var y = originalCanvas.height - 1; y >= 0 && !found; y--) {
        for (var x = 0; x < originalCanvas.width; x++) {
            var index = (y * originalCanvas.width + x) * 4;
            var r = data[index];
            var g = data[index + 1];
            var b = data[index + 2];
            var a = data[index + 3];
            
            // 如果不是白色或透明，则找到内容边界
            if (!(r > 250 && g > 250 && b > 250) || a < 250) {
                bottomBound = y + 10; // 在内容下方保留10px的空白，与上方一致
                found = true;
                break;
            }
        }
    }
    
    // 计算裁剪后的尺寸
    var newWidth = rightBound - leftBound;
    var newHeight = bottomBound;
    
    // 确保裁剪后的尺寸不会太小
    newWidth = Math.max(newWidth, originalCanvas.width * 0.5);
    newHeight = Math.max(newHeight, originalCanvas.height * 0.7);
    
    // 设置新canvas的尺寸
    croppedCanvas.width = newWidth;
    croppedCanvas.height = newHeight;
    
    // 将原图的指定区域绘制到新canvas上
    ctx.drawImage(originalCanvas, leftBound, 0, newWidth, newHeight, 0, 0, newWidth, newHeight);
    
    console.log('✓ 图片裁剪完成，原尺寸：' + originalCanvas.width + 'x' + originalCanvas.height + 'px，新尺寸：' + newWidth + 'x' + newHeight + 'px');
    console.log('✓ 裁剪区域：左边界' + leftBound + 'px，右边界' + rightBound + 'px，下边界' + bottomBound + 'px');
    
    return croppedCanvas;
}

// DOM元素 - 添加兼容性检查
var inputPage = document.getElementById('input-page');
var reportPage = document.getElementById('report-page');
var generateBtn = document.getElementById('generate-report');
var backBtn = document.getElementById('back-btn');
var generateImageBtn = document.getElementById('generate-image-btn');

// 输入框元素
var scoreInput = document.getElementById('score-input');

// 事件监听器 - 添加存在性检查
if (generateBtn) generateBtn.addEventListener('click', generateReport);
if (backBtn) backBtn.addEventListener('click', backToInput);
if (generateImageBtn) generateImageBtn.addEventListener('click', generateLongImage);

// 显示错误信息
function showError(message) {
    // 移除现有的错误提示
    var existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // 创建新的错误提示
    var errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // 在输入框后面插入错误提示
    var inputGroup = document.querySelector('.single-input-group');
    inputGroup.insertAdjacentElement('afterend', errorDiv);
    
    // 3秒后自动消失
    setTimeout(function() {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 3000);
}

// 移除错误信息
function clearError() {
    var existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
}

// 输入验证
function validateInputs() {
    var input = scoreInput.value.trim();
    
    if (!input) {
        showError('请输入分数');
        return false;
    }
    
    if (input.length !== 4) {
        showError('请输入99.9格式的分数');
        return false;
    }
    
    if (!/^[0-9]{2}\.[0-9]$/.test(input)) {
        showError('请输入有效的分数格式（99.9）');
        return false;
    }
    
    var score = parseFloat(input);
    if (score < 0 || score > 99.9) {
        showError('分数应在0.0-99.9之间');
        return false;
    }
    
    clearError();
    return true;
}

// 生成报告
function generateReport() {
    // 兼容性检查
    if (!checkBrowserCompatibility()) {
        showError('您的浏览器版本过低，请升级浏览器后重试');
        return;
    }
    
    if (!validateInputs()) return;
    
    // 添加加载状态
    var generateBtn = document.getElementById('generate-report');
    var originalText = generateBtn.textContent;
    generateBtn.textContent = '生成中...';
    generateBtn.disabled = true;
    generateBtn.style.opacity = '0.7';
    
    // 获取输入值
    var input = scoreInput.value.trim();
    var score = parseFloat(input);
    
    // 将输入的分数解析为三个维度（从左到右取数字）
    var scoreStr = score.toFixed(1); // 确保是两位整数+一位小数
    scores.advanced = parseInt(scoreStr[0]) || 0;        // 第1位：高阶应用层
    scores.comprehensive = parseInt(scoreStr[1]) || 0;   // 第2位：综合理解层
    scores.basic = parseInt(scoreStr[3]) || 0;           // 小数点后第1位：基础认知层
    
    // 添加生成延迟以显示加载效果
    setTimeout(function() {
        // 切换到报告页面
        inputPage.classList.remove('active');
        reportPage.classList.add('active');
        
        // 恢复按钮状态
        generateBtn.textContent = originalText;
        generateBtn.disabled = false;
        generateBtn.style.opacity = '1';
        
        // 生成各部分内容
        setTimeout(function() {
            generateRadarChart();
            generateEvaluationTable();
            generateEvolutionGuide();
            generateMedicalCompass();
            
            // 确保流程图内容生成后立即保存到全局变量
            setTimeout(function() {
                var mermaidChart = document.getElementById('mermaid-chart');
                if (mermaidChart) {
                    if (mermaidChart.innerHTML.trim() === '') {
                        console.log('流程图容器为空，强制生成内容');
                        var comprehensiveScore = ((scores.basic / 9) * 0.2 + (scores.comprehensive / 9) * 0.3 + (scores.advanced / 9) * 0.5) * 100;
                        generateTextFlowChart(mermaidChart, comprehensiveScore);
                    }
                    
                    // 立即保存当前内容到全局变量
                    setTimeout(function() {
                        window.flowChartContent = mermaidChart.innerHTML;
                        console.log('✓ 报告生成后保存流程图内容，长度:', window.flowChartContent && window.flowChartContent.length || 0);
                    }, 100);
                }
            }, 500);
        }, 100);
    }, 800);
}

// 返回输入页面
function backToInput() {
    reportPage.classList.remove('active');
    inputPage.classList.add('active');
    
    // 清除之前的报告内容，确保重新生成时数据正确
    var radarChart = Chart.getChart('radarChart');
    if (radarChart) {
        radarChart.destroy();
    }
    
    // 清除表格内容
    var tbody = document.getElementById('evaluation-tbody');
    if (tbody) {
        tbody.innerHTML = '';
    }
    
    
    // 清除进化指引内容
    var textEvaluationContent = document.getElementById('text-evaluation-content');
    if (textEvaluationContent) {
        textEvaluationContent.innerHTML = '';
    }
    
    var mermaidChart = document.getElementById('mermaid-chart');
    if (mermaidChart) {
        mermaidChart.innerHTML = '';
    }
    
    // 清除医考航标塔内容
    var compassContent = document.getElementById('medical-compass-content');
    if (compassContent) {
        compassContent.innerHTML = '';
    }
}

// 生成雷达图
function generateRadarChart() {
    var radarCanvas = document.getElementById('radarChart');
    if (!radarCanvas) {
        console.error('雷达图画布元素未找到');
        return;
    }
    
    // 检查Chart.js是否加载
    if (typeof Chart === 'undefined') {
        console.error('Chart.js库未加载');
        radarCanvas.parentElement.innerHTML = '<p style="text-align:center;color:#666;padding:50px;">图表库加载失败，请刷新页面重试<br><small>如果问题持续，请尝试使用较新的浏览器</small></p>';
        return;
    }
    
    // 检查getContext方法支持
    if (!radarCanvas.getContext) {
        console.error('浏览器不支持Canvas');
        radarCanvas.parentElement.innerHTML = '<p style="text-align:center;color:#666;padding:50px;">您的浏览器不支持图表显示<br><small>请升级到较新版本的浏览器</small></p>';
        return;
    }
    
    var ctx = radarCanvas.getContext('2d');
    
    // 更新分数显示
    var advancedScoreEl = document.getElementById('advanced-score');
    var comprehensiveScoreEl = document.getElementById('comprehensive-score');
    var basicScoreEl = document.getElementById('basic-score');
    
    if (advancedScoreEl) advancedScoreEl.textContent = scores.advanced;
    if (comprehensiveScoreEl) comprehensiveScoreEl.textContent = scores.comprehensive;
    if (basicScoreEl) basicScoreEl.textContent = scores.basic;
    
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['高阶应用层', '综合理解层', '基础认知层'],
            datasets: [{
                label: 'CTA测评结果',
                data: [scores.advanced, scores.comprehensive, scores.basic],
                backgroundColor: 'rgba(76, 175, 80, 0.25)',
                borderColor: 'rgba(76, 175, 80, 1)',
                borderWidth: 3,
                pointBackgroundColor: 'rgba(76, 175, 80, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 3,
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(76, 175, 80, 1)',
                pointHoverBorderWidth: 4,
                pointRadius: 8,
                pointHoverRadius: 10,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 10,
                    ticks: {
                        stepSize: 2,
                        font: {
                            size: 12
                        },
                        backdropColor: 'rgba(255, 255, 255, 0.8)',
                        backdropPadding: 4
                    },
                    pointLabels: {
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: 15,
                        color: '#333'
                    },
                    grid: {
                        color: '#e0e0e0',
                        lineWidth: 1
                    },
                    angleLines: {
                        color: '#d0d0d0',
                        lineWidth: 1
                    }
                }
            }
        }
    });
}

// 生成评价表格
function generateEvaluationTable() {
    var tbody = document.getElementById('evaluation-tbody');
    
    // 评价标准
    function getAbilityLevel(score, dimension) {
        if (dimension === 'basic') {
            // 基础认知层的应试能力诊断
            if (score >= 7) return { level: '知识仓储系统高效', class: 'ability-level-excellent' };
            if (score >= 4) return { level: '碎片化记忆效率待提升', class: 'ability-level-average' };
            return { level: '考点识别机制薄弱', class: 'ability-level-poor' };
        } else if (dimension === 'comprehensive') {
            // 综合理解层的应试能力诊断
            if (score >= 7) return { level: '命题逻辑反向推演专家', class: 'ability-level-excellent' };
            if (score >= 4) return { level: '中等难度题耗时过高', class: 'ability-level-average' };
            return { level: '题干解码能力不足', class: 'ability-level-poor' };
        } else if (dimension === 'advanced') {
            // 高阶应用层的应试能力诊断
            if (score >= 7) return { level: '满分题精算师', class: 'ability-level-excellent' };
            if (score >= 4) return { level: '风险收益评估待优化', class: 'ability-level-average' };
            return { level: '决策时间分配失衡', class: 'ability-level-poor' };
        }
    }
    
    function getEvaluation(score, dimension) {
        var evaluations = {
            advanced: {
                excellent: '训练模糊证据处置范式，实现疑难项辨析精准度＞90%。',
                good: '开发处置方案评分卡（正确率×分值权重），优先攻克权重＞15%的战略题型。',
                average: '开发处置方案评分卡（正确率×分值权重），优先攻克权重＞15%的战略题型。',
                poor: '建立"黄金8分钟"机制：复杂题限时完成，超时保留标记转战基础题。'
            },
            comprehensive: {
                excellent: '掌握命题人思维建模技术，能预判干扰项设置逻辑。',
                good: '推行"两分钟法则"：超过时限自动启用排除法，同步训练最优选项识别眼动模式。',
                average: '推行"两分钟法则"：超过时限自动启用排除法，同步训练最优选项识别眼动模式。',
                poor: '强化题干关键词捕捉训练（但/除外/最可能），建立错题陷阱类型库。'
            },
            basic: {
                excellent: '优化记忆提取路径，训练跨模块概念瞬时关联能力。',
                good: '开发概念聚类记忆法，压缩记忆检索时间＜3秒/概念。',
                average: '开发概念聚类记忆法，压缩记忆检索时间＜3秒/概念。',
                poor: '建立高频考点雷达图，优先掌握占分比＞5%的核心术语记忆策略。'
            }
        };
        
        var level;
        if (dimension === 'basic') {
            // 基础认知层使用新的评分标准
            if (score >= 7) level = 'excellent';
            else if (score >= 4) level = 'good';
            else level = 'poor';
        } else if (dimension === 'comprehensive') {
            // 综合理解层使用新的评分标准
            if (score >= 7) level = 'excellent';
            else if (score >= 4) level = 'good';
            else level = 'poor';
        } else if (dimension === 'advanced') {
            // 高阶应用层使用新的评分标准
            if (score >= 7) level = 'excellent';
            else if (score >= 4) level = 'good';
            else level = 'poor';
        }
        
        return evaluations[dimension][level];
    }
    
    // 生成表格内容
    var dimensions = [
        { name: '高阶应用层', score: scores.advanced, key: 'advanced' },
        { name: '综合理解层', score: scores.comprehensive, key: 'comprehensive' },
        { name: '基础认知层', score: scores.basic, key: 'basic' }
    ];
    
    tbody.innerHTML = '';
    for (var i = 0; i < dimensions.length; i++) {
        var dim = dimensions[i];
        var abilityLevel = getAbilityLevel(dim.score, dim.key);
        var evaluation = getEvaluation(dim.score, dim.key);
        
        var row = document.createElement('tr');
        row.innerHTML = '<td><strong>' + dim.name + '</strong></td>' +
            '<td><span class="score-highlight">' + dim.score + '</span></td>' +
            '<td><span class="' + abilityLevel.class + '">' + abilityLevel.level + '</span></td>' +
            '<td>' + evaluation + '</td>';
        tbody.appendChild(row);
    }
}

// 生成能力进化指引
function generateEvolutionGuide() {
    var textContent = document.getElementById('text-evaluation-content');
    var chartContainer = document.getElementById('mermaid-chart');
    
    // 文字评价
    var totalScore = scores.advanced + scores.comprehensive + scores.basic;
    var avgScore = totalScore / 3;
    
    // 找出最强和最弱的维度
    var dimensions = [
        { name: '高阶应用层', score: scores.advanced, key: 'advanced' },
        { name: '综合理解层', score: scores.comprehensive, key: 'comprehensive' },
        { name: '基础认知层', score: scores.basic, key: 'basic' }
    ];
    
    dimensions.sort(function(a, b) { return b.score - a.score; });
    var strongest = dimensions[0];
    var weakest = dimensions[2];
    
    var evolutionText = '<div style="line-height: 1.8;">' +
            '<h4>💡 个性化发展建议</h4>' +
            '<p><strong>优势维度：</strong>' + strongest.name + '（' + strongest.score + '分）</p>' +
            '<p>继续发挥您在' + strongest.name + '方面的优势，这是您认知能力的核心竞争力。</p>' +
            '<p><strong>提升重点：</strong>' + weakest.name + '（' + weakest.score + '分）</p>' +
            '<p>建议重点关注' + weakest.name + '的提升，这将显著提高您的整体认知表现。</p>' +
            '<h4>🎯 发展路径规划</h4>' +
            '<ul>' +
                '<li><strong>短期目标（1-3个月）：</strong>针对' + weakest.name + '进行专项训练</li>' +
                '<li><strong>中期目标（3-6个月）：</strong>整体提升各维度能力，实现均衡发展</li>' +
                '<li><strong>长期目标（6-12个月）：</strong>形成个人独特的认知优势体系</li>' +
            '</ul>' +
        '</div>';
    
    if (textContent) {
        textContent.innerHTML = evolutionText;
    }
    
    // 生成流程图 - 添加更robust的处理
    var comprehensiveScore = ((scores.basic / 9) * 0.2 + (scores.comprehensive / 9) * 0.3 + (scores.advanced / 9) * 0.5) * 100;
    generateFlowChart(chartContainer, comprehensiveScore);
}

// 独立的流程图生成函数 - 恢复Mermaid图线引导
function generateFlowChart(chartContainer, comprehensiveScore) {
    if (!chartContainer) {
        console.error('流程图容器未找到');
        return;
    }
    
    console.log('=== 生成Mermaid流程图 ===');
    console.log('容器ID:', chartContainer.id);
    console.log('综合得分:', comprehensiveScore);
    
    // 设置加载状态
    chartContainer.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">正在生成流程图...</p>';
    
    // 根据综合得分确定时间安排
    var timePhase1 = '1-2个月';
    var timePhase2 = '2-4个月'; 
    var timePhase3 = '4-6个月';
    
    if (comprehensiveScore >= 85) {
        timePhase1 = '0.5-1个月';
        timePhase2 = '1-2个月';
        timePhase3 = '2-3个月';
    } else if (comprehensiveScore >= 70) {
        timePhase1 = '1-1.5个月';
        timePhase2 = '1.5-3个月';
        timePhase3 = '3-5个月';
    }
    
    // 检查Mermaid是否可用
    if (typeof mermaid === 'undefined') {
        console.warn('Mermaid库未加载，使用文本版流程图');
        generateTextFlowChart(chartContainer, comprehensiveScore);
        return;
    }
    
    try {
        // 初始化Mermaid
        mermaid.initialize({ 
            startOnLoad: false,
            theme: 'base',
            themeVariables: {
                primaryColor: '#4CAF50',
                primaryTextColor: '#333',
                primaryBorderColor: '#4CAF50',
                lineColor: '#666',
                fontSize: '14px'
            },
            flowchart: {
                htmlLabels: true,
                curve: 'basis'
            }
        });
        
        // 生成与原始模板一致的Mermaid流程图代码，时间作为独立单元框
        var mermaidCode = `
            graph TD
                A["📊 当前状态<br/>综合得分: ${comprehensiveScore.toFixed(1)}"] --> B{"🔍 能力诊断"}
                B --> C["📚 基础认知强化<br/>记忆、注意、感知"]
                B --> D["🧠 综合理解提升<br/>信息整合、分析推理"]
                B --> E["🚀 高阶应用发展<br/>创新思维、问题解决"]
                
                C --> F["⏱️ 基础训练阶段<br/>${timePhase1}"]
                D --> G["🔄 能力整合阶段<br/>${timePhase2}"]
                E --> H["⭐ 高阶发展阶段<br/>${timePhase3}"]
                
                F --> I["💪 进阶提升"]
                G --> I
                H --> I
                
                I --> J["🎯 成功上岸"]
                
                style A fill:#e1f5fe,stroke:#2196F3,stroke-width:2px
                style B fill:#fff3e0,stroke:#FF9800,stroke-width:2px
                style C fill:#fff3e0,stroke:#FF9800,stroke-width:2px
                style D fill:#f3e5f5,stroke:#9C27B0,stroke-width:2px
                style E fill:#fce4ec,stroke:#E91E63,stroke-width:2px
                style F fill:#ffecb3,stroke:#FFC107,stroke-width:2px
                style G fill:#f1f8e9,stroke:#8BC34A,stroke-width:2px
                style H fill:#fde7f3,stroke:#FF4081,stroke-width:2px
                style I fill:#e8f5e8,stroke:#4CAF50,stroke-width:2px
                style J fill:#c8e6c9,stroke:#4CAF50,stroke-width:3px
        `;
        
        // 创建唯一ID
        var chartId = 'mermaid-chart-' + Date.now();
        chartContainer.innerHTML = '<div id="' + chartId + '" class="mermaid">' + mermaidCode + '</div>';
        
        // 渲染流程图
        setTimeout(function() {
            try {
                var element = document.getElementById(chartId);
                if (element && mermaid.render) {
                    mermaid.render(chartId + '-svg', mermaidCode, function(svgCode) {
                        chartContainer.innerHTML = '<div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">' + svgCode + '</div>';
                        
                        // 立即保存生成的内容
                        window.flowChartContent = chartContainer.innerHTML;
                        console.log('✓ Mermaid流程图生成成功，已保存到全局变量');
                    });
                } else if (element && mermaid.init) {
                    mermaid.init(undefined, element);
                    
                    // 保存内容
                    setTimeout(function() {
                        window.flowChartContent = chartContainer.innerHTML;
                        console.log('✓ Mermaid流程图初始化成功，已保存到全局变量');
                    }, 200);
                } else {
                    throw new Error('Mermaid渲染方法不可用');
                }
            } catch (error) {
                console.error('Mermaid渲染失败，使用文本版:', error);
                generateTextFlowChart(chartContainer, comprehensiveScore);
            }
        }, 100);
        
    } catch (error) {
        console.warn('Mermaid初始化失败，使用文本版:', error);
        generateTextFlowChart(chartContainer, comprehensiveScore);
    }
}

// 文本版流程图（与原模板一致，包含时间信息）
function generateTextFlowChart(chartContainer, comprehensiveScore) {
    if (!chartContainer) {
        console.error('流程图容器不存在');
        return;
    }
    
    // 简化版本的流程图
    var currentStage = '';
    if (comprehensiveScore >= 85) {
        currentStage = '高阶发展阶段';
    } else if (comprehensiveScore >= 70) {
        currentStage = '能力整合阶段';
    } else {
        currentStage = '基础训练阶段';
    }
    
    var textChart = '<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">' +
        '<h4>进化路径流程图</h4>' +
        '<div style="background: #e1f5fe; padding: 10px; margin: 10px; border-radius: 5px;">' +
            '<strong>📊 当前状态</strong><br>' +
            '综合得分: ' + comprehensiveScore.toFixed(1) + '<br>' +
            '所处阶段: ' + currentStage +
        '</div>' +
        '<div style="margin: 10px; font-size: 18px;">↓</div>' +
        '<div style="background: #fff3e0; padding: 10px; margin: 10px; border-radius: 5px;">' +
            '<strong>🔍 能力诊断</strong><br>' +
            '多维度评估分析' +
        '</div>' +
        '<div style="margin: 10px; font-size: 18px;">↓</div>' +
        '<div style="background: #e8f5e8; padding: 10px; margin: 10px; border-radius: 5px;">' +
            '<strong>🎯 目标</strong><br>' +
            '全面能力提升，成功上岸' +
        '</div>' +
        '</div>';
    
    chartContainer.innerHTML = textChart;
    console.log('已生成原模板一致的流程图，内容长度:', textChart.length);
}

// 计算排名百分比
function calculateRanking(comprehensiveScore) {
    var baseRanking, rangeMin, rangeMax;
    
    // 根据分数区间确定基础排名和区间范围
    if (comprehensiveScore >= 95) {
        baseRanking = 5;
        rangeMin = 95;
        rangeMax = 100;
    } else if (comprehensiveScore >= 85) {
        baseRanking = 19;
        rangeMin = 85;
        rangeMax = 95;
    } else if (comprehensiveScore >= 75) {
        baseRanking = 34;
        rangeMin = 75;
        rangeMax = 85;
    } else if (comprehensiveScore >= 65) {
        baseRanking = 50;
        rangeMin = 65;
        rangeMax = 75;
    } else if (comprehensiveScore >= 45) {
        baseRanking = 64;
        rangeMin = 45;
        rangeMax = 65;
    } else if (comprehensiveScore >= 25) {
        baseRanking = 74;
        rangeMin = 25;
        rangeMax = 45;
    } else {
        baseRanking = 84;
        rangeMin = 0;
        rangeMax = 25;
    }
    
    // 在区间内进行等比例调整
    var rangeWidth = rangeMax - rangeMin;
    var scorePosition = comprehensiveScore - rangeMin;
    const positionRatio = scorePosition / rangeWidth;
    
    let adjustedRanking;
    if (comprehensiveScore >= 95) {
        // 95分以上：从5%调整到0%
        adjustedRanking = 5 - (positionRatio * 5);
    } else if (comprehensiveScore >= 85) {
        // 85-95分：从19%调整到5%
        adjustedRanking = 19 - (positionRatio * 14);
    } else if (comprehensiveScore >= 75) {
        // 75-85分：从34%调整到19%
        adjustedRanking = 34 - (positionRatio * 15);
    } else if (comprehensiveScore >= 65) {
        // 65-75分：从50%调整到34%
        adjustedRanking = 50 - (positionRatio * 16);
    } else if (comprehensiveScore >= 45) {
        // 45-65分：从64%调整到50%
        adjustedRanking = 64 - (positionRatio * 14);
    } else if (comprehensiveScore >= 25) {
        // 25-45分：从74%调整到64%
        adjustedRanking = 74 - (positionRatio * 10);
    } else {
        // 0-25分：从84%调整到74%
        adjustedRanking = 84 - (positionRatio * 10);
    }
    
    return Math.max(0.1, parseFloat(adjustedRanking.toFixed(1)));
}

// 计算到下一级目标的差距
function calculateGapToNextLevel(comprehensiveScore) {
    if (comprehensiveScore >= 95) {
        return 0; // 已经是最高等级
    } else if (comprehensiveScore >= 85) {
        return parseFloat((95 - comprehensiveScore).toFixed(1));
    } else if (comprehensiveScore >= 75) {
        return parseFloat((85 - comprehensiveScore).toFixed(1));
    } else if (comprehensiveScore >= 65) {
        return parseFloat((75 - comprehensiveScore).toFixed(1));
    } else if (comprehensiveScore >= 45) {
        return parseFloat((65 - comprehensiveScore).toFixed(1));
    } else if (comprehensiveScore >= 25) {
        return parseFloat((45 - comprehensiveScore).toFixed(1));
    } else {
        return parseFloat((25 - comprehensiveScore).toFixed(1));
    }
}

// 根据综合得分匹配适合的报考单位
function getMatchedUnits(comprehensiveScore) {
    if (comprehensiveScore >= 90) {
        return '省级核心（三甲省属）、一线地市（三甲）';
    } else if (comprehensiveScore >= 80) {
        return '一线地市（二级单位）、市级枢纽（三甲/优质三乙）';
    } else if (comprehensiveScore >= 70) {
        return '市级枢纽（二级单位）、县域中心（三甲）';
    } else if (comprehensiveScore >= 60) {
        return '县域中心（三乙/二甲）、县域副中心（三甲）';
    } else if (comprehensiveScore >= 50) {
        return '镇级单位（三级、二级单位）、镇级社区卫生中心';
    } else {
        return '基层网络（乡镇卫生院、卫生所）';
    }
}

// 获取三维诊断结果评价
function getDiagnosisEvaluation() {
    function getScoreLevel(score) {
        if (score >= 7) return '高';
        if (score >= 4) return '中';
        return '低';
    }
    
    const B = getScoreLevel(scores.basic);      // 基础认知层
    const C = getScoreLevel(scores.comprehensive);  // 综合理解层
    const A = getScoreLevel(scores.advanced);   // 高阶应用层
    
    const combinationKey = `${B}${C}${A}`;
    
    const diagnosisMap = {
        '低低低': '基础薄弱且缺乏解题策略，急需系统化应试训练。',
        '低低中': '应用题策略初见成效，但知识储备和题干解读能力严重不足。',
        '低低高': '高阶应试技巧突出，但基础不牢导致整体稳定性差。',
        '低中低': '题干理解能力中等，但基础记忆和复杂题决策能力双弱。',
        '低中中': '中等题处理尚可，但基础漏洞和难题攻坚能力制约提分空间。',
        '低中高': '中高难度题应对良好，基础薄弱成为分数突破瓶颈。',
        '低高低': '阅读理解能力优秀，但知识储备与应用策略双缺。',
        '低高中': '理解层优势明显，基础记忆和难题精算能力需补强。',
        '低高高': '理解与应用能力出色，基础术语记忆拖累整体表现。',
        '中低低': '基础记忆中等，题干理解缺陷制约分数提升。',
        '中低中': '基础与应用能力中等，题干解读能力亟需强化。',
        '中低高': '基础与应用双优，题干解读能力不足导致中等题意外失分。',
        '中中低': '基础扎实、理解中等，但复杂题时间管理及决策策略存在硬伤。',
        '中中中': '基础与理解稳固，应用题策略中等，需聚焦压轴题得分效率。',
        '中中高': '基础与理解良好，应用题优势显著，具备冲击顶尖分数潜力。',
        '中高低': '基础与理解双优，但应用层决策失误率高，需紧急补救。',
        '中高中': '全科能力优异，压轴题攻坚稳定性不足阻碍满分突破。',
        '中高高': '接近顶尖水平，细节完善后可实现全面突破。',
        '高低低': '基础扎实但理解与应用双弱，需强化题干分析和解题策略。',
        '高低中': '基础优秀、应用中等，题干理解能力成为提分关键。',
        '高低高': '基础与应用双优，题干解读能力不足导致中等题意外失分。',
        '高中低': '基础扎实、理解中等，但复杂题时间管理及决策策略存在硬伤。',
        '高中中': '基础与理解稳固，应用题策略中等，需聚焦压轴题得分效率。',
        '高中高': '基础与理解良好，应用题优势显著，具备冲击顶尖分数潜力。',
        '高高低': '基础与理解双优，但应用层决策失误率高，需紧急补救。',
        '高高中': '全科能力优异，压轴题攻坚稳定性不足阻碍满分突破。',
        '高高高': '顶尖应试机器，具备精准考点定位、题干解析及难题攻坚能力。'
    };
    
    return diagnosisMap[combinationKey] || '评价数据异常，请重新测试。';
}

// 生成医考航标塔
function generateMedicalCompass() {
    var compassContent = document.getElementById('medical-compass-content');
    
    const totalScore = scores.advanced + scores.comprehensive + scores.basic;
    const avgScore = totalScore / 3;
    
    // 计算综合得分
    const comprehensiveScore = ((scores.basic / 9) * 0.2 + (scores.comprehensive / 9) * 0.3 + (scores.advanced / 9) * 0.5) * 100;
    
    // 确定人才类型
    let talentType = '';
    if (comprehensiveScore >= 85) {
        talentType = '卓越型';
    } else if (comprehensiveScore >= 70) {
        talentType = '稳健型';
    } else if (comprehensiveScore >= 50) {
        talentType = '成长型';
    } else {
        talentType = '基础型';
    }
    
    // 获取三维诊断结果评价
    const diagnosisEvaluation = getDiagnosisEvaluation();
    
    // 计算排名
    const ranking = calculateRanking(comprehensiveScore);
    const rankingDisplay = comprehensiveScore >= 65 ? `前${ranking}%` : `${ranking}%`;
    
    // 计算预警差距
    const gapToNext = calculateGapToNextLevel(comprehensiveScore);
    const warningText = gapToNext > 0 ? `距离上一级目标差${gapToNext}分` : '已达到最高等级';
    
    const compassHTML = `
        <div class="compass-section">
            <h4>🏥 能力定位</h4>
            <p class="ranking-display">${talentType}</p>
            <p>${diagnosisEvaluation}</p>
        </div>
        
        <div class="compass-section">
            <h4>📊 全国排名</h4>
            <p class="ranking-display">${rankingDisplay}</p>
            <p>综合得分：${comprehensiveScore.toFixed(1)}分</p>
            <p>您的综合能力在全国医学生排名${rankingDisplay}，该排名为综合排名。</p>
        </div>
        
        <div class="compass-section">
            <h4>🎯 适配报考单位</h4>
            <p class="ranking-display">${getMatchedUnits(comprehensiveScore)}</p>
            <p>根据您的综合评分${comprehensiveScore.toFixed(1)}分，建议您重点关注以上类型的医疗单位。</p>
            <p>这些单位与您当前的能力水平匹配度较高，有较大概率能成功上岸。</p>
        </div>
        
        <div class="compass-section">
            <h4>⚠️ 预警提示</h4>
            <div class="warning-alert">
                <p><strong>${warningText}</strong></p>
                ${gapToNext > 0 ? `<p>建议重点提升薄弱维度，通过针对性训练可快速进入下一能力等级。</p>` : `<p>恭喜您已达到最高等级！继续保持并发挥您的优势。</p>`}
            </div>
        </div>
    `;
    
    compassContent.innerHTML = compassHTML;
}

// 生成长图报告 - 全新简化版本
function generateLongImage() {
    // 兼容性检查
    if (!checkBrowserCompatibility()) {
        alert('您的浏览器版本过低，不支持长图生成功能。请升级浏览器后重试。');
        return;
    }
    
    // 检查Canvas支持
    var testCanvas = document.createElement('canvas');
    if (!testCanvas.getContext) {
        alert('您的浏览器不支持Canvas，无法生成长图。请使用支持Canvas的浏览器。');
        return;
    }
    
    // 添加html2canvas库（如果未加载）
    if (typeof html2canvas === 'undefined') {
        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
        script.onload = function() {
            captureReportSimple();
        };
        script.onerror = function() {
            // 备用CDN
            var backupScript = document.createElement('script');
            backupScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            backupScript.onload = function() {
                captureReportSimple();
            };
            backupScript.onerror = function() {
                alert('长图生成功能需要加载html2canvas库，请检查网络连接后重试。');
            };
            document.head.appendChild(backupScript);
        };
        document.head.appendChild(script);
        
        // 显示加载提示
        showImageGenerationTip('正在加载图片生成库，请稍候...');
    } else {
        // 显示生成进度
        showImageGenerationTip('正在生成长图，请稍候...（约需10-15秒）');
        captureReportSimple();
    }
}

// 高清版长图生成函数 - 提升清晰度并移除提示
function captureReportSimple() {
    // 隐藏按钮和提示
    var headerButtons = document.querySelector('.header-buttons');
    var originalDisplay = headerButtons ? headerButtons.style.display : '';
    if (headerButtons) headerButtons.style.display = 'none';
    
    // 移除所有生成提示以免被截图
    var existingTips = document.querySelectorAll('.image-generation-tip');
    for (var i = 0; i < existingTips.length; i++) {
        existingTips[i].remove();
    }
    
    // 准备所有内容
    prepareAllContentForCapture().then(function() {
        
        // 获取整个body而不是报告页面，确保完整截图
        var bodyElement = document.body;
        var containerElement = document.querySelector('.container');
        
        // 临时重置页面滚动和位置
        const originalScrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const originalScrollY = window.pageYOffset || document.documentElement.scrollTop;
        
        // 滚动到页面顶部左侧
        window.scrollTo(0, 0);
        
        // 等待滚动完成
        setTimeout(function() {
            
            // 使用body元素确保捕获完整内容，同时优化样式减少留白
            var reportElement = document.body;
            
            // 使用白色背景，优化性能设置
            const options = {
                backgroundColor: '#ffffff',
                scale: 1.5, // 适中分辨率，平衡质量和速度
                useCORS: true,
                allowTaint: true,
                scrollX: 0,
                scrollY: 0,
                logging: false,
                removeContainer: false,
                foreignObjectRendering: false, // 禁用以提高速度
                imageTimeout: 15000, // 减少超时时间
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight,
                // 移除固定width和height，让html2canvas自动计算完整内容尺寸
                ignoreElements: function(element) {
                    // 忽略输入页面、按钮、提示、noscript、IE兼容性警告和其他不需要的元素
                    return element.id === 'input-page' || 
                           element.classList.contains('header-buttons') || 
                           element.classList.contains('image-generation-tip') ||
                           element.tagName === 'BUTTON' ||
                           element.tagName === 'NOSCRIPT' ||
                           element.tagName === 'SCRIPT' ||
                           element.tagName === 'STYLE' ||
                           element.tagName === 'LINK' ||
                           element.tagName === 'META' ||
                           element.tagName === 'TITLE' ||
                           (element.tagName === 'DIV' && element.innerHTML && element.innerHTML.includes('浏览器兼容性提示'));
                },
                onclone: function(clonedDoc, clonedElement) {
                    console.log('=== 处理完整页面克隆文档 ===');
                    
                    // 移除所有可能的提示元素和警告信息
                    const tips = clonedDoc.querySelectorAll('.image-generation-tip');
                    for (var i = 0; i < tips.length; i++) {
                        tips[i].remove();
                    }
                    
                    // 移除noscript元素
                    const noscriptElements = clonedDoc.querySelectorAll('noscript');
                    for (var i = 0; i < noscriptElements.length; i++) {
                        noscriptElements[i].remove();
                    }
                    
                    // 移除包含JavaScript警告的div元素
                    const warningDivs = clonedDoc.querySelectorAll('div');
                    for (var i = 0; i < warningDivs.length; i++) {
                        var div = warningDivs[i];
                        if (div.innerHTML && (div.innerHTML.includes('此应用需要启用JavaScript') || 
                            div.innerHTML.includes('浏览器兼容性提示') ||
                            div.innerHTML.includes('JavaScript才能正常工作') ||
                            div.innerHTML.includes('检测到您使用的是较老版本'))) {
                            div.remove();
                        }
                    }
                    
                    // 移除所有script、style、link、meta等不需要的头部元素
                    const headElements = clonedDoc.querySelectorAll('script, style, link[rel="stylesheet"], meta');
                    for (var i = 0; i < headElements.length; i++) {
                        headElements[i].remove();
                    }
                    
                    // 重置整个文档的样式，完全去除留白
                    clonedDoc.documentElement.style.margin = '0';
                    clonedDoc.documentElement.style.padding = '0';
                    clonedDoc.documentElement.style.width = '100%';
                    clonedDoc.documentElement.style.height = 'auto';
                    
                    // 设置body为无留白布局
                    clonedDoc.body.style.margin = '0';
                    clonedDoc.body.style.padding = '0'; // 完全去掉padding
                    clonedDoc.body.style.width = '100%';
                    clonedDoc.body.style.height = 'auto';
                    clonedDoc.body.style.position = 'static';
                    clonedDoc.body.style.left = '0';
                    clonedDoc.body.style.top = '0';
                    clonedDoc.body.style.transform = 'none';
                    clonedDoc.body.style.background = '#ffffff';
                    clonedDoc.body.style.minHeight = 'auto';
                    clonedDoc.body.style.display = 'block'; // 改为block布局，减少多余空间
                    clonedDoc.body.style.justifyContent = 'flex-start';
                    clonedDoc.body.style.alignItems = 'flex-start';
                    
                    // 处理容器为紧凑居中布局，调整右侧留白匹配左侧
                    const clonedContainer = clonedDoc.querySelector('.container');
                    if (clonedContainer) {
                        clonedContainer.style.maxWidth = '1000px'; // 设置合适的最大宽度保持布局
                        clonedContainer.style.width = '100%';
                        clonedContainer.style.margin = '0 auto'; // 水平居中
                        clonedContainer.style.padding = '10px'; // 最小padding保持内容不贴边
                        clonedContainer.style.position = 'static';
                        clonedContainer.style.left = '0';
                        clonedContainer.style.top = '0';
                        clonedContainer.style.transform = 'none';
                        clonedContainer.style.display = 'block';
                        clonedContainer.style.flexDirection = 'column';
                        clonedContainer.style.alignItems = 'stretch';
                        
                        // 保持原始布局，后续将对生成的图片进行裁剪
                        // 不修改body宽度，让html2canvas生成完整图片
                    }
                    
                    // 确保报告页面显示，隐藏输入页面
                    const clonedInputPage = clonedDoc.getElementById('input-page');
                    const clonedReportPage = clonedDoc.getElementById('report-page');
                    
                    if (clonedInputPage) {
                        clonedInputPage.style.display = 'none';
                    }
                    
                    if (clonedReportPage) {
                        clonedReportPage.style.display = 'block';
                        clonedReportPage.style.position = 'static';
                        clonedReportPage.style.left = '0';
                        clonedReportPage.style.top = '0';
                        clonedReportPage.style.transform = 'none';
                        clonedReportPage.style.margin = '0';
                        clonedReportPage.style.padding = '0';
                        clonedReportPage.style.width = '100%';
                        clonedReportPage.style.background = 'rgba(255, 255, 255, 0.95)'; // 保持原始背景样式
                        clonedReportPage.style.borderRadius = '15px'; // 保持圆角以维持设计一致性
                        clonedReportPage.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)'; // 保持阴影
                        clonedReportPage.style.backdropFilter = 'blur(10px)'; // 保持模糊效果
                        clonedReportPage.style.overflow = 'visible';
                        clonedReportPage.style.border = 'none';
                        clonedReportPage.style.height = 'auto'; // 确保高度自适应内容
                        clonedReportPage.style.minHeight = 'auto'; // 确保最小高度自适应
                        // 由于隐藏了header，调整第一个section的上边距
                        const firstSection = clonedReportPage.querySelector('.report-section');
                        if (firstSection) {
                            firstSection.style.marginTop = '15px';
                        }
                    }
                    
                    // 简化雷达图处理，提高生成速度
                    const originalCanvas = document.getElementById('radarChart');
                    const clonedCanvas = clonedDoc.getElementById('radarChart');
                    
                    if (originalCanvas && clonedCanvas && originalCanvas.width > 0) {
                        try {
                            // 使用标准分辨率，减少处理时间
                            clonedCanvas.width = originalCanvas.width;
                            clonedCanvas.height = originalCanvas.height;
                            clonedCanvas.style.width = originalCanvas.style.width;
                            clonedCanvas.style.height = originalCanvas.style.height;
                            
                            const clonedCtx = clonedCanvas.getContext('2d');
                            clonedCtx.drawImage(originalCanvas, 0, 0);
                            console.log('✓ 雷达图复制完成');
                        } catch (e) {
                            console.warn('雷达图复制失败，跳过:', e);
                        }
                    }
                    
                    // 优化雷达图容器布局，进一步减少留白
                    const radarContainer = clonedDoc.querySelector('.radar-container');
                    if (radarContainer) {
                        radarContainer.style.margin = '0 auto 5px';
                        radarContainer.style.padding = '5px';
                        radarContainer.style.maxWidth = '500px';
                        radarContainer.style.height = '350px';
                    }
                    
                    // 优化雷达图图例，减少间距
                    const radarLegend = clonedDoc.querySelector('.radar-legend');
                    if (radarLegend) {
                        radarLegend.style.margin = '5px 0 0 0';
                        radarLegend.style.padding = '5px';
                        radarLegend.style.gap = '15px';
                    }
                    
                    // 优化报告section布局，确保内容完整显示
                    const reportSections = clonedDoc.querySelectorAll('.report-section');
                    reportSections.forEach((section, index) => {
                        section.style.display = 'block';
                        section.style.visibility = 'visible';
                        section.style.opacity = '1';
                        section.style.margin = '15px'; // 保持适当外边距确保内容可见
                        section.style.padding = '20px'; // 保持适当内边距
                        section.style.marginBottom = '15px'; // 保持section间距
                        section.style.background = '#ffffff';
                        section.style.borderRadius = '15px'; // 保持圆角
                        section.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)'; // 保持阴影
                        section.style.height = 'auto'; // 确保高度自适应
                        section.style.overflow = 'visible'; // 确保内容不被裁剪
                        section.style.pageBreakInside = 'avoid'; // 避免分页时断开
                    });
                    
                    // 隐藏header，去除头部文字信息
                    const header = clonedDoc.querySelector('header');
                    if (header) {
                        header.style.display = 'none';
                    }
                    
                    // 高清表格处理
                    const tables = clonedDoc.querySelectorAll('.evaluation-table');
                    tables.forEach(table => {
                        table.style.display = 'table';
                        table.style.width = '100%';
                        table.style.borderCollapse = 'collapse';
                        table.style.fontSize = '16px';
                        table.style.fontFamily = 'Arial, sans-serif';
                    });
                    
                    // 紧凑化医考航标塔
                    const compassContent = clonedDoc.querySelector('#medical-compass-content');
                    if (compassContent) {
                        compassContent.style.display = 'block';
                        compassContent.style.visibility = 'visible';
                        compassContent.style.fontSize = '16px'; // 减少字体大小
                        compassContent.style.fontFamily = 'Arial, sans-serif';
                        compassContent.style.padding = '10px'; // 减少内边距
                        compassContent.style.margin = '0';
                        compassContent.style.lineHeight = '1.4'; // 减少行间距
                    }
                    
                    // 紧凑化流程图处理
                    const mermaidChart = clonedDoc.querySelector('#mermaid-chart');
                    if (mermaidChart) {
                        mermaidChart.style.display = 'block';
                        mermaidChart.style.visibility = 'visible';
                        mermaidChart.style.height = 'auto';
                        mermaidChart.style.minHeight = '250px'; // 减少最小高度
                        mermaidChart.style.margin = '0';
                        mermaidChart.style.padding = '5px'; // 减少内边距
                        
                        // 优化流程图字体
                        const allFlowChartText = mermaidChart.querySelectorAll('*');
                        allFlowChartText.forEach(el => {
                            el.style.fontFamily = 'Arial, Microsoft YaHei, sans-serif';
                            el.style.fontSize = '16px';
                            el.style.fontWeight = 'bold';
                            el.style.textRendering = 'optimizeLegibility';
                            el.style.webkitFontSmoothing = 'antialiased';
                            el.style.mozOsxFontSmoothing = 'grayscale';
                        });
                        
                        // 特别处理SVG文字
                        const svgTexts = mermaidChart.querySelectorAll('svg text, svg tspan');
                        svgTexts.forEach(text => {
                            text.style.fontFamily = 'Arial, Microsoft YaHei, sans-serif';
                            text.style.fontSize = '16px';
                            text.style.fontWeight = 'bold';
                            text.setAttribute('font-family', 'Arial, Microsoft YaHei, sans-serif');
                            text.setAttribute('font-size', '16');
                            text.setAttribute('font-weight', 'bold');
                        });
                    }
                    
                    // 全局字体优化
                    var allElements = clonedDoc.querySelectorAll('*');
                    for (var i = 0; i < allElements.length; i++) {
                        allElements[i].style.webkitFontSmoothing = 'antialiased';
                        allElements[i].style.mozOsxFontSmoothing = 'grayscale';
                        allElements[i].style.textRendering = 'optimizeLegibility';
                    }
                    
                    // 确保所有内容区域都可见
                    for (var j = 0; j < allElements.length; j++) {
                        var el = allElements[j];
                        if (el.style.display === 'none' && el.id !== 'input-page') {
                            el.style.display = 'block'; // 显示所有非输入页面的隐藏元素
                        }
                        if (el.style.visibility === 'hidden') {
                            el.style.visibility = 'visible'; // 显示所有隐藏的元素
                        }
                        if (el.style.height && el.style.height === '0px') {
                            el.style.height = 'auto'; // 修复高度为0的元素
                        }
                    }
                    
                    // 确保Mermaid图表正确显示
                    var mermaidElements = clonedDoc.querySelectorAll('.mermaid, #mermaid-chart');
                    for (var k = 0; k < mermaidElements.length; k++) {
                        mermaidElements[k].style.display = 'block';
                        mermaidElements[k].style.visibility = 'visible';
                        mermaidElements[k].style.height = 'auto';
                        mermaidElements[k].style.minHeight = '200px'; // 确保Mermaid图表有足够空间
                    }
                    
                    console.log('✓ 完整报告处理完成，所有内容已确保可见');
                }
            };
            
            html2canvas(reportElement, options).then(function(canvas) {
                // 恢复原始滚动位置
                window.scrollTo(originalScrollX, originalScrollY);
                
                // 恢复按钮
                if (headerButtons) headerButtons.style.display = originalDisplay;
                
                // 检查canvas尺寸
                if (canvas.width === 0 || canvas.height === 0) {
                    showImageGenerationTip('长图生成失败：内容尺寸异常，请重试');
                    return;
                }
                
                // 验证canvas内容是否正常
                var ctx = canvas.getContext('2d');
                var testData = ctx.getImageData(canvas.width/2, canvas.height/2, 1, 1);
                if (!testData || testData.data.length === 0) {
                    showImageGenerationTip('长图生成失败：内容为空，请重试');
                    return;
                }
                
                showImageGenerationTip('正在裁剪和优化图片...');
                
                // 对生成的canvas进行裁剪处理
                try {
                    const croppedCanvas = cropRightMargin(canvas);
                    
                    if (!croppedCanvas || croppedCanvas.width === 0) {
                        showImageGenerationTip('图片裁剪失败，使用原始图片');
                        // 使用原始canvas作为备用
                        downloadCanvas(canvas);
                        return;
                    }
                    
                    downloadCanvas(croppedCanvas);
                } catch (error) {
                    console.error('裁剪过程出错:', error);
                    showImageGenerationTip('裁剪失败，使用原始图片');
                    downloadCanvas(canvas);
                }
            }).catch(function(error) {
                console.error('HTML2Canvas生成失败:', error);
                showImageGenerationTip('长图生成失败：' + error.message + '，请重试');
                
                // 恢复原始状态
                window.scrollTo(originalScrollX, originalScrollY);
                if (headerButtons) headerButtons.style.display = originalDisplay;
            });
        }, 200);
    }).catch(function(error) {
        console.error('内容准备失败:', error);
        showImageGenerationTip('内容准备失败，请重试');
    });
}

// 下载canvas图片的辅助函数
function downloadCanvas(canvas) {
    // 创建高质量图片 - 使用PNG最高质量
    var imageData = canvas.toDataURL('image/png', 1.0);
    var link = document.createElement('a');
    var timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    link.download = 'CTA测评报告_优化版_' + timestamp + '.png';
    link.href = imageData;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 延迟显示成功提示，避免干扰
    setTimeout(function() {
        showImageGenerationTip('✅ 长图生成成功！尺寸: ' + canvas.width + '×' + canvas.height);
    }, 100);
}

// 准备所有内容用于截图
function prepareAllContentForCapture() {
    return new Promise(function(resolve) {
        console.log('=== 准备所有内容用于截图 ===');
        
        // 1. 确保雷达图正确渲染
        var radarCanvas = document.getElementById('radarChart');
        if (radarCanvas && typeof Chart !== 'undefined') {
            const existingChart = Chart.getChart('radarChart');
            if (existingChart) {
                existingChart.resize();
                existingChart.update('none');
                existingChart.render();
                console.log('✓ 雷达图已刷新');
            }
        }
        
        // 2. 确保流程图内容存在
        var mermaidChart = document.getElementById('mermaid-chart');
        if (mermaidChart && mermaidChart.innerHTML.trim().length < 100) {
            const comprehensiveScore = ((scores.basic / 9) * 0.2 + (scores.comprehensive / 9) * 0.3 + (scores.advanced / 9) * 0.5) * 100;
            generateTextFlowChart(mermaidChart, comprehensiveScore);
            console.log('✓ 流程图内容已生成');
        }
        
        // 3. 确保医考航标塔内容存在
        var compassContent = document.getElementById('medical-compass-content');
        if (compassContent && compassContent.innerHTML.trim().length < 100) {
            generateMedicalCompass();
            console.log('✓ 医考航标塔内容已生成');
        }
        
        // 4. 确保三维评价机制表格内容存在
        const evaluationTbody = document.getElementById('evaluation-tbody');
        if (evaluationTbody && evaluationTbody.innerHTML.trim().length < 100) {
            generateEvaluationTable();
            console.log('✓ 三维评价机制表格已生成');
        }
        
        // 5. 确保所有section都是可见的
        const reportSections = document.querySelectorAll('.report-section');
        reportSections.forEach((section, index) => {
            section.style.display = 'block';
            section.style.visibility = 'visible';
            section.style.opacity = '1';
            section.style.height = 'auto';
            section.style.overflow = 'visible';
            console.log(`✓ 报告Section ${index + 1} 已确保可见`);
        });
        
        // 6. 强制重新布局
        const reportPage = document.getElementById('report-page');
        if (reportPage) {
            reportPage.style.height = 'auto';
            reportPage.style.minHeight = 'auto';
            reportPage.style.overflow = 'visible';
            // 触发重排
            reportPage.offsetHeight;
        }
        
        console.log('=== 所有内容准备完成 ===');
        
        // 延迟一点时间确保所有内容都完全渲染
        setTimeout(function() {
            resolve();
        }, 500);
    });
}


// 显示图片生成提示
function showImageGenerationTip(message) {
    const tip = document.createElement('div');
    tip.className = 'image-generation-tip';
    tip.innerHTML = `
        <div style="background: #4CAF50; color: white; padding: 15px; border-radius: 8px; margin: 20px auto; max-width: 400px; text-align: center; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10000;">
            📸 ${message}
        </div>
    `;
    document.body.appendChild(tip);
    
    // 3秒后自动移除
    setTimeout(function() {
        if (tip.parentNode) {
            tip.remove();
        }
    }, 3000);
}

// 截图报告内容
function captureReport() {
    showImageGenerationTip('正在生成长图，请稍候...');
    
    // 隐藏按钮以免截图包含
    var headerButtons = document.querySelector('.header-buttons');
    var originalDisplay = headerButtons.style.display;
    headerButtons.style.display = 'none';
    
    // 获取报告页面元素
    const reportElement = document.getElementById('report-page');
    
    // 检查报告页面的定位和尺寸
    console.log('=== 报告页面检查 ===');
    console.log('reportElement位置:', {
        offsetLeft: reportElement.offsetLeft,
        offsetTop: reportElement.offsetTop,
        scrollLeft: reportElement.scrollLeft,
        scrollTop: reportElement.scrollTop
    });
    
    // 临时重置报告页面的定位，确保从左上角开始
    const originalStyles = {
        position: reportElement.style.position,
        left: reportElement.style.left,
        top: reportElement.style.top,
        transform: reportElement.style.transform
    };
    
    reportElement.style.position = 'static';
    reportElement.style.left = '0';
    reportElement.style.top = '0';
    reportElement.style.transform = 'none';
    
    // 检查并记录当前网页流程图状态
    var mermaidChart = document.getElementById('mermaid-chart');
    
    if (mermaidChart) {
        console.log('=== 截图前流程图状态检查 ===');
        console.log('当前流程图内容长度:', mermaidChart.innerHTML.length);
        
        // 将当前状态保存到全局变量
        window.flowChartContent = mermaidChart.innerHTML;
        
        if (mermaidChart.innerHTML.trim().length < 50) {
            console.log('⚠️ 流程图内容为空，生成基本内容');
            const comprehensiveScore = ((scores.basic / 9) * 0.2 + (scores.comprehensive / 9) * 0.3 + (scores.advanced / 9) * 0.5) * 100;
            generateTextFlowChart(mermaidChart, comprehensiveScore);
            
            setTimeout(function() {
                window.flowChartContent = mermaidChart.innerHTML;
                console.log('已更新全局流程图内容');
            }, 50);
        } else {
            console.log('✓ 流程图内容正常');
        }
    } else {
        console.error('❌ 未找到流程图容器元素');
    }
    
    // 强制展开并渲染所有内容
    const prepareFullContent = () => {
        return new Promise(function(resolve) {
            console.log('=== 准备完整内容用于截图 ===');
            
            // 确保报告页面完全展开
            reportElement.style.minHeight = 'auto';
            reportElement.style.height = 'auto';
            reportElement.style.overflow = 'visible';
            reportElement.style.maxHeight = 'none';
            
            // 确保所有section完全展开
            const sections = reportElement.querySelectorAll('.report-section');
            sections.forEach((section, index) => {
                section.style.height = 'auto';
                section.style.minHeight = 'auto';
                section.style.maxHeight = 'none';
                section.style.overflow = 'visible';
                section.style.pageBreakInside = 'avoid';
                console.log('Section', index + 1, '尺寸:', section.offsetWidth, 'x', section.offsetHeight);
            });
            
            // 重新触发Chart.js渲染
            var radarCanvas = document.getElementById('radarChart');
            if (radarCanvas && typeof Chart !== 'undefined') {
                const existingChart = Chart.getChart('radarChart');
                if (existingChart) {
                    existingChart.resize();
                    existingChart.update('none');
                    existingChart.render();
                    console.log('雷达图已重新渲染');
                }
            }
            
            // 处理Mermaid图表
            const mermaidContainer = document.getElementById('mermaid-chart');
            if (mermaidContainer) {
                mermaidContainer.style.height = 'auto';
                mermaidContainer.style.minHeight = 'auto';
                mermaidContainer.style.overflow = 'visible';
                console.log('Mermaid容器内容长度:', mermaidContainer.innerHTML.length);
                
                if (mermaidContainer.innerHTML.trim().length < 50) {
                    console.log('Mermaid容器内容不足，生成文本版流程图');
                    const comprehensiveScore = ((scores.basic / 9) * 0.2 + (scores.comprehensive / 9) * 0.3 + (scores.advanced / 9) * 0.5) * 100;
                    generateTextFlowChart(mermaidContainer, comprehensiveScore);
                }
            }
            
            // 强制重排和重绘
            reportElement.offsetHeight;
            
            // 等待所有内容完全渲染
            setTimeout(function() {
                const finalHeight = Math.max(
                    reportElement.scrollHeight,
                    reportElement.offsetHeight,
                    reportElement.clientHeight
                );
                console.log('最终内容高度:', finalHeight);
                resolve();
            }, 1500);
        });
    };
    
    prepareFullContent().then(function() {
        // 直接捕获整个body或container，而不是单独的报告页面
        var bodyElement = document.body;
        var containerElement = document.querySelector('.container');
        var targetElement = containerElement || bodyElement;
        
        // 计算目标元素的完整尺寸
        var fullWidth = Math.max(
            targetElement.scrollWidth,
            targetElement.offsetWidth,
            targetElement.clientWidth,
            1200 // 确保至少有足够的宽度
        );
        var fullHeight = Math.max(
            targetElement.scrollHeight,
            targetElement.offsetHeight,
            targetElement.clientHeight
        );
        
        console.log('=== 使用新的截图目标 ===');
        console.log('目标元素:', targetElement.className || targetElement.tagName);
        console.log('目标尺寸:', fullWidth, 'x', fullHeight);
        console.log('目标位置:', {
            offsetLeft: targetElement.offsetLeft,
            offsetTop: targetElement.offsetTop,
            scrollLeft: targetElement.scrollLeft,
            scrollTop: targetElement.scrollTop
        });
        
        // 创建专门用于截图的配置，确保捕获完整内容
        const options = {
            allowTaint: true,
            useCORS: true,
            scale: 1,  // 先用1倍确保能正常工作
            scrollX: 0,
            scrollY: 0,
            backgroundColor: '#ffffff',
            logging: true,
            removeContainer: false,
            imageTimeout: 60000,
            foreignObjectRendering: true,
            ignoreElements: function(element) {
                return element.classList.contains('header-buttons') || 
                       element.tagName === 'BUTTON';
            },
            onclone: function(clonedDoc, element) {
                console.log('=== 开始处理克隆文档 ===');
                console.log('克隆目标元素:', element.className || element.tagName);
                
                // 处理整个文档的定位和样式
                const clonedBody = clonedDoc.body;
                const clonedHtml = clonedDoc.documentElement;
                
                // 重置HTML根元素
                if (clonedHtml) {
                    clonedHtml.style.margin = '0';
                    clonedHtml.style.padding = '0';
                    clonedHtml.style.width = '100%';
                    clonedHtml.style.height = 'auto';
                }
                
                // 重置body元素
                if (clonedBody) {
                    clonedBody.style.margin = '0';
                    clonedBody.style.padding = '0';
                    clonedBody.style.position = 'static';
                    clonedBody.style.width = '100%';
                    clonedBody.style.minHeight = fullHeight + 'px';
                    clonedBody.style.background = '#667eea';
                    clonedBody.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                }
                
                // 处理容器元素（如果存在）
                const clonedContainer = clonedDoc.querySelector('.container');
                if (clonedContainer) {
                    clonedContainer.style.maxWidth = 'none';
                    clonedContainer.style.width = '100%';
                    clonedContainer.style.margin = '0';
                    clonedContainer.style.padding = '20px';
                    clonedContainer.style.position = 'static';
                    console.log('已重置容器样式');
                }
                
                // 处理报告页面（如果存在）
                const clonedReportPage = clonedDoc.getElementById('report-page');
                if (!clonedReportPage) {
                    console.warn('克隆文档中未找到report-page元素');
                    return;
                }
                
                // 移除所有动画和过渡效果
                var allElementsInClone = clonedElement.querySelectorAll('*');
                allElements.forEach(el => {
                    el.style.animation = 'none';
                    el.style.transition = 'none';
                    el.style.transform = 'none';
                });
                
                // 强制设置基础样式
                clonedElement.style.backgroundColor = '#ffffff';
                clonedElement.style.fontFamily = 'Arial, sans-serif';
                clonedElement.style.fontSize = '14px';
                clonedElement.style.lineHeight = '1.5';
                clonedElement.style.color = '#333333';
                
                // 修复克隆文档的定位和尺寸问题
                clonedElement.style.minHeight = fullHeight + 'px';
                clonedElement.style.width = fullWidth + 'px';
                clonedElement.style.maxWidth = fullWidth + 'px';
                clonedElement.style.overflow = 'visible';
                clonedElement.style.position = 'static'; // 改为static避免定位问题
                clonedElement.style.left = '0';
                clonedElement.style.top = '0';
                clonedElement.style.margin = '0';
                clonedElement.style.padding = '0';
                
                // 确保容器占据全宽，不居中显示
                const container = clonedElement.closest('.container');
                if (container) {
                    container.style.maxWidth = 'none'; // 移除最大宽度限制
                    container.style.width = fullWidth + 'px';
                    container.style.margin = '0'; // 移除居中margin
                    container.style.padding = '20px';
                    container.style.position = 'static';
                    container.style.left = '0';
                    container.style.top = '0';
                    console.log('已调整容器样式，宽度:', container.style.width);
                }
                
                // 处理所有报告section，确保它们完全可见
                const sections = clonedElement.querySelectorAll('.report-section');
                console.log('发现', sections.length, '个报告section');
                sections.forEach((section, index) => {
                    section.style.backgroundColor = '#ffffff';
                    section.style.margin = '20px';
                    section.style.padding = '30px';
                    section.style.borderRadius = '15px';
                    section.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
                    section.style.marginBottom = '30px';
                    section.style.pageBreakInside = 'avoid';
                    section.style.minHeight = 'auto';
                    section.style.height = 'auto';
                    section.style.overflow = 'visible';
                    section.style.display = 'block';
                    section.style.visibility = 'visible';
                    section.style.opacity = '1';
                    
                    console.log('处理section', index + 1, '高度:', section.scrollHeight);
                });
                
                // 处理雷达图区域
                const radarCanvas = clonedElement.querySelector('#radarChart');
                if (radarCanvas) {
                    const originalCanvas = reportElement.querySelector('#radarChart');
                    if (originalCanvas && originalCanvas.width > 0) {
                        try {
                            radarCanvas.width = originalCanvas.width;
                            radarCanvas.height = originalCanvas.height;
                            const clonedCtx = radarCanvas.getContext('2d');
                            clonedCtx.drawImage(originalCanvas, 0, 0);
                            console.log('雷达图复制成功');
                        } catch (e) {
                            console.error('雷达图复制失败:', e);
                        }
                    }
                }
                
                // 处理表格样式
                const tables = clonedElement.querySelectorAll('.evaluation-table');
                tables.forEach(table => {
                    table.style.width = '100%';
                    table.style.borderCollapse = 'collapse';
                    table.style.backgroundColor = '#ffffff';
                    table.style.fontSize = '14px';
                    
                    const ths = table.querySelectorAll('th');
                    ths.forEach(th => {
                        th.style.backgroundColor = '#4CAF50';
                        th.style.color = '#ffffff';
                        th.style.padding = '15px';
                        th.style.textAlign = 'center';
                        th.style.fontWeight = 'bold';
                        th.style.border = '1px solid #ddd';
                    });
                    
                    const tds = table.querySelectorAll('td');
                    tds.forEach(td => {
                        td.style.padding = '15px';
                        td.style.border = '1px solid #eee';
                        td.style.backgroundColor = '#ffffff';
                        td.style.textAlign = 'left';
                        td.style.verticalAlign = 'top';
                    });
                });
                
                // 处理医考航标塔
                const compassSections = clonedElement.querySelectorAll('.compass-section');
                compassSections.forEach(section => {
                    section.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    section.style.margin = '20px 0';
                    section.style.padding = '20px';
                    section.style.borderRadius = '10px';
                    section.style.borderLeft = '4px solid #ffffff';
                });
                
                // === 关键：确保Mermaid SVG流程图在克隆文档中正确显示 ===
                console.log('=== 开始处理Mermaid流程图内容 ===');
                
                // 获取原始页面的流程图内容
                const originalMermaidChart = reportElement.querySelector('#mermaid-chart');
                const originalMermaidContainer = reportElement.querySelector('.mermaid-container');
                
                console.log('原始页面元素检查:', {
                    'originalMermaidChart存在': !!originalMermaidChart,
                    'originalMermaidContainer存在': !!originalMermaidContainer
                });
                
                if (originalMermaidChart) {
                    console.log('原始流程图内容长度:', originalMermaidChart.innerHTML.length);
                    console.log('原始内容预览:', originalMermaidChart.innerHTML.substring(0, 200));
                }
                
                // 处理克隆文档中的流程图
                const clonedMermaidChart = clonedElement.querySelector('#mermaid-chart');
                const clonedMermaidContainer = clonedElement.querySelector('.mermaid-container');
                
                console.log('克隆文档元素检查:', {
                    'clonedMermaidChart存在': !!clonedMermaidChart,
                    'clonedMermaidContainer存在': !!clonedMermaidContainer
                });
                
                // 使用全局存储的内容或从原始页面获取
                let flowChartContent = window.flowChartContent || '';
                if (!flowChartContent && originalMermaidChart && originalMermaidChart.innerHTML.trim().length > 50) {
                    flowChartContent = originalMermaidChart.innerHTML;
                    console.log('从原始页面获取流程图内容');
                }
                
                if (flowChartContent && flowChartContent.trim().length > 50) {
                    console.log('开始设置克隆文档中的流程图内容，长度:', flowChartContent.length);
                    
                    if (clonedMermaidChart) {
                        // 设置内容
                        clonedMermaidChart.innerHTML = flowChartContent;
                        
                        // 设置样式确保显示
                        clonedMermaidChart.style.cssText = `
                            display: block !important;
                            visibility: visible !important;
                            opacity: 1 !important;
                            width: 100% !important;
                            height: auto !important;
                            padding: 10px !important;
                            margin: 20px 0 !important;
                            background: white !important;
                            border-radius: 8px !important;
                            text-align: center !important;
                        `;
                        
                        console.log('✓ 已设置克隆的mermaid-chart内容和样式');
                    }
                    
                    if (clonedMermaidContainer) {
                        // 确保容器样式正确
                        clonedMermaidContainer.style.cssText = `
                            display: block !important;
                            visibility: visible !important;
                            opacity: 1 !important;
                            background: white !important;
                            padding: 20px !important;
                            border-radius: 8px !important;
                            margin: 20px 0 !important;
                            text-align: center !important;
                        `;
                        
                        console.log('✓ 已设置克隆的mermaid-container样式');
                    }
                } else {
                    console.log('⚠️ 没有找到有效的流程图内容');
                    
                    // 如果没有内容，生成基本的文本版流程图作为备用
                    if (clonedMermaidChart || clonedMermaidContainer) {
                        const comprehensiveScore = ((scores.basic / 9) * 0.2 + (scores.comprehensive / 9) * 0.3 + (scores.advanced / 9) * 0.5) * 100;
                        const backupContent = `
                            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #ddd;">
                                <h4 style="margin-bottom: 15px; color: #333;">进化路径流程图</h4>
                                <div style="color: #666;">当前综合得分: ${comprehensiveScore.toFixed(1)}</div>
                                <div style="margin: 10px 0;">↓</div>
                                <div style="color: #666;">能力诊断 → 针对性训练 → 成功上岸</div>
                            </div>
                        `;
                        
                        if (clonedMermaidChart) {
                            clonedMermaidChart.innerHTML = backupContent;
                        } else if (clonedMermaidContainer) {
                            clonedMermaidContainer.innerHTML = backupContent;
                        }
                        
                        console.log('已设置备用流程图内容');
                    }
                }
                
                // 处理所有SVG元素，确保它们在截图中正确显示
                const svgs = clonedElement.querySelectorAll('svg');
                console.log('发现', svgs.length, '个SVG元素');
                svgs.forEach((svg, index) => {
                    console.log('处理SVG元素', index);
                    svg.style.cssText = `
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                        max-width: 100% !important;
                        height: auto !important;
                        margin: 0 auto !important;
                        background: white !important;
                    `;
                    
                    // 确保SVG有合适的尺寸
                    if (!svg.getAttribute('width') || svg.getAttribute('width') === '0') {
                        svg.setAttribute('width', '600');
                    }
                    if (!svg.getAttribute('height') || svg.getAttribute('height') === '0') {
                        svg.setAttribute('height', '400');
                    }
                });
                
                console.log('Mermaid流程图处理完成');
            }
        };
        
        console.log('开始html2canvas截图，目标尺寸:', fullWidth, 'x', fullHeight);
        html2canvas(reportElement, options).then(function(canvas) {
            console.log('=== 截图完成 ===');
            console.log('Canvas尺寸:', canvas.width, 'x', canvas.height);
            console.log('预期尺寸:', fullWidth * options.scale, 'x', fullHeight * options.scale);
            
            // 恢复按钮显示和原始样式
            headerButtons.style.display = originalDisplay;
            
            // 恢复报告页面的原始定位样式
            reportElement.style.position = originalStyles.position;
            reportElement.style.left = originalStyles.left;
            reportElement.style.top = originalStyles.top;
            reportElement.style.transform = originalStyles.transform;
            
            // 检查canvas是否生成成功
            if (canvas.width === 0 || canvas.height === 0) {
                console.error('Canvas尺寸异常');
                showImageGenerationTip('长图生成失败：内容尺寸异常，请重试。');
                return;
            }
            
            // 验证内容完整性
            const expectedHeight = fullHeight * options.scale;
            const actualHeight = canvas.height;
            const heightRatio = actualHeight / expectedHeight;
            
            console.log('高度完整性检查:', heightRatio);
            
            if (heightRatio < 0.8) {
                console.warn('⚠️ 可能存在内容截断，实际高度比预期低', (1 - heightRatio) * 100, '%');
            }
            
            // 创建高质量的图片
            const imageData = canvas.toDataURL('image/png', 1.0);
            
            // 创建下载链接
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
            link.download = `CTA测评报告_${timestamp}.png`;
            link.href = imageData;
            
            // 自动下载
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            const sizeInfo = `${Math.round(canvas.width)}×${Math.round(canvas.height)}`;
            showImageGenerationTip(`✅ 长图报告生成成功！尺寸: ${sizeInfo}，请查看下载文件夹。`);
            
            // 显示预览（可选）
            // showImagePreview(imageData);
            
        }).catch(function(error) {
            console.error('生成长图失败:', error);
            
            // 恢复样式
            headerButtons.style.display = originalDisplay;
            reportElement.style.position = originalStyles.position;
            reportElement.style.left = originalStyles.left;
            reportElement.style.top = originalStyles.top;
            reportElement.style.transform = originalStyles.transform;
            
            showImageGenerationTip('长图生成失败：' + error.message);
        });
    });
}

// 可选：显示图片预览功能
function showImagePreview(imageData) {
    const previewWindow = window.open('', '_blank');
    previewWindow.document.write(`
        <html>
            <head><title>CTA测评报告预览</title></head>
            <body style="margin:0;padding:20px;text-align:center;background:#f5f5f5;">
                <h2>CTA测评报告预览</h2>
                <img src="${imageData}" style="max-width:100%;border:1px solid #ddd;box-shadow:0 4px 8px rgba(0,0,0,0.1);" />
                <p style="margin-top:20px;color:#666;">图片已自动下载到您的设备</p>
            </body>
        </html>
    `);
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查关键元素是否存在
    if (!scoreInput) {
        console.error('输入框元素未找到');
        return;
    }
    
    // 为输入框添加实时验证
    scoreInput.addEventListener('input', function() {
        let value = this.value;
        
        // 移除非数字和小数点以外的字符
        value = value.replace(/[^0-9.]/g, '');
        
        // 确保只有一个小数点
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
        
        // 限制格式为99.9
        if (value.length > 4) {
            value = value.slice(0, 4);
        }
        
        // 自动添加小数点
        if (value.length === 2 && !value.includes('.')) {
            value = value + '.';
        }
        
        this.value = value;
        
        // 实时清除错误信息
        if (value) {
            clearError();
        }
        
        // 输入完整时添加视觉反馈
        if (value.length === 4 && /^[0-9]{2}\.[0-9]$/.test(value)) {
            this.style.borderColor = '#4CAF50';
            this.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.3)';
        } else {
            this.style.borderColor = '#ddd';
            this.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)';
        }
    });
    
    // 自动添加小数点
    scoreInput.addEventListener('keyup', function() {
        let value = this.value;
        if (value.length === 2 && !value.includes('.') && /^[0-9]{2}$/.test(value)) {
            this.value = value + '.';
        }
    });
    
    // 添加回车键支持
    scoreInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            generateReport();
        }
    });
});