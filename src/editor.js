import { Editor } from 'slate-react'
import { Block, Value, Data } from 'slate'
import PlaceholderPlugin from 'slate-react-placeholder'

import cx from 'classnames'

import React from 'react'
import initialValueAsJson from './value.json'

import Entities from './entities'

const plugins = [
  PlaceholderPlugin({
    placeholder: 'Summary of intent',
    when: (editor, node) => node.text.trim() === '' && node.type === 'title'
  }),
  PlaceholderPlugin({
    placeholder: 'Type a sentence',
    when: (editor, node) => node.text.trim() === '' && node.type === 'paragraph'
  })
]

const availableEntities = [
  { name: 'Date and Time', type: 'system.date', description: '' },
  { name: 'Ordinal Numbers', type: 'system.ordinal', description: '' },
  { name: 'Any one word', type: 'system.anyOne', description: '' },
  { name: 'Any many words', type: 'system.anyMany', description: '' },
  { name: 'City', type: 'list.city', description: '' }
]

/**
 * Deserialize the initial editor value.
 *
 * @type {Object}
 */

function BoldMark(props) {
  if (props.mark.data.get('color')) {
    return (
      <strong style={{ color: props.mark.data.get('color') }}>
        {props.children}
      </strong>
    )
  }
  return <strong>{props.children}</strong>
}

const initialValue = Value.fromJSON(initialValueAsJson)

/**
 * A simple schema to enforce the nodes in the Slate document.
 *
 * @type {Object}
 */

const schema = {
  document: {
    nodes: [
      { match: { type: 'title' }, min: 1, max: 1 },
      { match: { type: 'paragraph' }, min: 1 }
    ],
    normalize: (editor, { code, node, child, index }) => {
      switch (code) {
        case 'child_type_invalid': {
          const type = index === 0 ? 'title' : 'paragraph'
          return editor.setNodeByKey(child.key, type)
        }
        case 'child_min_invalid': {
          const block = Block.create(index === 0 ? 'title' : 'paragraph')
          return editor.insertNodeByKey(node.key, index, block)
        }
      }
    }
  }
}

/**
 * The Forced Layout example.
 *
 * @type {Component}
 */

class ForcedLayout extends React.Component {
  /**
   * Render the editor.
   *
   * @return {Component} component
   */

  state = { selection: { utterance: -1, block: -1, from: -1, to: -1 } }

  onKeyDown = (event, editor, next) => {
    if (!event.ctrlKey) return next()

    // Decide what to do based on the key code...
    switch (event.key) {
      // When "B" is pressed, add a "bold" mark to the text.
      case 'b': {
        event.preventDefault()
        editor.toggleMark({
          type: 'bold',
          data: Data.fromJSON({ color: 'blue' })
        })
        break
      }
      // Otherwise, let other plugins handle it.
      default: {
        return next()
      }
    }
  }

  render() {
    return (
      <div>
        <Entities
          selection={this.state.selection}
          entities={availableEntities}
        />
        <Editor
          placeholder="Enter utterance..."
          defaultValue={initialValue}
          schema={schema}
          renderNode={this.renderNode}
          renderMark={this.renderMark}
          onKeyDown={this.onKeyDown}
          onChange={this.onChange}
          plugins={plugins}
        />
      </div>
    )
  }

  onChange = ({ value, operations }) => {
    if (operations.filter(x => x.get('type') === 'set_selection').size) {
      const v = value.get('selection').toJS()
      let from = -1
      let to = -1
      let utterance = -1
      let block = -1
      if (
        // the editor has to be focused for tagging
        v.isFocused &&
        // Make sure we're in the same utterance (you can't tag cross-utterance)
        v.anchor.path['0'] === v.focus.path['0'] &&
        // Make sure we're not wrapping an other entity inside an other entity
        v.anchor.path['1'] === v.focus.path['1']
      ) {
        utterance = v.anchor.path['0']
        block = v.anchor.path['1']
        from = Math.min(v.anchor.offset, v.focus.offset)
        to = Math.max(v.anchor.offset, v.focus.offset)
      }
      this.setState({ selection: { utterance, block, from, to } })
    }
  }

  renderMark = (props, editor, next) => {
    switch (props.mark.type) {
      case 'bold':
        return <BoldMark {...props} />
      default:
        return next()
    }
  }

  /**
   * Render a Slate node.
   *
   * @param {Object} props
   * @param {Editor} editor
   * @param {Function} next
   * @return {Element}
   */

  renderMetadata = () => {
    const { selection } = this.state
    console.log('hello')
    if (
      selection &&
      selection.utterance > -1 &&
      selection.from !== selection.to
    ) {
      return (
        <div>
          <div>TAG THIS</div>
          <div># of utterances</div>
        </div>
      )
    }

    // console.log(editor.unwrapBlock('text'))
    return (
      <div>
        <div>List of Entities</div>
        <div># of utterances</div>
      </div>
    )
  }

  renderNode = (props, editor, next) => {
    const { attributes, children, node } = props
    const elementCx = cx('utterance', {
      title: node.type === 'title',
      active: props.isFocused
    })

    switch (node.type) {
      case 'title':
      case 'paragraph':
        return (
          <p className={elementCx} {...attributes}>
            {children}
          </p>
        )
      default:
        return next()
    }
  }
}

/**
 * Export.
 */

export default ForcedLayout
