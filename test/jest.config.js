module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['./**/?(*.)test.ts'],
  testTimeout: 10000,
  verbose: false,
  reporters: [ 
    "default", 
    [
      "jest-junit", 
      { 
        outputDirectory: "./target",
        outputName: "junit-jest-js-unit.xml"
      }
    ]
  ]
}
