module.exports = {
  preset: 'ts-jest',
  testEnvironment: './jest-environment.js',
  testRunner: 'jest-circus/runner',
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
