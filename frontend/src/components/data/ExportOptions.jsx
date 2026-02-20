import React, { useState } from 'react';
import axios from '../../api/axios';

const ExportOptions = ({ isOpen, onClose }) => {
    const [format, setFormat] = useState('json');
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        setExporting(true);

        try {
            const url = `/data/export/${format}?include_favorites_only=${favoritesOnly}`;

            const response = await axios.get(url, {
                responseType: 'blob'
            });

            // Create download link
            const blob = new Blob([response.data], {
                type: format === 'json' ? 'application/json' : 'text/csv'
            });

            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;

            const filename = `books_export_${new Date().toISOString().split('T')[0]}.${format}`;
            link.setAttribute('download', filename);

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(downloadUrl);

            setTimeout(() => {
                onClose();
            }, 500);
        } catch (error) {
            console.error('Export failed:', error);
            alert(error.response?.data?.detail || 'Export failed. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <i className="bx bx-download text-3xl"></i>
                            <div>
                                <h3 className="text-2xl font-bold">Export Books</h3>
                                <p className="text-sm text-white/80">Download your book collection</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <i className="bx bx-x text-3xl"></i>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Format Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Export Format
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setFormat('json')}
                                className={`p-4 rounded-lg border-2 transition-all ${format === 'json'
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                                    }`}
                            >
                                <i className="bx bx-code-alt text-3xl mb-2 text-primary-600 dark:text-primary-400"></i>
                                <p className="font-medium text-gray-900 dark:text-white">JSON</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Includes all data
                                </p>
                            </button>

                            <button
                                onClick={() => setFormat('csv')}
                                className={`p-4 rounded-lg border-2 transition-all ${format === 'csv'
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                                    }`}
                            >
                                <i className="bx bx-table text-3xl mb-2 text-primary-600 dark:text-primary-400"></i>
                                <p className="font-medium text-gray-900 dark:text-white">CSV</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    For spreadsheets
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Options */}
                    <div>
                        <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <input
                                type="checkbox"
                                checked={favoritesOnly}
                                onChange={(e) => setFavoritesOnly(e.target.checked)}
                                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                            />
                            <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white">
                                    Export favorites only
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Only include books marked as favorites
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Info */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="flex gap-3">
                            <i className="bx bx-info-circle text-xl text-blue-600 dark:text-blue-400"></i>
                            <div className="text-sm text-blue-900 dark:text-blue-100">
                                <p className="font-medium mb-1">Export Information</p>
                                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                                    <li>• JSON format includes cover image URLs</li>
                                    <li>• CSV format is compatible with Excel</li>
                                    <li>• All dates are in ISO format</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        disabled={exporting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {exporting ? (
                            <>
                                <i className="bx bx-loader-alt animate-spin"></i>
                                Exporting...
                            </>
                        ) : (
                            <>
                                <i className="bx bx-download"></i>
                                Export {format.toUpperCase()}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportOptions;