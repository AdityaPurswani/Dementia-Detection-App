// src/components/Results.js
import React from 'react';
import { useLocation } from 'react-router-dom';

function Results() {
  const location = useLocation();
  const { results } = location.state || {};

  if (!results) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-700">No results to display.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">Analysis Results</h1>
      {results.mtaScore && (
        <p className="text-gray-700 text-lg">MTA Score: {results.mtaScore}</p>
      )}
      {results.gcaScore && (
        <p className="text-gray-700 text-lg">GCA Score: {results.gcaScore}</p>
      )}
      {results.sentimentScore && (
        <p className="text-gray-700 text-lg">Sentiment Score: {results.sentimentScore}</p>
      )}
    </div>
  );
}

export default Results;
