import React from "react";

function About() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
      <div className="w-full max-w-5xl mx-auto px-6 py-8">
        <div className="rounded-2xl p-12 border border-gray-800">
          {/* Header */}
          <h1 className="text-4xl font-bold text-blue-500 mb-8 text-center">
            About the Study
          </h1>

          {/* Main Content */}
          <div className="space-y-8 text-gray-200">
            {/* Introduction */}
            <p className="text-lg leading-relaxed">
              Neurodegenerative illnesses such as Alzheimer's Dementia (AD), 
              Fronto-Temporal Dementia (FTD), Mild Cognitive Impairment (MCI), 
              and other dementia subtypes, especially mixed-dementia present 
              serious challenges in early clinical diagnosis. Early detection 
              of cognitive decline is crucial for patients to receive timely 
              treatment and medication.
            </p>

            {/* Research References */}
            <p className="text-lg leading-relaxed">
              Jack et al.<span className="text-blue-400">[1]</span> provide 
              criteria for diagnosing and staging Alzheimer's Dementia. The 
              "Cognitive and Neuroimaging in Neurodegenerative Disorders" 
              (CogNID) study<span className="text-blue-400">[2]</span> tries 
              to improve understanding and diagnosis of these disorders.
            </p>

            {/* Traditional Approaches Section */}
            <div className="space-y-6">
              <p className="text-lg leading-relaxed">
                Traditional approaches include clinical assessments, cognitive 
                tests like the Addenbrooke's these methods have drawbacks:
              </p>

              <ul className="space-y-4 pl-6">
                <li className="flex items-start space-x-4">
                  <span className="text-blue-500 mt-1.5">•</span>
                  <p className="text-lg leading-relaxed flex-1">
                    These tests don't consider the patient's education level 
                    and language proficiency, affecting the results, and are 
                    only able to detect dementia once cognitive decline has 
                    already started.
                  </p>
                </li>
                <li className="flex items-start space-x-4">
                  <span className="text-blue-500 mt-1.5">•</span>
                  <p className="text-lg leading-relaxed flex-1">
                    Conventional MRI scans often lack resolution, potentially 
                    missing neurodegenerative biomarkers and delaying diagnosis.
                  </p>
                </li>
              </ul>
            </div>

            {/* Project Approach */}
            <p className="text-lg leading-relaxed">
              This project will leverage Artificial Intelligence to tackle these 
              limitations, perform cognitive and neuroimaging data analysis, and 
              develop predictive models for early diagnosis of dementia. Using 
              the CogNID dataset, which includes ACE-III scores
              <span className="text-blue-400">[3]</span>, MRI imaging, and 
              clinical phenotyping, I will develop an AI diagnostic pipeline 
              for differentiating dementia subtypes and mixed-dementia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;