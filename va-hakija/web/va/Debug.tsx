import React from 'react'

export type DebugProps = { json: any }

export default function Debug({ json }: DebugProps) {
  console.log(json)
  return (
    <pre
      id="debug-api-response"
      style={{
        color: 'lightgreen',
        backgroundColor: 'black',
      }}
    >
      {JSON.stringify(json, null, 2)}
    </pre>
  )
}
