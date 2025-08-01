const initSalesTrendChart = (todayVsYesterday, currentVsPreviousMonth) => {
    const ctx = document.getElementById('sales-trend-chart').getContext('2d');
    
    // Destruir gráfica existente si hay una
    if (window.salesTrendChart instanceof Chart) {
        window.salesTrendChart.destroy();
    }
    
    // Calcular porcentajes de cambio para mostrar tendencias
    const dailyChange = todayVsYesterday.yesterday !== 0 
        ? ((todayVsYesterday.today - todayVsYesterday.yesterday) / todayVsYesterday.yesterday * 100).toFixed(1)
        : 0;
    
    const monthlyChange = currentVsPreviousMonth.previousMonth !== 0 
        ? ((currentVsPreviousMonth.currentMonth - currentVsPreviousMonth.previousMonth) / currentVsPreviousMonth.previousMonth * 100).toFixed(1)
        : 0;

    // Detectar si es dispositivo móvil
    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;
    
    // Colores más modernos y atractivos
    const colors = {
        primary: {
            bg: 'rgba(99, 102, 241, 0.8)',
            border: 'rgba(99, 102, 241, 1)',
            gradient: ['rgba(99, 102, 241, 0.8)', 'rgba(99, 102, 241, 0.4)']
        },
        secondary: {
            bg: 'rgba(236, 72, 153, 0.8)',
            border: 'rgba(236, 72, 153, 1)',
            gradient: ['rgba(236, 72, 153, 0.8)', 'rgba(236, 72, 153, 0.4)']
        },
        success: 'rgba(34, 197, 94, 0.8)',
        danger: 'rgba(239, 68, 68, 0.8)',
        grid: 'rgba(148, 163, 184, 0.2)',
        text: 'rgba(71, 85, 105, 0.8)'
    };
    
    // Crear gradientes para las barras
    const primaryGradient = ctx.createLinearGradient(0, 0, 0, 400);
    primaryGradient.addColorStop(0, colors.primary.gradient[0]);
    primaryGradient.addColorStop(1, colors.primary.gradient[1]);
    
    const secondaryGradient = ctx.createLinearGradient(0, 0, 0, 400);
    secondaryGradient.addColorStop(0, colors.secondary.gradient[0]);
    secondaryGradient.addColorStop(1, colors.secondary.gradient[1]);

    // Configuración responsive para labels
    const responsiveLabels = isMobile 
        ? ['Hoy vs Ayer', 'Mes vs Anterior'] 
        : ['Hoy vs Ayer', 'Mes Actual vs Anterior'];
    
    // Configuración de la gráfica mejorada y responsive
    window.salesTrendChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: responsiveLabels,
            datasets: [
                {
                    label: isMobile ? 'Actual' : 'Período Actual',
                    data: [todayVsYesterday.today, currentVsPreviousMonth.currentMonth],
                    backgroundColor: primaryGradient,
                    borderColor: colors.primary.border,
                    borderWidth: isMobile ? 1 : 2,
                    borderRadius: isMobile ? 6 : 8,
                    borderSkipped: false,
                    barThickness: isMobile ? (isSmallMobile ? 25 : 30) : 40,
                    categoryPercentage: 0.8,
                    barPercentage: 0.9
                },
                {
                    label: isMobile ? 'Anterior' : 'Período Anterior',
                    data: [todayVsYesterday.yesterday, currentVsPreviousMonth.previousMonth],
                    backgroundColor: secondaryGradient,
                    borderColor: colors.secondary.border,
                    borderWidth: isMobile ? 1 : 2,
                    borderRadius: isMobile ? 6 : 8,
                    borderSkipped: false,
                    barThickness: isMobile ? (isSmallMobile ? 25 : 30) : 40,
                    categoryPercentage: 0.8,
                    barPercentage: 0.9
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            // Configuración específica para móviles
            devicePixelRatio: isMobile ? 2 : undefined,
            animation: {
                duration: isMobile ? 800 : 1200,
                easing: 'easeOutQuart'
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'center',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'rectRounded',
                        padding: isMobile ? 12 : 20,
                        font: {
                            size: isMobile ? (isSmallMobile ? 10 : 11) : 13,
                            weight: '500'
                        },
                        color: colors.text,
                        // Reducir texto en móviles muy pequeños
                        generateLabels: function(chart) {
                            const original = Chart.defaults.plugins.legend.labels.generateLabels;
                            const labels = original.call(this, chart);
                            
                            if (isSmallMobile) {
                                labels.forEach(label => {
                                    if (label.text === 'Período Actual') label.text = 'Actual';
                                    if (label.text === 'Período Anterior') label.text = 'Anterior';
                                });
                            }
                            return labels;
                        }
                    }
                },
                title: {
                    display: !isSmallMobile, // Ocultar título en móviles muy pequeños
                    text: isMobile ? 'Tendencias de Ventas' : 'Análisis de Tendencias de Ventas',
                    font: {
                        size: isMobile ? (isSmallMobile ? 14 : 16) : 18,
                        weight: 'bold'
                    },
                    color: colors.text,
                    padding: {
                        top: isMobile ? 5 : 10,
                        bottom: isMobile ? 15 : 30
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: 'rgba(99, 102, 241, 0.5)',
                    borderWidth: 1,
                    cornerRadius: isMobile ? 8 : 10,
                    displayColors: true,
                    padding: isMobile ? 10 : 15,
                    titleFont: {
                        size: isMobile ? 12 : 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: isMobile ? 11 : 13
                    },
                    // Configuración responsive para tooltips
                    position: isMobile ? 'nearest' : 'average',
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            const value = new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: 'COP',
                                minimumFractionDigits: 0,
                                // Formato más corto en móviles
                                notation: isMobile && context.parsed.y >= 1000000 ? 'compact' : 'standard',
                                compactDisplay: 'short'
                            }).format(context.parsed.y);
                            
                            const label = isMobile ? context.dataset.label : `${context.dataset.label}`;
                            return `${label}: ${value}`;
                        },
                        afterBody: function(context) {
                            const changeText = context[0].dataIndex === 0 
                                ? (isMobile ? `${dailyChange > 0 ? '+' : ''}${dailyChange}%` : `Cambio diario: ${dailyChange > 0 ? '+' : ''}${dailyChange}%`)
                                : (isMobile ? `${monthlyChange > 0 ? '+' : ''}${monthlyChange}%` : `Cambio mensual: ${monthlyChange > 0 ? '+' : ''}${monthlyChange}%`);
                            return changeText;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: colors.grid,
                        drawBorder: false,
                        lineWidth: 1
                    },
                    border: {
                        display: false
                    },
                    title: {
                        display: !isSmallMobile, // Ocultar en móviles muy pequeños
                        text: 'Ventas (COP)',
                        font: {
                            size: isMobile ? 12 : 14,
                            weight: '600'
                        },
                        color: colors.text,
                        padding: {
                            bottom: isMobile ? 5 : 10
                        }
                    },
                    ticks: {
                        color: colors.text,
                        font: {
                            size: isMobile ? (isSmallMobile ? 9 : 10) : 12
                        },
                        padding: isMobile ? 5 : 10,
                        maxTicksLimit: isMobile ? 5 : 8, // Limitar ticks en móviles
                        callback: function(value) {
                            if (value >= 1000000) {
                                return isMobile ? `$${(value / 1000000).toFixed(1)}M` : `$${(value / 1000000).toFixed(1)}M`;
                            } else if (value >= 1000) {
                                return isMobile ? `$${(value / 1000).toFixed(0)}K` : `$${(value / 1000).toFixed(0)}K`;
                            }
                            if (isMobile && !isSmallMobile) {
                                return new Intl.NumberFormat('es-CO', {
                                    style: 'currency',
                                    currency: 'COP',
                                    minimumFractionDigits: 0,
                                    notation: 'compact',
                                    compactDisplay: 'short'
                                }).format(value).replace('COP', '').trim();
                            } else if (isSmallMobile) {
                                return `$${(value / 1000).toFixed(0)}K`;
                            }
                            return new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: 'COP',
                                minimumFractionDigits: 0
                            }).format(value).replace('COP', '').trim();
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    },
                    title: {
                        display: !isMobile, // Ocultar título del eje X en móviles
                        text: 'Períodos de Comparación',
                        font: {
                            size: 14,
                            weight: '600'
                        },
                        color: colors.text,
                        padding: {
                            top: 10
                        }
                    },
                    ticks: {
                        color: colors.text,
                        font: {
                            size: isMobile ? (isSmallMobile ? 9 : 10) : 12,
                            weight: '500'
                        },
                        padding: isMobile ? 5 : 10,
                        maxRotation: 0, // Evitar rotación de texto en móviles
                        minRotation: 0
                    }
                }
            },
            layout: {
                padding: {
                    top: isMobile ? 5 : 10,
                    right: isMobile ? 10 : 20,
                    bottom: isMobile ? 5 : 10,
                    left: isMobile ? 10 : 20
                }
            }
        },
        plugins: [{
            id: 'customDataLabels',
            afterDatasetsDraw: function(chart) {
                // No mostrar labels de datos en móviles muy pequeños
                if (isSmallMobile) return;
                
                const ctx = chart.ctx;
                chart.data.datasets.forEach((dataset, datasetIndex) => {
                    const meta = chart.getDatasetMeta(datasetIndex);
                    meta.data.forEach((bar, index) => {
                        const value = dataset.data[index];
                        if (value > 0) {
                            ctx.save();
                            ctx.font = `bold ${isMobile ? '9px' : '11px'} Arial`;
                            ctx.fillStyle = colors.text;
                            ctx.textAlign = 'center';
                            
                            let displayValue;
                            if (value >= 1000000) {
                                displayValue = '$' + (value / 1000000).toFixed(1) + 'M';
                            } else if (value >= 1000) {
                                displayValue = '$' + (value / 1000).toFixed(0) + 'K';
                            } else {
                                displayValue = isMobile ? '$' + (value / 1000).toFixed(0) + 'K' : '$' + value.toLocaleString();
                            }
                            
                            ctx.fillText(displayValue, bar.x, bar.y - (isMobile ? 5 : 8));
                            ctx.restore();
                        }
                    });
                });
            }
        }]
    });

    // Listener para redimensionamiento de ventana
    const resizeHandler = () => {
        if (window.salesTrendChart) {
            const newIsMobile = window.innerWidth <= 768;
            const newIsSmallMobile = window.innerWidth <= 480;
            
            // Si cambia de móvil a desktop o viceversa, recrear la gráfica
            if ((isMobile !== newIsMobile) || (isSmallMobile !== newIsSmallMobile)) {
                // Esperar un poco para que el DOM se actualice
                setTimeout(() => {
                    initSalesTrendChart(todayVsYesterday, currentVsPreviousMonth);
                }, 100);
            } else {
                // Solo redimensionar
                window.salesTrendChart.resize();
            }
        }
    };

    // Remover listener anterior si existe
    if (window.chartResizeHandler) {
        window.removeEventListener('resize', window.chartResizeHandler);
    }

    // Agregar nuevo listener
    window.chartResizeHandler = resizeHandler;
    window.addEventListener('resize', resizeHandler);
};

export { initSalesTrendChart };