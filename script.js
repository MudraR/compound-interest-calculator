class CompoundInterestCalculator {
    constructor() {
        this.currentView = 'yearly';
        this.calculationData = null;
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
        // Update summary
        document.getElementById('total-invested').textContent = this.formatCurrency(this.calculationData.summary.totalInvested);
        document.getElementById('total-interest').textContent = this.formatCurrency(this.calculationData.summary.totalInterest);
        document.getElementById('final-balance').textContent = this.formatCurrency(this.calculationData.summary.finalBalance);

        // Populate year selector
        this.populateYearSelector();

        // Show results section
        document.getElementById('results-section').style.display = 'block';

        // Update table based on current view
        if (this.currentView === 'yearly') {
            this.updateYearlyTable();
        } else {
            this.updateMonthlyTable();
        }
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
                <th>Year</th>
                <th>Starting Balance</th>
                <th>Annual Contributions</th>
                <th>Interest Earned</th>
                <th>Ending Balance</th>
                <th>Total Invested</th>
                <th>Total Interest</th>
            </tr>
        `;

        // Create body
        body.innerHTML = '';
        this.calculationData.yearly.forEach(yearData => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${yearData.year}</strong></td>
                <td class="currency">${this.formatCurrency(yearData.startingBalance)}</td>
                <td class="currency">${this.formatCurrency(yearData.contributions)}</td>
                <td class="currency positive">${this.formatCurrency(yearData.interestEarned)}</td>
                <td class="currency"><strong>${this.formatCurrency(yearData.endingBalance)}</strong></td>
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
                <th>Month</th>
                <th>Starting Balance</th>
                <th>Monthly Contribution</th>
                <th>Interest Earned</th>
                <th>Ending Balance</th>
            </tr>
        `;

        // Create body
        body.innerHTML = '';
        monthlyData.forEach(monthData => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${monthData.monthName}</strong></td>
                <td class="currency">${this.formatCurrency(monthData.startingBalance)}</td>
                <td class="currency">${this.formatCurrency(monthData.contribution)}</td>
                <td class="currency positive">${this.formatCurrency(monthData.interestEarned)}</td>
                <td class="currency"><strong>${this.formatCurrency(monthData.endingBalance)}</strong></td>
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
