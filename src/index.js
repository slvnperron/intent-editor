import React from 'react'
import ReactDOM from 'react-dom'

import Editor from './editor'
import './styles.css'

function App() {
  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <Editor />
    </div>
  )
}

const rootElement = document.getElementById('root')
ReactDOM.render(<App />, rootElement)
