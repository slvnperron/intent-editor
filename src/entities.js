import React from 'react'
import cx from 'classnames'

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
        {this.props.slots.map((slot, idx) =>
          this.renderSlot(slot, idx + 1, true)
        )}
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

    return this.props.slots.map((slot, idx) =>
      this.renderSlot(slot, idx + 1, false)
    )
  }

  renderSlot(slot, idx, tagMode) {
    const cn = cx('slot', `color-` + slot.color, {
      tag: tagMode,
      'color-bg': tagMode,
      'color-fg': !tagMode
    })

    const suffix = tagMode ? <span className="suffix idx">{idx}</span> : null

    return (
      <span
        onClick={() => this.props.onTag(idx)}
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
