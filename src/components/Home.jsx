import React, { useState, useEffect } from "react";
import BrainCanvas from "./Brain";

function Home() {
  const [popups, setPopups] = useState([]); // State to manage active pop-ups

  useEffect(() => {
    // Function to add a new pop-up
    const addPopup = () => {
      const id = new Date().getTime(); // Unique ID for each pop-up
      setPopups((prevPopups) => [
        ...prevPopups,
        {
          id,
          message: getRandomMessage(),
          position: getRandomPosition(), // Generate random position
        },
      ]);

      // Remove the pop-up after 5 seconds
      setTimeout(() => {
        setPopups((prevPopups) =>
          prevPopups.filter((popup) => popup.id !== id)
        );
      }, 2000);
    };

    // Add pop-ups every 5 seconds
    const interval = setInterval(addPopup, 5000);

    return () => clearInterval(interval); // Clean up interval on unmount
  }, []);

  // Function to generate random messages
  const getRandomMessage = () => {
    const messages = [
      "Alzheimer's affects memory and behavior.",
      "The hippocampus is vital for memory formation.",
      "Early detection of Alzheimer's can slow progression.",
      "Regular mental exercise keeps your brain healthy.",
      "Did you know? Alzheimer's is not a normal part of aging.",
      "The human brain is a complex organ responsible for controlling various functions, including thought, memory, emotion, and movement.",
      "Frontal Lobe: Involved in attention, planning, decision-making, and personality traits.",
      "Parietal Lobe: Processes sensory information and integrates data from different senses.",
      "Temporal Lobe: Associated with language, memory, and emotion.",
      "Occipital Lobe: Responsible for visual processing.",
      "Cerebellum: Coordinates movement and balance, and plays a role in cognitive functions that require precise timing.",
      "Brainstem: Connects the brain to the spinal cord and regulates vital functions such as breathing, heart rate, and sleep cycles.",
      "Limbic System: Includes structures like the hippocampus and amygdala, which are crucial for memory formation and emotional responses.",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Function to generate random positions for the pop-ups
  const getRandomPosition = () => {
    const top = Math.floor(Math.random() * 50) + 25; // Random top position within 25% to 75% of the screen height
    const left = Math.floor(Math.random() * 80) + 10; // Random left position within 10% to 90% of the screen width
    return { top: `${top}%`, left: `${left}%` };
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-r from-black via-gray-900 to-black">
      {/* Header Section */}
      <div className="absolute top-10 left-0 right-0 text-center z-20">
        <h1 className="text-5xl font-bold text-blue-500 mb-4">
          Welcome to the Dementia Detection Platform
        </h1>
        <p className="text-lg text-gray-300">
          Participate in our study by uploading MRI scans and medical reports to contribute to early detection research.
        </p>
      </div>

      {/* Pop-Up Section */}
      {popups.map((popup) => (
        <div
          key={popup.id}
          style={{
            position: "absolute",
            top: popup.position.top,
            left: popup.position.left,
          }}
          className="bg-gray-800 text-white p-4 rounded-lg shadow-md animate-fade z-30 w-64 break-words text-center"
        >
          {popup.message}
        </div>
      ))}

      {/* Canvas Section */}
      <div className="absolute inset-0 z-10">
        <BrainCanvas />
      </div>
    </div>
  );
}

export default Home;
