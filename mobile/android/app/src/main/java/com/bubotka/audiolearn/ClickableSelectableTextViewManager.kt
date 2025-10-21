package com.bubotka.audiolearn

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class ClickableSelectableTextViewManager : ViewGroupManager<ClickableSelectableTextView>() {
  override fun getName(): String {
    return "ClickableSelectableTextView"
  }

  override fun createViewInstance(reactContext: ThemedReactContext): ClickableSelectableTextView {
    return ClickableSelectableTextView(reactContext)
  }

  @ReactProp(name = "menuOptions")
  fun setMenuOptions(view: ClickableSelectableTextView, options: ReadableArray?) {
    if (options != null) {
      val optionsArray = Array(options.size()) { i ->
        options.getString(i) ?: ""
      }
      view.setMenuOptions(optionsArray)
    }
  }
}
