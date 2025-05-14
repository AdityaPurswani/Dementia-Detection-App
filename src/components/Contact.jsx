import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import emailjs from '@emailjs/browser';
import EarthCanvas from '../canvas/Earth';
import StarsCanvas from '../canvas/Stars';
import { slideIn } from '../utils/motion';
import SectionWrapper from '../hoc/SectionWrapper';

const Contact = () => {
  const formRef = useRef();
  const [form, setForm] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    emailjs.send(
      'service_6ec6pii',
      'template_k4j4fzm',
      {
        from_name: form.name,
        to_name: 'Aditya',
        from_email: form.email,
        to_email: 'adityapurswani386@gmail.com',
        message: form.message,
      },
      'LmxfSYnLqxHPjlts4'
    ).then(() => {
      setLoading(false);
      alert('Thank you. I will get back to you as soon as possible.');
      setForm({
        name: '',
        email: '',
        message: '',
      });
    }, (error) => {
      setLoading(false);
      console.log(error);
      alert('Something went wrong.');
    });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden  w-full h-screen bg-gradient-to-r from-black via-gray-900 to-black">
     <div className="w-full mx-auto flex items-center justify-center px-20">
        {/* Form Section */}
        <motion.div 
          variants={slideIn('left', 'tween', 0.2, 1)} 
          className="flex flex-col w-[600px] ml-auto pr-20"
        >
          <h3 className="text-blue-500 text-xl uppercase tracking-wider mb-2">
            Get in Touch
          </h3>
          <h2 className="text-6xl font-bold text-white mb-12">
            Contact.
          </h2>
          
          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <span className="text-white text-lg">Your Name</span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="What's your name"
                className="bg-[#1a1a1a] py-4 px-6 text-white rounded-lg outline-none w-full"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <span className="text-white text-lg">Your Email</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="What's your email"
                className="bg-[#1a1a1a] py-4 px-6 text-white rounded-lg outline-none w-full"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <span className="text-white text-lg">Message</span>
              <textarea
                rows="7"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="What do you want to say"
                className="bg-[#1a1a1a] py-4 px-6 text-white rounded-lg outline-none resize-none w-full"
              />
            </div>

            <button
              type="submit"
              className="py-3 px-8 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </motion.div>
        
        
        {/* Earth Canvas Section */}
        <motion.div 
          variants={slideIn('right', 'tween', 0.2, 1)} 
          className="h-[900px] w-[900px]"
        >
          <StarsCanvas />
          <EarthCanvas />
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;