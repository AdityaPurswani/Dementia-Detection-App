// src/components/graphData.js
const graphData = [
    {
      id: "1",
      title: "Correllation Map for the entire feature set",
      description: "Correlation Map",
      imgSrc: "/all.png", // Replace with actual image URLs
      details: "This graph shows increased correlation between the integrated multimodal feature and underscores the need for feature selection",
    },
    {
      id: "2",
      title: "Number of Instances for Each Diagnostic Category",
      description: "Data imbalance",
      imgSrc: "/imb.png", // Replace with actual image URLs
      details: "This graph marks the number of instances for each diagnosis classes and we can clearly see data imbalance with AD being significantly higher than other classes",
    },
    {
      id: "3",
      title: "Correllation Map for the selected feature set",
      description: "Correlation map",
      imgSrc: "/corr.png", // Replace with actual image URLs
      details: "This graph shows lower correlation between the integrated multimodal feature suitable for training machine learning models",
    },
    {
      id: "4",
      title: "Feature Importance for Random Forest model",
      description: "Feature Importance",
      imgSrc: "/rfc4fi.png", // Replace with actual image URLs
      details: "The graph illustrates the feature considered as important by the Random Forest model in condition 4 (achieving 91.7% accuracy)",
    },
    {
      id: "5",
      title: "AUC-ROC scores for Random Forest model",
      description: "AUC-ROC curves",
      imgSrc: "/rfc4roc.png", // Replace with actual image URLs
      details: "The graph illustrates how well the model is able to distinguish between the different neurodegenerative categories",
    },
    {
      id: "6",
      title: "Feature Importance for XGBoost Model",
      description: "Feature Importance",
      imgSrc: "/xgfi.png", // Replace with actual image URLs
      details: "The graph illustrates the feature considered as important by the Random Forest model in condition 2 (achieving 84.5% accuracy)",
    },
  ];
  
  export default graphData;
  