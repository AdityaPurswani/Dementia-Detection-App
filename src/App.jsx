// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import About from './components/About';
import UploadMRI from './components/UploadMRI';
import UploadReports from './components/UploadReports';
import Results from './components/Results';
import VisualizationPage from './components/VisualisationPage';
import GraphDetailPage from './components/GraphDetailPage';
import Contact from './components/Contact';
import MRIAnalyzer from './components/MRIAnalyzer';


function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/upload-mri" element={<UploadMRI />} />
        <Route path="/upload-reports" element={<UploadReports />} />
        <Route path="/results" element={<Results />} />
        <Route path="/visualise" element={<VisualizationPage/>}/>
        <Route path='/visualise/:id' element={<GraphDetailPage />}/>
        <Route path='/contact' element={<Contact />} />
      </Routes>
    </Router>
  );
}

export default App;

