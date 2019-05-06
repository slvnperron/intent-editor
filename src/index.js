import React from 'react'
import ReactDOM from 'react-dom'

import { Value } from 'slate'

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

const restoreCache = () => {
  const initialIntentsValue = window.localStorage.getItem('bp-intents')
  const initialSlotsValue = window.localStorage.getItem('bp-slots')
  const value =
    typeof initialIntentsValue === 'string'
      ? Value.fromJS(JSON.parse(initialIntentsValue))
      : null
  const slots =
    typeof initialSlotsValue === 'string' ? JSON.parse(initialSlotsValue) : []
  return { slots, value }
}

const clearCache = () => {
  window.localStorage.removeItem('bp-intents')
  window.localStorage.removeItem('bp-slots')
}

class App extends React.Component {
  state = restoreCache()

  onValueChanged = value => {
    this.setState({ value }, () => {
      window.localStorage.setItem(
        'bp-intents',
        JSON.stringify(this.state.value.toJS())
      )
      window.localStorage.setItem('bp-slots', JSON.stringify(this.state.slots))
    })
  }

  render() {
    return (
      <div className="App">
        <h1>Intent Editor</h1>
        <p>
          Actions:{' '}
          <a href="#" onClick={clearCache}>
            Clear the cache
          </a>
        </p>
        <hr />
        <br />
        <IntentEditor
          slots={this.state.slots}
          value={this.state.value}
          onChange={this.onValueChanged}
          availableEntities={availableEntities}
          onCreateSlot={() => this.setState({ slots: prebuiltSlots })}
        />
      </div>
    )
  }
}

const rootElement = document.getElementById('root')
ReactDOM.render(<App />, rootElement)
