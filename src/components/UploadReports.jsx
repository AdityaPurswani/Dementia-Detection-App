import React, { useState } from 'react';
import { FileText, AlertCircle } from 'lucide-react';

function MedicalReportAnalyzer() {
  const [reportText, setReportText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleTextChange = (event) => {
    setReportText(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!reportText.trim()) {
      setError('Please enter some text to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8001/api/reports/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: reportText }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to analyze report');
      }
      
      setResult(data.data);
    } catch (err) {
      setError(err.message || 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Function to determine color based on importance score
  const getColorFromScore = (score) => {
    if (score >= 80) return 'text-red-500'; // High importance
    if (score >= 60) return 'text-orange-500'; // Moderate-high importance
    if (score >= 40) return 'text-yellow-500'; // Moderate importance
    if (score >= 20) return 'text-blue-500'; // Low-moderate importance
    return 'text-gray-300'; // Low importance
  };

  // Function to determine risk level color
  const getRiskLevelColor = (level) => {
    switch(level?.toLowerCase()) {
      case 'high': return 'text-red-500';
      case 'moderate': return 'text-orange-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto px-6 py-8">
        <div className="rounded-2xl p-12 border border-gray-800 shadow-2xl bg-gray-900 bg-opacity-40 backdrop-blur-sm">
          {!result && (
            <h1 className="text-4xl font-bold text-blue-500 mb-12 text-center">
              Medical Report Analyzer
            </h1>
          )}

          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Text Input Area */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="reportText" className="text-lg text-gray-300 font-medium">
                    Enter Medical Report Text
                  </label>
                  <FileText size={24} className="text-blue-500" />
                </div>
                
                <textarea
                  id="reportText"
                  value={reportText}
                  onChange={handleTextChange}
                  rows={12}
                  className="w-full p-6 bg-gray-800 text-gray-200 border border-gray-700 rounded-lg 
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none 
                    shadow-inner resize-none font-medium"
                  placeholder="Paste or type your medical report text here..."
                  required
                />
              </div>

              {error && (
                <div className="flex items-start space-x-2 text-red-500">
                  <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isAnalyzing || !reportText.trim()}
                className="w-full py-4 px-6 rounded-lg bg-blue-600 text-white font-medium 
                  transition duration-200 ease-in-out transform hover:bg-blue-700 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Medical Report'}
              </button>
            </form>
          ) : (
            <div className="space-y-8">
              {/* Results Header with improved styling */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between text-center">
                  <h1 className="text-4xl font-bold text-blue-500">Medical Report Analyzer</h1>
                  <span className="px-4 py-1 rounded-full bg-blue-900 bg-opacity-40 text-blue-400 text-sm">
                    {new Date(result.processed_at).toLocaleString()}
                  </span>
                </div>
                
                <h2 className="text-2xl font-semibold text-gray-200 mt-6 mb-2">Analysis Results</h2>
                
                <div className="flex items-center gap-8 mt-2 mb-6">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Risk Score</p>
                    <p className="text-3xl font-bold text-white">{result.risk_score.toFixed(1)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Risk Level</p>
                    <p className={`text-3xl font-bold ${getRiskLevelColor(result.risk_level)}`}>
                      {result.risk_level}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Colored Text Analysis with improved styling */}
              <div className="p-8 bg-gray-800 bg-opacity-50 rounded-lg border border-gray-700 shadow-lg">
                <h3 className="text-xl font-semibold text-white mb-8">Highlighted Report</h3>
                <div className="text-base leading-relaxed p-2">
                  {result.sentence_analysis
                    .sort((a, b) => a.position - b.position)
                    .map((item, index) => (
                      <span 
                        key={index} 
                        className={`${getColorFromScore(item.importance_score)} inline`}
                      >
                        {item.sentence}{' '}
                      </span>
                    ))}
                </div>
              </div>
              
              {/* Legend with improved styling */}
              <div className="px-6 py-4 bg-gray-800 bg-opacity-30 rounded-lg border border-gray-700 border-opacity-50">
                <p className="text-sm font-medium text-gray-300 mb-3">Color Legend</p>
                <div className="flex flex-wrap gap-x-8 gap-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-red-500 rounded-full"></span>
                    <span className="text-sm text-gray-300">High Importance</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-orange-500 rounded-full"></span>
                    <span className="text-sm text-gray-300">Moderate-High</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-yellow-500 rounded-full"></span>
                    <span className="text-sm text-gray-300">Moderate</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-blue-500 rounded-full"></span>
                    <span className="text-sm text-gray-300">Low-Moderate</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-gray-500 rounded-full"></span>
                    <span className="text-sm text-gray-300">Low Importance</span>
                  </div>
                </div>
              </div>
              
              {/* Back Button with improved styling */}
              <button
                onClick={() => setResult(null)}
                className="w-full py-4 px-6 rounded-lg bg-blue-600 text-white font-medium 
                  transition duration-200 ease-in-out hover:bg-blue-700
                  focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg"
              >
                Analyze Another Report
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MedicalReportAnalyzer;