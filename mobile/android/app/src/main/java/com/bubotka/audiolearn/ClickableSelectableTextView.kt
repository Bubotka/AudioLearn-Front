package com.bubotka.audiolearn

import android.content.Context
import android.util.AttributeSet
import android.view.ActionMode
import android.view.GestureDetector
import android.view.Menu
import android.view.MenuItem
import android.view.MotionEvent
import android.widget.FrameLayout
import android.widget.TextView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class ClickableSelectableTextView : FrameLayout {
  private var menuOptions: Array<String> = emptyArray()
  private var textView: TextView? = null
  private var gestureDetector: GestureDetector? = null
  private var currentActionMode: ActionMode? = null
  private var lastSelectionStart = -1
  private var lastSelectionEnd = -1

  constructor(context: Context?) : super(context!!) {
    setupGestureDetector()
  }

  constructor(context: Context?, attrs: AttributeSet?) : super(context!!, attrs) {
    setupGestureDetector()
  }

  constructor(context: Context?, attrs: AttributeSet?, defStyleAttr: Int) : super(
    context!!,
    attrs,
    defStyleAttr
  ) {
    setupGestureDetector()
  }

  private fun setupGestureDetector() {
    gestureDetector = GestureDetector(context, object : GestureDetector.SimpleOnGestureListener() {
      override fun onSingleTapConfirmed(e: MotionEvent): Boolean {
        textView?.let { tv ->
          val clickedWord = getWordAtPosition(tv, e.x, e.y)
          if (clickedWord.isNotEmpty()) {
            onWordClick(clickedWord)
            return true
          }
        }
        return false
      }

      override fun onDown(e: MotionEvent): Boolean {
        return true
      }
    })
  }

  fun setMenuOptions(options: Array<String>) {
    this.menuOptions = options
    setupTextView()
  }

  private fun setupTextView() {
    // Find the first TextView child
    for (i in 0 until childCount) {
      val child = getChildAt(i)
      if (child is TextView) {
        textView = child
        setupSelectionCallback(child)
        break
      }
    }
  }

  private fun setupSelectionCallback(textView: TextView) {
    textView.setTextIsSelectable(true)
    textView.customSelectionActionModeCallback = object : ActionMode.Callback {
      override fun onCreateActionMode(mode: ActionMode?, menu: Menu?): Boolean {
        android.util.Log.d("ClickableSelectableText", "onCreateActionMode called")
        currentActionMode = mode
        // Store initial selection
        lastSelectionStart = textView.selectionStart
        lastSelectionEnd = textView.selectionEnd
        android.util.Log.d("ClickableSelectableText", "Initial selection: $lastSelectionStart-$lastSelectionEnd")

        // Return true to create action mode, but we'll hide the menu in onPrepare
        return true
      }

      override fun onPrepareActionMode(mode: ActionMode?, menu: Menu?): Boolean {
        android.util.Log.d("ClickableSelectableText", "onPrepareActionMode called")

        // Check if selection has changed (user finished dragging)
        val currentStart = textView.selectionStart
        val currentEnd = textView.selectionEnd
        android.util.Log.d("ClickableSelectableText", "Current selection: $currentStart-$currentEnd")

        if (lastSelectionStart != currentStart || lastSelectionEnd != currentEnd) {
          lastSelectionStart = currentStart
          lastSelectionEnd = currentEnd
        }

        // Clear all menu items to hide the menu
        menu?.clear()

        // Get selected text before finishing
        val selectedText = if (currentStart >= 0 && currentEnd > currentStart) {
          textView.text.toString().substring(currentStart, currentEnd)
        } else ""

        // Finish action mode immediately
        mode?.finish()

        // Clear selection handles asynchronously
        textView.post {
          textView.text?.let { text ->
            if (text is android.text.Spannable) {
              android.text.Selection.removeSelection(text)
            }
          }
          // Force clear focus to remove any lingering handles
          textView.clearFocus()
        }

        // Send selection event
        if (selectedText.isNotEmpty()) {
          android.util.Log.d("ClickableSelectableText", "Sending selected text: '$selectedText'")
          onTextSelection(selectedText)
        }

        return true
      }

      override fun onActionItemClicked(mode: ActionMode?, item: MenuItem?): Boolean {
        android.util.Log.d("ClickableSelectableText", "onActionItemClicked called")
        return false
      }

      override fun onDestroyActionMode(mode: ActionMode?) {
        android.util.Log.d("ClickableSelectableText", "onDestroyActionMode called")
        currentActionMode = null
        lastSelectionStart = -1
        lastSelectionEnd = -1
      }
    }
  }

  private fun getWordAtPosition(textView: TextView, x: Float, y: Float): String {
    val layout = textView.layout ?: return ""

    // Get the offset in the text corresponding to the touch position
    val line = layout.getLineForVertical(y.toInt())
    val offset = layout.getOffsetForHorizontal(line, x)

    val text = textView.text.toString()
    if (offset < 0 || offset >= text.length) return ""

    // Find word boundaries
    var start = offset
    var end = offset

    // Move start backwards to find the beginning of the word
    while (start > 0 && !text[start - 1].isWhitespace() && text[start - 1] != '.' && text[start - 1] != ',' && text[start - 1] != '!' && text[start - 1] != '?') {
      start--
    }

    // Move end forwards to find the end of the word
    while (end < text.length && !text[end].isWhitespace() && text[end] != '.' && text[end] != ',' && text[end] != '!' && text[end] != '?') {
      end++
    }

    return text.substring(start, end).trim()
  }

  override fun onInterceptTouchEvent(ev: MotionEvent): Boolean {
    // Let gesture detector see the event
    gestureDetector?.onTouchEvent(ev)
    // Always return false to let TextView handle long press for text selection
    return false
  }

  override fun onTouchEvent(event: MotionEvent): Boolean {
    gestureDetector?.onTouchEvent(event)
    return super.onTouchEvent(event)
  }

  private fun onWordClick(word: String) {
    val reactContext = context as ReactContext
    val params = Arguments.createMap().apply {
      putInt("viewTag", id)
      putString("eventType", "wordClick")
      putString("word", word)
    }

    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("ClickableSelectableTextEvent", params)
  }

  private fun onTextSelection(highlightedText: String) {
    val reactContext = context as ReactContext
    val params = Arguments.createMap().apply {
      putInt("viewTag", id)
      putString("eventType", "textSelection")
      putString("highlightedText", highlightedText)
    }

    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("ClickableSelectableTextEvent", params)
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
    if (changed && textView == null) {
      setupTextView()
    }
  }
}
