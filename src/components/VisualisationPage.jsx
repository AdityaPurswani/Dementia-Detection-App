import React from "react";
import { Link } from "react-router-dom";
import graphData from "./graphData";

function VisualizationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center py-16">
      <div className="w-full max-w-7xl mx-auto px-6">
        {/* Header */}
        <h1 className="text-6xl font-bold text-blue-500 mb-16 text-center">
          Visualization Graphs
        </h1>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
          {graphData.map((graph) => (
            <Link
              key={graph.id}
              to={`/visualise/${graph.id}`}
              className="group"
            >
              <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
                {/* Image Container */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={graph.imgSrc}
                    alt={graph.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60" />
                </div>

                {/* Content */}
                <div className="p-6 space-y-3">
                  <h2 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {graph.title}
                  </h2>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {graph.description}
                  </p>
                </div>

                {/* Hover Overlay */}
                <div className="px-6 pb-6">
                  <div className="text-blue-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    View Details →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VisualizationPage;