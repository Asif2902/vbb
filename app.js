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
                    <td>
                        <h3>${token.agent_name || 'Unknown'}</h3>
                        <a
                        href="https://app.uniswap.org/swap?outputCurrency=${token.contract_address}&chain=base"
                        target="_blank">Swap now </a>
                    </td>
                    <td>
                        <h3>${token.contract_address}</h3>
                        <a href="https://basescan.org/address/${token.contract_address}" target="_blank">View on Basescan</a>
                    </td>
                    <td>
                        <h3>${formatNumber(token.vir_bb_amt)}</h3>
                    </td>
                    <td id="marketCap-${token.contract_address}">
                        <h3>-</h3>
                    </td>
                    <td>
                        <button onclick="startFetchingAllMarketCaps()">Fetch Market Cap</button>
                    </td>
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
        const data = await response.json();

        const pairs = data?.pairs || [];
        let marketCap = 0;

        for (const pair of pairs) {
            if (pair?.fdv) {
                marketCap = pair.fdv; // Use the first available FDV
                break;
            }
        }

        if (marketCap > 0) {
            document.getElementById(`marketCap-${contractAddress}`).innerHTML = `
                <h3>${formatNumber(marketCap)}</h3>
                <a href="https://www.dexscreener.com/base/${contractAddress}" target="_blank">View on Dexscreener</a>
            `;
        } else {
            document.getElementById(`marketCap-${contractAddress}`).innerHTML = `
                <h3>No Data</h3>
                <a href="https://www.dexscreener.com/base/${contractAddress}" target="_blank">View on Dexscreener</a>
            `;
        }
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

    let batchSize = 5; // Fetch 5 tokens at a time
    let batchIndex = 0;

    function fetchNextBatch() {
        const batch = tokens.slice(batchIndex, batchIndex + batchSize);
        batch.forEach(token => {
            if (token.contract_address) fetchMarketCap(token.contract_address);
        });

        batchIndex += batchSize;
        if (batchIndex < tokens.length) {
            setTimeout(fetchNextBatch, 1000); // Delay next batch by 1 second
        }
    }

    fetchNextBatch();
}
