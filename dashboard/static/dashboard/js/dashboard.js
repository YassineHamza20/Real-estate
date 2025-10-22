// static/dashboard/js/dashboard.js
class DashboardCharts {
    constructor() {
        this.charts = {};
        this.realtimeInterval = null;
        this.isRealtimeActive = false; // Start with real-time OFF
        this.currentTheme = localStorage.getItem('theme') || 'light';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initCharts();
        this.applyTheme(this.currentTheme);
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Export functionality
        document.querySelectorAll('.export-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.exportChart(e.target.dataset.export);
            });
        });

        // Real-time toggle
        const realtimeToggle = document.getElementById('realtime-toggle');
        if (realtimeToggle) {
            realtimeToggle.addEventListener('click', () => {
                this.toggleRealtimeUpdates();
            });
        }

        // Drill-down actions
        document.querySelectorAll('.chart-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.drillDownChart(e.target.dataset.chart);
            });
        });

        // Responsive breakpoints
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));
    }

    initCharts() {
        const colors = this.getThemeColors();
        const data = window.dashboardData;
        
        // 1. User Distribution Chart
        const usersCtx = document.getElementById('usersChart');
        if (usersCtx) {
            this.charts.usersChart = new Chart(usersCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Buyers', 'Sellers', 'Admins'],
                    datasets: [{
                        data: [data.totalBuyers, data.totalSellers, data.totalAdmins],
                        backgroundColor: [colors.primary, colors.secondary, colors.accent],
                        borderWidth: 0,
                        borderRadius: 4
                    }]
                },
                options: this.getChartOptions('doughnut', colors)
            });
        }

        // 2. Monthly Growth Chart
        const growthCtx = document.getElementById('growthChart');
        if (growthCtx && data.monthlyRegistrations) {
            this.charts.growthChart = new Chart(growthCtx, {
                type: 'line',
                data: {
                    labels: data.monthlyRegistrations.labels,
                    datasets: [{
                        label: 'User Registrations',
                        data: data.monthlyRegistrations.data,
                        borderColor: colors.primary,
                        backgroundColor: this.hexToRgba(colors.primary, 0.1),
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: this.getChartOptions('line', colors)
            });
        }

        // 3. Property Types Chart
        const propertiesCtx = document.getElementById('propertiesChart');
        if (propertiesCtx && data.propertyTypes) {
            this.charts.propertiesChart = new Chart(propertiesCtx, {
                type: 'pie',
                data: {
                    labels: data.propertyTypes.labels,
                    datasets: [{
                        data: data.propertyTypes.data,
                        backgroundColor: Object.values(colors),
                        borderWidth: 0
                    }]
                },
                options: this.getChartOptions('pie', colors)
            });
        }

        // 4. Price Ranges Chart
        const priceCtx = document.getElementById('priceChart');
        if (priceCtx && data.priceRanges) {
            this.charts.priceChart = new Chart(priceCtx, {
                type: 'bar',
                data: {
                    labels: data.priceRanges.labels,
                    datasets: [{
                        label: 'Properties',
                        data: data.priceRanges.data,
                        backgroundColor: colors.secondary,
                        borderRadius: 4
                    }]
                },
                options: this.getChartOptions('bar', colors)
            });
        }

        // 5. Verification Chart
        const verificationCtx = document.getElementById('verificationChart');
        if (verificationCtx) {
            this.charts.verificationChart = new Chart(verificationCtx, {
                type: 'bar',
                data: {
                    labels: ['Verified', 'Pending', 'Not Submitted'],
                    datasets: [{
                        data: [data.verifiedSellers, data.pendingVerifications, data.unsubmittedSellers],
                        backgroundColor: [colors.secondary, colors.warning, colors.neutral],
                        borderRadius: 4
                    }]
                },
                options: this.getChartOptions('horizontalBar', colors)
            });
        }

        // 6. Cities Chart
        const citiesCtx = document.getElementById('citiesChart');
        if (citiesCtx && data.citiesData) {
            this.charts.citiesChart = new Chart(citiesCtx, {
                type: 'bar',
                data: {
                    labels: data.citiesData.labels,
                    datasets: [{
                        data: data.citiesData.data,
                        backgroundColor: colors.primary,
                        borderRadius: 4
                    }]
                },
                options: this.getChartOptions('bar', colors)
            });
        }

        // 7. Rooms Chart
        const roomsCtx = document.getElementById('roomsChart');
        if (roomsCtx && data.roomsData) {
            this.charts.roomsChart = new Chart(roomsCtx, {
                type: 'bar',
                data: {
                    labels: data.roomsData.labels,
                    datasets: [{
                        data: data.roomsData.data,
                        backgroundColor: colors.accent,
                        borderRadius: 4
                    }]
                },
                options: this.getChartOptions('bar', colors)
            });
        }
    }

    getChartOptions(type, colors) {
        const baseOptions = {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 11, family: 'Inter' },
                        padding: 20,
                        usePointStyle: true,
                        color: colors.text
                    }
                },
                tooltip: {
                    backgroundColor: colors.surface,
                    titleColor: colors.text,
                    bodyColor: colors.text,
                    borderColor: colors.border,
                    borderWidth: 1
                }
            }
        };

        if (type === 'line' || type === 'bar') {
            baseOptions.scales = {
                y: {
                    beginAtZero: true,
                    grid: { color: colors.grid },
                    ticks: { color: colors.text }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: colors.text }
                }
            };
        }

        if (type === 'horizontalBar') {
            baseOptions.indexAxis = 'y';
            baseOptions.scales = {
                x: {
                    beginAtZero: true,
                    grid: { color: colors.grid },
                    ticks: { color: colors.text }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: colors.text }
                }
            };
            baseOptions.plugins.legend = { display: false };
        }

        if (type === 'doughnut' || type === 'pie') {
            baseOptions.cutout = type === 'doughnut' ? '65%' : 0;
        }

        return baseOptions;
    }

    getThemeColors() {
        const isDark = this.currentTheme === 'dark';
        return {
            primary: '#3b82f6',
            secondary: '#10b981',
            accent: '#0ea5e9',
            warning: '#f59e0b',
            neutral: '#6b7280',
            text: isDark ? '#f9fafb' : '#111827',
            surface: isDark ? '#1f2937' : '#ffffff',
            border: isDark ? '#374151' : '#e5e7eb',
            grid: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        };
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
        
        // Update all charts with new theme
        Object.values(this.charts).forEach(chart => {
            chart.destroy();
        });
        this.initCharts();
    }

    applyTheme(theme) {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    toggleRealtimeUpdates() {
        this.isRealtimeActive = !this.isRealtimeActive;
        const btn = document.getElementById('realtime-toggle');
        
        if (this.isRealtimeActive) {
            this.startRealtimeUpdates();
            if (btn) {
                btn.textContent = '🔄 Live Updates: ON';
                btn.classList.add('bg-green-100', 'text-green-800', 'dark:bg-green-900', 'dark:text-green-200');
                btn.classList.remove('bg-red-100', 'text-red-800', 'dark:bg-red-900', 'dark:text-red-200');
            }
        } else {
            this.stopRealtimeUpdates();
            if (btn) {
                btn.textContent = '⏸️ Live Updates: OFF';
                btn.classList.add('bg-red-100', 'text-red-800', 'dark:bg-red-900', 'dark:text-red-200');
                btn.classList.remove('bg-green-100', 'text-green-800', 'dark:bg-green-900', 'dark:text-green-200');
            }
        }
    }

    startRealtimeUpdates() {
        this.realtimeInterval = setInterval(() => {
            this.updateChartData();
        }, 10000); // Update every 10 seconds
    }

    stopRealtimeUpdates() {
        if (this.realtimeInterval) {
            clearInterval(this.realtimeInterval);
            this.realtimeInterval = null;
        }
    }

    async updateChartData() {
        try {
            if (!window.dashboardData || !window.dashboardData.updateUrl) {
                console.warn('No update URL configured');
                return;
            }

            const response = await fetch(window.dashboardData.updateUrl);
            const newData = await response.json();
            
            // Update users chart
            if (this.charts.usersChart) {
                this.charts.usersChart.data.datasets[0].data = [
                    newData.total_buyers,
                    newData.total_sellers,
                    newData.total_admins
                ];
                this.charts.usersChart.update('none');
            }
            
            this.updateLastUpdatedTime();
        } catch (error) {
            console.error('Failed to update chart data:', error);
        }
    }

    updateLastUpdatedTime() {
        const now = new Date();
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString();
        }
    }

    exportChart(format) {
        const chartIds = Object.keys(this.charts);
        
        if (format === 'png') {
            chartIds.forEach(chartId => {
                const chart = this.charts[chartId];
                const link = document.createElement('a');
                link.download = `${chartId}-${new Date().toISOString().split('T')[0]}.png`;
                link.href = chart.toBase64Image();
                link.click();
            });
        } else if (format === 'pdf') {
            alert('PDF export would require jsPDF library. Exporting as PNG instead.');
            this.exportChart('png');
        }
    }

    drillDownChart(chartId) {
        console.log(`Drill-down for ${chartId}`);
        // Implement your drill-down logic here
        alert(`Drill-down feature for ${chartId} - This would show detailed data`);
    }

    handleResize() {
        Object.values(this.charts).forEach(chart => {
            chart.resize();
        });
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}


// Initialize theme from localStorage or system preference
const savedTheme = localStorage.getItem('theme') || 
                  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
    document.getElementById('theme-icon').textContent = '☀️';
} else {
    document.documentElement.classList.remove('dark');
    document.getElementById('theme-icon').textContent = '🌙';
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DashboardCharts();
    
    // Update time initially
    const updateTime = () => {
        const now = new Date();
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString();
        }
    };
    updateTime();
    setInterval(updateTime, 60000);
});