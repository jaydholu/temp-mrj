import React, { useState } from 'react';
import axios from '../../api/axios';

const ImportModal = ({ isOpen, onClose, onImportComplete }) => {
    const [file, setFile] = useState(null);
    const [format, setFormat] = useState('json');
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (selectedFile) => {
        const ext = selectedFile.name.split('.').pop().toLowerCase();

        if (ext !== 'json' && ext !== 'csv') {
            alert('Please select a JSON or CSV file');
            return;
        }

        setFile(selectedFile);
        setFormat(ext);
        setResult(null);
    };

    const handleImport = async () => {
        if (!file) {
            alert('Please select a file');
            return;
        }

        setUploading(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(`/data/import?format=${format}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setResult(response.data);

            if (response.data.stats.imported > 0) {
                setTimeout(() => {
                    onImportComplete();
                    handleClose();
                }, 3000);
            }
        } catch (error) {
            console.error('Import failed:', error);
            setResult({
                message: 'Import failed',
                stats: {
                    total: 0,
                    imported: 0,
                    failed: 1,
                    errors: [{ row: 0, error: error.response?.data?.detail || error.message }]
                }
            });
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setFormat('json');
        setResult(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <i className="bx bx-upload text-3xl"></i>
                            <div>
                                <h3 className="text-2xl font-bold">Import Books</h3>
                                <p className="text-sm text-white/80">Upload your book data in JSON or CSV format</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <i className="bx bx-x text-3xl"></i>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* File Upload Area */}
                    <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        {file ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full">
                                    <i className="bx bx-file text-4xl text-green-600 dark:text-green-400"></i>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {(file.size / 1024).toFixed(2)} KB • {format.toUpperCase()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setFile(null)}
                                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                                >
                                    Remove file
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full">
                                    <i className="bx bx-cloud-upload text-4xl text-gray-400"></i>
                                </div>
                                <div>
                                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                        Drag & drop your file here
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                        or click to browse
                                    </p>
                                    <input
                                        type="file"
                                        id="file-upload"
                                        className="hidden"
                                        accept=".json,.csv"
                                        onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg cursor-pointer hover:bg-primary-700 transition-colors"
                                    >
                                        Choose File
                                    </label>
                                </div>
                                <p className="text-xs text-gray-400">
                                    Supported formats: JSON, CSV (max 50MB)
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Download Template */}
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <i className="bx bx-info-circle text-2xl text-blue-600 dark:text-blue-400"></i>
                                <div>
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                        Need a template?
                                    </p>
                                    <p className="text-xs text-blue-700 dark:text-blue-300">
                                        Download our CSV template with sample data
                                    </p>
                                </div>
                            </div>
                            <a
                                href={`${import.meta.env.VITE_API_URL}/data/template/csv`}
                                download
                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Download
                            </a>
                        </div>
                    </div>

                    {/* Import Result */}
                    {result && (
                        <div className={`mt-4 p-4 rounded-lg ${result.stats.failed === 0
                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                            }`}>
                            <div className="flex items-start gap-3">
                                <i className={`bx ${result.stats.failed === 0 ? 'bx-check-circle text-green-600' : 'bx-error text-yellow-600'} text-2xl`}></i>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white mb-2">
                                        {result.message}
                                    </p>
                                    <div className="text-sm space-y-1">
                                        <p className="text-gray-700 dark:text-gray-300">
                                            Total: {result.stats.total} |
                                            Imported: <span className="text-green-600 dark:text-green-400 font-medium">{result.stats.imported}</span> |
                                            Failed: <span className="text-red-600 dark:text-red-400 font-medium">{result.stats.failed}</span>
                                        </p>
                                    </div>

                                    {result.stats.errors && result.stats.errors.length > 0 && (
                                        <div className="mt-3 max-h-32 overflow-y-auto">
                                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Errors:</p>
                                            <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                                                {result.stats.errors.map((error, idx) => (
                                                    <li key={idx}>Row {error.row}: {error.error}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        disabled={uploading}
                    >
                        {result?.stats.imported > 0 ? 'Close' : 'Cancel'}
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={!file || uploading}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {uploading ? (
                            <>
                                <i className="bx bx-loader-alt animate-spin"></i>
                                Importing...
                            </>
                        ) : (
                            <>
                                <i className="bx bx-upload"></i>
                                Import Books
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportModal;