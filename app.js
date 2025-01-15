document.getElementById('fetchDuneData').addEventListener('click', fetchDuneData);

// Helper function to format numbers
function formatNumber(number) {
    if (number >= 1e6) return (number / 1e6).toFixed(1) + 'm';
    if (number >= 1e3) return (number / 1e3).toFixed(1) + 'k';
    return number.toFixed(2); // For small numbers, show two decimal places
}

async function fetchDuneData() {
    const apiKey = "9MDzKy3KIwjTcatmsfnVHuulKFevA17U";
    const duneUrl = `https://api.dune.com/api/v1/query/4498300/results/csv?api_key=${apiKey}`;

    try {
        // Fetch the CSV file
        const response = await fetch(duneUrl);
        const csvText = await response.text();

        // Parse CSV data
        const rows = csvText.split('\n').slice(1); // Skip the header row
        const data = rows.map(row => {
            const [agent_name, contract_address, vir_bb_amt] = row.split(',');
            return {
                contract_address,
                vir_bb_amt: parseFloat(vir_bb_amt) // Convert to number
            };
        });

        // Populate the table
        const tbody = document.querySelector('#tokenTable tbody');
        tbody.innerHTML = ''; // Clear existing rows
        data.forEach(token => {
            if (token.contract_address && !isNaN(token.vir_bb_amt)) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${token.contract_address}</td>
                    <td>${formatNumber(token.vir_bb_amt)}</td>
                    <td id="marketCap-${token.contract_address}">-</td>
                    <td><button onclick="fetchMarketCap('${token.contract_address}')">Fetch Market Cap</button></td>
                `;
                tbody.appendChild(row);
            }
        });
    } catch (error) {
        console.error('Error fetching Dune data:', error);
    }
}

async function fetchMarketCap(contractAddress) {
    try {
        // Fetch market cap using DEX Screener API
        const dexUrl = `https://api.dexscreener.io/latest/dex/tokens/${contractAddress}`;
        const response = await fetch(dexUrl);
        const { pairs } = await response.json();

        // Find the first pair with market cap information
        const marketCap = pairs?.[0]?.fdv || 0;
        document.getElementById(`marketCap-${contractAddress}`).textContent = formatNumber(marketCap);
    } catch (error) {
        console.error(`Error fetching market cap for ${contractAddress}:`, error);
    }
}
