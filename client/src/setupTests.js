// setup file
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { enableMocks } from 'jest-fetch-mock';

global.console = {
    warn: jest.fn(),
    
    // Keep native behaviour for other methods, use those to print out things in your own tests, not `console.log`
    log: console.log, // console.log are ignored in tests
    error: console.error,
    info: console.info,
    debug: console.debug,
  };
enableMocks();
configure({ adapter: new Adapter() });