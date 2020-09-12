/**
 * Created by bharatbatra on 11/10/17.
 */
import React, { Component } from 'react';
import { hydrate } from 'react-dom';
import BasicComponent from './components/BasicComponent'

hydrate(
  <BasicComponent />,
  document.getElementById('app')
);