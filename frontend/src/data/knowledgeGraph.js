// Knowledge Graph Data Structure
// status: 'locked' | 'active' | 'mastered'

export const knowledgeGraphData = {
  nodes: [
    // Starting Node
    { id: 'programming-basics', label: 'Programming\nBasics', status: 'mastered', level: 1, description: 'Variables, loops, conditionals' },
    
    // Level 2 - Fundamentals
    { id: 'data-structures', label: 'Data\nStructures', status: 'active', level: 2, description: 'Arrays, Lists, Hash Tables' },
    { id: 'algorithms', label: 'Algorithms', status: 'locked', level: 2, description: 'Sorting, Searching, Complexity' },
    
    // Level 3 - Core CS
    { id: 'linear-algebra', label: 'Linear\nAlgebra', status: 'locked', level: 3, description: 'Vectors, Matrices, Eigenvalues' },
    { id: 'statistics', label: 'Statistics &\nProbability', status: 'locked', level: 3, description: 'Distributions, Hypothesis Testing' },
    { id: 'calculus', label: 'Calculus', status: 'locked', level: 3, description: 'Derivatives, Integrals, Optimization' },
    
    // Level 4 - ML Foundations
    { id: 'python', label: 'Python for\nML', status: 'locked', level: 4, description: 'NumPy, Pandas, Matplotlib' },
    { id: 'ml-basics', label: 'Machine\nLearning Basics', status: 'locked', level: 4, description: 'Supervised vs Unsupervised Learning' },
    
    // Level 5 - Advanced ML
    { id: 'neural-networks', label: 'Neural\nNetworks', status: 'locked', level: 5, description: 'Perceptrons, Backpropagation' },
    { id: 'deep-learning', label: 'Deep\nLearning', status: 'locked', level: 5, description: 'CNNs, RNNs, Transformers' },
    
    // Level 6 - Specializations
    { id: 'computer-vision', label: 'Computer\nVision', status: 'locked', level: 6, description: 'Image Recognition, Object Detection' },
    { id: 'nlp', label: 'Natural Language\nProcessing', status: 'locked', level: 6, description: 'Text Analysis, LLMs' },
    { id: 'reinforcement-learning', label: 'Reinforcement\nLearning', status: 'locked', level: 6, description: 'Q-Learning, Policy Gradients' },
  ],
  links: [
    // Level 1 -> Level 2
    { source: 'programming-basics', target: 'data-structures' },
    { source: 'programming-basics', target: 'algorithms' },
    
    // Level 2 -> Level 3
    { source: 'data-structures', target: 'linear-algebra' },
    { source: 'algorithms', target: 'statistics' },
    { source: 'algorithms', target: 'calculus' },
    
    // Level 3 -> Level 4
    { source: 'linear-algebra', target: 'python' },
    { source: 'statistics', target: 'ml-basics' },
    { source: 'calculus', target: 'ml-basics' },
    { source: 'python', target: 'ml-basics' },
    
    // Level 4 -> Level 5
    { source: 'ml-basics', target: 'neural-networks' },
    { source: 'linear-algebra', target: 'neural-networks' },
    { source: 'neural-networks', target: 'deep-learning' },
    
    // Level 5 -> Level 6
    { source: 'deep-learning', target: 'computer-vision' },
    { source: 'deep-learning', target: 'nlp' },
    { source: 'deep-learning', target: 'reinforcement-learning' },
  ]
};

// Helper function to get node color based on status
export const getNodeColor = (status) => {
  switch (status) {
    case 'mastered':
      return '#4cc9f0'; // Bright blue
    case 'active':
      return '#39ff14'; // Neon green
    case 'locked':
      return '#555555'; // Gray
    default:
      return '#ffffff';
  }
};

// Helper function to get link color based on connected nodes
export const getLinkColor = (link, nodesMap) => {
  const sourceNode = nodesMap.get(link.source.id || link.source);
  const targetNode = nodesMap.get(link.target.id || link.target);
  
  if (sourceNode?.status === 'mastered' && targetNode?.status !== 'locked') {
    return 'rgba(0, 255, 136, 0.4)'; // Active path
  } else if (sourceNode?.status === 'mastered') {
    return 'rgba(255, 255, 255, 0.2)'; // Unlockable path
  }
  return 'rgba(100, 100, 100, 0.1)'; // Locked path
};
