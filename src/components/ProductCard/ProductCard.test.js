import React from 'react';
import ReactDOM from 'react-dom';
import ProductCard from './ProductCard';

it('It should mount', () => {
  const div = document.createElement('div');
  ReactDOM.render(<ProductCard />, div);
  ReactDOM.unmountComponentAtNode(div);
});