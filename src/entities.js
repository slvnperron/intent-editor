import React from 'react'
import cx from 'classnames'

import { slotShortcuts } from './constants'

class EntitiesBar extends React.PureComponent {
  render() {
    if (this.props.selection.from !== this.props.selection.to) {
      // There's text selected that we can tag entities on
      return this.renderTagging()
    } else {
      return this.renderAllSlots()
    }
  }

  renderTagging() {
    if (!this.props.slots.length) {
      return (
        <p>
          You have no slot defined.{' '}
          <a href="#" onClick={this.props.onCreateSlot}>
            Create one first.
          </a>
        </p>
      )
    }

    return (
      <div>
        <p>
          Click a slot to tag it or press the keyboard shortcut (the number).
        </p>
        <div className="entities-list">
          {this.props.slots.map((slot, idx) =>
            this.renderSlot(slot, idx, true)
          )}
        </div>
      </div>
    )
  }

  renderAllSlots() {
    if (!this.props.slots.length) {
      return (
        <p>
          There are no slots.{' '}
          <a href="#" onClick={this.props.onCreateSlot}>
            Create one.
          </a>
        </p>
      )
    }

    return (
      <div className="entities-list">
        {this.props.slots.map((slot, idx) => this.renderSlot(slot, idx, false))}
      </div>
    )
  }

  renderSlot(slot, idx, tagMode) {
    const cn = cx('slot', `color-` + slot.color, {
      tag: tagMode,
      'color-bg': tagMode,
      'color-fg': !tagMode
    })

    const suffix = tagMode ? (
      <span className="suffix idx">{slotShortcuts[idx]}</span>
    ) : null

    return (
      <span
        onClick={() =>
          tagMode ? this.props.onTag(idx, this.props.editor) : null
        }
        key={`slot-${idx}`}
        className={cn}
      >
        {slot.name}
        {suffix}
      </span>
    )
  }
}

/**
 * Export.
 */

export default EntitiesBar
