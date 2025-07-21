
import React from 'react';
import type { TableResult } from '../types';
import { DownloadIcon } from './icons';
import { downloadFile } from '../utils';
import * as authService from '../services/authService';

// --- EXPORT HELPER ---

const exportAsCsv = (result: TableResult, fileName: string) => {
    let csvContent = `"${result.title}"\n\n`;
    
    result.tables.forEach(table => {
        csvContent += `"${table.title}"\n`;
        table.data.forEach(row => {
            csvContent += row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',') + '\n';
        });
        csvContent += '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, `${fileName}.csv`);
};


// --- COMPONENT ---

interface TableResultViewProps {
  result: TableResult | null;
  fileName: string;
  onStartNew: () => void;
}

const TableResultView: React.FC<TableResultViewProps> = ({ result, fileName, onStartNew }) => {
    
    const handleExport = () => {
        if (!result) return;
        const baseFileName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
        exportAsCsv(result, baseFileName);
        authService.logReportGeneration();
    };

    if (!result) {
        return <div className="text-center p-8">No table data available.</div>;
    }
    
    if (result.tables.length === 0) {
        return (
            <div className="w-full max-w-2xl mx-auto p-4 md:p-8 text-center">
                 <div className="glass-card rounded-2xl p-8">
                    <h1 className="text-2xl font-bold text-white mb-2">{result.title}</h1>
                    <p className="text-lg text-gray-300 my-6">The AI could not find any tables in this document.</p>
                    <button
                        onClick={onStartNew}
                        className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
            <div className="glass-card rounded-2xl">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div>
                       <h1 className="text-2xl font-bold text-white">{result.title}</h1>
                       <p className="text-gray-300">Extracted from: {fileName}</p>
                    </div>
                     <button 
                        onClick={handleExport}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <DownloadIcon className="w-5 h-5"/>
                        Export as CSV
                    </button>
                </div>
                <div className="p-6 h-[65vh] overflow-y-auto space-y-8">
                    {result.tables.map((table, tableIndex) => (
                        <div key={tableIndex}>
                            <h2 className="text-xl font-semibold text-white mb-3">{table.title}</h2>
                            <div className="overflow-x-auto rounded-lg border border-white/10">
                               <table className="min-w-full divide-y divide-white/10">
                                  <thead className="bg-black/20">
                                    {table.data?.[0] && (
                                        <tr>
                                            {table.data[0].map((header, headerIndex) => (
                                                <th key={headerIndex} scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    )}
                                  </thead>
                                  <tbody className="bg-transparent divide-y divide-white/10">
                                    {table.data?.slice(1).map((row, rowIndex) => (
                                        <tr key={rowIndex} className="hover:bg-black/20">
                                            {row.map((cell, cellIndex) => (
                                                <td key={cellIndex} className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                  </tbody>
                               </table>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-6 border-t border-white/10">
                     <button
                        onClick={onStartNew}
                        className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TableResultView;
