import React, { useMemo } from 'react';

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function Greeting({ name = 'Explorer' }) {
  const timeOfDay = useMemo(() => getTimeOfDay(), []);

  return (
    <div className="text-center mb-8 select-none">
      <h1 className="text-3xl font-light text-gray-200 animate-gentle-pulse">
        Good {timeOfDay}, <span className="font-normal">{name}</span>
      </h1>
    </div>
  );
}

export default Greeting;
