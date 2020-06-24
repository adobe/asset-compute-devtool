import React from 'react';
import { shallow } from 'enzyme';
import App from '../App';
import Provider from '@react/react-spectrum/Provider';

it('renders without crashing', () => {
  shallow(<Provider theme="dark"><App/></Provider>);
});