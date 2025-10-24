class LeaderboardApp {
    constructor() {
        // REPLACE THESE WITH YOUR SUPABASE PROJECT DETAILS
        this.supabaseUrl = 'https://gzrsknywsqpfimeecydn.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cnNrbnl3c3FwZmltZWVjeWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzc3MDgsImV4cCI6MjA3NjY1MzcwOH0.hjBoZqa-BC41cnbknzwkM36mER2I-3gsk-hUp7CVaWA'; // From Supabase > Settings > API > anon public

        // Query: Select all needed fields, order by member_count DESC, limit 10
        this.apiUrl = `${this.supabaseUrl}/rest/v1/leaderboardmain?select=guild_id,server_name,member_count,last_updated&order=member_count.desc&limit=10`;

        this.refreshBtn = document.getElementById('refreshBtn');
        this.leaderboardDiv = document.getElementById('leaderboard');
        this.loadingDiv = document.getElementById('loading');
        this.errorDiv = document.getElementById('error');
        this.lastUpdatedSpan = document.getElementById('lastUpdated');

        this.init();
    }

    init() {
        this.refreshBtn.addEventListener('click', () => this.loadLeaderboard());
        this.loadLeaderboard();
    }

    async loadLeaderboard() {
        this.setLoadingState(true);
        this.clearError();

        try {
            const response = await fetch(this.apiUrl, {
                method: 'GET',
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const servers = await response.json();
            this.renderLeaderboard(servers);
            this.updateLastUpdated();

        } catch (error) {
            console.error('Error loading data:', error);
            this.showError();
        } finally {
            this.setLoadingState(false);
        }
    }

    setLoadingState(loading) {
        if (loading) {
            this.refreshBtn.disabled = true;
            this.refreshBtn.textContent = 'Loading...';
            this.refreshBtn.classList.add('loading');
            this.loadingDiv.style.display = 'block';
            this.leaderboardDiv.style.display = 'none';
        } else {
            this.refreshBtn.disabled = false;
            this.refreshBtn.textContent = 'Refresh Leaderboard';
            this.refreshBtn.classList.remove('loading');
            this.loadingDiv.style.display = 'none';
            this.leaderboardDiv.style.display = 'block';
        }
    }

    renderLeaderboard(servers) {
        if (!servers || servers.length === 0) {
            this.leaderboardDiv.innerHTML = `
                <p style="text-align: center; padding: 40px; color: #666; font-style: italic;">
                    No servers in the leaderboard yet.
                </p>`;
            return;
        }

        this.leaderboardDiv.innerHTML = `
            <table class="leaderboard-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Server Name</th>
                        <th>Members</th>
                        <th>Last Updated</th>
                    </tr>
                </thead>
                <tbody>
                    ${servers.map((server, index) => {
                        const rank = index + 1;
                        const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
                        const memberCount = server.member_count || 0;
                        const lastUpdated = this.formatDate(server.last_updated);

                        return `
                            <tr class="leaderboard-row">
                                <td class="rank ${rankClass}">${rank}</td>
                                <td class="server-name">
                                    <div class="server-info">
                                        <img src="https://cdn.discordapp.com/icons/${server.guild_id}/${server.icon_hash || 'unknown'}.png?size=64" 
                                             alt="${this.escapeHtml(server.server_name)}" 
                                             class="server-icon"
                                             onerror="this.src='https://via.placeholder.com/64/5865F2/ffffff?text=DS'">
                                        <span>${this.escapeHtml(server.server_name)}</span>
                                    </div>
                                </td>
                                <td class="member-count">${this.formatNumber(memberCount)}</td>
                                <td class="last-updated">${lastUpdated}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    updateLastUpdated() {
        const now = new Date();
        this.lastUpdatedSpan.textContent = `Last refreshed: ${now.toLocaleTimeString()}`;
    }

    showError() {
        this.errorDiv.style.display = 'block';
    }

    clearError() {
        this.errorDiv.style.display = 'none';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatNumber(num) {
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
        if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
        return num.toString();
    }

    formatDate(isoString) {
        if (!isoString) return 'Never';
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new LeaderboardApp();
});
