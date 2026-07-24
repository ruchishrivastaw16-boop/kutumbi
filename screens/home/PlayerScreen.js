import React, { useEffect, useState } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';

// ✅ REAL FIX (confirmed by diagnostic logs): mobile pe real touchstart/
// touchend fire hote hain aur content kaam karta hai. Chromebook pe sirf
// mouse/pointer events aate hain, touchstart/touchend KABHI nahi — isliye
// Storyline ka interactivity engine (jo touch events pe depend karta hai)
// silent reh jata hai, bawajood click sahi element pe lagne ke.
// Yahan mousedown/mousemove/mouseup ko synthetic TouchEvent mein convert
// karke dispatch kar rahe hain, taaki Storyline ko wahi touchstart/touchend
// mile jiski use zaroorat hai. Agar device pe real touch already ho raha
// hai (asli touchscreen), to us case me ye synthesize skip kar dete hain
// taaki double-events na banein.
const syntheticTouchFromMouse = `
  (function() {
    var lastRealTouchTime = 0;
    document.addEventListener('touchstart', function() {
      lastRealTouchTime = Date.now();
    }, true);

    function makeTouch(e) {
      if (typeof Touch === 'function') {
        try {
          return new Touch({
            identifier: 1,
            target: e.target,
            clientX: e.clientX,
            clientY: e.clientY,
            pageX: e.pageX,
            pageY: e.pageY,
            screenX: e.screenX,
            screenY: e.screenY,
            radiusX: 1,
            radiusY: 1,
            rotationAngle: 0,
            force: 1
          });
        } catch (err) {}
      }
      // Fallback: plain object jaisa Touch (kuch libraries duck-typing check karti hain)
      return {
        identifier: 1,
        target: e.target,
        clientX: e.clientX,
        clientY: e.clientY,
        pageX: e.pageX,
        pageY: e.pageY,
        screenX: e.screenX,
        screenY: e.screenY
      };
    }

    function dispatchSyntheticTouch(type, e) {
      if (Date.now() - lastRealTouchTime < 500) return; // real touchscreen — skip
      try {
        var touch = makeTouch(e);
        var touches = type === 'touchend' ? [] : [touch];
        var evt = new TouchEvent(type, {
          bubbles: true,
          cancelable: true,
          composed: true,
          touches: touches,
          targetTouches: touches,
          changedTouches: [touch]
        });
        e.target.dispatchEvent(evt);
      } catch (err) {
        // TouchEvent construction not supported on this engine — ignore silently
      }
    }

    document.addEventListener('mousedown', function(e) {
      dispatchSyntheticTouch('touchstart', e);
    }, true);
    document.addEventListener('mousemove', function(e) {
      if (e.buttons === 1) dispatchSyntheticTouch('touchmove', e);
    }, true);
    document.addEventListener('mouseup', function(e) {
      dispatchSyntheticTouch('touchend', e);
    }, true);
  })();
`;

// ✅ FIX: WebView apna default background white rakhta hai jab tak actual
// page ka HTML/CSS load na ho jaye — isse ek white flash dikhta hai.
// Content load hone se PEHLE hi <html>/<body> ka background black force
// kar dete hain, taaki white flash na dikhe.
const forceBlackBackground = `
  (function() {
    var style = document.createElement('style');
    style.innerHTML = 'html, body { background-color: #000 !important; }';
    document.documentElement.appendChild(style);
  })();
`;

// ✅ MAGIC SCRIPT: Fake SCORM API for Storyline/SCORM courses (WebView ke liye)
const injectMockLmsApi = `
  (function() {
    window.API = {
      LMSInitialize: function() { return "true"; },
      LMSGetValue: function(key) {
        if (key === "cmi.core.lesson_status") return "incomplete";
        if (key === "cmi.core.score.raw") return "";
        return "";
      },
      LMSSetValue: function(key, val) { return "true"; },
      LMSCommit: function() { return "true"; },
      LMSFinish: function() { return "true"; },
      LMSGetLastError: function() { return "0"; },
      LMSGetErrorString: function() { return "No error"; },
      LMSGetDiagnostic: function() { return ""; }
    };

    window.API_1484_11 = {
      Initialize: function() { return "true"; },
      GetValue: function(key) {
        if (key === "cmi.completion_status") return "incomplete";
        return "";
      },
      SetValue: function(key, val) { return "true"; },
      Commit: function() { return "true"; },
      Terminate: function() { return "true"; },
      GetLastError: function() { return "0"; },
      GetErrorString: function() { return "No error"; },
      GetDiagnostic: function() { return ""; }
    };
  })();
`;

export default function PlayerScreen({ route }) {
  const { url, title } = route.params;
  const [loading, setLoading] = useState(true);

  const decodedUrl = url ? decodeURIComponent(url) : '';

  useEffect(() => {
    const enableRotation = async () => {
      await ScreenOrientation.unlockAsync();
    };
    enableRotation();

    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  // ✅ Ab device chahe phone ho ya Chromebook, sab jagah content
  // hamesha in-app WebView me hi khulega — koi Chrome redirect nahi.
  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Loading Content...</Text>
        </View>
      )}

      {decodedUrl ? (
        <WebView
          source={{ uri: decodedUrl }}
          style={{ flex: 1, backgroundColor: '#000' }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsFullscreenVideo={true}
          originWhitelist={['*']}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          allowFileAccessFromFileURLs={true}
          setSupportMultipleWindows={false}
          overScrollMode="never"
          nestedScrollEnabled={true}
          // ✅ FIX: log confirm karta hai ki click/mouse events sahi element
          // pe sahi coordinates ke saath fire ho rahe hain, lekin touchstart/
          // touchend KABHI fire nahi hote. Storyline apna "touch device"
          // detection User-Agent string se karta hai ("Android" dekh ke),
          // aur touch-only handlers laga deta hai jo kabhi trigger hi nahi
          // hote. Desktop UA spoof karke Storyline ko "desktop hai"
          // samjhate hain, taaki wo mouse/click handlers use kare — jo
          // already sahi fire ho rahe hain.
          userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
          injectedJavaScriptBeforeContentLoaded={forceBlackBackground + injectMockLmsApi + syntheticTouchFromMouse}
          onLoadEnd={() => setLoading(false)}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.log('WebView Error: ', nativeEvent);
            setLoading(false);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    zIndex: 999,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});