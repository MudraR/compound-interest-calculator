class CompoundInterestCalculator {
    constructor() {
        this.currentView = 'yearly';
        this.calculationData = null;
        this.growthChart = null;
        this.breakdownChart = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('calculate').addEventListener('click', () => this.calculate());
        
        // View toggle buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.target.dataset.view));
        });

        // Year selector for monthly view
        document.getElementById('year-select').addEventListener('change', () => this.updateMonthlyTable());

        // Calculate on input change for real-time updates
        const inputs = ['principal', 'rate', 'years', 'compound', 'monthly-contribution'];
        inputs.forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                if (this.calculationData) {
                    this.calculate();
                }
            });
        });
    }

    calculate() {
        const principal = parseFloat(document.getElementById('principal').value) || 0;
        const rate = parseFloat(document.getElementById('rate').value) || 0;
        const years = parseInt(document.getElementById('years').value) || 0;
        const compound = parseInt(document.getElementById('compound').value) || 12;
        const monthlyContribution = parseFloat(document.getElementById('monthly-contribution').value) || 0;

        if (principal <= 0 || rate <= 0 || years <= 0) {
            alert('Please enter valid positive values for all fields.');
            return;
        }

        this.calculationData = this.calculateCompoundInterest(principal, rate, years, compound, monthlyContribution);
        this.displayResults();
    }

    calculateCompoundInterest(principal, annualRate, years, compoundFreq, monthlyContribution) {
        const r = annualRate / 100;
        const data = {
            yearly: [],
            monthly: {},
            summary: {}
        };

        let currentBalance = principal;
        let totalContributions = principal;
        
        for (let year = 1; year <= years; year++) {
            const startBalance = currentBalance;
            const startContributions = totalContributions;
            
            data.monthly[year] = [];
            
            for (let month = 1; month <= 12; month++) {
                const monthStart = currentBalance;
                
                // Add monthly contribution at the beginning of the month
                currentBalance += monthlyContribution;
                totalContributions += monthlyContribution;
                
                // Calculate compound interest for this month
                const monthlyRate = r / 12;
                const interestEarned = currentBalance * monthlyRate;
                currentBalance += interestEarned;
                
                data.monthly[year].push({
                    month: month,
                    monthName: this.getMonthName(month),
                    startingBalance: monthStart,
                    contribution: monthlyContribution,
                    interestEarned: interestEarned,
                    endingBalance: currentBalance
                });
            }
            
            const yearlyInterest = currentBalance - startBalance - (monthlyContribution * 12);
            const yearlyContributions = monthlyContribution * 12;
            
            data.yearly.push({
                year: year,
                startingBalance: startBalance,
                contributions: yearlyContributions,
                interestEarned: yearlyInterest,
                endingBalance: currentBalance,
                totalContributions: totalContributions,
                totalInterest: currentBalance - totalContributions
            });
        }

        data.summary = {
            totalInvested: totalContributions,
            totalInterest: currentBalance - totalContributions,
            finalBalance: currentBalance
        };

        return data;
    }

    displayResults() {
        const summary = this.calculationData.summary;
        const principal = parseFloat(document.getElementById('principal').value) || 0;
        
        // Update summary with animations and growth indicators
        this.animateValue('total-invested', summary.totalInvested);
        this.animateValue('total-interest', summary.totalInterest);
        this.animateValue('final-balance', summary.finalBalance);
        
        // Calculate and display growth percentages
        const interestPercentage = ((summary.totalInterest / summary.totalInvested) * 100).toFixed(1);
        const balanceMultiplier = (summary.finalBalance / principal).toFixed(1);
        
        document.getElementById('interest-percentage').textContent = `${interestPercentage}%`;
        document.getElementById('balance-multiplier').textContent = `${balanceMultiplier}x`;

        // Create sparklines
        this.createSparklines();
        
        // Create charts
        this.createCharts();

        // Populate year selector
        this.populateYearSelector();

        // Show results section with animation
        const resultsSection = document.getElementById('results-section');
        resultsSection.style.display = 'block';
        setTimeout(() => {
            resultsSection.style.opacity = '1';
            resultsSection.style.transform = 'translateY(0)';
        }, 100);

        // Update table based on current view
        if (this.currentView === 'yearly') {
            this.updateYearlyTable();
        } else {
            this.updateMonthlyTable();
        }
    }

    animateValue(elementId, targetValue) {
        const element = document.getElementById(elementId);
        const startValue = 0;
        const duration = 1500;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = startValue + (targetValue - startValue) * easeOutQuart;
            
            element.textContent = this.formatCurrency(currentValue);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    createSparklines() {
        const yearlyData = this.calculationData.yearly;
        
        // Create sparkline data
        const investedData = yearlyData.map(year => year.totalContributions);
        const interestData = yearlyData.map(year => year.totalInterest);
        const balanceData = yearlyData.map(year => year.endingBalance);
        
        this.renderSparkline('invested-sparkline', investedData, '#667eea');
        this.renderSparkline('interest-sparkline', interestData, '#28a745');
        this.renderSparkline('balance-sparkline', balanceData, '#ffc107');
    }

    renderSparkline(elementId, data, color) {
        const container = document.getElementById(elementId);
        if (!container || data.length === 0) return;
        
        container.innerHTML = '';
        
        const width = container.offsetWidth || 200;
        const height = 30;
        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.style.width = '100%';
        svg.style.height = '100%';
        
        // Create path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const points = data.map((value, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = height - ((value - min) / range) * height * 0.8 - height * 0.1;
            return `${x},${y}`;
        });
        
        path.setAttribute('d', `M ${points.join(' L ')}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', '2');
        path.setAttribute('stroke-linecap', 'round');
        
        // Add gradient area under the line
        const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const areaPath = `M ${points[0]} L ${points.join(' L ')} L ${width},${height} L 0,${height} Z`;
        area.setAttribute('d', areaPath);
        area.setAttribute('fill', `url(#gradient-${elementId})`);
        
        // Create gradient
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', `gradient-${elementId}`);
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '0%');
        gradient.setAttribute('y2', '100%');
        
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', color);
        stop1.setAttribute('stop-opacity', '0.3');
        
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', color);
        stop2.setAttribute('stop-opacity', '0');
        
        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        
        svg.appendChild(defs);
        svg.appendChild(area);
        svg.appendChild(path);
        
        container.appendChild(svg);
    }

    createCharts() {
        this.createGrowthChart();
        this.createBreakdownChart();
    }

    createGrowthChart() {
        const ctx = document.getElementById('growthChart').getContext('2d');
        
        if (this.growthChart) {
            this.growthChart.destroy();
        }
        
        const yearlyData = this.calculationData.yearly;
        const labels = yearlyData.map(year => `Year ${year.year}`);
        const principalData = yearlyData.map(year => year.totalContributions);
        const interestData = yearlyData.map(year => year.totalInterest);
        const totalData = yearlyData.map(year => year.endingBalance);
        
        this.growthChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Total Invested',
                        data: principalData,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Interest Earned',
                        data: interestData,
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Total Balance',
                        data: totalData,
                        borderColor: '#ffc107',
                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                        fill: false,
                        tension: 0.4,
                        borderWidth: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: '#667eea',
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${this.formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(102, 126, 234, 0.1)'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(102, 126, 234, 0.1)'
                        },
                        ticks: {
                            callback: (value) => this.formatCurrency(value)
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 4,
                        hoverRadius: 8
                    }
                }
            }
        });
    }

    createBreakdownChart() {
        const ctx = document.getElementById('breakdownChart').getContext('2d');
        
        if (this.breakdownChart) {
            this.breakdownChart.destroy();
        }
        
        const summary = this.calculationData.summary;
        const principal = parseFloat(document.getElementById('principal').value) || 0;
        const additionalContributions = summary.totalInvested - principal;
        
        this.breakdownChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Principal Investment', 'Additional Contributions', 'Interest Earned'],
                datasets: [{
                    data: [
                        principal,
                        additionalContributions,
                        summary.totalInterest
                    ],
                    backgroundColor: [
                        '#667eea',
                        '#6f42c1', 
                        '#28a745'
                    ],
                    borderColor: [
                        '#667eea',
                        '#6f42c1',
                        '#28a745'
                    ],
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: '#667eea',
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                const percentage = ((context.parsed / summary.finalBalance) * 100).toFixed(1);
                                return `${context.label}: ${this.formatCurrency(context.parsed)} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    switchView(view) {
        this.currentView = view;
        
        // Update toggle buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Show/hide year selector
        document.getElementById('year-selector').style.display = 
            view === 'monthly' ? 'block' : 'none';

        // Update table
        if (view === 'yearly') {
            this.updateYearlyTable();
        } else {
            this.updateMonthlyTable();
        }
    }

    populateYearSelector() {
        const select = document.getElementById('year-select');
        select.innerHTML = '';
        
        for (let year = 1; year <= this.calculationData.yearly.length; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = `Year ${year}`;
            select.appendChild(option);
        }
    }

    updateYearlyTable() {
        const header = document.getElementById('table-header');
        const body = document.getElementById('table-body');

        // Create header
        header.innerHTML = `
            <tr>
                <th><i class="fas fa-calendar-alt"></i> Year</th>
                <th><i class="fas fa-dollar-sign"></i> Starting Balance</th>
                <th><i class="fas fa-plus-circle"></i> Annual Contributions</th>
                <th><i class="fas fa-trending-up"></i> Interest Earned</th>
                <th><i class="fas fa-wallet"></i> Ending Balance</th>
                <th><i class="fas fa-piggy-bank"></i> Total Invested</th>
                <th><i class="fas fa-chart-line"></i> Total Interest</th>
            </tr>
        `;

        // Create body
        body.innerHTML = '';
        this.calculationData.yearly.forEach((yearData, index) => {
            const row = document.createElement('tr');
            
            // Calculate different growth metrics
            let growthBadge = '';
            if (index > 0) {
                const previousBalance = this.calculationData.yearly[index - 1].endingBalance;
                const currentBalance = yearData.endingBalance;
                const dollarGrowth = currentBalance - previousBalance;
                const percentGrowth = (dollarGrowth / previousBalance * 100).toFixed(1);
                
                // Show both dollar amount and percentage
                growthBadge = `<div class="growth-badge">+${this.formatCurrency(dollarGrowth)} (+${percentGrowth}%)</div>`;
            }
            
            row.innerHTML = `
                <td><strong><i class="fas fa-calendar"></i> ${yearData.year}</strong></td>
                <td class="currency">${this.formatCurrency(yearData.startingBalance)}</td>
                <td class="currency">${this.formatCurrency(yearData.contributions)}</td>
                <td class="currency positive">${this.formatCurrency(yearData.interestEarned)}</td>
                <td class="currency"><strong>${this.formatCurrency(yearData.endingBalance)}</strong>
                    ${growthBadge}
                </td>
                <td class="currency">${this.formatCurrency(yearData.totalContributions)}</td>
                <td class="currency positive">${this.formatCurrency(yearData.totalInterest)}</td>
            `;
            body.appendChild(row);
        });
    }

    updateMonthlyTable() {
        const selectedYear = parseInt(document.getElementById('year-select').value) || 1;
        const monthlyData = this.calculationData.monthly[selectedYear];
        
        if (!monthlyData) return;

        const header = document.getElementById('table-header');
        const body = document.getElementById('table-body');

        // Create header
        header.innerHTML = `
            <tr>
                <th><i class="fas fa-calendar"></i> Month</th>
                <th><i class="fas fa-dollar-sign"></i> Starting Balance</th>
                <th><i class="fas fa-plus"></i> Monthly Contribution</th>
                <th><i class="fas fa-chart-line"></i> Interest Earned</th>
                <th><i class="fas fa-wallet"></i> Ending Balance</th>
            </tr>
        `;

        // Create body
        body.innerHTML = '';
        monthlyData.forEach((monthData, index) => {
            const row = document.createElement('tr');
            
            // Calculate monthly growth metrics
            let growthBadge = '';
            if (index > 0) {
                const previousBalance = monthlyData[index - 1].endingBalance;
                const currentBalance = monthData.endingBalance;
                const dollarGrowth = currentBalance - previousBalance;
                const percentGrowth = (dollarGrowth / previousBalance * 100).toFixed(2);
                
                // Show both dollar amount and percentage for monthly
                growthBadge = `<div class="growth-badge">+${this.formatCurrency(dollarGrowth)} (+${percentGrowth}%)</div>`;
            }
            
            row.innerHTML = `
                <td><strong><i class="fas fa-calendar-day"></i> ${monthData.monthName}</strong></td>
                <td class="currency">${this.formatCurrency(monthData.startingBalance)}</td>
                <td class="currency">${this.formatCurrency(monthData.contribution)}</td>
                <td class="currency positive">${this.formatCurrency(monthData.interestEarned)}</td>
                <td class="currency"><strong>${this.formatCurrency(monthData.endingBalance)}</strong>
                    ${growthBadge}
                </td>
            `;
            body.appendChild(row);
        });
    }

    getMonthName(month) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[month - 1];
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }
}

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CompoundInterestCalculator();
});

// Add some nice animations and interactions
document.addEventListener('DOMContentLoaded', () => {
    // Animate cards on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Initially hide cards for animation
    document.querySelectorAll('.calculator-card, .summary-card, .table-controls').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Trigger initial animation
    setTimeout(() => {
        document.querySelectorAll('.calculator-card, .summary-card, .table-controls').forEach(card => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        });
    }, 100);
});
