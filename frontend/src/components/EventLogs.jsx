import React, { useEffect, useState } from 'react';
import './EventLogs.css';

const EventLogs = () => {
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [logLevel, setLogLevel] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const logsPerPage = 10; // Number of logs per page
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLogs = async () => {
            const token = localStorage.getItem('token'); // Retrieve the token from LocalStorage
            try {
                const response = await fetch('/logs', {
                    headers: {
                        Authorization: `Bearer ${token}`, // Include the token in the Authorization header
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch logs');
                }
                const data = await response.json();
                setLogs(data);
                setFilteredLogs(data); // Initialize filtered logs
            } catch (err) {
                setError(err.message);
            }
        };

        fetchLogs();
    }, []);

    // Filter logs based on search term and log level
    useEffect(() => {
        let filtered = logs;

        if (searchTerm) {
            filtered = filtered.filter(
                log =>
                    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    log.timestamp.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (logLevel !== 'all') {
            filtered = filtered.filter(log => log.level === logLevel);
        }

        setFilteredLogs(filtered);
        setCurrentPage(1); // Reset to the first page when filters change
    }, [searchTerm, logLevel, logs]);

    // Get logs for the current page
    const indexOfLastLog = currentPage * logsPerPage;
    const indexOfFirstLog = indexOfLastLog - logsPerPage;
    const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);

    // Handle log level change
    const handleLogLevelChange = e => {
        setLogLevel(e.target.value);
    };

    // Handle search term change
    const handleSearchChange = e => {
        setSearchTerm(e.target.value);
    };

    // Handle page change
    const handlePageChange = pageNumber => {
        setCurrentPage(pageNumber);
    };

    // Export logs to CSV (without using a library)
    const exportToCSV = () => {
        const csvContent = [
            ['Log Level', 'Log Message', 'Timestamp'], // Header row
            ...filteredLogs.map(log => [log.level, log.message, log.timestamp]),
        ]
            .map(row => row.map(cell => `"${cell}"`).join(',')) // Escape and join cells
            .join('\n'); // Join rows

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'logs.csv';
        link.click();
    };

    return (
        <div className="event-logs">
            {error && <div className="error-message">{error}</div>}
            <div className="controls">
                <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
                <select value={logLevel} onChange={handleLogLevelChange}>
                    <option value="all">All</option>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                </select>
                <button onClick={exportToCSV}>Export to CSV</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Log Level</th>
                        <th>Log Message</th>
                        <th>Timestamp</th>
                    </tr>
                </thead>
                <tbody>
                    {currentLogs.length > 0 ? (
                        currentLogs.map((log, index) => (
                            <tr key={index} className={log.level}>
                                <td>{log.level}</td>
                                <td>{log.message}</td>
                                <td>{log.timestamp}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3">No logs available</td>
                        </tr>
                    )}
                </tbody>
            </table>
            {filteredLogs.length > logsPerPage && (
                <div className="pagination">
                    {Array.from({
                        length: Math.ceil(filteredLogs.length / logsPerPage),
                    }).map((_, index) => (
                        <button
                            key={index}
                            className={currentPage === index + 1 ? 'active' : ''}
                            onClick={() => handlePageChange(index + 1)}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EventLogs;
