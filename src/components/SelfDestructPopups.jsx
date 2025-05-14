import React, { useEffect, useState } from "react";

function SelfDestructPopups() {
  const [popups, setPopups] = useState([]); // State to manage active pop-ups

  useEffect(() => {
    // Function to add a new pop-up to the screen
    const addPopup = () => {
      const id = new Date().getTime(); // Unique ID for each pop-up
      setPopups((prevPopups) => [...prevPopups, { id, message: getRandomMessage() }]);

      // Remove the pop-up after 5 seconds
      setTimeout(() => {
        setPopups((prevPopups) => prevPopups.filter((popup) => popup.id !== id));
      }, 5000);
    };

    // Start a loop to add pop-ups every 5 seconds
    const interval = setInterval(addPopup, 5000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(interval);
  }, []);

  // Function to generate random messages for the pop-ups
  const getRandomMessage = () => {
    const messages = [
      "Alzheimer's affects memory and behavior.",
      "The hippocampus plays a key role in memory.",
      "Early detection can slow down Alzheimer's progression.",
      "Engage in brain exercises to keep your brain healthy.",
      "Did you know? Alzheimer's is not a normal part of aging.",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-r from-black via-gray-900 to-black flex items-center justify-center">
      <h1 className="text-5xl font-bold text-blue-500 mb-4 text-center">
        Alzheimer's Information Popups
      </h1>
      <p className="text-lg text-gray-300 text-center mb-8">
        Informative messages about Alzheimer's and brain health will appear and disappear in a loop.
      </p>

      {/* Render pop-ups */}
      <div className="absolute top-20 left-0 right-0 flex flex-wrap justify-center space-x-4">
        {popups.map((popup) => (
          <div
            key={popup.id}
            className="bg-gray-800 text-white p-4 rounded-lg shadow-md m-2 animate-fade"
          >
            {popup.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SelfDestructPopups;
