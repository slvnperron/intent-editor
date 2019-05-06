import { Editor } from 'slate-react'
import { Block, Value, Data, Range } from 'slate'
import PlaceholderPlugin from 'slate-react-placeholder'

import cx from 'classnames'

import React from 'react'
import initialValueAsJson from './value.json'

import { slotShortcuts } from './constants'

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

function SlotMark(props) {
  const slot = props.mark.data.toJS()
  const cn = cx('mark-slot', 'color-bg', `color-${slot.color}`)
  const remove = () =>
    props.editor.moveToRangeOfNode(props.node).removeMark(props.mark)
  return (
    <span onClick={remove} className={cn}>
      {props.children}
    </span>
  )
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
  editorRef = null

  onKeyDown = (event, editor, next) => {
    if (event.key === 'Enter') {
      const doc = editor.value.get('document')
      const marks = doc.getActiveMarksAtRange(editor.value.selection)

      if (marks.size) {
        event.preventDefault()
        return editor
          .moveToEndOfText()
          .moveForward()
          .insertBlock('paragraph')
      }
    }

    if (event.key === 'Backspace') {
      const doc = editor.value.get('document')
      const marks = doc.getActiveMarksAtRange(editor.value.selection)
      if (marks.size) {
        event.preventDefault()
        editor.moveEndToEndOfText().moveStartToStartOfText()
        marks.forEach(m => editor.removeMark(m))
        return
      }
    }

    const somethingSelected =
      this.state.selection.from !== this.state.selection.to
    const shortcutIdx = slotShortcuts.indexOf(event.key)

    if (
      somethingSelected &&
      shortcutIdx > -1 &&
      shortcutIdx < this.props.slots.length
    ) {
      event.preventDefault()
      this.onTag(shortcutIdx, editor)
      return
    }

    return next()
  }

  render() {
    return (
      <Editor
        placeholder="Enter utterance..."
        defaultValue={initialValue}
        value={this.props.value}
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

    this.editorRef = editor
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
              onTag={this.onTag}
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

  onTag = (idx, editor) => {
    const { utterance, block } = this.state.selection
    let { from, to } = this.state.selection

    const node = editor.value.getIn([
      'document',
      'nodes',
      utterance,
      'nodes',
      block
    ])

    const content = node.text

    // We're trimming white spaces in the tagging (forward and backward)
    while (from < to && !content.charAt(from).trim().length) {
      from++
    }
    do {
      to--
    } while (to > from && !content.charAt(to).trim().length)

    if (from >= to) {
      // Trimming screwed up selection (nothing to tag)
      return
    }

    const range = Range.fromJS({
      anchor: { path: [utterance, block], offset: from },
      focus: {
        path: [utterance, block],
        offset: Math.min(content.length, to + 1)
      }
    })

    const mark = {
      type: 'slot',
      data: Data.fromJSON(this.props.slots[idx])
    }

    const marks = editor.value.get('document').getActiveMarksAtRange(range)
    if (marks.size) {
      marks.forEach(m => editor.select(range).replaceMark(m, mark))
    } else {
      editor.select(range).addMark(mark)
    }
  }

  onChange = ({ value, operations }) => {
    if (operations.filter(x => x.get('type') === 'set_selection').size) {
      this.onSelectionChanged(value)
    }

    this.props.onChange(value)
  }

  renderMark = (props, editor, next) => {
    switch (props.mark.type) {
      case 'slot':
        return <SlotMark {...props} />
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

  onSelectionChanged(value) {
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

export default ForcedLayout
