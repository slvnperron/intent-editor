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

class ForcedLayout extends React.Component {
  state = { selection: { utterance: -1, block: -1, from: -1, to: -1 } }
  utteranceKeys = []

  onKeyDown = (event, editor, next) => {
    if (!event.ctrlKey) return next()

    console.log(event.key)

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
      <Editor
        placeholder="Enter utterance..."
        defaultValue={initialValue}
        schema={schema}
        renderNode={this.renderNode}
        renderMark={this.renderMark}
        onKeyDown={this.onKeyDown}
        shouldNodeComponentUpdate={this.shouldNodeComponentUpdate}
        renderEditor={this.renderEditor}
        onChange={this.onChange}
        plugins={plugins}
      />
    )
  }

  renderEditor = (props, editor, next) => {
    const children = next()

    this.utteranceKeys = editor.value
      .getIn(['document', 'nodes'])
      .map(x => x.key)
      .toJS()

    return (
      <div className="editor-container">
        <div>{this.utteranceKeys.length} utterances</div>

        <div className="editor-body">
          <div className="utterances" editor={editor}>
            {children}
          </div>
          <div className="entities">
            <Entities
              editor={editor}
              selection={this.state.selection}
              onCreateSlot={this.props.onCreateSlot}
              availableEntities={this.props.availableEntities}
              slots={this.props.slots}
            />
          </div>
        </div>
      </div>
    )
  }

  onTag = idx => {
    console.log(idx)
  }

  onChange = ({ value, operations }) => {
    if (operations.filter(x => x.get('type') === 'set_selection').size) {
      const v = value.get('selection').toJS()
      let from = -1
      let to = -1
      let utterance = -1
      let block = -1
      if (
        // Something is actually selected
        v.anchor &&
        v.anchor.path &&
        v.focus &&
        v.focus.path &&
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

  renderNode = (props, editor, next) => {
    const { attributes, children, node } = props

    const utteranceIdx = this.utteranceKeys.indexOf(node.key)
    const isEmpty = node.text.trim().length <= 0
    const isWrong = utteranceIdx < this.utteranceKeys.length - 1 && isEmpty

    const elementCx = cx('utterance', {
      title: node.type === 'title',
      active: props.isFocused,
      wrong: isWrong
    })

    switch (node.type) {
      case 'title':
      case 'paragraph':
        return (
          <p className={elementCx} {...attributes}>
            {utteranceIdx > 0 ? (
              <span contentEditable={false} className="index">
                {utteranceIdx}
              </span>
            ) : (
              <span contentEditable={false} className="index">
                T
              </span>
            )}
            {children}
          </p>
        )
      default:
        return next()
    }
  }
}

export default ForcedLayout
