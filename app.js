document.getElementById('fetchDuneData').addEventListener('click', fetchDuneData);

function formatNumber(number) {
    if (number >= 1e6) return (number / 1e6).toFixed(1) + 'm';
    if (number >= 1e3) return (number / 1e3).toFixed(1) + 'k';
    return number.toFixed(2);
}
      async function fetchDuneData() {
            const apiKey = "9MDzKy3KIwjTcatmsfnVHuulKFevA17U";
            const duneUrl = `https://api.dune.com/api/v1/query/4498300/results/csv?api_key=${apiKey}`;

            try {
                const response = await fetch(duneUrl);
                const csvText = await response.text();

                const rows = csvText.split('\n').slice(1); // Skip the header row
                const data = rows.map(row => {
                    const [agent_name, contract_address, vir_bb_amt] = row.split(',');
                    return {
                        agent_name,
                        contract_address,
                        vir_bb_amt: parseFloat(vir_bb_amt)
                    };
                });

                const tbody = document.querySelector('#tokenTable tbody');
                tbody.innerHTML = '';
                data.forEach(token => {
                    if (token.contract_address && !isNaN(token.vir_bb_amt)) {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td><a
                            href="https://app.uniswap.org/swap?outputCurrency=${token.contract_address}&chain=base"target="_blank">${token.agent_name
                            || 'Unknown'}</a></td>
                            <td><a href="https://basescan.org/address/${token.contract_address}" target="_blank">${token.contract_address}</a></td>
                    <td>${formatNumber(token.vir_bb_amt)}</td>
                    <td id="marketCap-${token.contract_address}">-</td>
                    <td><button onclick="startFetchingAllMarketCaps()">Fetch Market Cap</button></td>
                `;
                tbody.appendChild(row);
            }
        });

        window.tokenList = data; // Save the token list globally for batch fetching
    } catch (error) {
        console.error('Error fetching Dune data:', error);
    }
}

async function fetchMarketCap(contractAddress) {
    try {
        const dexUrl = `https://api.dexscreener.io/latest/dex/tokens/${contractAddress}`;
        const response = await fetch(dexUrl);
        const { pairs } = await response.json();

        const marketCap = pairs?.[0]?.fdv || 0;
        const marketCapLink = `<a href="https://www.dexscreener.com/base/${contractAddress}" target="_blank">${formatNumber(marketCap)}</a>`;
        document.getElementById(`marketCap-${contractAddress}`).innerHTML = marketCapLink;
    } catch (error) {
        console.error(`Error fetching market cap for ${contractAddress}:`, error);
    }
}
function startFetchingAllMarketCaps() {
    const tokens = window.tokenList || [];
    if (!tokens.length) {
        alert('No tokens to fetch! Please fetch Dune data first.');
        return;
    }

    let index = 0;
    const fetchInterval = setInterval(() => {
        if (index >= tokens.length) {
            clearInterval(fetchInterval); // Stop the interval once all tokens are processed
            console.log('All market caps fetched.');
            return;
        }

        const token = tokens[index];
        if (token.contract_address) {
            fetchMarketCap(token.contract_address);
        }
        index++;
    }, 200); // 200ms interval = 5 tokens per second
}
