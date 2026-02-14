/**
 * Configuration and environment variables
 */
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/concept-tree',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FLASK_DEBUG: process.env.FLASK_DEBUG === 'true',

  // Math prerequisites mappings for interpolation
  MATH_PREREQUISITES: {
    "l'hôpital's rule": ["derivatives", "limits"],
    "fundamental theorem of calculus": ["integration", "derivatives", "antiderivatives"],
    "chain rule": ["derivatives", "composition"],
    "product rule": ["derivatives", "multiplication"],
    "quotient rule": ["derivatives", "division"],
    "eigenvalues": ["matrix operations", "determinants", "linear transformations"],
    "eigenvectors": ["eigenvalues", "matrix operations"],
    "diagonalization": ["eigenvalues", "eigenvectors", "linear transformations"],
    "singular value decomposition": ["matrix operations", "linear algebra"],
    "rank": ["linear independence", "matrix operations"],
    "span": ["linear combinations", "vectors"],
    "linear independence": ["vectors", "linear combinations"],
    "basis": ["span", "linear independence"],
    "dimension": ["basis", "vector spaces"],
    "vector space": ["vectors", "linear algebra"],
    "matrix multiplication": ["matrices", "dot product"],
    "determinant": ["matrices", "linear transformations"]
  },

  // Category keywords for auto-detection
  CATEGORY_KEYWORDS: {
    "Linear Algebra": ["matrix", "vector", "eigenvalue", "determinant", "linear", "span", "basis"],
    "Calculus": ["derivative", "integral", "limit", "continuity", "calculus", "differential"],
    "Algebra": ["polynomial", "equation", "quadratic", "factor", "exponent"],
    "Geometry": ["angle", "triangle", "circle", "polygon", "spatial", "symmetry"],
    "Statistics": ["probability", "distribution", "variance", "mean", "correlation", "hypothesis"],
    "Computer Science": ["algorithm", "data structure", "complexity", "graph", "sorting"],
    "Physics": ["force", "energy", "momentum", "field", "quantum", "mechanics"],
    "General Knowledge": []
  }
};
