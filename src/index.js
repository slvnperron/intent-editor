import React from 'react'
import ReactDOM from 'react-dom'

import IntentEditor from './editor'
import './styles.css'

const availableEntities = [
  { name: 'Date and Time', type: 'system.date', description: '' },
  { name: 'Number', type: 'system.number', description: '' },
  { name: 'Ordinal Number', type: 'system.ordinal', description: '' },
  { name: 'Any one word', type: 'system.anyOne', description: '' },
  { name: 'Any many words', type: 'system.anyMany', description: '' },
  { name: 'City', type: 'list.city', description: '' },
  { name: 'Airport Code', type: 'list.airport_code', description: '' }
]

const prebuiltSlots = [
  {
    name: 'departure',
    color: '0',
    entities: ['list.city', 'list.airport_code']
  },
  {
    name: 'destination',
    color: '1',
    entities: ['list.city', 'list.airport_code']
  },
  {
    name: 'departure_time',
    color: '2',
    entities: ['system.date']
  },
  {
    name: 'return_time',
    color: '3',
    entities: ['system.date']
  },
  {
    name: 'seats',
    color: '4',
    entities: ['system.number']
  }
]

class App extends React.Component {
  state = { slots: [] }

  render() {
    return (
      <div className="App">
        <h1>Hello CodeSandbox2</h1>
        <IntentEditor
          slots={this.state.slots}
          availableEntities={availableEntities}
          onCreateSlot={() => this.setState({ slots: prebuiltSlots })}
        />
      </div>
    )
  }
}

const rootElement = document.getElementById('root')
ReactDOM.render(<App />, rootElement)
