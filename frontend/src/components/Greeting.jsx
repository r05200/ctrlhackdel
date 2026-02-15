import React from 'react';

function Greeting({ name = 'Explorer' }) {
  return (
    <div className="text-center mb-8 select-none">
      <h1 className="text-3xl font-light text-gray-200 animate-gentle-pulse">
        Good morning, <span className="font-normal">{name}</span>
      </h1>
    </div>
  );
}

export default Greeting;
