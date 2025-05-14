import React from "react";
import { useParams, Link } from "react-router-dom";
import graphData from "./graphData";

function GraphDetails() {
  const { id } = useParams();
  const graph = graphData.find((item) => item.id === id);

  if (!graph) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-black via-gray-900 to-black flex items-center justify-center text-white">
        <p>Graph not found!</p>
        <Link
          to="/visualization"
          className="text-blue-500 underline ml-4 px-5 py-5"
        >
          Back to Visualization
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-black via-gray-900 to-black p-8 flex flex-col items-center">
      <img
        src={graph.imgSrc}
        alt={graph.title}
        className="w-3/4 max-w-lg rounded-lg shadow-lg mb-6"
      />
      <h1 className="text-3xl font-bold text-blue-500">{graph.title}</h1>
      <p className="text-gray-300 text-lg mt-4 max-w-3xl text-center">
        {graph.details}
      </p>
      <Link
        to="/visualise"
        className="mt-6 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-500"
      >
        Back to Visualization
      </Link>
    </div>
  );
}

export default GraphDetails;
