import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="bg-gradient-to-r from-black via-gray-900 to-black shadow-md">
      <div className="max-w-full px-20">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src="/brain.webp" alt="logo" className="w-16 h-10 object-contain"/>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex gap-5">
            <Link to="/" className="text-gray-300 hover:text-blue-600 text-base">
              Home
            </Link>
            <Link to="/about" className="text-gray-300 hover:text-blue-600 text-base">
              About the Study
            </Link>
            <Link to="https://docs-for-dementia-pipeline.vercel.app/" target='_blank' className="text-gray-300 hover:text-blue-600 text-base">
              Docs
            </Link>
            <Link to="/upload-mri" className="text-gray-300 hover:text-blue-600 text-base">
              Upload MRI Scans
            </Link>
            <Link to="/upload-reports" className="text-gray-300 hover:text-blue-600 text-base">
              Upload Medical Reports
            </Link>
            <Link to="/visualise" className="text-gray-300 hover:text-blue-600 text-base">
              Visualization
            </Link>
            <Link to="/contact" className="text-gray-300 hover:text-blue-600 text-base">
              Contact Us
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            {/* Mobile menu implementation */}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;