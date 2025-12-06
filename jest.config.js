module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['./tests/setup.js'],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
};