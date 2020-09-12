import React, { Component } from 'react';
import { renderToString } from 'react-dom/server';

import BasicComponent from '../../frontend/components/BasicComponent'

export default function renderReactApp() {

  // Render the component to a string
  const html = renderToString(
     <BasicComponent />
  );


  return {
    html
  };
}

