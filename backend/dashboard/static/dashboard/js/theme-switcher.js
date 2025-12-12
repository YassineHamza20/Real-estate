// static/dashboard/js/dashboard.js
class DashboardCharts {
    constructor() {
        this.charts = {};
        this.realtimeInterval = null;
        this.isRealtimeActive = false;
        this.currentTheme = localStorage.getItem('theme') || 'light';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initCharts();
        this.applyTheme(this.currentTheme);
        this.updateTime(); // Initialize time
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Export functionality - IMPROVED
        document.getElementById('export-btn')?.addEventListener('click', (e) => {
            this.showExportMenu(e);
        });

        document.addEventListener('click', (e) => {
            if (e.target.matches('.export-option')) {
                this.exportChart(e.target.dataset.export);
            }
        });

        // Real-time toggle
        document.getElementById('realtime-toggle')?.addEventListener('click', () => {
            this.toggleRealtimeUpdates();
        });

        // Drill-down actions - IMPROVED
        document.querySelectorAll('.chart-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.drillDownChart(e.target.dataset.chart);
            });
        });

        // Close modals
        document.addEventListener('click', (e) => {
            if (e.target.matches('.modal-close, .modal-backdrop')) {
                this.closeModal();
            }
        });

        // Responsive breakpoints
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));
    }

    initCharts() {
        const colors = this.getThemeColors();
        const data = window.dashboardData;
        
       // console.log('Initializing charts with data:', data);

        // 1. User Distribution Chart
        this.createChart('usersChart', {
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

        // 2. Monthly Growth Chart
        if (data.monthlyRegistrations) {
            this.createChart('growthChart', {
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
        if (data.propertyTypes) {
            this.createChart('propertiesChart', {
                type: 'pie',
                data: {
                    labels: data.propertyTypes.labels,
                    datasets: [{
                        data: data.propertyTypes.data,
                        backgroundColor: [colors.primary, colors.secondary, colors.accent, colors.warning, colors.neutral],
                        borderWidth: 0
                    }]
                },
                options: this.getChartOptions('pie', colors)
            });
        }

        // 4. Price Ranges Chart
        if (data.priceRanges) {
            this.createChart('priceChart', {
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
        this.createChart('verificationChart', {
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

        // 6. Cities Chart
        if (data.citiesData) {
            this.createChart('citiesChart', {
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

        // 7. Rooms Chart - FIXED
        if (data.roomsData) {
            this.createChart('roomsChart', {
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

    createChart(chartId, config) {
        const ctx = document.getElementById(chartId);
        if (ctx) {
            this.charts[chartId] = new Chart(ctx, config);
        } else {
            console.warn(`Chart element #${chartId} not found`);
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
            },
            onClick: (evt, elements) => {
                if (elements.length > 0) {
                    this.handleChartClick(evt, elements, type);
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

    // IMPROVED EXPORT FUNCTIONALITY
    showExportMenu(event) {
        const menu = event.target.nextElementSibling || event.target.parentElement.nextElementSibling;
        if (menu) {
            menu.classList.toggle('hidden');
        }
    }

    exportChart(format) {
        // Hide export menu
        document.querySelectorAll('[class*="group"] .absolute').forEach(menu => {
            menu.classList.add('hidden');
        });

        if (format === 'png') {
            this.exportAsPNG();
        } else if (format === 'pdf') {
            this.exportAsPDF();
        } else if (format === 'all') {
            this.exportAllCharts();
        }
    }

    exportAsPNG() {
        Object.entries(this.charts).forEach(([chartId, chart]) => {
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().split('T')[0];
            link.download = `chart-${chartId}-${timestamp}.png`;
            link.href = chart.toBase64Image();
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
        
        this.showNotification('All charts exported as PNG!', 'success');
    }

    exportAsPDF() {
        // Simple PDF export using window.print() for now
        const originalTitle = document.title;
        document.title = `Real-Estate-Dashboard-${new Date().toISOString().split('T')[0]}`;
        window.print();
        document.title = originalTitle;
        this.showNotification('Use browser print to save as PDF!', 'info');
    }

    exportAllCharts() {
        this.exportAsPNG();
        setTimeout(() => this.exportAsPDF(), 1000);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg border ${
            type === 'success' ? 'bg-green-100 border-green-400 text-green-800' :
            type === 'error' ? 'bg-red-100 border-red-400 text-red-800' :
            'bg-blue-100 border-blue-400 text-blue-800'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // IMPROVED DRILL-DOWN FUNCTIONALITY
    handleChartClick(evt, elements, chartType) {
        const chart = evt.chart;
        const element = elements[0];
        
        if (element) {
            const label = chart.data.labels[element.index];
            const value = chart.data.datasets[element.datasetIndex].data[element.index];
            
            this.showDrillDownModal(chart.canvas.id, label, value, chartType);
        }
    }

    drillDownChart(chartId) {
        const chart = this.charts[chartId];
        if (!chart) return;

        const labels = chart.data.labels;
        const datasets = chart.data.datasets;
        
        this.showDrillDownModal(chartId, 'All Data', datasets, chart.config.type);
    }

    showDrillDownModal(chartId, label, data, chartType) {
        const modalHtml = `
            <div class="modal-backdrop fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                <div class="modal-content bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                            Drill Down: ${chartId.replace('Chart', '')} - ${label}
                        </h3>
                        <button class="modal-close text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            ✕
                        </button>
                    </div>
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                <div class="text-sm text-gray-600 dark:text-gray-300">Chart Type</div>
                                <div class="font-medium">${chartType}</div>
                            </div>
                            <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                <div class="text-sm text-gray-600 dark:text-gray-300">Selected Item</div>
                                <div class="font-medium">${label}</div>
                            </div>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <div class="text-sm text-gray-600 dark:text-gray-300 mb-2">Detailed Data</div>
                            <pre class="text-xs bg-white dark:bg-gray-600 p-3 rounded overflow-x-auto">${JSON.stringify(data, null, 2)}</pre>
                        </div>
                        <div class="text-sm text-gray-600 dark:text-gray-300">
                            💡 <strong>Real drill-down would:</strong>
                            <ul class="list-disc list-inside mt-2 space-y-1">
                                <li>Show detailed property listings</li>
                                <li>Display user information</li>
                                <li>Provide filtering options</li>
                                <li>Show historical trends</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    closeModal() {
        const modal = document.querySelector('.modal-backdrop');
        if (modal) {
            modal.remove();
        }
    }

    // ... rest of the methods (toggleTheme, getThemeColors, etc.) remain the same ...
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
                btn.className = 'text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-2 rounded-lg font-medium transition-colors';
            }
        } else {
            this.stopRealtimeUpdates();
            if (btn) {
                btn.textContent = '⏸️ Live Updates: OFF';
                btn.className = 'text-sm bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-2 rounded-lg font-medium transition-colors';
            }
        }
    }

    startRealtimeUpdates() {
        this.realtimeInterval = setInterval(() => {
            this.updateChartData();
        }, 10000);
    }

    stopRealtimeUpdates() {
        if (this.realtimeInterval) {
            clearInterval(this.realtimeInterval);
            this.realtimeInterval = null;
        }
    }

    async updateChartData() {
        try {
            if (!window.dashboardData?.updateUrl) {
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

    updateTime() {
        const now = new Date();
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString();
        }
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

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DashboardCharts();
    
    // Update time every minute
    setInterval(() => {
        const dashboard = window.dashboardInstance;
        if (dashboard) dashboard.updateTime();
    }, 60000);
});

// Make it globally available for debugging
window.DashboardCharts = DashboardCharts;